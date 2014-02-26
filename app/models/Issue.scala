package models

/**
 * Created by GoldRatio on 2/24/14.
 */
import java.sql.Date
import play.api.db.slick.Config.driver.simple._
import services.IssuesService.IssueSearchCondition

class IssueTable(tag: Tag) extends Table[Issue](tag, "ISSUE") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def issueId = column[Option[Int]]("ISSUE_ID", O.PrimaryKey, O.AutoInc)
  def milestoneId = column[Int]("MILESTONE_ID")
  def openedUserName = column[String]("OPENED_USER_NAME")
  def assignedUserName = column[String]("ASSIGNED_USER_NAME")
  def title = column[String]("TITLE")
  def content = column[String]("CONTENT")
  def closed = column[Boolean]("CLOSED")
  def registeredDate = column[Date]("REGISTERED_DATE")
  def updatedDate = column[Date]("UPDATED_DATE")
  def pullRequest = column[Boolean]("PULL_REQUEST")
  def * = (userName , repositoryName , issueId , openedUserName , milestoneId.? , assignedUserName.? , title , content.? , closed , registeredDate , updatedDate , pullRequest) <> (Issue.tupled, Issue.unapply _)

}

case class Issue(
  var userName: String,
  var repositoryName: String,
  issueId: Option[Int],
  var openedUserName: String,
  milestoneId: Option[Int],
  assignedUserName: Option[String],
  title: String,
  content: Option[String],
  closed: Boolean,
  registeredDate: Date,
  updatedDate: Date,
  isPullRequest: Boolean
)

object IssueDAO {
  val issues = TableQuery[IssueTable]

  def getIssueAll(userName: String, repositoryName: String, conditions: Map[String, String] = Map())(implicit s: Session): List[Issue] = {
    var query = issues.where(_.userName === userName)
      .where(_.repositoryName === repositoryName)
    conditions.map { condition:(String, String) =>
      query = query.where(_.column[String](condition._1) === condition._2)
    }
    query.list
  }

  def getIssue(userName: String, repositoryName: String, condition: IssueSearchCondition)(implicit s: Session): List[Issue] = {
    val q = issues.filter { i =>
      (i.closed === (condition.state == "closed")) &&
        ((i.milestoneId === condition.milestoneId) || (condition.milestoneId == None)) &&
        ((i.assignedUserName === condition.assigned) || (condition.assigned == None)) &&
        ((i.openedUserName === condition.createBy) || (condition.createBy == None))
    }
    q.list()
    /*
    val q = for { i <- issues
                  if (i.closed === (condition.state == "closed")) &&
                    (i.milestoneId === condition.milestoneId, condition.milestoneId.isDefined) &&
                    (i.milestoneId isNull, condition.milestoneId == None)
    } yield i.*
    */
  }

  def create(issue: Issue)(implicit s: Session): Int = {
    val issueId =
      (issues returning issues.map(_.issueId)) += issue
    issueId.get
  }

  def setColseState(issueId: Int, closed: Boolean)(implicit s: Session) {
    val q = for { i <- issues if i.issueId === issueId} yield i.closed
    q.update(closed)
  }

  def reopen(issueId: Int)(implicit s: Session) {
    setColseState(issueId, false)
  }

  def close(issueId: Int)(implicit s: Session) {
    val q = for { i <- issues if i.issueId === issueId} yield i.closed
    setColseState(issueId, true)
  }

  def getById(issueId: Int)(implicit  s: Session): Option[Issue] = {
    issues.where(_.issueId === issueId).firstOption
  }
}
