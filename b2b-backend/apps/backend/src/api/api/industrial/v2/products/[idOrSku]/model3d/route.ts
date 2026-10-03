import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../../../auth-helper"
import { getAssetDefinition, getSnapshotDefinition } from "../../../catalog"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  const { idOrSku } = req.params as { idOrSku?: string }
  if (!idOrSku || idOrSku.trim() === "") {
    return formatErrorResponse(
      res,
      400,
      "INVALID_PARAM",
      "Path parameter 'idOrSku' is required",
      auth.requestId
    )
  }

  // Resolve asset directly or via snapshot
  let asset = getAssetDefinition(idOrSku)
  if (!asset) {
    const snapshot = getSnapshotDefinition(idOrSku)
    if (snapshot) {
      asset = getAssetDefinition(snapshot.sku)
    }
  }

  if (!asset) {
    return formatErrorResponse(
      res,
      404,
      "ASSET_NOT_FOUND",
      `3D model asset for identifier '${idOrSku}' was not found.`,
      auth.requestId
    )
  }

  const manifest = asset.manifest_json || {}
  const anchors = Array.isArray(manifest.anchors) ? manifest.anchors : []
  const fidelity = manifest.fidelity || "dimensional_proxy_verified"
  const url = `https://data.controlnautas.com/industrial-assets/${asset.sha256}/${asset.sku}.glb`
  const manifestUrl = `/industrial-assets/${asset.sha256}/${asset.sku}.manifest.json`

  const responsePayload = {
    asset_id: asset.id,
    sku: asset.sku,
    fidelity,
    format: "model/gltf-binary",
    units: "meters",
    url,
    sha256: asset.sha256,
    bytes: asset.bytes,
    anchors,
    manifest_url: manifestUrl,
  }

  return res.status(200).json(responsePayload)
}
