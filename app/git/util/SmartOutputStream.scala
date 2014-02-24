package git.util

import org.eclipse.jgit.util.{HttpSupport, TemporaryBuffer}
import java.io.OutputStream
import play.api.mvc.{AnyContent, Result, Request}
import java.util.zip.GZIPOutputStream

/**
 * Created by GoldRatio on 2/22/14.
 */
class SmartOutputStream(request: Request[AnyContent], outputStream: OutputStream, result: Result, compressStream: Boolean, LIMIT:Int = 32 * 1024) extends TemporaryBuffer(LIMIT) {
  var startedOutput = false

  override def overflow(): OutputStream = {
    startedOutput = true
    if(acceptsGzipEncoding(request)) {
      result.withHeaders((HttpSupport.HDR_ACCEPT_ENCODING, HttpSupport.ENCODING_GZIP))
      new GZIPOutputStream(outputStream)
    }
    else {
      outputStream
    }
  }

  override def close() {
    super.close()
    if (!startedOutput) {
      // If output hasn't started yet, the entire thing fit into our
      // buffer. Try to use a proper Content-Length header, and also
      // deflate the response with gzip if it will be smaller.
      var out:TemporaryBuffer = this

      if (256 < out.length() && acceptsGzipEncoding(request)) {
        val gzbuf = new TemporaryBuffer.Heap(LIMIT)
        try {
          val gzip = new GZIPOutputStream(gzbuf)
          try {
            out.writeTo(gzip, null)
          } finally {
            gzip.close();
          }
          if (gzbuf.length() < out.length()) {
            out = gzbuf
            result.withHeaders((HttpSupport.HDR_ACCEPT_ENCODING, HttpSupport.ENCODING_GZIP))
          }
        }
      }

      // The Content-Length cannot overflow when cast to an int, our
      // hardcoded LIMIT constant above assures us we wouldn't store
      // more than 2 GiB of content in memory.
      try {
        out.writeTo(outputStream, null)
        outputStream.flush()
      } finally {
        outputStream.close()
      }
    }
  }

  def acceptsGzipEncoding(req : Request[AnyContent]):Boolean = {
    req.headers.get(HttpSupport.HDR_ACCEPT_ENCODING).map { accepts =>
      val reg = """\s*gzip\s*"""".r
      if(reg.findAllMatchIn(accepts).hasNext)
        true
      else
        false
    }.getOrElse(false)

  }
}
