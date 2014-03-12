package models

import play.api.db.slick.Config.driver.simple._

/**
 * Created by GoldRatio on 3/12/14.
 */

class WatcherTable(tag: Tag) extends Table[Watcher](tag, "WATCHER") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def watcherName = column[String]("WATCHER_NAME")
  def * = (userName , repositoryName , watcherName) <> (Watcher.tupled, Watcher.unapply _)
}

case class Watcher(
  userName: String,
  repositoryName: String,
  watcherName: String
)


object WatcherDAO {

  val watchers = TableQuery[WatcherTable]

}