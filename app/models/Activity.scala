package models

/**
 * Created by GoldRatio on 2/20/14.
 */

import java.sql.Date
import play.api.db.slick.Config.driver.simple._

case class Activity (
  activityId: Option[Int],
  userName: String,
  repositoryName: String,
  activityUserName: String,
  activityType: String,
  message: String,
  additionalInfo: Option[String],
  activityDate: Date
)

class ActivitiyTable(tag: Tag) extends Table[Activity](tag, "ACTIVITY") with BasicTemplate {
  def activityId = column[Option[Int]]("ACTIVITY_ID", O.PrimaryKey, O.AutoInc)
  def activityUserName = column[String]("ACTIVITY_USER_NAME")
  def activityType = column[String]("ACTIVITY_TYPE")
  def message = column[String]("MESSAGE")
  def additionalInfo = column[String]("ADDITIONAL_INFO")
  def activityDate = column[Date]("ACTIVITY_DATE")
  def * = (activityId , userName , repositoryName , activityUserName , activityType , message , additionalInfo.? , activityDate) <> (Activity.tupled, Activity.unapply _)
}

class CommitLogTable(tag: Tag) extends Table[(String, String, String)](tag, "COMMIT_LOG") with BasicTemplate {
  def commitId = column[String]("COMMIT_ID")
  def * = (userName , repositoryName , commitId)
  def byPrimaryKey(userName: String, repositoryName: String, commitId: String) = byRepository(userName, repositoryName) && (this.commitId is commitId.bind)
}

object ActivityDAO {

  val activities = TableQuery[ActivitiyTable]

  def getRecentActivities(userName: String)(implicit s: Session): List[Activity] = {
    /*
    val query = activities.leftJoin(WatcherDAO.watchers).on { case (t1, t2) =>
      t1.userName === t2.userName &&
        t1.repositoryName === t2.repositoryName}
    .map { case (t1, t2) => t1.*}.take(30)
    query.list
    */
    val query = (for {
      (activity, reposityory) <- activities leftJoin WatcherDAO.watchers on { case (t1, t2) =>
        t1.repositoryName === t2.repositoryName && t1.userName === t2.userName
      }
      if activity.activityUserName =!= userName
    } yield (activity))
      .take(30)
    query.list
  }

  def create(userName: String, repositoryName: String, activityUserName: String,
             activityType: String, message: String)(implicit s: Session) = {
    val currentDate = new Date(System.currentTimeMillis())
    val activity = Activity(None, userName, repositoryName, activityUserName, activityType, message, None, currentDate)
    activities.insert(activity)
  }

}

