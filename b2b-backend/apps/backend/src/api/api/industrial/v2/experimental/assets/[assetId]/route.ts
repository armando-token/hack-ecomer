import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  resolveAssetManifest,
  findGlbFile,
  serveGlbBinary,
} from "../../../../../../../lib/industrial/assets"

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
    "Content-Length, Content-Type, ETag, X-Request-Id"
  )
  res.removeHeader("Access-Control-Allow-Credentials")
  return res.status(204).end()
}

export async function HEAD(req: MedusaRequest, res: MedusaResponse) {
  const { assetId } = req.params as { assetId: string }

  // If assetId is directly a .glb filename or sha256 of GLB, deliver binary HEAD
  if (assetId?.endsWith(".glb") || (/^[a-f0-9]{64}$/i.test(assetId) && !assetId.includes("."))) {
    const fileInfo = findGlbFile(assetId, assetId.endsWith(".glb") ? assetId : undefined)
    if (fileInfo) {
      return serveGlbBinary(req, res, fileInfo)
    }
  }

  const manifest = resolveAssetManifest(assetId)
  if (!manifest) {
    return res.status(404).end()
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("ETag", `"${manifest.sha256 || manifest.id}"`)
  res.setHeader("Cache-Control", "public, max-age=300")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.removeHeader("Access-Control-Allow-Credentials")
  return res.status(200).end()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { assetId } = req.params as { assetId: string }

  // If assetId is directly a .glb filename or sha256 of GLB, deliver binary GET
  if (assetId?.endsWith(".glb") || (/^[a-f0-9]{64}$/i.test(assetId) && !assetId.includes("."))) {
    const fileInfo = findGlbFile(assetId, assetId.endsWith(".glb") ? assetId : undefined)
    if (fileInfo) {
      return serveGlbBinary(req, res, fileInfo)
    }
  }

  const manifest = resolveAssetManifest(assetId)
  if (!manifest) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.removeHeader("Access-Control-Allow-Credentials")
    return res.status(404).json({
      error: "ASSET_NOT_FOUND",
      status: "not_documented",
      message: `Asset manifest for identifier '${assetId}' not found.`,
    })
  }

  const ifNoneMatch = req.headers["if-none-match"]
  const etagVal = `"${manifest.sha256 || manifest.id}"`
  if (ifNoneMatch && (ifNoneMatch === etagVal || ifNoneMatch === (manifest.sha256 || manifest.id))) {
    return res.status(304).end()
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8")
  res.setHeader("ETag", etagVal)
  res.setHeader("Cache-Control", "public, max-age=300")
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.removeHeader("Access-Control-Allow-Credentials")

  return res.status(200).json({
    status: "available",
    asset_id: manifest.id,
    sku_or_syn_id: manifest.sku_or_syn_id,
    variant_id: manifest.variant_id,
    fidelity: manifest.fidelity,
    units: manifest.units || manifest.linear_unit,
    coordinate_system: manifest.coordinate_system,
    dimensions_mm: manifest.dimensions_mm,
    bbox: manifest.bbox,
    anchors: manifest.anchors,
    qa: manifest.qa,
    delivery: manifest.delivery,
    manifest,
  })
}
