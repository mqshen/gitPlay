package util

import java.io.File
import util.ControlUtil._
import org.apache.commons.io.FileUtils

/**
 * Provides directories used by GitBucket.
 */
object Directory {

  val GitPlayHome = (System.getProperty("gitplay.home") match {
    // -Dgitbucket.home=<path>
    case path if(path != null) => new File(path)
    case _ => scala.util.Properties.envOrNone("GITPLAY_HOME") match {
      // environment variable GITBUCKET_HOME
      case Some(env) => new File(env)
      // default is HOME/.gitbucket
      case None => {
        val oldHome = new File(System.getProperty("user.home"), "gitplay")
        if(oldHome.exists && oldHome.isDirectory && new File(oldHome, "version").exists){
          //FileUtils.moveDirectory(oldHome, newHome)
          oldHome
        } else {
          new File(System.getProperty("user.home"), ".gitplay")
        }
      }
    }
  }).getAbsolutePath

  val GitBucketConf = new File(GitPlayHome, "gitbucket.conf")

  val RepositoryHome = s"${GitPlayHome}/repositories"

  val DatabaseHome = s"${GitPlayHome}/data"

  /**
   * Repository names of the specified user.
   */
  def getRepositories(owner: String): List[String] =
    defining(new File(s"${RepositoryHome}/${owner}")){ dir =>
      if(dir.exists){
        dir.listFiles.filter { file =>
          file.isDirectory && !file.getName.endsWith(".wiki.git")
        }.map(_.getName.replaceFirst("\\.git$", "")).toList
      } else {
        Nil
      }
    }

  /**
   * Substance directory of the repository.
   */
  def getRepositoryDir(owner: String, repository: String): File =
    new File(s"${RepositoryHome}/${owner}/${repository}.git")

  /**
   * Directory for uploaded files by the specified user.
   */
  def getUserUploadDir(userName: String): File = new File(s"${GitPlayHome}/data/${userName}/files")

  /**
   * Root of temporary directories for the specified repository.
   */
  def getTemporaryDir(owner: String, repository: String): File =
    new File(s"${GitPlayHome}/tmp/${owner}/${repository}")

  /**
   * Temporary directory which is used to create an archive to download repository contents.
   */
  def getDownloadWorkDir(owner: String, repository: String, sessionId: String): File =
    new File(getTemporaryDir(owner, repository), s"download/${sessionId}")

  /**
   * Substance directory of the wiki repository.
   */
  def getWikiRepositoryDir(owner: String, repository: String): File =
    new File(s"${RepositoryHome}/${owner}/${repository}.wiki.git")

}
