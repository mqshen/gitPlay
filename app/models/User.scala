package models

/**
 * Created by GoldRatio on 2/19/14.
 */

import java.sql.Date
import play.api.db.slick.Config.driver.simple._

case class User (
  userName: String,
  fullName: String,
  mailAddress: String,
  password: String,
  isAdmin: Boolean,
  url: Option[String],
  registeredDate: Date,
  updatedDate: Date,
  lastLoginDate: Option[Date],
  image: Option[String],
  isGroupAccount: Boolean,
  isRemoved: Boolean
)

class UserTable(tag: Tag) extends Table[User](tag, "User") {
  def userName = column[String]("USER_NAME", O.PrimaryKey)
  def fullName = column[String]("FULL_NAME")
  def mailAddress = column[String]("MAIL_ADDRESS")
  def password = column[String]("PASSWORD")
  def isAdmin = column[Boolean]("ADMINISTRATOR")
  def url = column[String]("URL")
  def registeredDate = column[Date]("REGISTERED_DATE")
  def updatedDate = column[Date]("UPDATED_DATE")
  def lastLoginDate = column[Date]("LAST_LOGIN_DATE")
  def image = column[String]("IMAGE")
  def groupAccount = column[Boolean]("GROUP_ACCOUNT")
  def removed = column[Boolean]("REMOVED")
  def * = (userName , fullName , mailAddress , password , isAdmin , url.? ,
    registeredDate , updatedDate , lastLoginDate.? , image.? , groupAccount , removed) <> (User.tupled, User.unapply _)
}

object UserDAO {

  val Users = TableQuery[UserTable]

  def create(user: User)(implicit s: Session) {
    Users.insert(user)
  }

  def findByName(name: String)(implicit s: Session): Option[User] =
    Users.where(_.userName === name).firstOption

  def findByEmail(mailAddress: String)(implicit s: Session): Option[User] =
    Users.where(_.mailAddress === mailAddress).firstOption

  def authenticate(email: String, password: String) (implicit s: Session): Option[User] =
    Users.where(_.mailAddress === email).where( _.password === password).firstOption
}

