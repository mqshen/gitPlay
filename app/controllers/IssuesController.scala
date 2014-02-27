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
import models.Issue
import services.IssuesService.IssueSearchCondition

object IssuesController extends Controller with RepositoryService with Secured {

  def index(userName: String, repositoryName: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        val labels = LabelDAO.getLabels(userName, repositoryName)
        val condition = IssueSearchCondition(request)
        val issues = IssueDAO.getIssue(userName, repositoryName, condition)
        Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, 0, getSessionUser(request), "", condition))
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
        val condition = IssueSearchCondition(request)
        val issues = IssueDAO.getIssue(userName, repositoryName, condition)
        val labels = LabelDAO.getLabels(userName, repositoryName)
        Ok(views.html.issue.index(getBaseUrl(request), request.uri, repositoryInfo, issues, labels, selectIndex, getSessionUser(request), "", condition))
      }.getOrElse(NotFound)
    }
  }

  case class IssueForm(title: String, body: Option[String], milestoneId: Option[Int], assignedUserName: Option[String], labels: List[String])

  val createForm: Form[IssueForm] = Form(

    mapping(
      "title" -> text(minLength = 4),
      "body" -> optional(text(minLength = 6)),
      "milestoneId" -> optional(number),
      "assignedUserName" -> optional(text(minLength = 3)),
      "labels" -> list(text)
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (title, body, milestoneId, assignedUserName, labels) => {
        IssueForm(title, body, milestoneId, assignedUserName, labels)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      issue => Some(issue.title, issue.body, issue.milestoneId, issue.assignedUserName, issue.labels)
    }
  )

  def create(userName: String, repositoryName: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        val labels = LabelDAO.getLabels(userName, repositoryName)
        Ok(views.html.issue.create(getBaseUrl(request), repositoryInfo, labels, getSessionUser(request)))
      }.getOrElse(NotFound)
    }
  }

  def doCreate(userName: String, repositoryName: String) = Action { implicit request =>
    getSessionUser(request).map { user =>
      DB.withSession{ implicit session =>
        getRepository(userName, repositoryName).map { repositoryInfo =>
          createForm.bindFromRequest.fold(
            errors => {
              val labels = LabelDAO.getLabels(userName, repositoryName)
              BadRequest(views.html.issue.create(getBaseUrl(request), repositoryInfo, labels, getSessionUser(request)))
            },
            issue => {
              val currentDate = new Date(System.currentTimeMillis())
              val newIssue = new Issue(userName, repositoryName, None, user.userName, issue.milestoneId,
                issue.assignedUserName, issue.title, issue.body, false, currentDate, currentDate, false
              )
              val issueId = IssueDAO.create(newIssue)
              issue.labels.foreach { labelName =>
                val issueLabel = new IssueLabel(userName, repositoryName, issueId, labelName)
                IssueLabelDAO.create(issueLabel)
              }
              Redirect("/")
            }
          )
        }.getOrElse(NotFound)
      }
    }.getOrElse(NotFound)
  }

  def detail(userName: String, repositoryName: String, issueId: Int) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        IssueDAO.getById(issueId).map { issue =>
          val comments = IssueCommentDAO.get(userName, repositoryName, issue.issueId)
          val labels = LabelDAO.getLabels(userName, repositoryName)
          val currentLabels = IssueLabelDAO.getIssueLabels(userName, repositoryName, issue.issueId.get)
          var collaborators = CollaboratorDAO.get(userName, repositoryName)
          Ok(views.html.issue.detail(getBaseUrl(request), request.uri, repositoryInfo, collaborators :+ userName, issue, comments, currentLabels, labels, 0, getSessionUser(request)))
        }.getOrElse(NotFound)
      }.getOrElse(NotFound)
    }
  }

  val modifyForm: Form[Option[String]] = Form(
    mapping(
      "assignedUserName" -> optional(text(minLength = 3))
    )
    {
      (assignedUserName) => assignedUserName
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      assignedUserName => Some(assignedUserName)
    }
  )

  def doModify(userName: String, repositoryName: String, issueId: Int) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(userName, repositoryName).map { repositoryInfo =>
        modifyForm.bindFromRequest.fold(
          errors => {
            BadRequest
          },
          assignedUserName => {
            IssueDAO.updateAssigne(issueId, assignedUserName.getOrElse(""))
            Ok
          }
        )
      }.getOrElse(NotFound)
    }
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
