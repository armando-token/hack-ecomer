import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs"
import { formatErrorResponse, getOrGenerateRequestId } from "../../../auth-helper"
import {
  getV2Quote,
  resolvePdfPath,
  isTokenValidForDownload,
} from "../../../quotes-store"
import { generateQuotePdf } from "../../../../../../../lib/muse/pdf-generator"

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

  const requestId = getOrGenerateRequestId(req)

  // 1. Extract quote identifier
  const rawQuoteId = (req.params as any)?.quoteId || (req.params as any)?.id
  if (!rawQuoteId || typeof rawQuoteId !== "string" || !rawQuoteId.trim()) {
    return formatErrorResponse(
      res,
      404,
      "NOT_FOUND",
      "Quote not found or invalid quote ID",
      requestId
    )
  }

  const quoteId = rawQuoteId.trim()

  // 2. Resolve quote record by quoteId or opaque_public_id
  const quote = await getV2Quote(quoteId)
  if (!quote) {
    return formatErrorResponse(
      res,
      404,
      "NOT_FOUND",
      `Quote '${quoteId}' was not found.`,
      requestId
    )
  }

  // 3. Verify token if provided (or allows demo download if omitted)
  const rawToken = (req.query as any)?.token
  const token = typeof rawToken === "string" ? rawToken.trim() : ""

  if (token && !isTokenValidForDownload(token, quote.download_token)) {
    return formatErrorResponse(
      res,
      403,
      "INVALID_TOKEN",
      "Invalid download token for preliminary quote",
      requestId
    )
  }

  // 4. Check expiration
  if (quote.expires_at) {
    const expiresAtMs = new Date(quote.expires_at).getTime()
    if (!Number.isNaN(expiresAtMs) && Date.now() > expiresAtMs) {
      return formatErrorResponse(
        res,
        410,
        "QUOTE_EXPIRED",
        "The preliminary quote has expired",
        requestId,
        { quote_id: quote.quote_id, expired_at: quote.expires_at }
      )
    }
  }

  // 5. Resolve physical PDF file on disk
  let resolvedPath = resolvePdfPath(quote.pdf_storage_key, quote.pdf_file_path)

  if (!resolvedPath && quote.items && quote.items.length > 0) {
    try {
      const allPriced =
        quote.items.length > 0 &&
        quote.items.every(
          (it) =>
            ((it as any).unit_price_cents || 0) > 0 ||
            ((it as any).unit_price_usd || 0) > 0
        )
      const pdfStatus = allPriced ? "priced" : (quote.status === "priced" ? "priced" : "manual_review")

      const regenerated = await generateQuotePdf({
        quote_id: quote.quote_id,
        id: quote.quote_id,
        opaque_public_id: quote.opaque_public_id,
        status: pdfStatus,
        currency: quote.currency || "USD",
        subtotal: quote.total_usd,
        subtotal_amount: quote.total_usd,
        total: quote.total_usd,
        total_amount: quote.total_usd,
        total_cents: quote.total_cents,
        observed_at: quote.observed_at,
        expires_at: quote.expires_at,
        items: quote.items.map((it) => ({
          sku: it.sku,
          model: (it as any).model || it.sku,
          title: it.title,
          quantity: it.quantity,
          currency: "USD",
          unit_price: it.unit_price_usd,
          unit_price_minor: it.unit_price_cents,
          subtotal: it.subtotal_usd,
          subtotal_minor: it.subtotal_cents,
          availability_status: it.availability_status,
        })),
        disclaimer: quote.disclaimer,
      })
      resolvedPath = regenerated.filePath
    } catch {
      // Fallback below
    }
  }

  if (!resolvedPath || !fs.existsSync(resolvedPath)) {
    return formatErrorResponse(
      res,
      404,
      "NOT_FOUND",
      "Quote PDF document file not found on disk",
      requestId
    )
  }

  // 6. Set response headers and stream PDF binary
  const filename = `quote-${quote.opaque_public_id || quote.quote_id}.pdf`
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`)
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.setHeader("X-Request-Id", requestId)

  if (typeof (res as any).status === "function") {
    res.status(200)
  }

  // Express sendFile optimization
  if (typeof (res as any).sendFile === "function") {
    return (res as any).sendFile(resolvedPath, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
        "X-Request-Id": requestId,
        "Access-Control-Allow-Origin": "*",
      },
    })
  }

  // Real Node writable stream pipe (standard Express/Medusa response)
  if (typeof (res as any).write === "function" && typeof (res as any).on === "function") {
    const stream = fs.createReadStream(resolvedPath)
    stream.on("error", () => {
      if (!res.headersSent) {
        formatErrorResponse(
          res,
          500,
          "INTERNAL_SERVER_ERROR",
          "Error streaming quote PDF document",
          requestId
        )
      }
    })
    return stream.pipe(res)
  }

  // Buffer response fallback (tests and lightweight mock environments)
  const buffer = fs.readFileSync(resolvedPath)
  if (typeof (res as any).send === "function") {
    return (res as any).send(buffer)
  }
  if (typeof (res as any).end === "function") {
    return (res as any).end(buffer)
  }
}
