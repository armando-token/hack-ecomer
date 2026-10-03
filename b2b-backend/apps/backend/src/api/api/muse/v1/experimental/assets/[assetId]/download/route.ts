import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  verifySignedAssetToken,
  resolveAssetManifest,
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
    "Content-Length, Content-Type, Content-Range, ETag, Accept-Ranges, Content-Disposition, X-Request-Id"
  )
  res.removeHeader("Access-Control-Allow-Credentials")
  return res.status(204).end()
}

export async function HEAD(req: MedusaRequest, res: MedusaResponse) {
  const { assetId } = req.params as { assetId: string }
  const token = (req.query?.token as string | undefined) || (req.headers["x-muse-token"] as string | undefined)
  const expires = req.query?.expires as string | undefined
  const authHeader = req.headers["authorization"] as string | undefined

  const authResult = verifySignedAssetToken(assetId, token, expires, authHeader)
  if (!authResult.valid) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")

    if (authResult.code === "DOWNLOAD_EXPIRED") {
      return res.status(410).json({
        error: "DOWNLOAD_EXPIRED",
        message: authResult.message || "Download token has expired",
        expires: expires ? Number(expires) : undefined,
      })
    }
    if (authResult.code === "UNAUTHORIZED") {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: authResult.message || "Authentication required. Provide MUSE_API_TOKEN or signed download token.",
      })
    }
    return res.status(403).json({
      error: authResult.code || "FORBIDDEN",
      message: authResult.message || "Invalid or tampered download token",
    })
  }

  const manifest = resolveAssetManifest(assetId)
  const fileInfo = findGlbFile(assetId, manifest ? `${manifest.sku_or_syn_id || manifest.id}.glb` : undefined)
  if (!fileInfo) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(404).end()
  }

  const safeFilename = `${manifest?.sku_or_syn_id || manifest?.id || assetId}.glb`
  return serveGlbBinary(req, res, fileInfo, { isSigned: true, dispositionFilename: safeFilename })
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { assetId } = req.params as { assetId: string }
  const token = (req.query?.token as string | undefined) || (req.headers["x-muse-token"] as string | undefined)
  const expires = req.query?.expires as string | undefined
  const authHeader = req.headers["authorization"] as string | undefined

  const authResult = verifySignedAssetToken(assetId, token, expires, authHeader)
  if (!authResult.valid) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")

    if (authResult.code === "DOWNLOAD_EXPIRED") {
      return res.status(410).json({
        error: "DOWNLOAD_EXPIRED",
        message: authResult.message || "Download token has expired",
        expires: expires ? Number(expires) : undefined,
      })
    }
    if (authResult.code === "UNAUTHORIZED") {
      return res.status(401).json({
        error: "UNAUTHORIZED",
        message: authResult.message || "Authentication required. Provide MUSE_API_TOKEN or signed download token.",
      })
    }
    return res.status(403).json({
      error: authResult.code || "FORBIDDEN",
      message: authResult.message || "Invalid or tampered download token",
    })
  }

  const manifest = resolveAssetManifest(assetId)
  const fileInfo = findGlbFile(assetId, manifest ? `${manifest.sku_or_syn_id || manifest.id}.glb` : undefined)
  if (!fileInfo) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(404).json({
      error: "ASSET_NOT_FOUND",
      message: `Asset '${assetId}' not found in industrial asset repository.`,
    })
  }

  const safeFilename = `${manifest?.sku_or_syn_id || manifest?.id || assetId}.glb`
  return serveGlbBinary(req, res, fileInfo, { isSigned: true, dispositionFilename: safeFilename })
}
