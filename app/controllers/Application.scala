package controllers

import models.{UserDAO, User}
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import java.sql.Date
import play.api.Play.current
import play.api.db.slick.{DBAction, DB}

object Application extends Controller with Secured{

  def index = Action { implicit request =>
    if(isLogin(request))
      Redirect(routes.DashboardController.news)
    else
      Ok(views.html.index(""))
  }

  val loginForm = Form(
    mapping(
      "email" -> email,
      "password" -> text
    ){
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      DB.withSession { implicit session =>
        (email, passwords) => UserDAO.authenticate(email, passwords)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      user => Some(user.map(user => user.mailAddress).getOrElse(""), user.map(user => user.password).getOrElse(""))
    }.verifying ("Invalid email or password", result => result match {
      case user => user.isDefined
    })
  )

  def login = Action { implicit request =>
    Ok(views.html.login(loginForm))
  }

  def doLogin = Action { implicit request =>
    loginForm.bindFromRequest.fold(
      formWithErrors =>
        BadRequest(views.html.login(formWithErrors)),
      user => {
        user.map { u =>
          Redirect(routes.Application.index).withSession("email" -> u.mailAddress)
        }
        .getOrElse {
          BadRequest(views.html.login(loginForm))
        }
      }
    )
  }


  val signupForm: Form[User] = Form(

    // Define a mapping that will handle User values
    mapping(
      "name" -> text(minLength = 4),
      "email" -> email,
      "password" ->  text(minLength = 6)
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (username, email, passwords) => {
        val currentDate = new Date(System.currentTimeMillis())
        User(username, username, passwords, email, false, None, currentDate, currentDate, None, None, false, false)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      user => Some(user.userName, user.mailAddress, user.password)
    }.verifying(
        "This username is not available",
        user => {
          DB.withSession { implicit session =>
            !(UserDAO.findByName(user.userName).map( _ => true ).getOrElse(false))
          }
        }
      )
  )

  def signUp() = Action { implicit request =>
    signupForm.bindFromRequest.fold(
      errors =>
        BadRequest(views.html.signup(errors)),
      user => {
        DB.withSession { implicit session =>
          UserDAO.create(user)
        }
        Redirect("/")
      }
    )
  }

}
/*
object Secured {
  def isLogin(request: RequestHeader) = request.session.get("email").isDefined

  def getSessionUser(request: RequestHeader):Option[User] = {
    request.session.get("email").map { email =>
      DB.withSession { implicit session =>
        UserDAO.findByEmail(email).get
      }
    }
  }

  def getSessionUser(request: Request[AnyContent]):Option[User] = {
    request.session.get("email").map { email =>
      DB.withSession { implicit session =>
        UserDAO.findByEmail(email).get
      }
    }
  }
}
*/

trait Secured {

  def isLogin(request: RequestHeader) = request.session.get("email").isDefined

  def getSessionUser(request: RequestHeader):Option[User] = {
    request.session.get("email").map { email =>
      DB.withSession { implicit session =>
        UserDAO.findByEmail(email).get
      }
    }
  }

  def getSessionUser(request: Request[AnyContent]):Option[User] = {
    request.session.get("email").map { email =>
      DB.withSession { implicit session =>
        UserDAO.findByEmail(email).get
      }
    }
  }

  /**
   * Retrieve the connected user email.
   */
  private def username(request: RequestHeader):Option[User] = request.session.get("email").map { email =>
    DB.withSession { implicit session =>
      UserDAO.findByEmail(email).get
    }
  }

  /**
   * Redirect to login if the user in not authorized.
   */
  private def onUnauthorized(request: RequestHeader) = Results.Redirect(routes.Application.login)
  // --

  /**
   * Action for authenticated users.
   */
  def IsAuthenticated(f: => User => Request[AnyContent] => Result) = Security.Authenticated(username, onUnauthorized) { user =>
    Action(request => f(user)(request))
  }

}
