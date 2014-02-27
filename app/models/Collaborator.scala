package models

/**
 * Created by GoldRatio on 2/26/14.
 */

import play.api.db.slick.Config.driver.simple._

class CollaboratorTable(tag: Tag) extends Table[Collaborator](tag, "COLLABORATOR") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def collaboratorName = column[String]("COLLABORATOR_NAME")
  def * = (userName , repositoryName , collaboratorName) <> (Collaborator.tupled, Collaborator.unapply _)
}

case class Collaborator(
  userName: String,
  repositoryName: String,
  collaboratorName: String
)

object CollaboratorDAO {
  val collaborators = TableQuery[CollaboratorTable]

  def get(userName: String, repositoryName: String)(implicit s: Session): List[String] = {
    collaborators.where(_.userName === userName).where(_.repositoryName === repositoryName).map(_.collaboratorName).list
  }
}
