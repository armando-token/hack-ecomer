import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  findGlbFile,
  serveGlbBinary,
} from "../../../../../../../../lib/industrial/assets"

export const AUTHENTICATE = false

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, Authorization, X-Request-Id, x-request-id"
  )
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Length, Content-Type, Content-Range, ETag, Accept-Ranges, X-Request-Id"
  )
  res.removeHeader("Access-Control-Allow-Credentials")
  return res.status(204).end()
}

export async function HEAD(req: MedusaRequest, res: MedusaResponse) {
  const params = req.params as Record<string, string>
  const sha256 = params.sha256 || params.assetId
  const filename = params.filename

  if (!sha256 || !filename || !filename.endsWith(".glb")) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(400).end()
  }

  const fileInfo = findGlbFile(sha256, filename)
  if (!fileInfo) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(404).end()
  }

  return serveGlbBinary(req, res, fileInfo)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const params = req.params as Record<string, string>
  const sha256 = params.sha256 || params.assetId
  const filename = params.filename

  if (!sha256 || !filename || !filename.endsWith(".glb")) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(400).json({
      error: "INVALID_ASSET_REQUEST",
      message: "Request must specify valid SHA-256 identifier and .glb filename",
    })
  }

  const fileInfo = findGlbFile(sha256, filename)
  if (!fileInfo) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(404).json({
      error: "ASSET_NOT_FOUND",
      message: `Asset '${filename}' with content hash '${sha256}' not found in storage.`,
    })
  }

  return serveGlbBinary(req, res, fileInfo)
}
