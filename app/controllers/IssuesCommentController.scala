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

/**
 * Created by GoldRatio on 2/25/14.
 */
object IssuesCommentController extends Controller with RepositoryService with Secured {

  val createForm: Form[IssueComment] = Form(

    mapping(
      "issueId" -> number,
      "content" -> text(minLength = 6)
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (issueIde, content) => {
        val currentDate = new Date(System.currentTimeMillis())
        IssueComment("", "", issueIde, None, "", "", content, currentDate, currentDate)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      comment => Some(comment.issueId, comment.content)
    }
  )

  def doCreate(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          createForm.bindFromRequest.fold(
            errors => {
              val issues = IssueDAO.getIssue(userName, repositoryName)
              val labels = LabelDAO.getLabels(userName, repositoryName)
              Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request)))
            },
            comment => {
              comment.userName = userName
              comment.repositoryName = repositoryName
              comment.commentedUserName = user.userName
              IssueCommentDAO.create(comment)
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
