import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  authenticateMuseRequest,
  getOrGenerateRequestId,
  applySecurityHeaders,
  formatErrorResponse,
} from "../../../../lib/muse/auth-guard"

export { formatErrorResponse, getOrGenerateRequestId, applySecurityHeaders }

export interface OptionalAuthResult {
  allowed: boolean
  requestId: string
  authenticated: boolean
}

/**
 * Handles optional Bearer authentication for Industrial v2 read endpoints.
 * - If Authorization header is provided, it validates the token format and value via authenticateMuseRequest.
 *   If invalid, authenticateMuseRequest responds with HTTP 401 and returns allowed: false.
 * - If Authorization header is omitted, public read is allowed, with request tracking and security headers applied.
 */
export function verifyOptionalMuseAuth(
  req: MedusaRequest,
  res: MedusaResponse
): OptionalAuthResult {
  if (!req.headers) {
    req.headers = {} as any
  }
  const authHeader = req.headers["authorization"]

  if (authHeader) {
    const authResult = authenticateMuseRequest(req, res)
    if (!authResult.authenticated) {
      return {
        allowed: false,
        requestId: authResult.requestId,
        authenticated: false,
      }
    }
    return {
      allowed: true,
      requestId: authResult.requestId,
      authenticated: true,
    }
  }

  const requestId = getOrGenerateRequestId(req)
  applySecurityHeaders(res, requestId)

  return {
    allowed: true,
    requestId,
    authenticated: false,
  }
}
