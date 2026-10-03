import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

export interface AssetManifest {
  schema_version?: string
  id: string
  sku_or_syn_id?: string
  variant_id?: string
  asset_id?: string
  units?: string
  linear_unit?: string
  coordinate_system?: string
  fidelity?: string
  format?: string
  gltf_version?: string
  dimensions_mm?: Record<string, number>
  bbox?: Record<string, any>
  body_bbox_m?: Record<string, any>
  geometry_bbox_m?: Record<string, any>
  anchors?: Array<Record<string, any>>
  qa?: Record<string, any>
  sha256?: string
  byte_length?: number
  delivery?: {
    public_url?: string
    signed_download_url?: string
    mime_type?: string
    byte_length?: number
    sha256?: string
    access_mode?: string
    expires_at?: string
    expires?: number
    [key: string]: any
  }
  provenance?: Record<string, any>
  created_at?: string
  [key: string]: any
}

export interface GlbFileInfo {
  filePath: string
  sha256: string
  byteLength: number
  filename: string
}

/**
 * Resolved candidate search directories for industrial 3D assets.
 */
function getSearchDirectories(): string[] {
  const dirs = [
    process.env.INDUSTRIAL_ASSETS_DIR,
    path.resolve(process.cwd(), "storage/industrial/assets"),
    path.resolve(process.cwd(), "storage/industrial-assets"),
    path.resolve(process.cwd(), "../../storage/industrial/assets"),
    path.resolve(process.cwd(), "../../storage/industrial-assets"),
    path.resolve(process.cwd(), "../../../storage/industrial/assets"),
    path.resolve(process.cwd(), "../../../storage/industrial-assets"),
    path.resolve(process.cwd(), "b2b-backend/storage/industrial-assets"),
    path.resolve(process.cwd(), "../storage/industrial-assets"),
    path.resolve(process.cwd(), "docs/industrial/assets"),
    path.resolve(process.cwd(), "../../docs/industrial/assets"),
    path.resolve(process.cwd(), "../../../docs/industrial/assets"),
    path.resolve(__dirname, "../../../../../storage/industrial/assets"),
    path.resolve(__dirname, "../../../../../docs/industrial/assets"),
  ].filter((d): d is string => Boolean(d && fs.existsSync(d)))

  return Array.from(new Set(dirs))
}

/**
 * Constant secret for download token signing.
 */
export function getSigningSecret(): string {
  return (
    process.env.MUSE_DOWNLOAD_SECRET ||
    process.env.MUSE_API_TOKEN ||
    process.env.JWT_SECRET ||
    "controlnautas-asset-delivery-secret-2026-peru-industrial"
  )
}

/**
 * Constant-time string equality check.
 */
function safeTokenCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false
  }
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) {
    return false
  }
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Generate HMAC-SHA256 signed download token for an asset ID with TTL.
 */
export function generateSignedAssetToken(
  assetId: string,
  ttlSeconds: number = 900
): {
  token: string
  expires: number
  expires_at: string
} {
  const expires = Math.floor(Date.now() / 1000) + ttlSeconds
  const secret = getSigningSecret()
  const payload = `${assetId}:${expires}`
  const token = crypto.createHmac("sha256", secret).update(payload).digest("hex")
  return {
    token,
    expires,
    expires_at: new Date(expires * 1000).toISOString(),
  }
}

/**
 * Verify signed download token or MUSE_API_TOKEN.
 */
export function verifySignedAssetToken(
  assetId: string,
  token: string | undefined,
  expiresParam: string | number | undefined,
  authHeader?: string
): {
  valid: boolean
  code?: "DOWNLOAD_EXPIRED" | "INVALID_TOKEN" | "UNAUTHORIZED"
  message?: string
} {
  const expectedMuseToken = process.env.MUSE_API_TOKEN?.trim()

  // 1. Check Bearer token in Authorization header
  if (authHeader) {
    const parts = authHeader.split(" ")
    if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
      const bearer = parts[1].trim()
      if (expectedMuseToken && safeTokenCompare(bearer, expectedMuseToken)) {
        return { valid: true }
      }
    }
  }

  // 2. Check query token matching MUSE_API_TOKEN directly
  if (token && expectedMuseToken && safeTokenCompare(token.trim(), expectedMuseToken)) {
    return { valid: true }
  }

  // 3. If no token provided anywhere
  if (!token && !authHeader) {
    return {
      valid: false,
      code: "UNAUTHORIZED",
      message: "Authentication required. Provide valid MUSE_API_TOKEN or signed download token.",
    }
  }

  // 4. Verify signed token with expires parameter
  if (!expiresParam) {
    return {
      valid: false,
      code: "INVALID_TOKEN",
      message: "Missing 'expires' query parameter for signed download token.",
    }
  }

  const rawExpires = Number(expiresParam)
  if (isNaN(rawExpires) || rawExpires <= 0) {
    return {
      valid: false,
      code: "INVALID_TOKEN",
      message: "Invalid 'expires' parameter format. Must be Unix epoch timestamp.",
    }
  }

  const expiresSec = rawExpires > 1e11 ? Math.floor(rawExpires / 1000) : rawExpires
  const nowSec = Math.floor(Date.now() / 1000)

  // Explicit expiration check (MEGAPLAN §16.3 / §33 G2)
  if (nowSec > expiresSec) {
    return {
      valid: false,
      code: "DOWNLOAD_EXPIRED",
      message: `Download token has expired at ${new Date(expiresSec * 1000).toISOString()}`,
    }
  }

  if (!token) {
    return {
      valid: false,
      code: "INVALID_TOKEN",
      message: "Missing 'token' query parameter.",
    }
  }

  const secret = getSigningSecret()
  const expectedToken = crypto
    .createHmac("sha256", secret)
    .update(`${assetId}:${rawExpires}`)
    .digest("hex")

  if (safeTokenCompare(token.trim(), expectedToken)) {
    return { valid: true }
  }

  // Check aliases from manifest if assetId is an alias
  const manifest = resolveAssetManifest(assetId)
  if (manifest) {
    const candidateIds = [
      manifest.id,
      manifest.sku_or_syn_id,
      manifest.variant_id,
      manifest.asset_id,
    ].filter(Boolean) as string[]

    for (const altId of candidateIds) {
      if (altId !== assetId) {
        const altToken = crypto
          .createHmac("sha256", secret)
          .update(`${altId}:${rawExpires}`)
          .digest("hex")
        if (safeTokenCompare(token.trim(), altToken)) {
          return { valid: true }
        }
      }
    }
  }

  return {
    valid: false,
    code: "INVALID_TOKEN",
    message: "Invalid or tampered signed download token.",
  }
}

/**
 * Resolve Asset Manifest by assetId / SKU / SHA-256.
 */
export function resolveAssetManifest(assetId: string): AssetManifest | null {
  if (!assetId || typeof assetId !== "string") {
    return null
  }

  const cleanId = assetId.replace(/\.manifest\.json$/i, "").replace(/\.glb$/i, "")
  const searchDirs = getSearchDirectories()

  // 1. Direct file matches
  for (const dir of searchDirs) {
    const candidates = [
      path.join(dir, `${cleanId}.manifest.json`),
      path.join(dir, cleanId, `${cleanId}.manifest.json`),
    ]
    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        try {
          const raw = fs.readFileSync(cand, "utf-8")
          const manifest = JSON.parse(raw) as AssetManifest
          return enrichManifestDelivery(manifest, cleanId)
        } catch {
          // continue search
        }
      }
    }
  }

  // 2. Scan directories for matching manifest JSON
  for (const dir of searchDirs) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".manifest.json")) {
          const filePath = path.join(dir, entry.name)
          try {
            const raw = fs.readFileSync(filePath, "utf-8")
            const manifest = JSON.parse(raw) as AssetManifest
            if (matchesAssetManifest(manifest, cleanId)) {
              return enrichManifestDelivery(manifest, cleanId)
            }
          } catch {
            // ignore corrupt files
          }
        } else if (entry.isDirectory()) {
          const subDir = path.join(dir, entry.name)
          try {
            const subEntries = fs.readdirSync(subDir, { withFileTypes: true })
            for (const subEntry of subEntries) {
              if (subEntry.isFile() && subEntry.name.endsWith(".manifest.json")) {
                const filePath = path.join(subDir, subEntry.name)
                try {
                  const raw = fs.readFileSync(filePath, "utf-8")
                  const manifest = JSON.parse(raw) as AssetManifest
                  if (matchesAssetManifest(manifest, cleanId)) {
                    return enrichManifestDelivery(manifest, cleanId)
                  }
                } catch {
                  // ignore
                }
              }
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore inaccessible dir
    }
  }

  return null
}

function matchesAssetManifest(manifest: AssetManifest, cleanId: string): boolean {
  const normTarget = cleanId.toLowerCase().replace(/[-_]/g, "")
  const idsToCheck = [
    manifest.id,
    manifest.sku_or_syn_id,
    manifest.variant_id,
    manifest.asset_id,
    manifest.sha256,
  ].filter(Boolean) as string[]

  for (const id of idsToCheck) {
    if (id === cleanId) return true
    if (id.toLowerCase().replace(/[-_]/g, "") === normTarget) return true
  }
  return false
}

function enrichManifestDelivery(manifest: AssetManifest, requestedId: string): AssetManifest {
  const sha256 = manifest.sha256 || manifest.delivery?.sha256 || ""
  const safeFilename = `${manifest.sku_or_syn_id || manifest.id || requestedId}.glb`
  const canonicalId = manifest.id || requestedId

  const signedData = generateSignedAssetToken(canonicalId, 900)

  manifest.delivery = {
    mime_type: "model/gltf-binary",
    byte_length: manifest.byte_length || manifest.delivery?.byte_length,
    sha256: sha256,
    public_url: sha256 ? `/api/industrial/v2/experimental/assets/${sha256}/${safeFilename}` : undefined,
    signed_download_url: `/api/muse/v1/experimental/assets/${canonicalId}/download?token=${signedData.token}&expires=${signedData.expires}`,
    access_mode: "public_content_addressed",
    expires_at: signedData.expires_at,
    expires: signedData.expires,
    ...(manifest.delivery || {}),
  }

  return manifest
}

/**
 * Find GLB file path on disk matching a sha256 hash or asset identifier.
 */
export function findGlbFile(sha256: string, filename?: string): GlbFileInfo | null {
  const searchDirs = getSearchDirectories()

  // 1. Content-addressed search if sha256 is 64 hex characters
  const isHexHash = /^[a-f0-9]{64}$/i.test(sha256)

  if (isHexHash) {
    for (const dir of searchDirs) {
      // Option A: <dir>/<sha256>/<filename>
      if (filename) {
        const p1 = path.join(dir, sha256, filename)
        if (fs.existsSync(p1) && fs.statSync(p1).isFile()) {
          const stat = fs.statSync(p1)
          return {
            filePath: p1,
            sha256,
            byteLength: stat.size,
            filename,
          }
        }
      }

      // Option B: <dir>/<sha256>/*.glb
      const hashSubdir = path.join(dir, sha256)
      if (fs.existsSync(hashSubdir) && fs.statSync(hashSubdir).isDirectory()) {
        const entries = fs.readdirSync(hashSubdir)
        const glb = entries.find((e) => e.endsWith(".glb"))
        if (glb) {
          const p2 = path.join(hashSubdir, glb)
          const stat = fs.statSync(p2)
          return {
            filePath: p2,
            sha256,
            byteLength: stat.size,
            filename: glb,
          }
        }
      }

      // Option C: Check root files in dir
      if (filename) {
        const p3 = path.join(dir, filename)
        if (fs.existsSync(p3) && fs.statSync(p3).isFile()) {
          const fileBytes = fs.readFileSync(p3)
          const computedHash = crypto.createHash("sha256").update(fileBytes).digest("hex")
          if (computedHash.toLowerCase() === sha256.toLowerCase()) {
            return {
              filePath: p3,
              sha256: computedHash,
              byteLength: fileBytes.length,
              filename,
            }
          }
        }
      }
    }
  }

  // 2. Fallback: resolve manifest to get sha256 and filename
  const manifest = resolveAssetManifest(sha256)
  if (manifest) {
    const targetSha = manifest.sha256 || manifest.delivery?.sha256
    const targetFilename = filename || `${manifest.sku_or_syn_id || manifest.id}.glb`
    if (targetSha && /^[a-f0-9]{64}$/i.test(targetSha)) {
      return findGlbFile(targetSha, targetFilename)
    }
  }

  return null
}

/**
 * Delivers GLB binary respecting HTTP specs (§16, §33 G2):
 * - Content-Type: model/gltf-binary
 * - Cache-Control: public, max-age=31536000, immutable
 * - ETag: "<sha256>"
 * - Content-Length: <bytes>
 * - Access-Control-Allow-Origin: * (WITHOUT Access-Control-Allow-Credentials)
 * - Supports Range requests & If-None-Match
 * - Supports HEAD & GET
 */
export function serveGlbBinary(
  req: MedusaRequest,
  res: MedusaResponse,
  fileInfo: GlbFileInfo,
  options?: { isSigned?: boolean; dispositionFilename?: string }
) {
  const { filePath, sha256, byteLength, filename } = fileInfo

  res.setHeader("Content-Type", "model/gltf-binary")
  res.setHeader("ETag", `"${sha256}"`)

  if (options?.isSigned) {
    res.setHeader("Cache-Control", "private, no-cache, no-transform")
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${options.dispositionFilename || filename}"`
    )
  } else {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
  }

  // Mandatory CORS rule: Public asset uses *, NEVER combine with Allow-Credentials: true
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Accept-Ranges", "bytes")
  res.removeHeader("Access-Control-Allow-Credentials")

  // ETag conditional check (304 Not Modified)
  const ifNoneMatch = req.headers["if-none-match"]
  if (ifNoneMatch && (ifNoneMatch === `"${sha256}"` || ifNoneMatch === sha256)) {
    return res.status(304).end()
  }

  // HEAD request: return exact headers with 200 OK and no body
  if (req.method === "HEAD") {
    res.setHeader("Content-Length", byteLength.toString())
    return res.status(200).end()
  }

  // Range request handling
  const rangeHeader = req.headers["range"]
  if (rangeHeader && typeof rangeHeader === "string") {
    const parts = rangeHeader.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : byteLength - 1

    if (isNaN(start) || isNaN(end) || start >= byteLength || end >= byteLength || start > end) {
      res.setHeader("Content-Range", `bytes */${byteLength}`)
      return res.status(416).end()
    }

    const chunkSize = end - start + 1
    res.setHeader("Content-Range", `bytes ${start}-${end}/${byteLength}`)
    res.setHeader("Content-Length", chunkSize.toString())
    res.status(206)

    const stream = fs.createReadStream(filePath, { start, end })
    return stream.pipe(res as any)
  }

  // Full GET delivery
  res.setHeader("Content-Length", byteLength.toString())
  res.status(200)
  const stream = fs.createReadStream(filePath)
  return stream.pipe(res as any)
}
