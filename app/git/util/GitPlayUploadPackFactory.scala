package git.util

import org.eclipse.jgit.transport.resolver.UploadPackFactory
import play.api.mvc.{AnyContent, Request}
import org.eclipse.jgit.lib.Repository
import org.eclipse.jgit.transport.UploadPack

/**
 * Created by GoldRatio on 2/24/14.
 */
class GitPlayUploadPackFactory extends UploadPackFactory[Request[AnyContent]] {

  override def create(req: Request[AnyContent], repository: Repository): UploadPack = {
    // http/https request may or may not be authenticated
    /*
      user = authenticationManager.authenticate((HttpServletRequest) req);
      if (user == null) {
        user = UserModel.ANONYMOUS;
      }
    */
    val up = new UploadPack(repository)
    up.setTimeout(0)
    up
  }

}
