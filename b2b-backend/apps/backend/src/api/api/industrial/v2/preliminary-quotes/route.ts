import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as crypto from "crypto"
import { verifyOptionalMuseAuth, formatErrorResponse } from "../auth-helper"
import { getProductMeta } from "../catalog"
import { getLiveOffer, type LiveOfferResult } from "../../../../../lib/muse/offer"
import { generateQuotePdf, type GenerateQuotePdfResult } from "../../../../../lib/muse/pdf-generator"
import { getPool } from "../../../../../lib/muse/db"
import {
  PILOT_SKUS,
  saveV2Quote,
  type V2QuoteItem,
  type V2QuoteRecord,
} from "../quotes-store"

export const AUTHENTICATE = false

const KNOWN_PILOT_SKU_SET = new Set<string>(PILOT_SKUS)

const MISSING_ROLE_PATTERNS = [
  "ssr",
  "solid_state_relay",
  "relay",
  "heater",
  "heating_element",
  "actuator_power_switching",
  "thermal_load_heater",
  "power_contactor",
  "contactor",
]

function isMissingRoleIndicator(value: string): boolean {
  const lower = value.toLowerCase()
  return MISSING_ROLE_PATTERNS.some((pattern) => lower.includes(pattern))
}

export async function OPTIONS(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Range, Content-Type, Authorization, X-Request-Id, x-request-id"
  )
  res.setHeader("Access-Control-Max-Age", "86400")
  return res.status(204).end()
}

export async function POST(req: MedusaRequest, res: MedusaResponse): Promise<any> {
  res.setHeader("Access-Control-Allow-Origin", "*")

  const auth = verifyOptionalMuseAuth(req, res)
  if (!auth.allowed) {
    return
  }

  // 1. Parse JSON body
  let body: any = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return formatErrorResponse(
        res,
        400,
        "INVALID_REQUEST",
        "Request body must be a valid JSON object",
        auth.requestId
      )
    }
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return formatErrorResponse(
      res,
      400,
      "INVALID_REQUEST",
      "Request body must be a non-null JSON object",
      auth.requestId
    )
  }

  // 2. Reject explicit missing roles in request body (e.g. from bundle missing_roles)
  if (Array.isArray(body.missing_roles) && body.missing_roles.length > 0) {
    const rolesList = body.missing_roles
      .map((r: any) =>
        typeof r === "string" ? r : r.role || r.required_for || JSON.stringify(r)
      )
      .join(", ")
    return formatErrorResponse(
      res,
      400,
      "MISSING_ROLES_NOT_QUOTABLE",
      `Cannot quote configuration with unresolved missing roles: ${rolesList}. Missing power actuator (SSR) or heater must be resolved. Only pilot SKUs (CN-X5PRIME-HE-XP5, CN-N1200, CN-THT02) can be quoted.`,
      auth.requestId,
      { missing_roles: body.missing_roles }
    )
  }

  // 3. Extract items/lines
  interface RawItem {
    sku?: unknown
    role?: unknown
    role_id?: unknown
    quantity?: unknown
  }

  let rawItems: RawItem[] = []
  if (Array.isArray(body.items)) {
    rawItems = body.items
  } else if (Array.isArray(body.lines)) {
    rawItems = body.lines
  } else if (body.sku) {
    rawItems = [{ sku: body.sku, quantity: body.quantity }]
  } else {
    return formatErrorResponse(
      res,
      400,
      "INVALID_REQUEST",
      "Request body must specify either 'sku' or an 'items'/'lines' array.",
      auth.requestId
    )
  }

  if (rawItems.length === 0) {
    return formatErrorResponse(
      res,
      400,
      "INVALID_REQUEST",
      "Quotation items list cannot be empty.",
      auth.requestId
    )
  }

  // 4. Validate each line item
  interface ValidatedItem {
    sku: string
    quantity: number
  }

  const validatedItems: ValidatedItem[] = []

  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i]
    if (!it || typeof it !== "object") {
      return formatErrorResponse(
        res,
        400,
        "INVALID_ITEM",
        `Item at index ${i} must be a valid JSON object.`,
        auth.requestId
      )
    }

    // Check if item only has role (missing role)
    if (!it.sku && (it.role || it.role_id)) {
      const roleStr = String(it.role || it.role_id)
      return formatErrorResponse(
        res,
        400,
        "MISSING_ROLE_NOT_QUOTABLE",
        `Item at index ${i} specifies missing role '${roleStr}' without a physical pilot SKU. Solid state relays (SSR) and heaters are not yet available in pilot demonstration catalog.`,
        auth.requestId,
        { index: i, role: roleStr }
      )
    }

    if (!it.sku || typeof it.sku !== "string" || !it.sku.trim()) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_PARAM",
        `Item at index ${i} requires a non-empty string 'sku'.`,
        auth.requestId
      )
    }

    const normSku = it.sku.trim().toUpperCase()

    // Detect missing role keywords passed in SKU (e.g. "SSR-40DA", "HEATER-2KW")
    if (isMissingRoleIndicator(normSku) || (it.role && isMissingRoleIndicator(String(it.role)))) {
      return formatErrorResponse(
        res,
        400,
        "MISSING_ROLE_NOT_QUOTABLE",
        `SKU '${it.sku}' represents an unfulfilled missing role (power actuator / heater). Only pilot SKUs (CN-X5PRIME-HE-XP5, CN-N1200, CN-THT02) can be quoted.`,
        auth.requestId,
        { sku: it.sku }
      )
    }

    // Check pilot catalog isolation
    if (!KNOWN_PILOT_SKU_SET.has(normSku)) {
      return formatErrorResponse(
        res,
        400,
        "UNSUPPORTED_SKU",
        `SKU '${it.sku}' is not a valid pilot demonstration SKU. Supported pilot SKUs: CN-X5PRIME-HE-XP5, CN-N1200, CN-THT02.`,
        auth.requestId,
        { received_sku: it.sku, supported_skus: Array.from(KNOWN_PILOT_SKU_SET) }
      )
    }

    // Validate quantity
    const rawQty = it.quantity === undefined || it.quantity === null ? 1 : it.quantity
    const parsedQty = Number(rawQty)
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 20) {
      return formatErrorResponse(
        res,
        400,
        "INVALID_QUANTITY",
        `Quantity for item '${it.sku}' must be an integer between 1 and 20 (received: ${String(it.quantity)}).`,
        auth.requestId,
        { sku: it.sku, quantity: it.quantity }
      )
    }

    validatedItems.push({
      sku: normSku,
      quantity: parsedQty,
    })
  }

  // 5. Query live offer for each validated item
  const quoteItems: V2QuoteItem[] = []
  const regionId = typeof body.region_id === "string" ? body.region_id.trim() : undefined

  for (const it of validatedItems) {
    try {
      const offer: LiveOfferResult = await getLiveOffer(it.sku, it.quantity, regionId)
      const meta = getProductMeta(offer.sku)
      const unitCents = offer.unit_price_minor ?? 0
      const unitUsd = unitCents / 100
      const subCents = unitCents * it.quantity
      const subUsd = subCents / 100

      quoteItems.push({
        sku: offer.sku,
        title: offer.title || meta.title || offer.sku,
        quantity: it.quantity,
        unit_price_cents: unitCents,
        unit_price_usd: unitUsd,
        subtotal_cents: subCents,
        subtotal_usd: subUsd,
        availability_status: offer.availability_status || "in_stock",
      })
    } catch (err: any) {
      return formatErrorResponse(
        res,
        500,
        "OFFER_CALCULATION_ERROR",
        `Failed to calculate live price for item '${it.sku}': ${err.message}`,
        auth.requestId
      )
    }
  }

  // 6. Compute deterministic totals in minor units (cents)
  const total_cents = quoteItems.reduce((acc, it) => acc + it.subtotal_cents, 0)
  const total_usd = total_cents / 100

  // 7. Generate identifiers & timestamps
  const quote_id = `quo_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`
  const opaque_public_id = crypto.randomBytes(16).toString("hex")
  const download_token = crypto.randomBytes(24).toString("hex")
  const now = new Date()
  const observed_at = now.toISOString()
  const expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  const disclaimer =
    "Preliminary commercial estimate for demonstration only. Excludes taxes and freight."

  const baseMuseUrl = (
    process.env.PUBLIC_MUSE_BASE_URL?.trim() ||
    process.env.STOREFRONT_BASE_URL?.trim() ||
    "https://data.controlnautas.com"
  ).replace(/\/+$/, "")
  const pdf_url = `${baseMuseUrl}/api/industrial/v2/quotes/${opaque_public_id}/pdf?token=${download_token}`

  // 8. Generate preliminary quote PDF
  let pdfResult: GenerateQuotePdfResult | null = null
  try {
    const allPriced =
      quoteItems.length > 0 && quoteItems.every((it) => it.unit_price_cents > 0)
    const pdfStatus = allPriced ? "priced" : "manual_review"

    const pdfPayload = {
      quote_id,
      id: quote_id,
      opaque_public_id,
      status: pdfStatus,
      currency: "USD",
      subtotal: total_usd,
      subtotal_amount: total_usd,
      total: total_usd,
      total_amount: total_usd,
      total_cents,
      observed_at,
      expires_at,
      items: quoteItems.map((it) => ({
        sku: it.sku,
        model: getProductMeta(it.sku).model || it.sku,
        title: it.title,
        quantity: it.quantity,
        currency: "USD",
        unit_price: it.unit_price_usd,
        unit_price_minor: it.unit_price_cents,
        subtotal: it.subtotal_usd,
        subtotal_minor: it.subtotal_cents,
        availability_status: it.availability_status,
      })),
      disclaimer,
    }

    pdfResult = await generateQuotePdf(pdfPayload)
  } catch {
    // If Python reportlab is unavailable in test environment, quote continues gracefully
  }

  // 9. Store quote in-memory and in PostgreSQL
  const quoteRecord: V2QuoteRecord = {
    quote_id,
    opaque_public_id,
    status: "preliminary",
    currency: "USD",
    total_cents,
    total_usd,
    items: quoteItems,
    pdf_url,
    download_token,
    expires_at,
    observed_at,
    disclaimer,
    pdf_storage_key: pdfResult?.storageKey || `quotes/${opaque_public_id}.pdf`,
    pdf_file_path: pdfResult?.filePath,
  }

  saveV2Quote(quoteRecord)

  try {
    const pool = getPool()
    const insertSql = `
      INSERT INTO preliminary_quote (
        id,
        opaque_public_id,
        status,
        variant_id,
        sku,
        model,
        title,
        quantity,
        region_id,
        currency,
        unit_price_minor,
        unit_price_decimal,
        subtotal_minor,
        subtotal_decimal,
        tax_status,
        shipping_status,
        availability_snapshot_json,
        product_url,
        observed_at,
        created_at,
        expires_at,
        demo,
        pdf_storage_key,
        download_token,
        metadata
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25
      );
    `

    const primarySku = quoteItems.map((i) => i.sku).join(", ")
    const totalQty = quoteItems.reduce((acc, it) => acc + it.quantity, 0)
    const primaryTitle =
      quoteItems.length === 1
        ? quoteItems[0].title
        : `Preliminary Quote (${quoteItems.length} items)`

    await pool.query(insertSql, [
      quote_id,
      opaque_public_id,
      "preliminary",
      quoteItems[0]?.sku || "CN-PILOT",
      primarySku,
      quoteItems.length === 1 ? quoteItems[0].sku : "MULTILINE",
      primaryTitle,
      totalQty,
      regionId || null,
      "USD",
      quoteItems.length === 1 ? quoteItems[0].unit_price_cents : null,
      quoteItems.length === 1 ? quoteItems[0].unit_price_usd : null,
      total_cents,
      total_usd,
      "tax_excluded",
      "to_be_confirmed",
      JSON.stringify(
        quoteItems.map((i) => ({
          sku: i.sku,
          availability_status: i.availability_status,
        }))
      ),
      `${baseMuseUrl}/us/products/${quoteItems[0].sku.toLowerCase()}`,
      observed_at,
      now,
      expires_at,
      true,
      quoteRecord.pdf_storage_key,
      download_token,
      JSON.stringify({
        quote_id,
        opaque_public_id,
        items: quoteItems,
        total_cents,
        total_usd,
        pdf_file_path: pdfResult?.filePath,
        download_token,
      }),
    ])
  } catch {
    // If PostgreSQL unavailable, in-memory record handles quote lifecycle
  }

  // 10. Return standard JSON response
  return res.status(201).json({
    quote_id,
    opaque_public_id,
    status: "preliminary",
    currency: "USD",
    total_cents,
    total_usd,
    items: quoteItems,
    pdf_url,
    download_token,
    expires_at,
    disclaimer,
  })
}
