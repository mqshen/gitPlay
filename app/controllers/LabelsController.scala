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
import models._
import services.RepositoryService
import java.sql.Date
import util.Directory._
import scala.Some
import util.JGitUtil
import scala.Some
import models.Issue
import services.IssuesService.IssueSearchCondition

object LabelsController extends Controller with RepositoryService with Secured {

  val createForm: Form[Label] = Form(

    mapping(
      "name" -> text(minLength = 2),
      "color" -> text(minLength = 6)
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (name, color) => {
        Label("", "", None, name, color)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      label => Some(label.labelName, label.color)
    }
  )


  def doCreate(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          createForm.bindFromRequest.fold(
            errors => {
              val issues = IssueDAO.getIssueAll(userName, repositoryName)
              val labels = LabelDAO.getLabels(userName, repositoryName)
              val condition = IssueSearchCondition(request)
              Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request), "", condition))
            },
            label => {
              label.userName = userName
              label.repositoryName = repositoryName
              LabelDAO.create(label)
              request.headers.get("Referer") .map { referer =>
                Redirect(referer)
              }.getOrElse(NotFound)
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }

  def doModify(userName: String, repositoryName: String, labelName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          createForm.bindFromRequest.fold(
            errors => {
              val issues = IssueDAO.getIssueAll(userName, repositoryName)
              val labels = LabelDAO.getLabels(userName, repositoryName)
              val condition = IssueSearchCondition(request)
              Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request), "", condition))
            },
            label => {
              LabelDAO.update(userName, repositoryName, labelName, label)
              request.headers.get("Referer") .map { referer =>
                Redirect(referer)
              }.getOrElse(NotFound)
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }

  def doDelete(userName: String, repositoryName: String, labelName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          LabelDAO.delete(userName, repositoryName, labelName)
          Ok
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
