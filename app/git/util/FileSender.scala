package git.util

/**
 * Created by GoldRatio on 2/23/14.
 */

import java.io.{EOFException, OutputStream, File, RandomAccessFile}

import org.eclipse.jgit.lib.ObjectId
import play.api.mvc.{Result, AnyContent, Request}
import org.eclipse.jgit.util.HttpSupport
import java.text.MessageFormat
import org.eclipse.jgit.http.server.HttpServerText

object FileSender {
  def getRange(req: Request[AnyContent]) = {
    req.headers.getAll(HttpSupport.HDR_RANGE)
  }
}

class FileSender(path: File) {

  val source = new RandomAccessFile(path, "r")
  val lastModified = path.lastModified()
  val fileLen = source.getChannel().size()
  var pos = 0L
  var end = 0L

  def close() {
    source.close()
  }

  def getTailChecksum(): String = {
    val n = 20
    val buf:Array[Byte] = new Array[Byte](n)
    source.seek(fileLen - n)
    source.readFully(buf, 0, n)
    ObjectId.fromRaw(buf).getName()
  }

  def serve(request: Request[AnyContent], outputStream: OutputStream, result: Result, sendBody: Boolean) {
    if (!initRangeRequest(request, outputStream, result)) {
      //rsp.sendError(SC_REQUESTED_RANGE_NOT_SATISFIABLE)
    }
    else {
      result.withHeaders((HttpSupport.HDR_ACCEPT_RANGES, "bytes"))
      result.withHeaders((HttpSupport.HDR_CONTENT_LENGTH, (end - pos).toString))
      if (sendBody) {
        try {
          val buf:Array[Byte] = new Array[Byte](4096)
          source.seek(pos)
          while (pos < end) {
            val r = Math.min(buf.length, end - pos).toInt
            val n = source.read(buf, 0, r)
            if (n < 0) {
              throw new EOFException(MessageFormat.format(HttpServerText.get().unexpectedeOFOn, path));
            }
            outputStream.write(buf, 0, n)
            pos += n
          }
          outputStream.flush()
        }
        finally {
          outputStream.close()
        }
      }
    }
  }

  def initRangeRequest(request: Request[AnyContent], outputStream: OutputStream, result: Result): Boolean = {
    val rangeHeaders = FileSender.getRange(request)
    if(rangeHeaders.size == 0) {
      true
    }
    else if(rangeHeaders.size > 1) {
      false
    }
    else {
      val range = rangeHeaders(0)
      val eq = range.indexOf('=')
      val dash = range.indexOf('-')
      if (eq < 0 || dash < 0 || !range.startsWith("bytes=")) {
        false
      }
      else {
        request.headers.get(HttpSupport.HDR_IF_RANGE).map { ifRange =>
          if(!getTailChecksum().equals(ifRange)) {
            true
          }
        }
        try {
          if (eq + 1 == dash) {
            // "bytes=-500" means last 500 bytes
            pos = fileLen - (range.substring(dash + 1)).toLong
          }
          else {
            pos = (range.substring(eq + 1, dash)).toLong
            if (dash < range.length() - 1) {
              end = (range.substring(dash + 1)).toLong + 1
            }
          }
        }
        catch {
          case e: NumberFormatException => {
            false
          }
        }
        if (end > fileLen) {
          end = fileLen
        }
        if (pos >= end) {
          false
        }
        else {
          //rsp.setStatus(Status.PARTIAL_CONTENT)
          result.withHeaders((HttpSupport.HDR_CONTENT_RANGE, "bytes " + pos + "-" + (end - 1) + "/" + fileLen))
          source.seek(pos)
        }
      }
      true
    }
  }

}
