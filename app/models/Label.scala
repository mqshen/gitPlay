package models

/**
 * Created by GoldRatio on 2/24/14.
 */

import java.sql.Date
import play.api.db.slick.Config.driver.simple._

case class Label(
  var userName: String,
  var repositoryName: String,
  labelId: Int,
  var labelName: String,
  var color: String){

  val fontColor = {
    val r = color.substring(0, 2)
    val g = color.substring(2, 4)
    val b = color.substring(4, 6)

    if(Integer.parseInt(r, 16) + Integer.parseInt(g, 16) + Integer.parseInt(b, 16) > 408){
      "000000"
    } else {
      "FFFFFF"
    }
  }
}

class LabelTable(tag: Tag) extends Table[Label](tag, "LABEL") {
  def userName = column[String]("USER_NAME")
  def repositoryName = column[String]("REPOSITORY_NAME")
  def labelId = column[Int]("LABEL_ID", O.PrimaryKey, O.AutoInc)
  def labelName = column[String]("LABEL_NAME")
  def color = column[String]("COLOR")
  def * = (userName , repositoryName , labelId , labelName , color) <> (Label.tupled, Label.unapply _)

}

object LabelDAO {
  val labels = TableQuery[LabelTable]

  def getLabels(userName: String, repositoryName: String)(implicit s: Session): List[Label] = {
    labels.where(_.userName === userName).where(_.repositoryName === repositoryName).list
  }

  def getLabel(userName: String, repositoryName: String, labelName: String)(implicit s: Session): Option[Label] = {
    labels.where(_.userName === userName).where(_.repositoryName === repositoryName).where(_.labelName === labelName).firstOption
  }

  def create(label: Label)(implicit s: Session) {
    labels.insert(label)
  }

  def update(userName: String, repositoryName: String, labelName: String, label: Label)(implicit s: Session) {
    val q = for { l <- labels if l.userName === userName && l.repositoryName === repositoryName && l.labelName === labelName} yield (l.labelName, l.color)
    q.update(label.labelName, label.color)
  }

  def delete(userName: String, repositoryName: String, labelName: String)(implicit s: Session) = {
    labels.where(_.userName === userName).where(_.repositoryName === repositoryName).where(_.labelName === labelName).delete
  }

}