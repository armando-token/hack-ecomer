import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  withMuseAuth,
  formatErrorResponse,
  applySecurityHeaders,
  museLogger,
  type MuseRouteContext,
} from "../../../../../lib/muse/auth-guard"
import {
  validateEvaluatePayload,
  MuseValidationError,
} from "../../../../../lib/muse/schema-validator"
import {
  getTechnicalProfile,
  getTechnicalFacts,
  getTechnicalSources,
  getPool,
  type TechnicalProfileRecord,
  type TechnicalFactRecord,
  type TechnicalSourceRecord,
} from "../../../../../lib/muse/db"
import {
  evaluateRequirements,
  type EvaluationResult,
} from "../../../../../lib/muse/evaluator"

/**
 * Tell Medusa to disable default session/store authentication.
 * Route security is fully enforced via `withMuseAuth` (Bearer token guard).
 */
export const AUTHENTICATE = false

/**
 * POST /api/muse/v1/evaluate
 *
 * Technical evaluation route for Meta Muse Agent Commerce.
 *
 * Requirements:
 * - Requires Bearer authentication with `auth-guard`. If fails -> HTTP 401.
 * - Response headers: `Cache-Control: no-store` and `X-Request-Id: <request_id>`.
 * - Validates body with `schema-validator`:
 *     - `variant_id` or `sku` string mandatory.
 *     - `requirements` array of 1 to 10 elements.
 *     - closed vocabulary for `property`.
 *     - If validation fails -> responder HTTP 400:
 *       `{ "error": { "code": "INVALID_REQUEST", "message": "..." }, "request_id": "..." }`
 * - Verifies that `variant_id` / `sku` belongs to the demonstration catalog.
 *   Resolves against `technical_profile` OR `industrial_technical_snapshot`.
 *   If non-existent or non-demo -> HTTP 404.
 * - Loads `technical_profile`, `technical_fact`, and `technical_source` from PostgreSQL for the variant.
 * - Executes evaluation with deterministic engine `evaluator.ts`.
 * - Responds HTTP 200 preserving v1 format with v2 tri-state detail:
 *     `overall_verdict`, `rule_set_version: "2026.g5.1"`, `unverified_scopes`,
 *     and in evaluations: `verdict`, `reason_code`, `evidence_refs`.
 * - Structured logging without Bearer tokens or PII.
 */
export const POST = withMuseAuth(
  async (
    req: MedusaRequest,
    res: MedusaResponse,
    context: MuseRouteContext
  ): Promise<any> => {
    const { requestId } = context

    // 1. Ensure required response headers are set
    applySecurityHeaders(res, requestId)

    // 2. Validate request body with schema-validator
    let validatedPayload: ReturnType<typeof validateEvaluatePayload>
    try {
      let rawBody = req.body
      if (typeof rawBody === "string") {
        try {
          rawBody = JSON.parse(rawBody)
        } catch {
          return formatErrorResponse(
            res,
            400,
            "INVALID_REQUEST",
            "Invalid JSON payload in request body",
            requestId
          )
        }
      }

      validatedPayload = validateEvaluatePayload(rawBody)
    } catch (err: any) {
      if (
        err instanceof MuseValidationError ||
        err?.name === "MuseValidationError" ||
        err?.statusCode === 400
      ) {
        return formatErrorResponse(
          res,
          400,
          "INVALID_REQUEST",
          err.message || "Invalid request payload",
          requestId,
          err.details
        )
      }
      return formatErrorResponse(
        res,
        400,
        "INVALID_REQUEST",
        err?.message || "Invalid request payload",
        requestId
      )
    }

    const { variant_id, requirements } = validatedPayload
    const targetIdentifier = variant_id || (validatedPayload as any).sku

    // 3. Verify variant_id / sku belongs to demo catalog.
    // Look up in technical_profile OR industrial_technical_snapshot so both legacy demo and G4 snapshots resolve.
    let profile: TechnicalProfileRecord | null = null
    try {
      profile = await getTechnicalProfile(targetIdentifier)
    } catch (dbErr: any) {
      museLogger.error("Failed to query technical profile from database", dbErr, {
        requestId,
        variant_id: targetIdentifier,
      })
      return formatErrorResponse(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "Failed to query database for technical profile",
        requestId
      )
    }

    // Fallback to industrial_technical_snapshot if not found in technical_profile
    if (!profile) {
      try {
        const pool = getPool()
        const snapshotRes = await pool.query(
          `
          SELECT 
            its.id,
            its.variant_id,
            its.revision,
            its.content_json,
            its.state,
            its.created_at,
            its.updated_at
          FROM industrial_technical_snapshot its
          WHERE (its.variant_id = $1 OR its.content_json->>'sku' = $1)
            AND its.deleted_at IS NULL
          ORDER BY its.revision DESC
          LIMIT 1
          `,
          [targetIdentifier]
        )

        if (snapshotRes.rows.length > 0) {
          const row = snapshotRes.rows[0]
          const content = row.content_json || {}
          profile = {
            id: row.id,
            variant_id: row.variant_id,
            model: content.manufacturer_part_number || content.model || null,
            revision: content.technical_revision || `rev-${row.revision}` || "rev-2026.1",
            demo: true,
            sku: content.sku || (targetIdentifier.startsWith("variant_") ? "" : targetIdentifier),
            created_at: row.created_at,
            updated_at: row.updated_at,
          }
        }
      } catch (snapshotErr: any) {
        museLogger.warn("Failed to query industrial_technical_snapshot fallback", {
          error: snapshotErr?.message,
          requestId,
          targetIdentifier,
        })
      }
    }

    if (!profile || !profile.demo) {
      return formatErrorResponse(
        res,
        404,
        "NOT_FOUND",
        `Variant '${targetIdentifier}' not found or outside demo scope`,
        requestId
      )
    }

    // 4. Load technical facts and referenced sources from PostgreSQL
    let facts: TechnicalFactRecord[] = []
    let sources: TechnicalSourceRecord[] = []
    try {
      facts = await getTechnicalFacts(profile.variant_id)

      // Fallback: If no facts in technical_fact table, synthesize facts from snapshot content_json
      if (facts.length === 0) {
        const pool = getPool()
        const snapshotRes = await pool.query(
          `
          SELECT its.content_json, its.created_at, its.updated_at
          FROM industrial_technical_snapshot its
          WHERE its.variant_id = $1 AND its.deleted_at IS NULL
          ORDER BY its.revision DESC
          LIMIT 1
          `,
          [profile.variant_id]
        )
        if (snapshotRes.rows.length > 0) {
          const content = snapshotRes.rows[0].content_json || {}
          const createdAt = snapshotRes.rows[0].created_at || new Date()
          const updatedAt = snapshotRes.rows[0].updated_at || new Date()
          const srcId = content.source_ids?.[0] || null

          if (Array.isArray(content.mounting) && content.mounting.length > 0) {
            facts.push({
              id: `fact_snp_mounting_${profile.variant_id}`,
              variant_id: profile.variant_id,
              property: "mounting",
              normalized_value_json: { type: content.mounting[0], mounting: content.mounting },
              display_value: content.mounting.join(", "),
              source_id: srcId,
              page: 1,
              section: "Mounting",
              excerpt: null,
              polarity: true,
              created_at: createdAt,
              updated_at: updatedAt,
            })
          }

          if (Array.isArray(content.ports)) {
            for (const port of content.ports) {
              if (port.category === "power" || port.signal_type?.includes("power")) {
                facts.push({
                  id: `fact_snp_power_${port.port_id}`,
                  variant_id: profile.variant_id,
                  property: "supply_voltage",
                  normalized_value_json: { label: port.label, signal_type: port.signal_type },
                  display_value: port.label || "Supply Voltage",
                  source_id: srcId,
                  page: 1,
                  section: "Power",
                  excerpt: null,
                  polarity: true,
                  created_at: createdAt,
                  updated_at: updatedAt,
                })
              }
            }
          }
        }
      }

      const sourceIds: string[] = Array.from(
        new Set(
          facts
            .map((f) => f.source_id)
            .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        )
      )
      sources = sourceIds.length > 0 ? await getTechnicalSources(sourceIds as string[]) : []
    } catch (dbErr: any) {
      museLogger.error(
        "Failed to load technical facts or sources from database",
        dbErr,
        {
          requestId,
          variant_id: profile.variant_id,
        }
      )
      return formatErrorResponse(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "Failed to query technical facts or sources",
        requestId
      )
    }

    // 5. Execute evaluation with deterministic evaluator engine
    let evaluationResult: EvaluationResult
    try {
      evaluationResult = evaluateRequirements(
        profile.variant_id,
        requirements,
        facts,
        sources,
        profile
      )
    } catch (evalErr: any) {
      museLogger.error("Evaluation engine failure", evalErr, {
        requestId,
        variant_id: profile.variant_id,
      })
      return formatErrorResponse(
        res,
        500,
        "INTERNAL_SERVER_ERROR",
        "Failed to execute requirement evaluation engine",
        requestId
      )
    }

    // 6. Structured log of successful evaluation (NO Bearer tokens, NO PII)
    museLogger.info("Evaluation completed successfully", {
      requestId,
      variantId: profile.variant_id,
      sku: profile.sku,
      overallSatisfied: evaluationResult.overall_satisfied,
      overallVerdict: evaluationResult.overall_verdict,
      requirementsCount: requirements.length,
    })

    // 7. Respond HTTP 200 with the exact specification JSON format preserving v1 with v2 detail
    return res.status(200).json({
      variant_id: profile.variant_id,
      sku: profile.sku || "",
      overall_satisfied: evaluationResult.overall_satisfied,
      overall_verdict: evaluationResult.overall_verdict,
      rule_set_version: evaluationResult.rule_set_version || "2026.g5.1",
      unverified_scopes: evaluationResult.unverified_scopes || [],
      evaluations: evaluationResult.evaluations,
      source_revision: evaluationResult.source_revision || "rev-2026.1",
      evaluated_at: evaluationResult.evaluated_at,
      request_id: requestId,
    })
  }
)
