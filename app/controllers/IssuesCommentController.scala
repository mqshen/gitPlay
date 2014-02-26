package controllers

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

/**
 * Created by GoldRatio on 2/25/14.
 */
object IssuesCommentController extends Controller with RepositoryService with Secured {

  val createForm: Form[IssueComment] = Form(

    mapping(
      "issueId" -> number,
      "content" -> optional(text),
      "action" -> optional(text)
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (issueIde, content, action) => {
        val currentDate = new Date(System.currentTimeMillis())
        IssueComment("", "", issueIde, None, action, "", content, currentDate, currentDate)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      comment => Some(comment.issueId, comment.content, comment.action)
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
            comment => {
              comment.userName = userName
              comment.repositoryName = repositoryName
              comment.commentedUserName = user.userName
              IssueCommentDAO.create(comment)
              comment.action.map { action =>
                if(action == "reopen")
                  IssueDAO.reopen(comment.issueId)
                else if(action == "close")
                  IssueDAO.close(comment.issueId)
              }
              request.headers.get("Referer") .map { referer =>
                Redirect(referer)
              }.getOrElse(NotFound)
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }
}
