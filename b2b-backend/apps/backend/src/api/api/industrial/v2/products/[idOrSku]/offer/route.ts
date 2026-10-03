import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../../../auth-helper"
import { getSnapshotDefinition, getProductMeta } from "../../../catalog"
import {
  getLiveOffer,
  isLiveOfferNotFoundError,
  isLiveOfferValidationError,
  type LiveOfferResult,
} from "../../../../../../../lib/muse/offer"

export const AUTHENTICATE = false

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, Authorization, X-Request-Id, x-request-id"
  )
  res.setHeader("Access-Control-Max-Age", "86400")
  return res.status(204).end()
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  res.setHeader("Access-Control-Allow-Origin", "*")

  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  const rawIdOrSku = (req.params as any)?.idOrSku || (req.params as any)?.sku || (req.params as any)?.id
  if (!rawIdOrSku || typeof rawIdOrSku !== "string" || !rawIdOrSku.trim()) {
    return formatErrorResponse(
      res,
      400,
      "INVALID_PARAM",
      "Path parameter 'idOrSku' is required",
      auth.requestId
    )
  }

  const cleanId = rawIdOrSku.trim()

  // 1. Resolve idOrSku (SKU, variant_id, or snapshot_id)
  const snapshot = getSnapshotDefinition(cleanId)
  const lookupTarget = snapshot?.variant_id || snapshot?.sku || cleanId

  // 2. Validate quantity (integer 1..20, default 1)
  const rawQuantity = req.query?.quantity
  let quantity = 1

  if (rawQuantity !== undefined && rawQuantity !== null && String(rawQuantity).trim() !== "") {
    const qtyStr = String(rawQuantity).trim()
    const parsed = Number(qtyStr)

    if (
      !/^-?\d+$/.test(qtyStr) ||
      !Number.isInteger(parsed) ||
      parsed < 1 ||
      parsed > 20
    ) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        `Query parameter 'quantity' must be an integer between 1 and 20 (received: ${qtyStr})`,
        auth.requestId,
        { parameter: "quantity", received: rawQuantity, min: 1, max: 20 }
      )
    }

    quantity = parsed
  }

  // 3. Optional region_id
  const rawRegionId = req.query?.region_id || (req.query as any)?.regionId
  const regionId =
    typeof rawRegionId === "string" && rawRegionId.trim().length > 0
      ? rawRegionId.trim()
      : undefined

  // 4. Query live offer
  try {
    let offer: LiveOfferResult
    try {
      offer = await getLiveOffer(lookupTarget, quantity, regionId)
    } catch (firstErr) {
      if (lookupTarget !== cleanId) {
        offer = await getLiveOffer(cleanId, quantity, regionId)
      } else {
        throw firstErr
      }
    }

    const meta = getProductMeta(offer.sku)
    const productUrl =
      offer.product_url ||
      meta.product_url ||
      `https://data.controlnautas.com/us/products/${(offer.product_handle || offer.sku).toLowerCase()}`

    const responsePayload = {
      sku: offer.sku,
      variant_id: offer.variant_id,
      model: offer.model || (snapshot as any)?.manufacturer_part_number || (snapshot as any)?.model || null,
      title: offer.title || meta.title || offer.sku,
      quantity: offer.quantity,
      currency: (offer.currency || "USD").toUpperCase(),
      unit_price_cents: offer.unit_price_minor,
      unit_price_usd: offer.unit_price,
      subtotal_cents: offer.subtotal_minor,
      subtotal_usd: offer.subtotal,
      state: offer.state,
      availability_status: offer.availability_status,
      availability: offer.availability,
      tax_status: "tax_excluded",
      shipping_status: "to_be_confirmed",
      limitations: offer.limitations || [],
      observed_at: offer.observed_at,
      product_url: productUrl,
    }

    res.setHeader("Cache-Control", "no-store")
    return res.status(200).json(responsePayload)
  } catch (err: any) {
    if (
      err?.code === "NOT_FOUND" ||
      err?.statusCode === 404 ||
      err?.status === 404 ||
      isLiveOfferNotFoundError(err) ||
      /not found/i.test(err?.message || "")
    ) {
      return formatErrorResponse(
        res,
        404,
        "NOT_FOUND",
        err?.message || `Product with identifier '${cleanId}' was not found in active catalog.`,
        auth.requestId
      )
    }

    if (
      err?.code === "INVALID_PARAM" ||
      err?.code === "INVALID_QUANTITY" ||
      err?.statusCode === 400 ||
      err?.status === 400 ||
      isLiveOfferValidationError(err)
    ) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        err?.message || "Invalid parameter provided",
        auth.requestId
      )
    }

    return formatErrorResponse(
      res,
      500,
      "INTERNAL_SERVER_ERROR",
      err?.message || "An unexpected error occurred while calculating product offer",
      auth.requestId
    )
  }
}
