import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth } from "../auth-helper"

export const AUTHENTICATE = false

export const CAPABILITIES_RESPONSE = {
  api_version: "2.0.0",
  rules_version: "2026.g5.1",
  process_families: ["Heating Chamber"],
  pilot_skus: ["CN-X5PRIME-HE-XP5", "CN-N1200", "CN-THT02"],
  search: {
    supported_filters: [
      "q",
      "sku",
      "manufacturer",
      "role",
      "signal_type",
      "protocol",
      "mounting_type",
      "has_model3d",
      "limit",
      "cursor",
    ],
    max_limit: 50,
    default_limit: 10,
  },
  models_3d: {
    supported_format: "model/gltf-binary",
    coordinate_system: "right_handed_y_up_z_forward",
    units: "meters",
    default_fidelity: "dimensional_proxy_verified",
    base_url: "https://data.controlnautas.com/industrial-assets",
  },
  evaluation: {
    engine: "strict_evaluator_pure",
    verdicts: ["meets", "does_not_meet", "not_documented"],
    supports_evidence_refs: true,
  },
  auth: {
    scheme: "Bearer",
    header: "Authorization: Bearer <MUSE_API_TOKEN>",
    read_operations: [
      "capabilities",
      "products/search",
      "products/{idOrSku}",
      "products/{idOrSku}/model3d",
      "evaluate",
      "configurations/heating-chamber/bundle",
    ],
  },
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  return res.status(200).json(CAPABILITIES_RESPONSE)
}
