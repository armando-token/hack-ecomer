import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  buildHeatingChamberBundle,
  HEATING_CHAMBER_PILOT_ID,
} from "../../../../../../../modules/industrial-config/data/heating-chamber-pilot"

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
  const { configId } = req.params as { configId: string }

  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Content-Type", "application/json; charset=utf-8")
  if (typeof (res as any).removeHeader === "function") {
    res.removeHeader("Access-Control-Allow-Credentials")
  }

  if (
    configId === HEATING_CHAMBER_PILOT_ID ||
    configId === "heating-chamber" ||
    configId === "cfg_heating_chamber_pilot"
  ) {
    const bundle = buildHeatingChamberBundle()
    return res.status(200).json(bundle)
  }

  return res.status(404).json({
    error: "CONFIGURATION_NOT_FOUND",
    message: `Configuration '${configId}' not found`,
  })
}
