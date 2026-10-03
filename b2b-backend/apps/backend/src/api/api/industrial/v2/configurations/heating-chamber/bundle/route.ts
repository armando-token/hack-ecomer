import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth } from "../../../auth-helper"
import { buildHeatingChamberBundleWithCommerce } from "../../../../../../../modules/industrial-config/data/heating-chamber-pilot"

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
  if (typeof (res as any).removeHeader === "function") {
    res.removeHeader("Access-Control-Allow-Credentials")
  }
  return res.status(204).end()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  if (typeof (res as any).removeHeader === "function") {
    res.removeHeader("Access-Control-Allow-Credentials")
  }

  const rawBundle = await buildHeatingChamberBundleWithCommerce()

  // Return unified bundle supporting both Megaplan §19 core keys and pilot contract keys
  const enrichedBundle = {
    ...rawBundle,
    schema_version: "industrial_bundle/2.0",
    identity: {
      configuration_id: rawBundle.configuration.configuration_id,
      revision: rawBundle.configuration.revision,
      title: rawBundle.configuration.title,
      process_family: rawBundle.configuration.process_family,
    },
    engineering: {
      instances: rawBundle.configuration.instances,
      connections: rawBundle.configuration.connections,
      missing_roles: rawBundle.configuration.missing_roles,
    },
    technical_evaluation: {
      overall_verdict: rawBundle.evaluation.overall_verdict,
      overall_status: rawBundle.evaluation.overall_verdict,
      rule_set_version: rawBundle.evaluation.rule_set_version,
      evaluations: rawBundle.evaluation.evaluations,
    },
    commercial: rawBundle.commercial,
  }

  return res.status(200).json(enrichedBundle)
}
