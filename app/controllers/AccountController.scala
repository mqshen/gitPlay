package controllers

import models.{RepositoryDAO, UserDAO}
import play.api.db.slick.DB
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import play.api.Play.current


/**
 * Created by GoldRatio on 2/19/14.
 */
object AccountController  extends Controller with Secured{

  def index(userName: String, tab: Option[String]) = Action { implicit request =>
    DB.withSession { implicit session =>
      UserDAO.findByName(userName).map { user =>
        tab.map {
          case "repositories" =>
            val repositories = RepositoryDAO.getByUser(user.userName)
            Ok(views.html.account.repositories(user, repositories, getSessionUser(request)))
          case "activity" =>
            Ok(views.html.account.activity(user, getSessionUser(request)))
        }.getOrElse {
          Ok(views.html.account.contributions(user, getSessionUser(request)))
        }
      }.getOrElse(Forbidden)
    }

  }

}
