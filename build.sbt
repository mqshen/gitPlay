import play.Project._

name := "gitPlay"

version := "1.0-SNAPSHOT"

libraryDependencies ++= Seq(
  jdbc,
  anorm,
  cache,
  ws,
  filters,
  "com.typesafe.play" %% "play-slick" % "0.6.0.1",
  "mysql" % "mysql-connector-java" % "5.1.29",
  "org.eclipse.jgit" % "org.eclipse.jgit.http.server" % "3.0.0.201306101825-r",
  "commons-io" % "commons-io" % "2.4",
  "com.googlecode.juniversalchardet" % "juniversalchardet" % "1.0.3"
)

play.Project.playScalaSettings

templatesImport += "services.RepositoryService"

templatesImport += "util.JGitUtil"

templatesImport += "services.IssuesService"
