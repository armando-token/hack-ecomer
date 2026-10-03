import { getDatabasePool } from "../repository"
import { Pool } from "pg"
import * as crypto from "crypto"

describe("Database UNIQUE Constraints Verification (Gate G3)", () => {
  let pool: Pool

  beforeAll(async () => {
    pool = getDatabasePool()
  })

  afterAll(async () => {
    // Clean up test rows
    await pool.query("DELETE FROM industrial_configuration_revision WHERE configuration_id LIKE 'cfg_test_uniq%';")
    await pool.query("DELETE FROM industrial_configuration WHERE id LIKE 'cfg_test_uniq%';")
    await pool.query("DELETE FROM industrial_technical_snapshot WHERE variant_id LIKE 'var_test_uniq%';")
    await pool.query("DELETE FROM industrial_idempotency WHERE owner_id LIKE 'owner_test_uniq%';")
    await pool.query("DELETE FROM industrial_catalog_entry WHERE variant_id LIKE 'var_test_uniq%';")
    await pool.end()
  })

  it("duplicate (configuration_id, revision) in industrial_configuration_revision violates UNIQUE constraint (code 23505)", async () => {
    const configId = `cfg_test_uniq_${crypto.randomBytes(6).toString("hex")}`
    
    // Create base configuration
    await pool.query(
      "INSERT INTO industrial_configuration (id, owner_id, title, current_revision, lifecycle) VALUES ($1, 'owner_u', 'Test Uniq Config', 1, 'draft');",
      [configId]
    )

    // First insert: revision 1 succeeds
    const rev1Id = `rev_u1_${crypto.randomBytes(6).toString("hex")}`
    const sha = "a".repeat(64)
    await pool.query(
      `INSERT INTO industrial_configuration_revision (
        id, configuration_id, revision, schema_version, content_sha256
      ) VALUES ($1, $2, 1, 'configuration_revision/2.0', $3);`,
      [rev1Id, configId, sha]
    )

    // Second insert: identical (configuration_id, revision) MUST throw 23505 unique_violation
    const rev2Id = `rev_u2_${crypto.randomBytes(6).toString("hex")}`
    let error: any
    try {
      await pool.query(
        `INSERT INTO industrial_configuration_revision (
          id, configuration_id, revision, schema_version, content_sha256
        ) VALUES ($1, $2, 1, 'configuration_revision/2.0', $3);`,
        [rev2Id, configId, sha]
      )
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.code).toBe("23505") // PostgreSQL unique_violation error code
    expect(error.message).toMatch(/unique|duplicate key/i)
  })

  it("duplicate (variant_id, revision) in industrial_technical_snapshot violates UNIQUE constraint (code 23505)", async () => {
    const variantId = `var_test_uniq_${crypto.randomBytes(6).toString("hex")}`
    const sha = "b".repeat(64)

    // First snapshot: revision 1 succeeds
    const snap1Id = `snp_u1_${crypto.randomBytes(6).toString("hex")}`
    await pool.query(
      `INSERT INTO industrial_technical_snapshot (
        id, variant_id, revision, state, schema_version, content_json, content_sha256
      ) VALUES ($1, $2, 1, 'published', 'technical_snapshot/2.0', '{}'::jsonb, $3);`,
      [snap1Id, variantId, sha]
    )

    // Second snapshot: duplicate (variant_id, revision = 1) MUST throw 23505
    const snap2Id = `snp_u2_${crypto.randomBytes(6).toString("hex")}`
    let error: any
    try {
      await pool.query(
        `INSERT INTO industrial_technical_snapshot (
          id, variant_id, revision, state, schema_version, content_json, content_sha256
        ) VALUES ($1, $2, 1, 'published', 'technical_snapshot/2.0', '{}'::jsonb, $3);`,
        [snap2Id, variantId, sha]
      )
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.code).toBe("23505")
    expect(error.message).toMatch(/unique|duplicate key/i)
  })

  it("duplicate (owner_id, operation, key_hash) in industrial_idempotency violates UNIQUE constraint (code 23505)", async () => {
    const ownerId = `owner_test_uniq_${crypto.randomBytes(6).toString("hex")}`
    const operation = "create_configuration"
    const keyHash = crypto.createHash("sha256").update("unique_test_key").digest("hex")
    const bodyHash = crypto.createHash("sha256").update("body_1").digest("hex")

    // First idempotency record: succeeds
    const idemp1Id = `idemp_u1_${crypto.randomBytes(6).toString("hex")}`
    await pool.query(
      `INSERT INTO industrial_idempotency (
        id, owner_id, operation, key_hash, body_hash, state
      ) VALUES ($1, $2, $3, $4, $5, 'pending');`,
      [idemp1Id, ownerId, operation, keyHash, bodyHash]
    )

    // Second idempotency record: duplicate (owner_id, operation, key_hash) MUST throw 23505
    const idemp2Id = `idemp_u2_${crypto.randomBytes(6).toString("hex")}`
    let error: any
    try {
      await pool.query(
        `INSERT INTO industrial_idempotency (
          id, owner_id, operation, key_hash, body_hash, state
        ) VALUES ($1, $2, $3, $4, $5, 'pending');`,
        [idemp2Id, ownerId, operation, keyHash, bodyHash]
      )
    } catch (err) {
      error = err
    }

    expect(error).toBeDefined()
    expect(error.code).toBe("23505")
    expect(error.message).toMatch(/unique|duplicate key/i)
  })
})
