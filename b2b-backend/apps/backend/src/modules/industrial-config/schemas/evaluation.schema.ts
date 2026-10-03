import { z } from "zod";

/**
 * Three-state evaluation verdicts per Megaplan §8.3
 * 'meets', 'does_not_meet', 'not_documented' are the only valid verdicts.
 */
export const VerdictEnum = z.enum([
  "meets",
  "does_not_meet",
  "not_documented",
]);
export type Verdict = z.infer<typeof VerdictEnum>;

/**
 * Individual rule evaluation result with property, verdict, reason, and evidence
 */
export const SingleEvaluationSchema = z.object({
  rule_id: z.string().min(1, { message: "rule_id is required" }),
  property: z.string().min(1, { message: "property is required" }),
  verdict: VerdictEnum,
  reason: z.string(),
  evidence: z.any().optional(),
});
export type SingleEvaluation = z.infer<typeof SingleEvaluationSchema>;

/**
 * Structured evaluation result payload
 */
export const EvaluationResultPayloadSchema = z.object({
  overall_verdict: VerdictEnum,
  evaluations: z.array(SingleEvaluationSchema),
});
export type EvaluationResultPayload = z.infer<
  typeof EvaluationResultPayloadSchema
>;

/**
 * Evaluation Result entity schema per Megaplan §11.2 & §17.5
 * Immutable snapshot of technical evaluation results against a configuration revision.
 */
export const EvaluationResultSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  configuration_id: z.string().nullable().optional(),
  config_revision: z
    .number()
    .int({ message: "config_revision must be an integer" })
    .min(1, { message: "config_revision must be >= 1" })
    .nullable()
    .optional(),
  input_sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, {
      message: "input_sha256 must be a 64-character lowercase hex SHA-256 hash",
    }),
  snapshot_set_json: z.array(z.string()),
  rules_version: z.string().min(1, { message: "rules_version is required" }),
  result_json: EvaluationResultPayloadSchema,
  created_at: z.string().optional(),
});
export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
