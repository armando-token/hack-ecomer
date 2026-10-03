import { canonicalContentSha256, canonicalJsonStringify, normalizeUrl } from "../hash"
import * as crypto from "crypto"

describe("Hash Stability & Canonical Representation Unit Tests (Gate G3)", () => {
  describe("1. Stable Key Ordering", () => {
    it("verifies stable key ordering produces identical SHA-256 regardless of object key order", () => {
      const objA = {
        title: "Synthetic Controller",
        sku: "SYN-IND-CTRL-01",
        dimensions: {
          width: 100,
          height: 80,
          depth: 50,
        },
        mounting: "din_rail",
      }

      // Exact same content, reversed/shuffled key order at all levels
      const objB = {
        mounting: "din_rail",
        dimensions: {
          depth: 50,
          width: 100,
          height: 80,
        },
        sku: "SYN-IND-CTRL-01",
        title: "Synthetic Controller",
      }

      const hashA = canonicalContentSha256(objA)
      const hashB = canonicalContentSha256(objB)

      expect(hashA).toMatch(/^[0-9a-f]{64}$/)
      expect(hashB).toMatch(/^[0-9a-f]{64}$/)
      expect(hashA).toBe(hashB)
    })

    it("handles deeply nested structures with mixed arrays and dictionaries", () => {
      const nested1 = {
        a: 1,
        b: [
          { z: "last", a: "first" },
          { y: 20, x: 10 },
        ],
        c: {
          inner2: { beta: false, alpha: true },
          inner1: "value",
        },
      }

      const nested2 = {
        c: {
          inner1: "value",
          inner2: { alpha: true, beta: false },
        },
        b: [
          { a: "first", z: "last" },
          { x: 10, y: 20 },
        ],
        a: 1,
      }

      expect(canonicalContentSha256(nested1)).toBe(canonicalContentSha256(nested2))
    })

    it("changes hash when substantive content actually differs", () => {
      const base = { sku: "SYN-IND-CTRL-01", setpoint: 100 }
      const changed = { sku: "SYN-IND-CTRL-01", setpoint: 101 }

      expect(canonicalContentSha256(base)).not.toBe(canonicalContentSha256(changed))
    })
  })

  describe("2. Volatile URLs & Query Parameters Normalization", () => {
    it("verifies volatile URLs / query params do not affect content hash", () => {
      // Two snapshots with signed download URLs differing only in ephemeral token, expiration, and request_id
      const snapshotWithUrl1 = {
        sku: "SYN-IND-CTRL-01",
        asset: {
          kind: "3d_model",
          url: "https://data.controlnautas.com/industrial-assets/4730b336b910dd4edfb2104dbf272ee05000e708e37e9a68c8031b46170045b6/SYN-IND-CTRL-01.glb?token=sig_abc123456&expires=1720000000&request_id=req_001",
        },
      }

      const snapshotWithUrl2 = {
        sku: "SYN-IND-CTRL-01",
        asset: {
          kind: "3d_model",
          url: "https://data.controlnautas.com/industrial-assets/4730b336b910dd4edfb2104dbf272ee05000e708e37e9a68c8031b46170045b6/SYN-IND-CTRL-01.glb?token=sig_987654321&expires=1850000000&request_id=req_999",
        },
      }

      const hash1 = canonicalContentSha256(snapshotWithUrl1)
      const hash2 = canonicalContentSha256(snapshotWithUrl2)

      expect(hash1).toBe(hash2)
    })

    it("normalizes query parameter ordering in non-volatile parameters", () => {
      const url1 = "https://data.controlnautas.com/api/catalog?format=glb&lod=high"
      const url2 = "https://data.controlnautas.com/api/catalog?lod=high&format=glb"

      expect(normalizeUrl(url1)).toBe(normalizeUrl(url2))
    })

    it("ignores volatile object fields like request_id and timestamps in content hash", () => {
      const item1 = {
        variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
        request_id: "req_req_11111",
        timestamp: "2026-10-03T10:00:00Z",
        created_at: "2026-10-03T10:00:00Z",
        updated_at: "2026-10-03T10:00:00Z",
        data: { active: true },
      }

      const item2 = {
        variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
        request_id: "req_req_22222", // different
        timestamp: "2026-10-03T15:30:00Z", // different
        created_at: "2026-10-03T11:00:00Z", // different
        updated_at: "2026-10-03T15:45:00Z", // different
        data: { active: true },
      }

      expect(canonicalContentSha256(item1)).toBe(canonicalContentSha256(item2))
    })
  })
})
