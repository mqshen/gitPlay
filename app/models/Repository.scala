package models

/**
 * Created by GoldRatio on 2/20/14.
 */
import java.sql.Date
import play.api.db.slick.Config.driver.simple._

case class Repository(
  var userName: String,
  repositoryName: String,
  isPrivate: Boolean,
  description: Option[String],
  defaultBranch: String,
  registeredDate: Date,
  updatedDate: Date,
  lastActivityDate: Date,
  originUserName: Option[String],
  originRepositoryName: Option[String],
  parentUserName: Option[String],
  parentRepositoryName: Option[String]
)

class RepositoriryTable(tag: Tag) extends Table[Repository](tag, "REPOSITORY") with BasicTemplate{
  def isPrivate = column[Boolean]("PRIVATE")
  def description = column[String]("DESCRIPTION")
  def defaultBranch = column[String]("DEFAULT_BRANCH")
  def registeredDate = column[Date]("REGISTERED_DATE")
  def updatedDate = column[Date]("UPDATED_DATE")
  def lastActivityDate = column[Date]("LAST_ACTIVITY_DATE")
  def originUserName = column[String]("ORIGIN_USER_NAME")
  def originRepositoryName = column[String]("ORIGIN_REPOSITORY_NAME")
  def parentUserName = column[String]("PARENT_USER_NAME")
  def parentRepositoryName = column[String]("PARENT_REPOSITORY_NAME")
  def * = (userName , repositoryName , isPrivate , description.? , defaultBranch , registeredDate , updatedDate , lastActivityDate , originUserName.? , originRepositoryName.? , parentUserName.? , parentRepositoryName.?) <> (Repository.tupled, Repository.unapply _)

  def byPrimaryKey(owner: String, repository: String) = byRepository(owner, repository)
}

object RepositoryDAO {
  val repositories = TableQuery[RepositoriryTable]

  def create(repository: Repository)(implicit s: Session) {
    repositories.insert(repository)
  }

  def getByUser(userName: String)(implicit s: Session): List[Repository] = {
    repositories.where(_.userName === userName).list
  }
  def getByUserAndName(userName: String, repositoryName: String)(implicit s: Session): Option[Repository] = {
    repositories.where(_.userName === userName).where(_.repositoryName === repositoryName).firstOption
  }
}
