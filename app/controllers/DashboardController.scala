package controllers

import models.{RepositoryDAO, ActivityDAO, UserDAO}
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._

import play.api.Play.current
import play.api.db.slick._

/**
 * Created by GoldRatio on 2/19/14.
 */
object DashboardController extends Controller with Secured {


  def news =  IsAuthenticated { user => _ =>
      DB.withSession { implicit session =>
        val repostiories = RepositoryDAO.getByUser(user.userName)
        val activies = ActivityDAO.getRecentActivities(user.userName)
        Ok(views.html.dashboard.news(user, activies, repostiories))
      }
  }

}
