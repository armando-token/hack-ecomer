import { createHash } from "node:crypto";

/**
 * Standard set of volatile fields that MUST be omitted from canonical hashing
 * per Megaplan §11.3, §19.1, and §23.8:
 * - request_id: transient HTTP trace identifier
 * - observed_at / generated_at: volatile timestamps
 * - expires_at / expiry / expiration / lease_expires_at: TTL/lease bounds
 * - signed_url / token / temporary_token / access_token / download_token: ephemeral credentials
 * - idempotency_key / Idempotency-Key / idempotency_id: transport deduplication keys
 */
export const DEFAULT_VOLATILE_FIELDS = new Set([
  "request_id",
  "observed_at",
  "generated_at",
  "expires_at",
  "expiry",
  "expiration",
  "signed_url",
  "token",
  "temporary_token",
  "access_token",
  "download_token",
  "idempotency_key",
  "Idempotency-Key",
  "idempotency_id",
  "lease_expires_at",
]);

/**
 * Deterministically stringifies any JavaScript object / value to canonical JSON.
 * - Recursively sorts object keys alphabetically.
 * - Omits volatile fields (request_id, ephemeral signed URLs, expiry, temporary tokens).
 * - Omits undefined properties in objects (matching JSON.stringify behavior).
 * - Preserves array element ordering while canonicalizing each element.
 * - Converts Dates to canonical UTC ISO strings.
 * - Rejects NaN and Infinity to prevent corrupted canonical hashes.
 */
export function canonicalJsonStringify(
  obj: any,
  volatileFields: Set<string> = DEFAULT_VOLATILE_FIELDS
): string {
  if (obj === null) {
    return "null";
  }

  if (obj === undefined) {
    return "null";
  }

  const type = typeof obj;

  if (type === "boolean") {
    return obj ? "true" : "false";
  }

  if (type === "number") {
    if (!Number.isFinite(obj)) {
      throw new TypeError(`Cannot compute canonical hash with non-finite number: ${obj}`);
    }
    return obj.toString();
  }

  if (type === "string") {
    return JSON.stringify(obj);
  }

  if (type === "bigint") {
    return obj.toString();
  }

  if (obj instanceof Date) {
    return JSON.stringify(obj.toISOString());
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item) => canonicalJsonStringify(item, volatileFields));
    return `[${items.join(",")}]`;
  }

  if (type === "object") {
    // If the object implements a custom toJSON (other than Date), invoke it first
    let target = obj;
    if (typeof obj.toJSON === "function" && !(obj instanceof Date)) {
      target = obj.toJSON();
      if (typeof target !== "object" || target === null) {
        return canonicalJsonStringify(target, volatileFields);
      }
    }

    const keys = Object.keys(target).filter((key) => {
      if (volatileFields.has(key)) {
        return false;
      }
      return target[key] !== undefined;
    });

    // Lexicographical key sorting
    keys.sort();

    const entries = keys.map((key) => {
      const serializedKey = JSON.stringify(key);
      const serializedVal = canonicalJsonStringify(target[key], volatileFields);
      return `${serializedKey}:${serializedVal}`;
    });

    return `{${entries.join(",")}}`;
  }

  // Fallback for symbols/functions
  return "null";
}

/**
 * Computes a deterministic 64-character lowercase hex SHA-256 hash of an object
 * using canonical JSON serialization.
 */
export function computeCanonicalSha256(
  obj: any,
  volatileFields: Set<string> = DEFAULT_VOLATILE_FIELDS
): string {
  const canonicalJson = canonicalJsonStringify(obj, volatileFields);
  return createHash("sha256")
    .update(canonicalJson, "utf8")
    .digest("hex")
    .toLowerCase();
}
