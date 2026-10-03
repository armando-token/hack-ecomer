import { Pool, PoolClient } from "pg"
import * as crypto from "crypto"
import {
  NotFoundError,
  RevisionConflictError,
  IdempotencyConflictError,
  UniqueConstraintViolationError,
} from "./errors"
import { canonicalContentSha256 } from "./hash"

export function getDatabasePool(): Pool {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:password@localhost:5432/medusa"
  return new Pool({ connectionString })
}

export class IndustrialConfigRepository {
  private pool: Pool
  private externalClient?: PoolClient

  constructor(poolOrClient?: Pool | PoolClient) {
    if (poolOrClient && "query" in poolOrClient) {
      if ("connect" in poolOrClient && typeof (poolOrClient as any).connect === "function" && !("release" in poolOrClient)) {
        this.pool = poolOrClient as Pool
      } else {
        this.externalClient = poolOrClient as PoolClient
        this.pool = getDatabasePool()
      }
    } else {
      this.pool = getDatabasePool()
    }
  }

  private async getClient(): Promise<{ client: PoolClient | Pool; isPooled: boolean }> {
    if (this.externalClient) {
      return { client: this.externalClient, isPooled: false }
    }
    const client = await this.pool.connect()
    return { client, isPooled: true }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end()
    }
  }

  /**
   * Creates a configuration and its initial revision (rev 1).
   */
  async createConfiguration(params: {
    id?: string
    owner_id: string
    title: string
    lifecycle?: "draft" | "active" | "archived"
    graph_json?: any
    requirements_json?: any
    focus_json?: any
    created_by?: string
  }): Promise<{ id: string; owner_id: string; title: string; current_revision: number; lifecycle: string }> {
    const { client, isPooled } = await this.getClient()
    const poolClient = client as PoolClient

    try {
      if (isPooled) await poolClient.query("BEGIN")

      const configId = params.id || `cfg_${crypto.randomBytes(12).toString("hex")}`
      const lifecycle = params.lifecycle || "draft"

      const insertConfigSql = `
        INSERT INTO industrial_configuration (id, owner_id, title, current_revision, lifecycle, created_at, updated_at)
        VALUES ($1, $2, $3, 1, $4, NOW(), NOW())
        RETURNING id, owner_id, title, current_revision, lifecycle;
      `
      const configRes = await poolClient.query(insertConfigSql, [
        configId,
        params.owner_id,
        params.title,
        lifecycle,
      ])

      const revId = `rev_${crypto.randomBytes(12).toString("hex")}`
      const content = {
        graph: params.graph_json || null,
        requirements: params.requirements_json || null,
        focus: params.focus_json || null,
      }
      const contentSha = canonicalContentSha256(content)

      const insertRevSql = `
        INSERT INTO industrial_configuration_revision (
          id, configuration_id, revision, schema_version, graph_json, requirements_json, focus_json, content_sha256, created_by, created_at, updated_at
        ) VALUES ($1, $2, 1, 'configuration_revision/2.0', $3, $4, $5, $6, $7, NOW(), NOW());
      `
      await poolClient.query(insertRevSql, [
        revId,
        configId,
        params.graph_json ? JSON.stringify(params.graph_json) : null,
        params.requirements_json ? JSON.stringify(params.requirements_json) : null,
        params.focus_json ? JSON.stringify(params.focus_json) : null,
        contentSha,
        params.created_by || params.owner_id,
      ])

      if (isPooled) await poolClient.query("COMMIT")
      return configRes.rows[0]
    } catch (err) {
      if (isPooled) await poolClient.query("ROLLBACK")
      throw err
    } finally {
      if (isPooled) poolClient.release()
    }
  }

  /**
   * Queries a configuration enforcing strict tenant ownership isolation.
   * If config does not exist OR belongs to another tenant, throws NotFoundError (404)
   * so foreign tenant never learns of its existence.
   */
  async getConfiguration(
    id: string,
    owner_id: string
  ): Promise<{
    id: string
    owner_id: string
    title: string
    current_revision: number
    lifecycle: string
    created_at: Date
    updated_at: Date
  }> {
    const { client, isPooled } = await this.getClient()
    try {
      const sql = `
        SELECT id, owner_id, title, current_revision, lifecycle, created_at, updated_at
        FROM industrial_configuration
        WHERE id = $1 AND deleted_at IS NULL;
      `
      const res = await client.query(sql, [id])
      if (res.rows.length === 0) {
        throw new NotFoundError(`Configuration '${id}' not found`)
      }

      const config = res.rows[0]
      if (config.owner_id !== owner_id) {
        // Enforce strict tenant isolation: never reveal existence to unauthorized tenant
        throw new NotFoundError(`Configuration '${id}' not found`)
      }

      return config
    } finally {
      if (isPooled) (client as PoolClient).release()
    }
  }

  /**
   * Lists configurations owned exclusively by owner_id.
   */
  async listConfigurations(owner_id: string): Promise<any[]> {
    const { client, isPooled } = await this.getClient()
    try {
      const sql = `
        SELECT id, owner_id, title, current_revision, lifecycle, created_at, updated_at
        FROM industrial_configuration
        WHERE owner_id = $1 AND deleted_at IS NULL
        ORDER BY updated_at DESC;
      `
      const res = await client.query(sql, [owner_id])
      return res.rows
    } finally {
      if (isPooled) (client as PoolClient).release()
    }
  }

  /**
   * Compare-and-Swap (CAS) revision update.
   * Updates revision with expected revision matching current_revision.
   * Succeeds and increments revision, or fails with REVISION_CONFLICT (HTTP 412).
   */
  async updateConfigurationWithRevision(params: {
    configurationId: string
    ownerId: string
    expectedRevision: number
    graph_json?: any
    requirements_json?: any
    focus_json?: any
    created_by?: string
  }): Promise<{
    configuration: any
    newRevision: any
  }> {
    const { client, isPooled } = await this.getClient()
    const poolClient = client as PoolClient

    try {
      if (isPooled) await poolClient.query("BEGIN")

      // Lock row for update
      const lockSql = `
        SELECT id, owner_id, current_revision, lifecycle
        FROM industrial_configuration
        WHERE id = $1 AND deleted_at IS NULL
        FOR UPDATE;
      `
      const configRes = await poolClient.query(lockSql, [params.configurationId])
      if (configRes.rows.length === 0) {
        throw new NotFoundError(`Configuration '${params.configurationId}' not found`)
      }

      const config = configRes.rows[0]
      if (config.owner_id !== params.ownerId) {
        throw new NotFoundError(`Configuration '${params.configurationId}' not found`)
      }

      if (Number(config.current_revision) !== Number(params.expectedRevision)) {
        throw new RevisionConflictError(
          `Revision conflict: expected revision ${params.expectedRevision} but current revision is ${config.current_revision}`
        )
      }

      const nextRevNumber = Number(config.current_revision) + 1
      const revId = `rev_${crypto.randomBytes(12).toString("hex")}`
      const content = {
        graph: params.graph_json || null,
        requirements: params.requirements_json || null,
        focus: params.focus_json || null,
      }
      const contentSha = canonicalContentSha256(content)

      const insertRevSql = `
        INSERT INTO industrial_configuration_revision (
          id, configuration_id, revision, schema_version, graph_json, requirements_json, focus_json, content_sha256, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, 'configuration_revision/2.0', $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *;
      `
      const revRes = await poolClient.query(insertRevSql, [
        revId,
        params.configurationId,
        nextRevNumber,
        params.graph_json ? JSON.stringify(params.graph_json) : null,
        params.requirements_json ? JSON.stringify(params.requirements_json) : null,
        params.focus_json ? JSON.stringify(params.focus_json) : null,
        contentSha,
        params.created_by || params.ownerId,
      ])

      const updateConfigSql = `
        UPDATE industrial_configuration
        SET current_revision = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *;
      `
      const updatedConfigRes = await poolClient.query(updateConfigSql, [
        nextRevNumber,
        params.configurationId,
      ])

      if (isPooled) await poolClient.query("COMMIT")

      return {
        configuration: updatedConfigRes.rows[0],
        newRevision: revRes.rows[0],
      }
    } catch (err) {
      if (isPooled) await poolClient.query("ROLLBACK")
      throw err
    } finally {
      if (isPooled) poolClient.release()
    }
  }

  /**
   * Idempotent operation executor (§11.2, §19).
   * Same key + same body -> replays cached result.
   * Same key + different body -> throws IDEMPOTENCY_CONFLICT (HTTP 409).
   */
  async executeIdempotent<T = any>(params: {
    owner_id: string
    operation: string
    idempotency_key: string
    body: any
    executeFn: () => Promise<T>
  }): Promise<{ result: T; cached: boolean }> {
    const keyHash = crypto
      .createHash("sha256")
      .update(params.idempotency_key, "utf8")
      .digest("hex")
    const bodyHash = canonicalContentSha256(params.body)

    const { client, isPooled } = await this.getClient()
    const poolClient = client as PoolClient

    try {
      if (isPooled) await poolClient.query("BEGIN")

      // Check existing idempotency record
      const checkSql = `
        SELECT id, owner_id, operation, key_hash, body_hash, state, response_json
        FROM industrial_idempotency
        WHERE owner_id = $1 AND operation = $2 AND key_hash = $3 AND deleted_at IS NULL
        FOR UPDATE;
      `
      const checkRes = await poolClient.query(checkSql, [
        params.owner_id,
        params.operation,
        keyHash,
      ])

      if (checkRes.rows.length > 0) {
        const record = checkRes.rows[0]
        if (record.body_hash !== bodyHash) {
          throw new IdempotencyConflictError(
            `Idempotency conflict: key '${params.idempotency_key}' previously used with different body payload`
          )
        }

        if (record.state === "completed") {
          if (isPooled) await poolClient.query("COMMIT")
          const parsed = typeof record.response_json === "string"
            ? JSON.parse(record.response_json)
            : record.response_json
          return { result: parsed as T, cached: true }
        }
      }

      // If no existing record, insert pending
      const idempId = `idemp_${crypto.randomBytes(12).toString("hex")}`
      const insertSql = `
        INSERT INTO industrial_idempotency (
          id, owner_id, operation, key_hash, body_hash, state, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'pending', NOW(), NOW())
        ON CONFLICT (owner_id, operation, key_hash) WHERE deleted_at IS NULL DO NOTHING;
      `
      await poolClient.query(insertSql, [
        idempId,
        params.owner_id,
        params.operation,
        keyHash,
        bodyHash,
      ])

      // Execute work
      const result = await params.executeFn()

      // Update to completed
      const updateSql = `
        UPDATE industrial_idempotency
        SET state = 'completed', response_json = $1, updated_at = NOW()
        WHERE owner_id = $2 AND operation = $3 AND key_hash = $4;
      `
      await poolClient.query(updateSql, [
        JSON.stringify(result),
        params.owner_id,
        params.operation,
        keyHash,
      ])

      if (isPooled) await poolClient.query("COMMIT")
      return { result, cached: false }
    } catch (err) {
      if (isPooled) await poolClient.query("ROLLBACK")
      throw err
    } finally {
      if (isPooled) poolClient.release()
    }
  }
}
