package services

/**
 * Created by GoldRatio on 2/24/14.
 */
import util.StringUtil._
import models._
import play.api.db.slick.Config.driver.simple._
import models.Label
import scala.Some
import models.Issue

trait IssuesService {
  /*
  import IssuesService._

  /**
   * Assembles query for conditional issue searching.
   */
  private def searchIssueQuery(repos: Seq[(String, String)], condition: IssueSearchCondition,
                               filterUser: Map[String, String], onlyPullRequest: Boolean) = {
    val query = for {
      ((issues, issueLabel), label) <-
    }
    IssueDAO.issues.filter { t1 =>
      condition.repo
        .map { _.split('/') match { case array => Seq(array(0) -> array(1)) } }
        .getOrElse (repos)
        .map { case (owner, repository) => t1.byRepository(owner, repository) }
        .foldLeft[Column[Boolean]](false) ( _ || _ ) &&
        (t1.closed           is (condition.state == "closed").bind) &&
        (t1.milestoneId      is condition.milestoneId.get.get.bind, condition.milestoneId.flatten.isDefined) &&
        (t1.milestoneId      isNull, condition.milestoneId == Some(None)) &&
        (t1.assignedUserName is filterUser("assigned").bind, filterUser.get("assigned").isDefined) &&
        (t1.openedUserName   is filterUser("created_by").bind, filterUser.get("created_by").isDefined) &&
        (t1.openedUserName   isNot filterUser("not_created_by").bind, filterUser.get("not_created_by").isDefined) &&
        (t1.pullRequest      is true.bind, onlyPullRequest) &&
        (IssueLabelDAO.issueLabels filter { t2 =>
          (t2.byIssue(t1.userName, t1.repositoryName, t1.issueId)) &&
            (t2.labelId in
              (LabelDAO.labels filter { t3 =>
                (t3.byRepository(t1.userName, t1.repositoryName)) &&
                  (t3.labelName inSetBind condition.labels)
              } map(_.labelId)))
        } exists, condition.labels.nonEmpty)
    }
  }


  def searchIssue(condition: IssueSearchCondition, filterUser: Map[String, String], onlyPullRequest: Boolean,
                  offset: Int, limit: Int, repos: (String, String)*): List[(Issue, List[Label], Int)] = {

  }
  */

}
object IssuesService {
  import javax.servlet.http.HttpServletRequest

  val IssueLimit = 30

  case class IssueSearchCondition(
                                   labels: Set[String] = Set.empty,
                                   milestoneId: Option[Option[Int]] = None,
                                   repo: Option[String] = None,
                                   state: String = "open",
                                   sort: String = "created",
                                   direction: String = "desc"){

    def toURL: String =
      "?" + List(
        if(labels.isEmpty) None else Some("labels=" + urlEncode(labels.mkString(","))),
        milestoneId.map { id => "milestone=" + (id match {
          case Some(x) => x.toString
          case None    => "none"
        })},
        repo.map("for="   + urlEncode(_)),
        Some("state="     + urlEncode(state)),
        Some("sort="      + urlEncode(sort)),
        Some("direction=" + urlEncode(direction))).flatten.mkString("&")

  }
}
