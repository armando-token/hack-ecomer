import {
  canonicalJsonStringify,
  computeCanonicalSha256,
  DEFAULT_VOLATILE_FIELDS,
} from "../utils/canonical-hash";

describe("Canonical Hashing and Serialization Utility", () => {
  describe("1. Deterministic Recursive Key Sorting", () => {
    it("sorts top-level object keys alphabetically regardless of insertion order", () => {
      const obj1 = { zebra: 1, apple: 2, mango: 3, banana: 4 };
      const obj2 = { banana: 4, mango: 3, apple: 2, zebra: 1 };

      const json1 = canonicalJsonStringify(obj1);
      const json2 = canonicalJsonStringify(obj2);

      expect(json1).toBe('{"apple":2,"banana":4,"mango":3,"zebra":1}');
      expect(json1).toBe(json2);
    });

    it("sorts nested object keys recursively at any depth", () => {
      const nested1 = {
        meta: { z: 1, a: 2 },
        data: {
          inner: { y: 10, x: 20 },
        },
      };

      const nested2 = {
        data: {
          inner: { x: 20, y: 10 },
        },
        meta: { a: 2, z: 1 },
      };

      expect(canonicalJsonStringify(nested1)).toBe(
        '{"data":{"inner":{"x":20,"y":10}},"meta":{"a":2,"z":1}}'
      );
      expect(canonicalJsonStringify(nested1)).toBe(canonicalJsonStringify(nested2));
    });

    it("preserves array element ordering while canonicalizing nested objects inside arrays", () => {
      const arrWithObjs = [
        { b: 2, a: 1 },
        { d: 4, c: 3 },
      ];

      expect(canonicalJsonStringify(arrWithObjs)).toBe(
        '[{"a":1,"b":2},{"c":3,"d":4}]'
      );
    });
  });

  describe("2. Volatile Fields Omission", () => {
    it("omits standard volatile fields from canonical stringification", () => {
      const payload = {
        sku: "MUSE-SYN-CTRL-01",
        variant_id: "var_123",
        request_id: "req_xyz987",
        observed_at: "2026-10-03T20:00:00Z",
        generated_at: "2026-10-03T20:00:01Z",
        expires_at: "2026-10-03T21:00:00Z",
        expiry: "3600",
        expiration: "2026-10-03T21:00:00Z",
        signed_url: "https://storage.example.com/asset.glb?sig=secret123",
        token: "tok_temporary_999",
        temporary_token: "temp_abc",
        access_token: "acc_def",
        download_token: "dl_ghi",
        idempotency_key: "idem_key_001",
        "Idempotency-Key": "idem_hdr_001",
        idempotency_id: "idem_id_001",
        lease_expires_at: "2026-10-03T20:05:00Z",
        value: 42,
      };

      const canonical = canonicalJsonStringify(payload);

      expect(canonical).toBe(
        '{"sku":"MUSE-SYN-CTRL-01","value":42,"variant_id":"var_123"}'
      );
      expect(canonical).not.toContain("request_id");
      expect(canonical).not.toContain("signed_url");
      expect(canonical).not.toContain("observed_at");
      expect(canonical).not.toContain("expires_at");
      expect(canonical).not.toContain("token");
      expect(canonical).not.toContain("idempotency");
    });

    it("omits nested volatile fields in sub-objects", () => {
      const nested = {
        id: "snapshot_01",
        delivery: {
          url: "https://storage.example.com/item.glb",
          signed_url: "https://storage.example.com/item.glb?sig=xyz",
          expires_at: "2026-10-03T22:00:00Z",
          access_token: "tok_abc",
          mime: "model/gltf-binary",
        },
      };

      const canonical = canonicalJsonStringify(nested);
      expect(canonical).toBe(
        '{"delivery":{"mime":"model/gltf-binary","url":"https://storage.example.com/item.glb"},"id":"snapshot_01"}'
      );
    });

    it("supports custom volatile fields sets", () => {
      const customSet = new Set(["custom_secret", "ephemeral_id"]);
      const obj = {
        name: "test",
        custom_secret: "hide_me",
        ephemeral_id: "eph_123",
      };

      expect(canonicalJsonStringify(obj, customSet)).toBe('{"name":"test"}');
    });
  });

  describe("3. Edge Cases, Primitives, and Error Handling", () => {
    it("handles primitives correctly (booleans, strings, numbers, bigints, null, undefined)", () => {
      expect(canonicalJsonStringify(null)).toBe("null");
      expect(canonicalJsonStringify(undefined)).toBe("null");
      expect(canonicalJsonStringify(true)).toBe("true");
      expect(canonicalJsonStringify(false)).toBe("false");
      expect(canonicalJsonStringify(123)).toBe("123");
      expect(canonicalJsonStringify(-45.67)).toBe("-45.67");
      expect(canonicalJsonStringify("hello")).toBe('"hello"');
      expect(canonicalJsonStringify(1000n)).toBe("1000");
    });

    it("omits undefined properties within objects", () => {
      const obj = { a: 1, b: undefined, c: "test" };
      expect(canonicalJsonStringify(obj)).toBe('{"a":1,"c":"test"}');
    });

    it("formats Date instances as UTC ISO strings", () => {
      const d = new Date("2026-10-03T15:30:00.000Z");
      expect(canonicalJsonStringify({ date: d })).toBe(
        '{"date":"2026-10-03T15:30:00.000Z"}'
      );
    });

    it("rejects NaN and Infinity to prevent corrupted canonical representation", () => {
      expect(() => canonicalJsonStringify(NaN)).toThrow(TypeError);
      expect(() => canonicalJsonStringify(Infinity)).toThrow(TypeError);
      expect(() => canonicalJsonStringify(-Infinity)).toThrow(TypeError);
      expect(() => canonicalJsonStringify({ val: NaN })).toThrow(TypeError);
    });
  });

  describe("4. Canonical SHA-256 Hashing Stability", () => {
    it("produces identical 64-character lowercase hex hashes for differing key insertion orders", () => {
      const payloadA = {
        variant_id: "var_abc",
        sku: "SKU-1",
        revision: 2,
        active: true,
      };

      const payloadB = {
        active: true,
        sku: "SKU-1",
        variant_id: "var_abc",
        revision: 2,
      };

      const hashA = computeCanonicalSha256(payloadA);
      const hashB = computeCanonicalSha256(payloadB);

      expect(hashA).toHaveLength(64);
      expect(hashA).toMatch(/^[a-f0-9]{64}$/);
      expect(hashA).toBe(hashB);
    });

    it("produces identical hashes when volatile fields vary or are added", () => {
      const base = {
        snapshot_id: "snap_100",
        sku: "SKU-CONTROLLER",
        ports: [{ port_id: "p1", category: "analog_input" }],
      };

      const withVolatile1 = {
        ...base,
        request_id: "req_first",
        observed_at: "2026-10-03T12:00:00Z",
        token: "tok_1",
      };

      const withVolatile2 = {
        ...base,
        request_id: "req_second",
        observed_at: "2026-10-03T18:45:00Z",
        signed_url: "https://example.com/asset.glb?temp=true",
        expires_at: "2026-10-03T19:00:00Z",
      };

      const hashBase = computeCanonicalSha256(base);
      const hash1 = computeCanonicalSha256(withVolatile1);
      const hash2 = computeCanonicalSha256(withVolatile2);

      expect(hash1).toBe(hashBase);
      expect(hash2).toBe(hashBase);
    });

    it("produces different hashes when substantive data changes", () => {
      const objA = { sku: "SKU-1", value: 100 };
      const objB = { sku: "SKU-1", value: 101 };

      expect(computeCanonicalSha256(objA)).not.toBe(computeCanonicalSha256(objB));
    });
  });
});
