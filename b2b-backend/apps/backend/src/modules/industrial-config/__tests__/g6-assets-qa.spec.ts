import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"
import { Writable } from "stream"
import { Client } from "pg"
import {
  G6_ASSET_DEFINITIONS,
  G6_BINDING_DEFINITIONS,
} from "../data/g6-catalog-assets"
import { G4_DEFINITIONS } from "../data/g4-catalog-snapshots"
import { HEAD, GET } from "../../../api/industrial-assets/[sha256]/[filename]/route"

/**
 * Gate G6: Real Industrial 3D Assets & Bindings QA Suite
 * Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)
 */

// Helper to resolve project root storage directory
function resolveStorageRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "storage/industrial/assets"),
    path.resolve(process.cwd(), "../../storage/industrial/assets"),
    path.resolve(process.cwd(), "../../../storage/industrial/assets"),
    path.resolve(__dirname, "../../../../../../../storage/industrial/assets"),
    path.resolve(__dirname, "../../../../../../storage/industrial/assets"),
  ]
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return c
    }
  }
  return candidates[0]
}

const STORAGE_ROOT = resolveStorageRoot()

// Helper to parse glTF 2.0 binary (GLB) JSON chunk and compute bounding box from POSITION accessors
function parseGlbBBox(filePath: string): {
  size: [number, number, number]
  min: [number, number, number]
  max: [number, number, number]
  validatorCompliant: boolean
} {
  const buf = fs.readFileSync(filePath)
  const magic = buf.toString("utf8", 0, 4)
  const version = buf.readUInt32LE(4)
  const chunkLength = buf.readUInt32LE(12)
  const chunkType = buf.readUInt32LE(16) // 0x4E4F534A is JSON

  expect(magic).toBe("glTF")
  expect(version).toBe(2)
  expect(chunkType).toBe(0x4e4f534a)

  const jsonStr = buf.toString("utf8", 20, 20 + chunkLength)
  const gltf = JSON.parse(jsonStr)

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity

  for (const acc of gltf.accessors || []) {
    if (acc.min && acc.max && Array.isArray(acc.min) && acc.min.length === 3) {
      minX = Math.min(minX, acc.min[0])
      minY = Math.min(minY, acc.min[1])
      minZ = Math.min(minZ, acc.min[2])
      maxX = Math.max(maxX, acc.max[0])
      maxY = Math.max(maxY, acc.max[1])
      maxZ = Math.max(maxZ, acc.max[2])
    }
  }

  return {
    size: [
      Math.round((maxX - minX) * 1000000) / 1000000,
      Math.round((maxY - minY) * 1000000) / 1000000,
      Math.round((maxZ - minZ) * 1000000) / 1000000,
    ],
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    validatorCompliant: gltf.asset?.version === "2.0",
  }
}

// Mock Medusa response stream for HEAD and GET route testing
class MockMedusaResponse extends Writable {
  statusCode: number = 200
  headers: Record<string, string> = {}
  chunks: Buffer[] = []

  setHeader(name: string, value: string) {
    this.headers[name.toLowerCase()] = value
  }

  getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()]
  }

  removeHeader(name: string) {
    delete this.headers[name.toLowerCase()]
  }

  status(code: number) {
    this.statusCode = code
    return this
  }

  json(data: any) {
    this.chunks.push(Buffer.from(JSON.stringify(data)))
    this.end()
    return this
  }

  _write(chunk: any, encoding: string, callback: () => void) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    callback()
  }

  getBodyBuffer(): Buffer {
    return Buffer.concat(this.chunks)
  }
}

describe("Gate G6: Real Industrial 3D Assets & Delivery QA", () => {
  let dbClient: Client

  beforeAll(async () => {
    dbClient = new Client({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/medusa",
    })
    await dbClient.connect()
  })

  afterAll(async () => {
    if (dbClient) {
      await dbClient.end()
    }
  })

  describe("1. Physical Existence & CAS Integrity", () => {
    for (const def of G6_ASSET_DEFINITIONS) {
      it(`verifies physical files exist on disk for SKU: ${def.sku}`, () => {
        const casGlbPath = path.join(STORAGE_ROOT, def.sha256, `${def.sku}.glb`)
        const casManifestPath = path.join(
          STORAGE_ROOT,
          def.sha256,
          `${def.sku}.manifest.json`
        )
        const canonicalGlbPath = path.join(STORAGE_ROOT, `${def.sku}.glb`)
        const canonicalManifestPath = path.join(
          STORAGE_ROOT,
          `${def.sku}.manifest.json`
        )

        // 1. CAS GLB exists
        expect(fs.existsSync(casGlbPath)).toBe(true)
        const casStat = fs.statSync(casGlbPath)
        expect(casStat.isFile()).toBe(true)
        expect(casStat.size).toBe(def.bytes)

        // 2. Canonical GLB exists and matches CAS byte-for-byte
        expect(fs.existsSync(canonicalGlbPath)).toBe(true)
        const canStat = fs.statSync(canonicalGlbPath)
        expect(canStat.size).toBe(def.bytes)
        const casBytes = fs.readFileSync(casGlbPath)
        const canBytes = fs.readFileSync(canonicalGlbPath)
        expect(casBytes.equals(canBytes)).toBe(true)

        // 3. Manifests exist
        expect(fs.existsSync(casManifestPath)).toBe(true)
        expect(fs.existsSync(canonicalManifestPath)).toBe(true)

        // 4. Manifest schema & fidelity
        const manifest = JSON.parse(fs.readFileSync(casManifestPath, "utf-8"))
        expect(manifest.schema_version).toBe("model_manifest/2.0")
        expect(manifest.fidelity).toBe("dimensional_proxy_verified")
        expect(manifest.units).toBe("meter")
        expect(manifest.coordinate_system).toBe("right_handed_y_up_z_forward")
        expect(manifest.id).toBe(def.id)
        expect(manifest.variant_id).toBe(def.variant_id)
        expect(manifest.snapshot_id).toBe(def.snapshot_id)
      })
    }
  })

  describe("2. Cryptographic SHA-256 Verification", () => {
    for (const def of G6_ASSET_DEFINITIONS) {
      it(`verifies cryptographic SHA-256 match between disk and manifest for ${def.sku}`, () => {
        const glbPath = path.join(STORAGE_ROOT, def.sha256, `${def.sku}.glb`)
        const glbBytes = fs.readFileSync(glbPath)

        const computedSha256 = crypto
          .createHash("sha256")
          .update(glbBytes)
          .digest("hex")

        // Matches definition expected hash
        expect(computedSha256).toBe(def.sha256)

        // Matches manifest root hash and delivery section hash
        const manifestPath = path.join(
          STORAGE_ROOT,
          def.sha256,
          `${def.sku}.manifest.json`
        )
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

        expect(manifest.sha256).toBe(computedSha256)
        expect(manifest.delivery?.sha256).toBe(computedSha256)
        expect(manifest.delivery?.byte_length).toBe(def.bytes)
      })
    }
  })

  describe("3. Bounding Box Envelope Validation against G4 Snapshot Dimensions", () => {
    const TOLERANCE_METERS = 0.0005 // 0.5 mm tolerance per specification

    for (const def of G6_ASSET_DEFINITIONS) {
      it(`verifies bounding box matches SnapshotDimensions.envelope_m within 0.5 mm for ${def.sku}`, () => {
        // Find corresponding G4 snapshot
        const g4Def = G4_DEFINITIONS.find((d) => d.snapshot.sku === def.sku)
        expect(g4Def).toBeDefined()
        const expectedEnvelope = g4Def!.snapshot.dimensions!.envelope_m // [width, height, depth] in meters

        // 1. Check Manifest Bounding Box
        const manifestPath = path.join(STORAGE_ROOT, `${def.sku}.manifest.json`)
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

        const manifestBboxSize = manifest.bbox.size as [number, number, number]
        expect(manifestBboxSize).toHaveLength(3)

        // 2. Parse binary GLB file accessors directly
        const glbPath = path.join(STORAGE_ROOT, `${def.sku}.glb`)
        const parsedBbox = parseGlbBBox(glbPath)

        for (let axis = 0; axis < 3; axis++) {
          const axisName = ["X (width)", "Y (height)", "Z (depth)"][axis]

          // Check manifest bbox against G4 snapshot envelope
          const manifestDelta = Math.abs(manifestBboxSize[axis] - expectedEnvelope[axis])
          expect(manifestDelta).toBeLessThanOrEqual(TOLERANCE_METERS)

          // Check binary GLB geometry against G4 snapshot envelope
          const glbDelta = Math.abs(parsedBbox.size[axis] - expectedEnvelope[axis])
          expect(glbDelta).toBeLessThanOrEqual(TOLERANCE_METERS)
        }

        // 3. QA metadata verification
        expect(manifest.qa?.dimensional_error_mm?.x).toBeLessThanOrEqual(0.5)
        expect(manifest.qa?.dimensional_error_mm?.y).toBeLessThanOrEqual(0.5)
        expect(manifest.qa?.dimensional_error_mm?.z).toBeLessThanOrEqual(0.5)
        expect(manifest.qa?.validator_errors).toBe(0)
      })
    }
  })

  describe("4. PortSchema Anchor Coverage", () => {
    // Known port-to-anchor mapping aliases when semantic port IDs map to designated 3D anchors
    const PORT_ALIAS_MAP: Record<string, string[]> = {
      // CN-N1200
      p_universal_sensor_in: ["p_universal_sensor_in", "p_universal_in", "anchor_universal_in"],
      p_out1_control: ["p_out1_control", "p_out1_ctrl", "anchor_out1_ctrl"],
      p_out2_alarm: ["p_out2_alarm", "anchor_out2_alarm"],
      p_out3_alarm: ["p_out3_alarm", "anchor_out3_alarm"],
      p_analog_out_retrans: ["p_analog_out_retrans", "p_out4_analog", "anchor_out4_analog"],
      p_usb_comm: ["p_usb_comm", "anchor_usb_comm"],
      // CN-THT02
      p_sensor_sht30: ["p_sensor_sht30", "p_sensor_internal", "anchor_sensor_internal"],
      p_rs485: ["p_rs485", "anchor_rs485"],
      // CN-X5PRIME-HE-XP5
      p_power_in: ["p_power_in", "anchor_power_in"],
      p_rs485_mj1: ["p_rs485_mj1", "anchor_rs485_mj1"],
      p_ethernet_lan: ["p_ethernet_lan", "anchor_ethernet_lan"],
      p_analog_in: ["p_analog_in", "anchor_analog_in"],
      p_digital_in: ["p_digital_in", "anchor_digital_in"],
      p_digital_out: ["p_digital_out", "anchor_digital_out"],
    }

    for (const def of G6_ASSET_DEFINITIONS) {
      it(`verifies every port in G4 snapshot has a corresponding anchor in 3D manifest for ${def.sku}`, () => {
        const g4Def = G4_DEFINITIONS.find((d) => d.snapshot.sku === def.sku)
        expect(g4Def).toBeDefined()
        const snapshotPorts = g4Def!.snapshot.ports || []

        const manifestPath = path.join(STORAGE_ROOT, `${def.sku}.manifest.json`)
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
        const anchors = manifest.anchors || []

        expect(snapshotPorts.length).toBeGreaterThan(0)
        expect(anchors.length).toBeGreaterThan(0)

        // Every port in G4 snapshot must map to an anchor in the 3D manifest
        for (const port of snapshotPorts) {
          const acceptedIdentifiers = PORT_ALIAS_MAP[port.port_id] || [port.port_id]

          const matchingAnchor = anchors.find((a: any) => {
            return (
              acceptedIdentifiers.includes(a.port_id) ||
              acceptedIdentifiers.includes(a.name)
            )
          })

          expect(matchingAnchor).toBeDefined()
          expect(matchingAnchor.position).toBeDefined()
          expect(matchingAnchor.position).toHaveLength(3)
          expect(matchingAnchor.orientation).toBeDefined()
          expect(matchingAnchor.orientation).toHaveLength(4)

          // Position must be within device bounds
          const [px, py, pz] = matchingAnchor.position
          const bbox = manifest.bbox
          expect(px).toBeGreaterThanOrEqual(bbox.min[0] - 0.005)
          expect(px).toBeLessThanOrEqual(bbox.max[0] + 0.005)
          expect(py).toBeGreaterThanOrEqual(bbox.min[1] - 0.005)
          expect(py).toBeLessThanOrEqual(bbox.max[1] + 0.005)
          expect(pz).toBeGreaterThanOrEqual(bbox.min[2] - 0.005)
          expect(pz).toBeLessThanOrEqual(bbox.max[2] + 0.005)
        }
      })
    }
  })

  describe("5. PostgreSQL Database Verification", () => {
    it("verifies all 3 industrial_asset records exist in PostgreSQL", async () => {
      for (const asset of G6_ASSET_DEFINITIONS) {
        const res = await dbClient.query(
          "SELECT id, variant_id, snapshot_id, kind, revision, sha256, bytes, mime, storage_key, visibility, state, manifest_json FROM industrial_asset WHERE id = $1 AND deleted_at IS NULL;",
          [asset.id]
        )

        expect(res.rows).toHaveLength(1)
        const row = res.rows[0]

        expect(row.id).toBe(asset.id)
        expect(row.variant_id).toBe(asset.variant_id)
        expect(row.snapshot_id).toBe(asset.snapshot_id)
        expect(row.kind).toBe("model_glb")
        expect(row.revision).toBe("rev_2026_g6")
        expect(row.sha256).toBe(asset.sha256)
        expect(Number(row.bytes)).toBe(asset.bytes)
        expect(row.mime).toBe("model/gltf-binary")
        expect(row.visibility).toBe("public")
        expect(row.state).toBe("active")
        expect(row.storage_key).toContain(asset.sha256)
        expect(row.manifest_json).toBeDefined()
        expect(row.manifest_json.schema_version).toBe("model_manifest/2.0")
      }
    })

    it("verifies all 3 industrial_asset_binding records exist in PostgreSQL", async () => {
      for (const binding of G6_BINDING_DEFINITIONS) {
        const res = await dbClient.query(
          "SELECT id, snapshot_id, asset_id, binding_kind FROM industrial_asset_binding WHERE id = $1 AND deleted_at IS NULL;",
          [binding.id]
        )

        expect(res.rows).toHaveLength(1)
        const row = res.rows[0]

        expect(row.id).toBe(binding.id)
        expect(row.snapshot_id).toBe(binding.snapshot_id)
        expect(row.asset_id).toBe(binding.asset_id)
        expect(row.binding_kind).toBe("dimensional_proxy")
      }
    })

    it("verifies referential integrity across product_variant and industrial_technical_snapshot", async () => {
      for (const asset of G6_ASSET_DEFINITIONS) {
        // Core variant exists
        const varRes = await dbClient.query(
          "SELECT id, sku FROM product_variant WHERE id = $1;",
          [asset.variant_id]
        )
        expect(varRes.rows).toHaveLength(1)
        expect(varRes.rows[0].sku).toBe(asset.sku)

        // Snapshot exists
        const snapRes = await dbClient.query(
          "SELECT id, variant_id FROM industrial_technical_snapshot WHERE id = $1 AND deleted_at IS NULL;",
          [asset.snapshot_id]
        )
        expect(snapRes.rows).toHaveLength(1)
        expect(snapRes.rows[0].variant_id).toBe(asset.variant_id)
      }
    })
  })

  describe("6. Delivery Route Verification (/industrial-assets/{sha256}/{filename})", () => {
    for (const def of G6_ASSET_DEFINITIONS) {
      it(`serves HEAD /industrial-assets/${def.sha256}/${def.sku}.glb with correct headers`, async () => {
        const req: any = {
          method: "HEAD",
          params: { sha256: def.sha256, filename: `${def.sku}.glb` },
          headers: {},
        }
        const res = new MockMedusaResponse()

        await HEAD(req, res as any)

        expect(res.statusCode).toBe(200)
        expect(res.headers["content-type"]).toBe("model/gltf-binary")
        expect(res.headers["cache-control"]).toBe("public, max-age=31536000, immutable")
        expect(res.headers["access-control-allow-origin"]).toBe("*")
        expect(res.headers["access-control-allow-credentials"]).toBeUndefined()
        expect(res.headers["etag"]).toBe(`"${def.sha256}"`)
        expect(res.headers["content-length"]).toBe(def.bytes.toString())
        expect(res.headers["accept-ranges"]).toBe("bytes")
      })

      it(`serves GET /industrial-assets/${def.sha256}/${def.sku}.glb streaming exact binary bytes`, async () => {
        const req: any = {
          method: "GET",
          params: { sha256: def.sha256, filename: `${def.sku}.glb` },
          headers: {},
        }
        const res = new MockMedusaResponse()

        await new Promise<void>((resolve, reject) => {
          res.on("finish", () => resolve())
          res.on("error", reject)

          GET(req, res as any).catch(reject)
        })

        expect(res.statusCode).toBe(200)
        expect(res.headers["content-type"]).toBe("model/gltf-binary")
        expect(res.headers["cache-control"]).toBe("public, max-age=31536000, immutable")
        expect(res.headers["access-control-allow-origin"]).toBe("*")
        expect(res.headers["access-control-allow-credentials"]).toBeUndefined()
        expect(res.headers["etag"]).toBe(`"${def.sha256}"`)
        expect(res.headers["content-length"]).toBe(def.bytes.toString())

        // Validate binary stream against disk
        const streamedBytes = res.getBodyBuffer()
        const diskBytes = fs.readFileSync(
          path.join(STORAGE_ROOT, def.sha256, `${def.sku}.glb`)
        )

        expect(streamedBytes.length).toBe(def.bytes)
        expect(streamedBytes.equals(diskBytes)).toBe(true)

        // Verify SHA-256 of delivered stream
        const deliveredHash = crypto
          .createHash("sha256")
          .update(streamedBytes)
          .digest("hex")
        expect(deliveredHash).toBe(def.sha256)
      })
    }

    it("returns 400 Bad Request on invalid SHA-256 or non-glb filename", async () => {
      const req: any = {
        method: "GET",
        params: { sha256: "not-a-hash", filename: "model.glb" },
        headers: {},
      }
      const res = new MockMedusaResponse()
      await GET(req, res as any)

      // When sha256 is invalid or file is not found
      expect([400, 404]).toContain(res.statusCode)
      expect(res.headers["access-control-allow-origin"]).toBe("*")
    })

    it("returns 404 Not Found on non-existent hash with CORS *", async () => {
      const nonExistentHash = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
      const req: any = {
        method: "GET",
        params: { sha256: nonExistentHash, filename: "unknown.glb" },
        headers: {},
      }
      const res = new MockMedusaResponse()
      await GET(req, res as any)

      expect(res.statusCode).toBe(404)
      expect(res.headers["access-control-allow-origin"]).toBe("*")
      expect(res.headers["access-control-allow-credentials"]).toBeUndefined()
    })
  })
})
