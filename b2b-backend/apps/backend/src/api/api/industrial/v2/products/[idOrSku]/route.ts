import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../../auth-helper"
import {
  getSnapshotDefinition,
  getAssetDefinition,
  getProductMeta,
} from "../../catalog"

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

  const snapshot = getSnapshotDefinition(idOrSku)
  if (!snapshot) {
    return formatErrorResponse(
      res,
      404,
      "PRODUCT_NOT_FOUND",
      `Product with identifier '${idOrSku}' was not found in active catalog.`,
      auth.requestId
    )
  }

  const meta = getProductMeta(snapshot.sku)
  const asset = getAssetDefinition(snapshot.sku)

  const envelope = snapshot.dimensions?.envelope_m || null
  const model3d = asset
    ? {
        has_model3d: true,
        asset_id: asset.id,
        sku: asset.sku,
        fidelity: asset.manifest_json?.fidelity || "dimensional_proxy_verified",
        format: asset.mime || "model/gltf-binary",
        units: "meters",
        url: `https://data.controlnautas.com/industrial-assets/${asset.sha256}/${asset.sku}.glb`,
        sha256: asset.sha256,
        bytes: asset.bytes,
        manifest_url: `/industrial-assets/${asset.sha256}/${asset.sku}.manifest.json`,
      }
    : null

  const responsePayload = {
    identity: {
      sku: snapshot.sku,
      variant_id: snapshot.variant_id,
      snapshot_id: snapshot.snapshot_id,
      title: meta.title,
      manufacturer: snapshot.manufacturer,
      model: snapshot.manufacturer_part_number,
      role: meta.role,
    },
    sku: snapshot.sku,
    variant_id: snapshot.variant_id,
    snapshot_id: snapshot.snapshot_id,
    manufacturer: snapshot.manufacturer,
    manufacturer_part_number: snapshot.manufacturer_part_number,
    title: meta.title,
    role: meta.role,
    technical_summary: meta.technical_summary,
    technical_revision: snapshot.technical_revision,
    state: snapshot.state,
    metric_envelope: envelope,
    envelope_m: envelope,
    dimensions: snapshot.dimensions,
    mounting: snapshot.mounting || [],
    capabilities: snapshot.capabilities || [],
    ports: snapshot.ports || [],
    facts: snapshot.attributes || [],
    attributes: snapshot.attributes || [],
    source_ids: snapshot.source_ids || [],
    content_sha256: snapshot.content_sha256,
    model3d,
    product_url: meta.product_url,
  }

  return res.status(200).json(responsePayload)
}
