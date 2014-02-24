import play.api._

import java.io.File

import models._
import anorm._
import play.api.mvc.WithFilters
import play.filters.csrf._
import play.api.db.slick.ddl.TableScanner
import play.api.libs.Files

object Global extends GlobalSettings {

  private val configKey = "gitTable"
  private val ScriptDirectory = "conf/evolutions/"
  private val CreateScript = "create-database.sql"
  private val DropScript = "drop-database.sql"
  private val ScriptHeader = "-- SQL DDL script\n-- Generated file - do not edit\n\n"

  override def onStart(application: Application) {
    if (application.mode != Mode.Prod) {
      application.configuration.getConfig(configKey).foreach { configuration =>
        configuration.keys.foreach { database =>
          val databaseConfiguration = configuration.getString(database).getOrElse{
            throw configuration.reportError(database, "Missing values for key " + database, None)
          }
          val packageNames = databaseConfiguration.split(",").toSet
          val ddls = TableScanner.reflectAllDDLMethods(packageNames, scala.slick.driver.MySQLDriver,application.classloader)

          val scriptDirectory = application.getFile(ScriptDirectory + database)
          Files.createDirectory(scriptDirectory)

          writeScript(ddls.map(_.createStatements), scriptDirectory, CreateScript)
          writeScript(ddls.map(_.dropStatements), scriptDirectory, DropScript)
        }
      }
    }
    //InitialData.insert()
  }

  private def writeScript(ddlStatements: Set[Iterator[String]], directory: File, fileName: String): Unit = {
    val createScript = new File(directory, fileName)
    val createSql = ddlStatements.flatten.mkString("\n\n")
    Files.writeFileIfChanged(createScript, ScriptHeader + createSql)
  }

}

/**
 * Initial set of data to be imported 
 * in the sample application.
object InitialData {

  def date(str: String) = new java.text.SimpleDateFormat("yyyy-MM-dd").parse(str)

  def insert() = {

    if(User.findAll.isEmpty) {

      Seq(
        User("guillaume@sample.com", "Guillaume", "secret"),
        User("maxime@sample.com", "Maxime", "secret"),
        User("sadek@sample.com", "Sadek", "secret"),
        User("erwan@sample.com", "Erwan", "secret")
      ).foreach(User.create)

    }

  }

}
 */
