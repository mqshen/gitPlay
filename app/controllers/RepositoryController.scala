package controllers

import models.{UserDAO, User, Repository, RepositoryDAO}
import play.api._
import play.api.mvc._
import play.api.data._
import play.api.data.Forms._
import java.sql.Date
import play.api.Play.current
import play.api.db.slick._
import util.Directory._
import util.{FileUtil, StringUtil, JGitUtil}
import services.{RepositoryService, ActivityService, WikiService}
import org.eclipse.jgit.api.Git
import org.eclipse.jgit.lib.{ObjectId, Constants, Ref}
import scala.collection.JavaConverters._
import org.eclipse.jgit.transport.{PacketLineOut, ReceivePack, RefAdvertiser}
import java.io._
import org.eclipse.jgit.util.{HttpSupport, IO}
import play.api.libs.iteratee.Enumerator
import git.util.{GitPlayUploadPackFactory, GitPlayReceivePackFactory, SmartOutputStream}
import org.eclipse.jgit.transport.RefAdvertiser.PacketLineOutRefAdvertiser
import org.eclipse.jgit.treewalk.TreeWalk
import org.eclipse.jgit.internal.storage.file.ObjectDirectory
import scala.Some
import models.Repository


/**
 * Created by GoldRatio on 2/20/14.
 */
object RepositoryController extends Controller with Secured with WikiService with ActivityService with RepositoryService {

  val receivePackFactory = new GitPlayReceivePackFactory
  val uploadPackFactory =  new GitPlayUploadPackFactory

  val createForm: Form[Repository] = Form(

    // Define a mapping that will handle User values
    mapping(
      "name" -> text(minLength = 4),
      "description" -> text(minLength = 6),
      "public" -> boolean
    )
    {
      // Binding: Create a User from the mapping result (ignore the second password and the accept field)
      (name, description, public) => {
        val currentDate = new Date(System.currentTimeMillis())
        Repository("", name, public, Some(description), "", currentDate, currentDate, currentDate, None, None, None , None)
      }
    }
    {
      // Unbinding: Create the mapping values from an existing User value
      repository => Some(repository.repositoryName, repository.description.getOrElse(""), repository.isPrivate)
    }
  )

  def create =  IsAuthenticated { user => _ =>
    Ok(views.html.repository.create(user, createForm))
  }



  def doCreate = DBAction { implicit rs =>
    getSessionUser(rs).map { user =>
      createForm.bindFromRequest.fold(
        errors =>
          BadRequest(views.html.repository.create(user, errors)),
        repository => {
          repository.userName = user.userName
          RepositoryDAO.create(repository)
          val gitdir = getRepositoryDir(repository.userName, repository.repositoryName)
          JGitUtil.initRepository(gitdir)

          // Create Wiki repository
          createWikiRepository(user, repository.userName, repository.repositoryName)

          // Record activity
          recordCreateRepositoryActivity(user.userName, repository.repositoryName, repository.userName)


          Redirect("/")
        }
      )
    }.getOrElse(NotFound)
  }


  val readmeFiles = Seq("readme.md", "readme.markdown")

  def detail(name: String, repositoryName: String) = Action { implicit rs =>
    fileListAction(name, repositoryName, rs)
  /*
    getRepository(name, repositoryName).map { repositoryInfo =>
      if(repositoryInfo.commitCount == 0)
        Ok(views.html.repository.guide(repositoryInfo))
      else {
        val repository = getRepositoryDir(name, repositoryName)
        val git = Git.open(repository)
        val revisions = repositoryInfo.repository.defaultBranch
        JGitUtil.getDefaultBranch(git, repositoryInfo, "").map { case (objectId, revision) =>
          val revCommit = JGitUtil.getRevCommitFromId(git, objectId)
          // get files
          val files = JGitUtil.getFileList(git, revision, ".")
          // process README.md or README.markdown
          val readme = files.find { file =>
            readmeFiles.contains(file.name.toLowerCase)
          }.map { file =>
            StringUtil.convertFromByteArray(JGitUtil.getContent(Git.open(getRepositoryDir(name, repositoryName)), file.id, true).get)
          }

          /*
          repo.html.files(revision, repository,
            if(path == ".") Nil else path.split("/").toList, // current path
            new JGitUtil.CommitInfo(revCommit), // latest commit
            files, readme)
            */

          val commit = new JGitUtil.CommitInfo(revCommit) // latest commit
          Ok(views.html.repository.detail(revisions, repositoryInfo, files, readme, commit))
        } getOrElse NotFound

      }
    }.getOrElse(NotFound)
    */
  }

  def commit(name: String, repositoryName: String, commitId: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(name, repositoryName).map { repositoryInfo =>
        val repository = getRepositoryDir(name, repositoryName)
        val git = Git.open(repository)
        val revCommit= JGitUtil.getRevCommitFromId(git, git.getRepository.resolve(commitId))
        val baseUrl = if (request.secure) "https://" + request.host else "http://" + request.host
        JGitUtil.getDiffs(git, commitId) match {
          case (diffs, oldCommitId) =>
            val branchesOfCommit = JGitUtil.getBranchesOfCommit(git, revCommit.getName)
            val tagsOfCommit = JGitUtil.getTagsOfCommit(git, revCommit.getName)
            val commitInfo =  new JGitUtil.CommitInfo(revCommit)
          Ok(views.html.repository.commit(baseUrl, commitId, commitInfo, branchesOfCommit, tagsOfCommit, repositoryInfo, diffs, oldCommitId))
        }
      }.getOrElse(NotFound)
    }
  }


  def fileListAction(name:String, repositoryName: String, request: Request[AnyContent], reversionOpt: Option[String] = None, pathOpt: Option[String] = None) = {
    DB.withSession{ implicit session =>
      getRepository(name, repositoryName).map { repositoryInfo =>
        val baseUrl = if (request.secure) "https://" + request.host else "http://" + request.host
        if(repositoryInfo.commitCount == 0)
          Ok(views.html.repository.guide(baseUrl, repositoryInfo))
        else {
          val repository = getRepositoryDir(name, repositoryName)
          val git = Git.open(repository)
          val reversion = reversionOpt.getOrElse(repositoryInfo.repository.defaultBranch)
          val path  = pathOpt.getOrElse(".")
          JGitUtil.getDefaultBranch(git, repositoryInfo, reversion).map { case (objectId, revision) =>
            val revCommit = JGitUtil.getRevCommitFromId(git, objectId)
            // get files
            val files = JGitUtil.getFileList(git, revision, path)
            // process README.md or README.markdown
            val readme = files.find { file =>
              readmeFiles.contains(file.name.toLowerCase)
            }.map { file =>
              StringUtil.convertFromByteArray(JGitUtil.getContent(Git.open(getRepositoryDir(name, repositoryName)), file.id, true).get)
            }

            val commit = new JGitUtil.CommitInfo(revCommit) // latest commit
            Ok(views.html.repository.detail(baseUrl, pathOpt, reversion, repositoryInfo, files, readme, commit, getSessionUser(request)))
          } getOrElse NotFound

        }
      }.getOrElse(NotFound)
    }
  }

  def directory(name: String, repositoryName: String, reversion: String, path: String) = Action { implicit rs =>
    fileListAction(name, repositoryName , rs, Some(reversion), Some(path))
  }

  def file(name: String, repositoryName: String, reversion: String, path: String) = Action { implicit request =>
    DB.withSession{ implicit session =>
      getRepository(name, repositoryName).map { repositoryInfo =>
        val repository = getRepositoryDir(name, repositoryName)
        val git = Git.open(repository)
        val baseUrl = if (request.secure) "https://" + request.host else "http://" + request.host
        val revCommit = JGitUtil.getRevCommitFromId(git, git.getRepository.resolve(reversion))

        @scala.annotation.tailrec
        def getPathObjectId(path: String, walk: TreeWalk): ObjectId = walk.next match {
          case true if(walk.getPathString == path) => walk.getObjectId(0)
          case true => getPathObjectId(path, walk)
        }

        val treeWalk = new TreeWalk(git.getRepository)
        treeWalk.addTree(revCommit.getTree)
        treeWalk.setRecursive(true)
        val objectId = getPathObjectId(path, treeWalk)

        val large  = FileUtil.isLarge(git.getRepository.getObjectDatabase.open(objectId).getSize)
        val viewer = if(FileUtil.isImage(path)) "image" else if(large) "large" else "other"
        val bytes  = if(viewer == "other") JGitUtil.getContent(git, objectId, false) else None

        val content = if(viewer == "other"){
          if(bytes.isDefined && FileUtil.isText(bytes.get)){
            // text
            JGitUtil.ContentInfo("text", bytes.map(StringUtil.convertFromByteArray))
          } else {
            // binary
            JGitUtil.ContentInfo("binary", None)
          }
        } else {
          // image or large
          JGitUtil.ContentInfo(viewer, None)
        }

        Ok(views.html.repository.file(baseUrl, path, reversion, repositoryInfo, content, new JGitUtil.CommitInfo(revCommit), getSessionUser(request)))
      }.getOrElse(NotFound)
    }
  }

  def git(name: String, repositoryName: String, service: Option[String]) = Action { implicit rs =>

    val git = Git.open(getRepositoryDir(name, repositoryName))
    val repository = git.getRepository()
    val result = Ok
    service.map {
      case svc:String if svc == "git-receive-pack" => {
        import scala.concurrent.ExecutionContext.Implicits.global
        val enumerator = Enumerator.outputStream { os =>
          val buf = new SmartOutputStream(rs, os, result, true)
          val  out = new PacketLineOut(buf)
          out.writeString("# service=" + svc + "\n")
          out.end()
          val receivePack = receivePackFactory.create(rs, repository)
          try {
            val pck = new PacketLineOutRefAdvertiser(out)
            receivePack.sendAdvertisedRefs(pck)
          } finally {
            receivePack.getRevWalk().release()
          }
          buf.close()
        }
        result.stream(enumerator >>> Enumerator.eof).withHeaders(("Content-Type","application/x-git-receive-pack-advertisement"))
      }
      case svc:String if svc == "git-upload-pack" => {
        import scala.concurrent.ExecutionContext.Implicits.global
        val enumerator = Enumerator.outputStream { os =>
          val buf = new SmartOutputStream(rs, os, result, true)
          val  out = new PacketLineOut(buf)
          out.writeString("# service=" + svc + "\n")
          out.end()

          val uploadPack = uploadPackFactory.create(rs, repository)
          try {
            uploadPack.setBiDirectionalPipe(false)
            val pck = new PacketLineOutRefAdvertiser(out)
            uploadPack.sendAdvertisedRefs(pck)
          }
          finally {
            uploadPack.getRevWalk().release()
          }
        /*
          val inputStream = new ByteArrayInputStream(rs.body.asRaw.get.asBytes().get)
          uploadPack.upload(inputStream, os, null)
          */

          buf.close()
        }

        result.stream(enumerator >>> Enumerator.eof).withHeaders(("Content-Type","application/x-git-upload-pack-advertisement"))
      }
      case _ => {
        val refs = repository.getAllRefs
        refs.remove(Constants.HEAD)
        val out = new StringBuffer()

        val adv = new RefAdvertiser {
          protected def writeOne(line: CharSequence) {
            out.append(line.toString.replace(' ', '\t'))
          }

          protected def end {
          }
        }
        adv.init(repository)
        adv.setDerefTags(true)
        adv.send(refs)
        Ok(out.toString)
      }
    }.getOrElse(NotFound)
  }

  def gitHead(name: String, repositoryName: String) = DBAction { implicit rs =>
    val git = Git.open(getRepositoryDir(name, repositoryName))
    val repository = git.getRepository()
    val gitdir = repository.getDirectory
    val file = new File(gitdir, Constants.HEAD)
    Ok(IO.readFully(file))
  }

  def gitObject(name: String, repositoryName: String, objectId: String) = DBAction { implicit rs =>
    /*
    val git = Git.open(getRepositoryDir(name, repositoryName))
    val repository = git.getRepository()
    val directory = repository.getObjectDatabase().asInstanceOf[ObjectDirectory].getDirectory()
    val obj = new File(directory, req.getPathInfo())
    */
    NotFound
  }

  def save = Action { request =>
    val body: AnyContent = request.body
    val textBody: Option[String] = body.asText

    // Expecting text body
    textBody.map { text =>
      Ok("Got: " + text)
    }.getOrElse {
      BadRequest("Expecting text/plain request body")
    }
  }

  def gitReceivePack(name: String, repositoryName: String) = Action { rs =>
    DB.withSession{ implicit session =>
      val git = Git.open(getRepositoryDir(name, repositoryName))
      val repository = git.getRepository()

      val receivePack = receivePackFactory.create(rs, repository)
      receivePack.setBiDirectionalPipe(false)

      val bytes = rs.body.asRaw.get.asBytes()
      val inputStream =  if (bytes.isDefined) {
        new ByteArrayInputStream(bytes.get)
      }
      else {
        val file = rs.body.asRaw.get.asFile
        new BufferedInputStream( new FileInputStream( file ) )
      }
      val result = Ok

      import scala.concurrent.ExecutionContext.Implicits.global
      val enumerator = Enumerator.outputStream { os =>

        val buf = new SmartOutputStream(rs, os, result, true) {
          override def flush() {
            doFlush()
          }
        }

        receivePack.receive(inputStream, buf, null)
        buf.close()
      }
      result.chunked(enumerator >>> Enumerator.eof).withHeaders(("Content-Type","application/x-git-receive-pack-result"))
    }
  }

  def gitUploadPack(name: String, repositoryName: String) = Action { rs =>
    DB.withSession{ implicit session =>
      val git = Git.open(getRepositoryDir(name, repositoryName))
      val repository = git.getRepository()
      val uploadPack = uploadPackFactory.create(rs, repository)
      uploadPack.setBiDirectionalPipe(false)

      val inputStream = new ByteArrayInputStream(rs.body.asRaw.get.asBytes().get)

      val result = Ok

      import scala.concurrent.ExecutionContext.Implicits.global
      val enumerator = Enumerator.outputStream { os =>
        val buf = new SmartOutputStream(rs, os, result, true) {
          override def flush() {
            doFlush()
          }
        }
        uploadPack.upload(inputStream, buf, null)
        buf.close()
      }
      result.stream(enumerator >>> Enumerator.eof).withHeaders(("Content-Type","application/x-git-upload-pack-result"))
    }
  }
}
