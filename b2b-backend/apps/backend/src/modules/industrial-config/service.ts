import { MedusaService } from "@medusajs/framework/utils"
import * as crypto from "crypto"
import { IndustrialTechnicalSnapshot } from "./models/technical-snapshot"
import { IndustrialCatalogEntry } from "./models/catalog-entry"
import { IndustrialAsset } from "./models/asset"
import { IndustrialAssetBinding } from "./models/asset-binding"
import { IndustrialConfiguration } from "./models/configuration"
import { IndustrialConfigurationRevision } from "./models/configuration-revision"
import { IndustrialEvaluation } from "./models/evaluation"
import { IndustrialPresentationReceipt } from "./models/presentation-receipt"
import { IndustrialQuote } from "./models/quote"
import { IndustrialQuoteLine } from "./models/quote-line"
import { IndustrialIdempotency } from "./models/idempotency"
import { IndustrialJob } from "./models/job"
import { IndustrialAuditEvent } from "./models/audit-event"
import { IndustrialConfigRepository } from "./repository"

class IndustrialConfigService extends MedusaService({
  IndustrialTechnicalSnapshot,
  IndustrialCatalogEntry,
  IndustrialAsset,
  IndustrialAssetBinding,
  IndustrialConfiguration,
  IndustrialConfigurationRevision,
  IndustrialEvaluation,
  IndustrialPresentationReceipt,
  IndustrialQuote,
  IndustrialQuoteLine,
  IndustrialIdempotency,
  IndustrialJob,
  IndustrialAuditEvent,
}) {
  private repo?: IndustrialConfigRepository

  getRepository(): IndustrialConfigRepository {
    if (!this.repo) {
      this.repo = new IndustrialConfigRepository()
    }
    return this.repo
  }

  /**
   * Compare-and-Swap (CAS) revision update.
   */
  async createRevisionWithCas(
    configurationId: string,
    expectedRevision: number,
    data: {
      schema_version?: string
      graph_json?: any
      requirements_json?: any
      focus_json?: any
      content_sha256: string
      created_by?: string
    }
  ) {
    const config = await (this as any)
      .retrieveIndustrialConfiguration(configurationId)
      .catch(() => null)

    if (!config) {
      const err: any = new Error(`Configuration '${configurationId}' not found`)
      err.code = "NOT_FOUND"
      err.status = 404
      throw err
    }

    if (Number(config.current_revision) !== Number(expectedRevision)) {
      const err: any = new Error(
        `Revision conflict: expected revision ${expectedRevision} but current is ${config.current_revision}`
      )
      err.code = "REVISION_CONFLICT"
      err.status = 412
      throw err
    }

    const nextRev = Number(expectedRevision) + 1
    const revision = await (this as any).createIndustrialConfigurationRevisions({
      configuration_id: configurationId,
      revision: nextRev,
      schema_version: data.schema_version || "configuration_revision/2.0",
      graph_json: data.graph_json,
      requirements_json: data.requirements_json,
      focus_json: data.focus_json,
      content_sha256: data.content_sha256,
      created_by: data.created_by,
    })

    await (this as any).updateIndustrialConfigurations({
      id: configurationId,
      current_revision: nextRev,
    })

    return revision
  }

  /**
   * Retrieves an entity enforcing tenant ownership isolation.
   */
  async getByIdWithOwner(
    entity: string,
    id: string,
    ownerId: string
  ) {
    const normalized = entity.toLowerCase()
    let record: any = null

    if (normalized.includes("configuration")) {
      record = await (this as any).retrieveIndustrialConfiguration(id).catch(() => null)
    } else if (normalized.includes("quote")) {
      record = await (this as any).retrieveIndustrialQuote(id).catch(() => null)
    } else if (normalized.includes("receipt") || normalized.includes("presentation")) {
      record = await (this as any).retrieveIndustrialPresentationReceipt(id).catch(() => null)
    } else {
      const retrieveFn = (this as any)[`retrieve${entity}`]
      if (typeof retrieveFn === "function") {
        record = await retrieveFn(id).catch(() => null)
      }
    }

    if (!record || record.owner_id !== ownerId) {
      const err: any = new Error(`${entity} '${id}' not found`)
      err.code = "NOT_FOUND"
      err.status = 404
      throw err
    }

    return record
  }

  /**
   * Idempotent operation executor with lease and replay support.
   */
  async executeIdempotent<T = any>(
    ownerId: string,
    operation: string,
    idempotencyKey: string,
    payload: any,
    handler: () => Promise<T>
  ): Promise<any> {
    const keyHash = crypto.createHash("sha256").update(idempotencyKey).digest("hex")
    const bodyHash = crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex")

    const existingList = await (this as any).listIndustrialIdempotencies({
      owner_id: ownerId,
      operation,
      key_hash: keyHash,
    })
    const existing = existingList?.[0]

    if (existing) {
      if (existing.body_hash !== bodyHash) {
        const err: any = new Error("Idempotency conflict: key re-used with different payload")
        err.code = "IDEMPOTENCY_CONFLICT"
        err.status = 409
        throw err
      }

      if (existing.state === "in_progress") {
        const leaseExpires = existing.lease_expires_at ? new Date(existing.lease_expires_at) : null
        if (leaseExpires && leaseExpires.getTime() > Date.now()) {
          const err: any = new Error("Concurrent request in progress for this idempotency key")
          err.code = "CONCURRENT_REQUEST"
          err.status = 409
          throw err
        }
      }

      if (existing.state === "completed") {
        return {
          replayed: true,
          resource_id: existing.resource_id,
          response_json: existing.response_json,
        }
      }
    }

    const createdList = await (this as any).createIndustrialIdempotencies([
      {
        owner_id: ownerId,
        operation,
        key_hash: keyHash,
        body_hash: bodyHash,
        state: "in_progress",
        lease_expires_at: new Date(Date.now() + 30000),
      },
    ])
    const idemp = createdList[0]

    try {
      const result = await handler()
      const resourceId = (result as any)?.id || null
      await (this as any).updateIndustrialIdempotencies({
        id: idemp.id,
        state: "completed",
        resource_id: resourceId,
      })
      return result
    } catch (err) {
      await (this as any).updateIndustrialIdempotencies({
        id: idemp.id,
        state: "failed",
      }).catch(() => {})
      throw err
    }
  }
}

export default IndustrialConfigService
