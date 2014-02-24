package models

/**
 * Created by GoldRatio on 2/20/14.
 */

import play.api.db.slick.Config.driver.simple._

protected[models] trait BasicTemplate { self: Table[_] =>
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")

  def byRepository(owner: String, repository: String) =
    (userName is owner.bind) && (repositoryName is repository.bind)

  def byRepository(userName: Column[String], repositoryName: Column[String]) =
    (this.userName is userName) && (this.repositoryName is repositoryName)
}

protected[models] trait IssueTemplate extends BasicTemplate { self: Table[_] =>
  def issueId = column[Option[Int]]("ISSUE_ID", O.PrimaryKey, O.AutoInc)

  def byIssue(owner: String, repository: String, issueId: Int) =
    byRepository(owner, repository) && (this.issueId is issueId.bind)

  def byIssue(userName: Column[String], repositoryName: Column[String], issueId: Column[Int]) =
    byRepository(userName, repositoryName) && (this.issueId is issueId)
}

protected[models] trait LabelTemplate extends BasicTemplate { self: Table[_] =>
  def labelId = column[Int]("LABEL_ID")

  def byLabel(owner: String, repository: String, labelId: Int) =
    byRepository(owner, repository) && (this.labelId is labelId.bind)

  def byLabel(userName: Column[String], repositoryName: Column[String], labelId: Column[Int]) =
    byRepository(userName, repositoryName) && (this.labelId is labelId)
}

protected[models] trait MilestoneTemplate extends BasicTemplate { self: Table[_] =>
  def milestoneId = column[Int]("MILESTONE_ID")

  def byMilestone(owner: String, repository: String, milestoneId: Int) =
    byRepository(owner, repository) && (this.milestoneId is milestoneId.bind)

  def byMilestone(userName: Column[String], repositoryName: Column[String], milestoneId: Column[Int]) =
    byRepository(userName, repositoryName) && (this.milestoneId is milestoneId)
}