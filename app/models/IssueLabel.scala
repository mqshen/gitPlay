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
labelName: String)

class IssueLabelTable(tag: Tag) extends Table[IssueLabel](tag, "ISSUE_LABEL") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def issueId = column[Int]("ISSUE_ID")
  def labelName = column[String]("LABEL_ID")

  def * = (userName , repositoryName , issueId , labelName) <> (IssueLabel.tupled, IssueLabel.unapply _)
}

object IssueLabelDAO {
  val issueLabels = TableQuery[IssueLabelTable]

  def create(issueLabel: IssueLabel)(implicit s: Session) {
    issueLabels.insert(issueLabel)
  }

  def getIssueLabels(userName: String, repositoryName: String, issueId: Int)(implicit s: Session) : List[IssueLabel] = {
    issueLabels.where(_.userName === userName)
      .where(_.repositoryName === repositoryName)
      .where(_.issueId === issueId).list()
  }

  def delete(issueLabel: IssueLabel)(implicit s: Session) {
    issueLabels.where(_.userName === issueLabel.userName)
      .where(_.repositoryName === issueLabel.repositoryName)
      .where(_.issueId === issueLabel.issueId)
      .where(_.labelName === issueLabel.labelName).delete
  }

//  def add(assignment: (Int, String))(implicit s: Session) {
//    issueLabels.update()
//  }
}
