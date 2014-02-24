package models

/**
 * Created by GoldRatio on 2/24/14.
 */

import java.sql.Date
import play.api.db.slick.Config.driver.simple._

/*
class IssueLabelTable(tag: Tag) extends Table[IssueLabel](tag, "ISSUE_LABEL") with IssueTemplate with LabelTemplate {
  def * = (userName , repositoryName , issueId , labelId) <> (IssueLabel.tupled, IssueLabel.unapply _)
  def byPrimaryKey(owner: String, repository: String, issueId: Int, labelId: Int) =
    byIssue(owner, repository, issueId) && (this.labelId is labelId.bind)
}

case class IssueLabel(
  userName: String,
  repositoryName: String,
  issueId: Int,
  labelId: Int)

object IssueLabelDAO {
  val issueLabels = TableQuery[IssueLabelTable]
}
*/
