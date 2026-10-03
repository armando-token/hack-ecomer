import * as crypto from "crypto"

export interface HashOptions {
  excludeKeys?: string[]
  normalizeUrls?: boolean
  volatileQueryParams?: string[]
}

const DEFAULT_EXCLUDE_KEYS = new Set([
  "request_id",
  "requestId",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "timestamp",
  "expires_at",
  "expiresAt",
  "expires",
  "token",
  "signature",
  "sig",
])

const DEFAULT_VOLATILE_QUERY_PARAMS = new Set([
  "token",
  "expires",
  "sig",
  "signature",
  "nonce",
  "request_id",
  "ts",
  "_t",
  "x-amz-signature",
  "x-amz-credential",
  "x-amz-date",
  "x-amz-security-token",
])

/**
 * Normalizes a URL string by stripping volatile query parameters
 * (e.g. signed tokens, expiration stamps, ephemeral request IDs)
 * and sorting remaining query params stably.
 */
export function normalizeUrl(
  urlStr: string,
  volatileParams: Set<string> = DEFAULT_VOLATILE_QUERY_PARAMS
): string {
  try {
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://")) {
      return urlStr
    }
    const parsed = new URL(urlStr)
    const searchParams = new URLSearchParams()
    
    // Sort and filter query parameters
    const keys = Array.from(parsed.searchParams.keys()).sort()
    for (const key of keys) {
      if (!volatileParams.has(key.toLowerCase())) {
        const values = parsed.searchParams.getAll(key).sort()
        for (const v of values) {
          searchParams.append(key, v)
        }
      }
    }

    const query = searchParams.toString()
    parsed.search = query ? `?${query}` : ""
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return urlStr
  }
}

/**
 * Recursively canonicalizes a value:
 * 1. Omit volatile keys
 * 2. Stably sort object keys
 * 3. Normalize volatile URL query parameters
 */
export function canonicalizeValue(
  value: any,
  options: HashOptions = {}
): any {
  const excludeKeys = options.excludeKeys
    ? new Set(options.excludeKeys)
    : DEFAULT_EXCLUDE_KEYS
  const volatileParams = options.volatileQueryParams
    ? new Set(options.volatileQueryParams.map((p) => p.toLowerCase()))
    : DEFAULT_VOLATILE_QUERY_PARAMS
  const normalizeUrls = options.normalizeUrls !== false

  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === "string") {
    return normalizeUrls ? normalizeUrl(value, volatileParams) : value
  }

  if (typeof value !== "object") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item, options))
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const sortedObj: Record<string, any> = {}
  const keys = Object.keys(value).sort()

  for (const k of keys) {
    if (excludeKeys.has(k)) {
      continue
    }
    const val = value[k]
    if (val === undefined) {
      continue
    }
    sortedObj[k] = canonicalizeValue(val, options)
  }

  return sortedObj
}

/**
 * Returns a canonical, deterministic JSON representation with stable key ordering
 * and volatile properties/query parameters excluded.
 */
export function canonicalJsonStringify(data: any, options: HashOptions = {}): string {
  const canonical = canonicalizeValue(data, options)
  return JSON.stringify(canonical)
}

/**
 * Computes canonical SHA-256 hash (64 lowercase hex chars)
 * satisfying MEGAPLAN §11.3 & §33 G3.
 */
export function canonicalContentSha256(data: any, options: HashOptions = {}): string {
  const serialized = canonicalJsonStringify(data, options)
  return crypto.createHash("sha256").update(serialized, "utf8").digest("hex")
}
