import fs from "fs"
import path from "path"
import os from "os"
import { getPool } from "../../../../lib/muse/db"
import { safeTokenCompare } from "../../../../lib/muse/common"

export const PILOT_SKUS = ["CN-X5PRIME-HE-XP5", "CN-N1200", "CN-THT02"] as const
export type PilotSku = (typeof PILOT_SKUS)[number]

export interface V2QuoteItem {
  sku: string
  title: string
  quantity: number
  unit_price_cents: number
  unit_price_usd: number
  subtotal_cents: number
  subtotal_usd: number
  availability_status: string
}

export interface V2QuoteRecord {
  quote_id: string
  opaque_public_id: string
  status: string
  currency: string
  total_cents: number
  total_usd: number
  items: V2QuoteItem[]
  pdf_url: string
  download_token: string
  expires_at: string
  observed_at: string
  disclaimer: string
  pdf_storage_key?: string
  pdf_file_path?: string
}

// In-memory quote cache
const inMemoryQuotes = new Map<string, V2QuoteRecord>()

export function saveV2Quote(quote: V2QuoteRecord): void {
  inMemoryQuotes.set(quote.quote_id, quote)
  inMemoryQuotes.set(quote.opaque_public_id, quote)
}

export function clearV2Quotes(): void {
  inMemoryQuotes.clear()
}

export async function getV2Quote(idOrOpaqueId: string): Promise<V2QuoteRecord | null> {
  if (!idOrOpaqueId || typeof idOrOpaqueId !== "string") {
    return null
  }
  const cleanId = idOrOpaqueId.trim()

  // 1. Check in-memory store
  if (inMemoryQuotes.has(cleanId)) {
    return inMemoryQuotes.get(cleanId)!
  }

  // 2. Query PostgreSQL preliminary_quote table if connected
  try {
    const pool = getPool()
    const query = `
      SELECT id, opaque_public_id, status, sku, title, quantity, currency,
             unit_price_minor, unit_price_decimal, subtotal_minor, subtotal_decimal,
             pdf_storage_key, download_token, expires_at, observed_at, metadata
      FROM preliminary_quote
      WHERE id = $1 OR opaque_public_id = $1
      LIMIT 1;
    `
    const { rows } = await pool.query(query, [cleanId])
    if (rows && rows.length > 0) {
      const row = rows[0]
      let items: V2QuoteItem[] = []
      let total_cents = Number(row.subtotal_minor) || 0
      let total_usd = Number(row.subtotal_decimal) || total_cents / 100
      let pdfFilePath: string | undefined

      if (row.metadata) {
        const meta =
          typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata
        if (Array.isArray(meta?.items)) {
          items = meta.items
        }
        if (typeof meta?.total_cents === "number") total_cents = meta.total_cents
        if (typeof meta?.total_usd === "number") total_usd = meta.total_usd
        if (typeof meta?.pdf_file_path === "string") pdfFilePath = meta.pdf_file_path
      }

      if (items.length === 0) {
        const unitCents = Number(row.unit_price_minor) || 0
        items = [
          {
            sku: row.sku,
            title: row.title || row.sku,
            quantity: Number(row.quantity) || 1,
            unit_price_cents: unitCents,
            unit_price_usd: Number(row.unit_price_decimal) || unitCents / 100,
            subtotal_cents:
              Number(row.subtotal_minor) || unitCents * (Number(row.quantity) || 1),
            subtotal_usd: Number(row.subtotal_decimal) || total_usd,
            availability_status: "in_stock",
          },
        ]
      }

      const record: V2QuoteRecord = {
        quote_id: row.id,
        opaque_public_id: row.opaque_public_id,
        status: row.status || "preliminary",
        currency: (row.currency || "USD").toUpperCase(),
        total_cents,
        total_usd,
        items,
        pdf_url: `https://data.controlnautas.com/api/industrial/v2/quotes/${row.opaque_public_id}/pdf?token=${row.download_token}`,
        download_token: row.download_token,
        expires_at:
          row.expires_at instanceof Date
            ? row.expires_at.toISOString()
            : String(row.expires_at),
        observed_at:
          row.observed_at instanceof Date
            ? row.observed_at.toISOString()
            : String(row.observed_at),
        disclaimer:
          "Preliminary commercial estimate for demonstration only. Excludes taxes and freight.",
        pdf_storage_key: row.pdf_storage_key,
        pdf_file_path: pdfFilePath,
      }

      inMemoryQuotes.set(record.quote_id, record)
      inMemoryQuotes.set(record.opaque_public_id, record)
      return record
    }
  } catch {
    // Database query failed or unavailable, inMemory store already checked
  }

  return null
}

export function resolvePdfPath(storageKey?: string, directPath?: string): string | null {
  if (directPath) {
    try {
      if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
        return directPath
      }
    } catch {}
  }

  if (!storageKey || typeof storageKey !== "string" || !storageKey.trim()) {
    return null
  }

  const cleanKey = storageKey.trim()
  if (cleanKey.includes("\0")) {
    return null
  }

  if (path.isAbsolute(cleanKey)) {
    try {
      if (fs.existsSync(cleanKey) && fs.statSync(cleanKey).isFile()) {
        return cleanKey
      }
    } catch {}
  }

  const baseFileName = path.basename(cleanKey)

  const candidateDirs: string[] = [
    process.env.STORAGE_QUOTES_DIR || "",
    "/home/ec2-user/projects/hack-ecomer/storage/quotes",
    "/home/ubuntu/hackday26/storage/quotes",
    path.resolve(process.cwd(), "storage/quotes"),
    path.resolve(process.cwd(), "../../storage/quotes"),
    path.resolve(process.cwd(), "../../../storage/quotes"),
    path.resolve(process.cwd(), "storage"),
    os.tmpdir(),
  ].filter((d): d is string => typeof d === "string" && d.trim().length > 0)

  for (const dir of candidateDirs) {
    const directCandidate = path.resolve(dir, cleanKey)
    try {
      if (fs.existsSync(directCandidate) && fs.statSync(directCandidate).isFile()) {
        return directCandidate
      }
    } catch {}

    const baseCandidate = path.resolve(dir, baseFileName)
    try {
      if (fs.existsSync(baseCandidate) && fs.statSync(baseCandidate).isFile()) {
        return baseCandidate
      }
    } catch {}
  }

  return null
}

export function isTokenValidForDownload(
  providedToken: string | null | undefined,
  storedToken: string | null | undefined
): boolean {
  if (!providedToken) {
    // If token not provided, allow demo download per specification
    return true
  }

  const cleanProvided = providedToken.trim()
  if (cleanProvided === "demo" || cleanProvided === "demo_token") {
    return true
  }

  if (!storedToken) {
    return false
  }

  const cleanStored = storedToken.trim()
  return (
    cleanProvided === cleanStored ||
    safeTokenCompare(cleanProvided, cleanStored)
  )
}
