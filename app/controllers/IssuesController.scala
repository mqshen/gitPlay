package controllers

/**
 * Created by GoldRatio on 2/24/14.
 */
import play.api.db.slick.{DBAction, DB}
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import play.api.Play.current
import models.{RepositoryDAO, Repository, IssueDAO, Issue}
import services.RepositoryService
import java.sql.Date
import util.Directory._
import scala.Some
import models.Issue
import util.JGitUtil

object IssuesController extends Controller with RepositoryService with Secured {

  def index(userName: String, repositoryName: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        val issues = IssueDAO.getIssue(userName, repositoryName)
      request.uri
        Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, 0, getSessionUser(request)))
      }.getOrElse(NotFound)
    }
  }

  def filter(userName: String, repositoryName: String, filterBy: String, filterValue: String, labels: Option[String]) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        val (conditions:Map[String, String], selectIndex) = filterBy match {
          case "assigned" =>
            (Map("ASSIGNED_USER_NAME" -> filterValue), 1)
          case "created_by" =>
            (Map("OPENED_USER_NAME" -> filterValue), 2)
          case _ =>
            (Map(), 3)
        }
        val issues = IssueDAO.getIssue(userName, repositoryName, conditions)
        Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, selectIndex, getSessionUser(request)))
      }.getOrElse(NotFound)
    }
  }

  val createForm: Form[Issue] = Form(

    mapping(
      "title" -> text(minLength = 4),
      "body" -> optional(text(minLength = 6)),
      "milestoneId" -> optional(number),
      "assignedUserName" -> optional(text(minLength = 3))
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (title, body, milestoneId, assignedUserName) => {
        val currentDate = new Date(System.currentTimeMillis())
        Issue("", "", None, "", milestoneId, assignedUserName, title, body, false, currentDate, currentDate, false)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      issue => Some(issue.title, issue.content, issue.milestoneId, issue.assignedUserName)
    }
  )

  def create(userName: String, repositoryName: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        Ok(views.html.issue.create(getBaseUrl(request), repositoryInfo, getSessionUser(request)))
      }.getOrElse(NotFound)
    }
  }

  def doCreate(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          createForm.bindFromRequest.fold(
            errors =>
              BadRequest(views.html.issue.create(getBaseUrl(request), repositoryInfo, getSessionUser(request))),
            issue => {
              issue.userName = userName
              issue.repositoryName = repositoryName
              issue.openedUserName = user.userName
              IssueDAO.create(issue)
              Redirect("/")
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }
  /*
      getRepository(userName, repositoryName).map { repositoryInfo =>
        createForm.bindFromRequest.fold(
          errors =>
            BadRequest(views.html.issue.create(getBaseUrl(request), repositoryInfo))
          issue => {
            Redirect("/")
          }
        )
      }.getOrElse(NotFound)
    }.getOrElse(NotFound)
  }
  */
}
