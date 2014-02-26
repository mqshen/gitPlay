package models

/**
 * Created by GoldRatio on 2/25/14.
 */
import play.api.db.slick.Config.driver.simple._
import java.sql.Date

case class IssueComment(
var userName: String,
var repositoryName: String,
var issueId: Int,
commentId: Option[Int],
action: Option[String],
var commentedUserName: String,
content: Option[String],
registeredDate: Date,
updatedDate: Date
)

class IssueCommentTable(tag: Tag) extends Table[IssueComment](tag, "ISSUE_COMMENT") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def issueId = column[Int]("ISSUE_ID")
  def commentId = column[Option[Int]]("COMMENT_ID", O.PrimaryKey, O.AutoInc)
  def action = column[Option[String]]("ACTION")
  def commentedUserName = column[String]("COMMENTED_USER_NAME")
  def content = column[Option[String]]("CONTENT")
  def registeredDate = column[Date]("REGISTERED_DATE")
  def updatedDate = column[Date]("UPDATED_DATE")
  def * = (userName , repositoryName , issueId , commentId , action , commentedUserName , content , registeredDate , updatedDate) <> (IssueComment.tupled, IssueComment.unapply _)
}



object IssueCommentDAO {
  val issueComments = TableQuery[IssueCommentTable]

  def create(comment: IssueComment)(implicit s: Session) {
    issueComments.insert(comment)
  }

  def get(userName: String, repositoryName: String, issueId: Option[Int])(implicit s: Session):List[IssueComment] = {
    issueComments.where(_.userName === userName)
      .where(_.repositoryName === repositoryName)
      .where(_.issueId === issueId).list
  }
}