package models

/**
 * Created by GoldRatio on 2/25/14.
 */

import play.api.db.slick.Config.driver.simple._
import java.sql.Date

case class IssueLabel(
userName: String,
repositoryName: String,
issueId: Int,
labelId: Int)

class IssueLabelTable(tag: Tag) extends Table[IssueLabel](tag, "ISSUE_LABEL") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def issueId = column[Int]("ISSUE_ID")
  def labelId = column[Int]("LABEL_ID")

  def * = (userName , repositoryName , issueId , labelId) <> (IssueLabel.tupled, IssueLabel.unapply _)
}

object IssueLabelDAO {
  val issueLabels = TableQuery[IssueLabelTable]

  def create(issueLabel: IssueLabel)(implicit s: Session) {
    issueLabels.insert(issueLabel)

  }
}
