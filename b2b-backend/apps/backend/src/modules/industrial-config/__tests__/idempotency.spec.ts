import { IndustrialConfigRepository, getDatabasePool } from "../repository"
import { IdempotencyConflictError } from "../errors"
import { Pool } from "pg"
import * as crypto from "crypto"

describe("Idempotency Integration Tests (Gate G3)", () => {
  let pool: Pool
  let repo: IndustrialConfigRepository

  beforeAll(async () => {
    pool = getDatabasePool()
    repo = new IndustrialConfigRepository(pool)
  })

  afterAll(async () => {
    await pool.query("DELETE FROM industrial_idempotency WHERE owner_id LIKE 'tenant-idemp%';")
    await pool.end()
  })

  it("same key + same body -> replays cached result without re-executing handler", async () => {
    const key = `key_${crypto.randomBytes(8).toString("hex")}`
    const payload = {
      variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
      quantity: 2,
      scale: 2,
      currency: "USD",
    }

    let handlerCalls = 0
    const executeWork = async () => {
      handlerCalls++
      return {
        quote_id: "quote_test_abc123",
        total_minor: 178000,
        status: "issued",
      }
    }

    // First call: executes handler
    const firstCall = await repo.executeIdempotent({
      owner_id: "tenant-idemp-1",
      operation: "issue_quote",
      idempotency_key: key,
      body: payload,
      executeFn: executeWork,
    })

    expect(handlerCalls).toBe(1)
    expect(firstCall.cached).toBe(false)
    expect(firstCall.result).toEqual({
      quote_id: "quote_test_abc123",
      total_minor: 178000,
      status: "issued",
    })

    // Second call with IDENTICAL key and body: replays cached result
    const secondCall = await repo.executeIdempotent({
      owner_id: "tenant-idemp-1",
      operation: "issue_quote",
      idempotency_key: key,
      body: payload,
      executeFn: executeWork,
    })

    // Handler must NOT have been called a second time
    expect(handlerCalls).toBe(1)
    expect(secondCall.cached).toBe(true)
    expect(secondCall.result).toEqual(firstCall.result)
  })

  it("same key + different body -> throws IDEMPOTENCY_CONFLICT (HTTP 409)", async () => {
    const key = `key_${crypto.randomBytes(8).toString("hex")}`
    const originalPayload = {
      variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
      quantity: 1,
    }
    const modifiedPayload = {
      variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
      quantity: 5, // Modified quantity!
    }

    // First call: succeeds
    await repo.executeIdempotent({
      owner_id: "tenant-idemp-1",
      operation: "issue_quote",
      idempotency_key: key,
      body: originalPayload,
      executeFn: async () => ({ id: "q1" }),
    })

    // Second call: same key, different body -> MUST fail with 409 IDEMPOTENCY_CONFLICT
    await expect(
      repo.executeIdempotent({
        owner_id: "tenant-idemp-1",
        operation: "issue_quote",
        idempotency_key: key,
        body: modifiedPayload,
        executeFn: async () => ({ id: "q2" }),
      })
    ).rejects.toThrow(IdempotencyConflictError)

    try {
      await repo.executeIdempotent({
        owner_id: "tenant-idemp-1",
        operation: "issue_quote",
        idempotency_key: key,
        body: modifiedPayload,
        executeFn: async () => ({ id: "q2" }),
      })
      fail("Should have thrown IdempotencyConflictError")
    } catch (err: any) {
      expect(err).toBeInstanceOf(IdempotencyConflictError)
      expect(err.statusCode).toBe(409)
      expect(err.code).toBe("IDEMPOTENCY_CONFLICT")
      expect(err.message).toContain("different body payload")
    }
  })

  it("persists exact SHA-256 hashes in industrial_idempotency table", async () => {
    const key = "key_fixed_hash_test_123"
    const payload = { test: true }

    await repo.executeIdempotent({
      owner_id: "tenant-idemp-1",
      operation: "test_hash_storage",
      idempotency_key: key,
      body: payload,
      executeFn: async () => ({ ok: true }),
    })

    const expectedKeyHash = crypto.createHash("sha256").update(key).digest("hex")
    const res = await pool.query(
      "SELECT key_hash, body_hash, state FROM industrial_idempotency WHERE owner_id = $1 AND operation = $2 AND key_hash = $3;",
      ["tenant-idemp-1", "test_hash_storage", expectedKeyHash]
    )

    expect(res.rows.length).toBe(1)
    expect(res.rows[0].key_hash).toBe(expectedKeyHash)
    expect(res.rows[0].body_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(res.rows[0].state).toBe("completed")
  })
})
