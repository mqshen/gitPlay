package services

import models._
import scala.slick.driver.H2Driver.simple._

trait ActivityService {

  def recordCreateRepositoryActivity(userName: String, repositoryName: String, activityUserName: String)(implicit s: Session): Unit =
    ActivityDAO.create(userName, repositoryName, activityUserName, "create_repository",
      s"[user:${activityUserName}] created [repo:${userName}/${repositoryName}]"
    )

  private def cut(value: String, length: Int): String =
    if(value.length > length) value.substring(0, length) + "..." else value
}
