import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../../auth-helper"
import { searchCatalog, type SearchFilterParams } from "../../catalog"

export const AUTHENTICATE = false

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  const query = req.query || {}

  // 1. Validate 'q'
  let q: string | undefined
  if (query.q !== undefined && query.q !== null) {
    if (typeof query.q !== "string") {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        "Query parameter 'q' must be a string",
        auth.requestId
      )
    }
    if (query.q.length > 200) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        `Query parameter 'q' must not exceed 200 characters (received ${query.q.length})`,
        auth.requestId,
        { length: query.q.length, max: 200 }
      )
    }
    q = query.q.trim()
  }

  // 2. Validate 'limit'
  let limit = 10
  if (query.limit !== undefined && query.limit !== null && query.limit !== "") {
    const limitStr = String(query.limit).trim()
    const parsed = Number(limitStr)
    if (!/^-?\d+$/.test(limitStr) || !Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        `Query parameter 'limit' must be an integer between 1 and 50 (received '${query.limit}')`,
        auth.requestId,
        { limit: query.limit, min: 1, max: 50 }
      )
    }
    limit = parsed
  }

  // 3. Extract other filters
  const sku = typeof query.sku === "string" ? query.sku.trim() : undefined
  const manufacturer = typeof query.manufacturer === "string" ? query.manufacturer.trim() : undefined
  const role = typeof query.role === "string" ? query.role.trim() : undefined
  const signal_type = typeof query.signal_type === "string" ? query.signal_type.trim() : undefined
  const protocol = typeof query.protocol === "string" ? query.protocol.trim() : undefined
  const mounting_type = typeof query.mounting_type === "string" ? query.mounting_type.trim() : undefined
  const has_model3d = query.has_model3d as string | undefined
  const cursor = typeof query.cursor === "string" ? query.cursor.trim() : undefined

  const searchParams: SearchFilterParams = {
    q,
    sku,
    manufacturer,
    role,
    signal_type,
    protocol,
    mounting_type,
    has_model3d,
    limit,
    cursor,
  }

  try {
    const result = searchCatalog(searchParams)
    return res.status(200).json(result)
  } catch (err: any) {
    return formatErrorResponse(
      res,
      500,
      "INTERNAL_ERROR",
      err?.message || "An unexpected error occurred during product search",
      auth.requestId
    )
  }
}
