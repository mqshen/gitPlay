package services

import models._
import util.JGitUtil
import play.api.db.slick.Config.driver.simple._
import play.api.mvc.{RequestHeader, AnyContent, Request}

trait RepositoryService {
  import RepositoryService._

  def getRepository(userName: String, repositoryName: String)(implicit s: Session): Option[RepositoryInfo] = {

    RepositoryDAO.getByUserAndName(userName, repositoryName) map { repository =>
    // for getting issue count and pull request count

      new RepositoryInfo(
        JGitUtil.getRepositoryInfo(repository.userName, repository.repositoryName),
        repository,
        0,
        0,
        0)
    }
  }

  def getBaseUrl(request: RequestHeader): String = {
    val baseUrl = if (request.secure) "https://" + request.host else "http://" + request.host
    baseUrl
  }

}

object RepositoryService {

  case class RepositoryInfo(owner: String, name: String, url: String, repository: Repository,
                            issueCount: Int, pullCount: Int, commitCount: Int, forkedCount: Int,
                            branchList: List[String], tags: List[util.JGitUtil.TagInfo]){

    /**
     * Creates instance with issue count and pull request count.
     */
    def this(repo: JGitUtil.RepositoryInfo, model: Repository, issueCount: Int, pullCount: Int, forkedCount: Int) =
      this(repo.owner, repo.name, repo.url, model, issueCount, pullCount, repo.commitCount, forkedCount, repo.branchList, repo.tags)

    /**
     * Creates instance without issue count and pull request count.
     */
    def this(repo: JGitUtil.RepositoryInfo, model: Repository, forkedCount: Int) =
      this(repo.owner, repo.name, repo.url, model, 0, 0, repo.commitCount, forkedCount, repo.branchList, repo.tags)
  }

  case class RepositoryTreeNode(owner: String, name: String, children: List[RepositoryTreeNode])

}
