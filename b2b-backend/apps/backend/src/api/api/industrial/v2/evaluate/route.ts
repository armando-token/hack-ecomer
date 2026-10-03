import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../auth-helper"
import { getSnapshotDefinition } from "../catalog"
import { evaluateProduct } from "../../../../../modules/industrial-config/evaluator"

export const AUTHENTICATE = false

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  const body = (req.body || {}) as any
  const sku = typeof body.sku === "string" ? body.sku.trim() : undefined

  if (!sku) {
    return formatErrorResponse(
      res,
      400,
      "INVALID_PARAM",
      "Request body must include 'sku'",
      auth.requestId
    )
  }

  if (body.requirements !== undefined && !Array.isArray(body.requirements)) {
    return formatErrorResponse(
      res,
      400,
      "INVALID_PARAM",
      "Field 'requirements' must be an array of technical requirements",
      auth.requestId
    )
  }

  const snapshot = getSnapshotDefinition(sku)
  if (!snapshot) {
    return formatErrorResponse(
      res,
      404,
      "PRODUCT_NOT_FOUND",
      `Product with SKU '${sku}' was not found in active catalog.`,
      auth.requestId
    )
  }

  try {
    const evaluation = evaluateProduct(
      snapshot,
      body.requirements || [],
      body.context,
      "2026.g5.1"
    )

    const responsePayload = {
      sku: evaluation.sku,
      overall_verdict: evaluation.overall_verdict,
      overall_status: evaluation.overall_status,
      rule_set_version: "2026.g5.1",
      evaluations: evaluation.evaluations,
      unverified_scopes: evaluation.unverified_scopes,
      validation_scope: evaluation.validation_scope,
      evaluated_at: evaluation.evaluated_at,
    }

    return res.status(200).json(responsePayload)
  } catch (err: any) {
    return formatErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      err?.message || "An unexpected error occurred during product evaluation",
      auth.requestId
    )
  }
}
