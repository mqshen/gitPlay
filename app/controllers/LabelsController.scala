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
        Label("", "", 0, name, color)
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
              //Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request), "", condition))
              Ok
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
              //Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request), "", condition))
              Ok
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

  val assignmentForm: Form[(Int, String)] = Form(

    mapping(
      "issueId" -> number,
      "labelName" -> text
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (issueId, labelName) => {
        (issueId, labelName)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      label => Some(label._1, label._2)
    }
  )

  def assignment(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          assignmentForm.bindFromRequest.fold(
            errors => {
              BadRequest
            },
            assignment => {
              val issueLabel = new IssueLabel(userName, repositoryName, assignment._1, assignment._2)
              IssueLabelDAO.create(issueLabel)
              Ok
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }

  def deleteAssignment(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          assignmentForm.bindFromRequest.fold(
            errors => {
              BadRequest
            },
            assignment => {
              val issueLabel = new IssueLabel(userName, repositoryName, assignment._1, assignment._2)
              IssueLabelDAO.delete(issueLabel)
              Ok
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
