/**
 * Deterministic Pure Evaluator Core Types
 * Per Megaplan §12, §13, §14, §31
 */

export const VERDICTS = ["meets", "does_not_meet", "not_documented"] as const;
export type Verdict = (typeof VERDICTS)[number];

/**
 * Verified source documentation reference with page, section, excerpt, URL and revision
 */
export interface EvidenceRef {
  source_id: string;
  page?: number;
  section?: string;
  excerpt?: string;
  url?: string;
  revision?: string;
  attribute_path?: string;
  applicability?: string;
  bbox?: number[];
}

/**
 * Standard Reason Codes for 100% auditable evaluation results
 */
export const ReasonCode = {
  NO_REQUIREMENTS: "NO_REQUIREMENTS",
  EVIDENCE_CONFLICT: "EVIDENCE_CONFLICT",
  ABSENT_PROPERTY: "ABSENT_PROPERTY",
  NEGATIVE_FACT: "NEGATIVE_FACT",
  RANGE_OUT_OF_BOUNDS: "RANGE_OUT_OF_BOUNDS",
  UNIT_MISMATCH: "UNIT_MISMATCH",
  NATURE_MISMATCH: "NATURE_MISMATCH",
  PROTOCOL_MISMATCH: "PROTOCOL_MISMATCH",
  ROLE_MISMATCH: "ROLE_MISMATCH",
  CHANNEL_CAPACITY_EXCEEDED: "CHANNEL_CAPACITY_EXCEEDED",
  PORT_DIRECTION_MISMATCH: "PORT_DIRECTION_MISMATCH",
  PORT_TYPE_MISMATCH: "PORT_TYPE_MISMATCH",
  DUPLICATE_ADDRESS: "DUPLICATE_ADDRESS",
  BAUD_PARITY_NO_INTERSECTION: "BAUD_PARITY_NO_INTERSECTION",
  TOPOLOGY_INCOMPLETE: "TOPOLOGY_INCOMPLETE",
  ACTUATOR_INTERFACE_MISSING: "ACTUATOR_INTERFACE_MISSING",
  WIRING_INCOMPATIBLE: "WIRING_INCOMPATIBLE",
  RULE_NOT_IMPLEMENTED: "RULE_NOT_IMPLEMENTED",
  SATISFIED: "SATISFIED",
  OPTION_NOT_PROVEN: "OPTION_NOT_PROVEN",
  // Pilot rule aliases
  RANGE_COVERAGE: "RANGE_COVERAGE",
  SIGNAL_COMPATIBILITY: "SIGNAL_COMPATIBILITY",
  RTD_WIRING: "RTD_WIRING",
  PORT_DIRECTION: "PORT_DIRECTION",
  CHANNEL_CAPACITY: "CHANNEL_CAPACITY",
  POWER_SUPPLY: "POWER_SUPPLY",
  OUTPUT_ACTUATOR_INTERFACE: "OUTPUT_ACTUATOR_INTERFACE",
  PROTOCOL_ROLE: "PROTOCOL_ROLE",
  BUS_PARAMETERS: "BUS_PARAMETERS",
  ADDRESS_UNIQUENESS: "ADDRESS_UNIQUENESS",
  MOUNTING_METHOD: "MOUNTING_METHOD",
  LOGGING_CAPABILITY: "LOGGING_CAPABILITY",
  CONTROL_LOOP_COMPLETENESS: "CONTROL_LOOP_COMPLETENESS",
  IDENTITY_VARIANT: "IDENTITY_VARIANT",
} as const;

export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode] | string;
export const REASON_CODES = ReasonCode;

// Direct named exports for convenient DX
export const REASON_NO_REQUIREMENTS = ReasonCode.NO_REQUIREMENTS;
export const REASON_EVIDENCE_CONFLICT = ReasonCode.EVIDENCE_CONFLICT;
export const REASON_ABSENT_PROPERTY = ReasonCode.ABSENT_PROPERTY;
export const REASON_NEGATIVE_FACT = ReasonCode.NEGATIVE_FACT;
export const REASON_RANGE_OUT_OF_BOUNDS = ReasonCode.RANGE_OUT_OF_BOUNDS;
export const REASON_UNIT_MISMATCH = ReasonCode.UNIT_MISMATCH;
export const REASON_NATURE_MISMATCH = ReasonCode.NATURE_MISMATCH;
export const REASON_PROTOCOL_MISMATCH = ReasonCode.PROTOCOL_MISMATCH;
export const REASON_ROLE_MISMATCH = ReasonCode.ROLE_MISMATCH;
export const REASON_CHANNEL_CAPACITY_EXCEEDED = ReasonCode.CHANNEL_CAPACITY_EXCEEDED;
export const REASON_PORT_DIRECTION_MISMATCH = ReasonCode.PORT_DIRECTION_MISMATCH;
export const REASON_PORT_TYPE_MISMATCH = ReasonCode.PORT_TYPE_MISMATCH;
export const REASON_DUPLICATE_ADDRESS = ReasonCode.DUPLICATE_ADDRESS;
export const REASON_BAUD_PARITY_NO_INTERSECTION = ReasonCode.BAUD_PARITY_NO_INTERSECTION;
export const REASON_TOPOLOGY_INCOMPLETE = ReasonCode.TOPOLOGY_INCOMPLETE;
export const REASON_ACTUATOR_INTERFACE_MISSING = ReasonCode.ACTUATOR_INTERFACE_MISSING;
export const REASON_WIRING_INCOMPATIBLE = ReasonCode.WIRING_INCOMPATIBLE;
export const REASON_RULE_NOT_IMPLEMENTED = ReasonCode.RULE_NOT_IMPLEMENTED;
export const REASON_SATISFIED = ReasonCode.SATISFIED;
export const REASON_OPTION_NOT_PROVEN = ReasonCode.OPTION_NOT_PROVEN;

/**
 * Supported operators per Megaplan §13.3
 */
export const OPERATORS = [
  "equals",
  "not_equals",
  "includes_all",
  "covers_range",
  "gte",
  "lte",
  "supports_mode",
] as const;
export type Operator = (typeof OPERATORS)[number] | string;

/**
 * Requirement Target Scope per Megaplan §13.3
 */
export type RequirementTarget =
  | "product"
  | "instance"
  | "connection"
  | "network"
  | "loop"
  | "system"
  | {
      kind?: "product" | "instance" | "port" | "network" | "system";
      port_id?: string;
      instance_id?: string;
    }
  | string;

/**
 * Structured Technical Requirement per Megaplan §13.3
 */
export interface TechnicalRequirement {
  requirement_id: string;
  target?: RequirementTarget;
  property: string;
  operator: Operator;
  value?: any;
  required?: boolean;
  origin?: string;
  notes?: string;
  channels?: number;
  min?: number;
  max?: number;
  unit?: string;
  direction?: string;
  nature?: "ac" | "dc" | string;
  inclusive_min?: boolean;
  inclusive_max?: boolean;
  [key: string]: any;
}

export type EvaluatorRequirement = TechnicalRequirement;

/**
 * Result of executing a single technical rule per Megaplan §13.1
 */
export interface RuleResult {
  rule_id: string;
  rule_version: string;
  scope: string;
  verdict: Verdict;
  status?: Verdict; // Alias for verdict
  satisfied?: boolean; // true iff verdict === 'meets'
  reason_code: ReasonCode;
  message: string;
  reason?: string; // Alias for message
  required: boolean;
  subjects: string[];
  evidence_refs: EvidenceRef[];
  missing_fields?: string[];
  assumptions?: string[];
  suggested_actions?: string[];
  property?: string;
}

export type RuleEvaluationResult = RuleResult;

export function createRuleResult(
  data: {
    rule_id: string;
    rule_version?: string;
    scope?: string;
    verdict: Verdict;
    reason_code: ReasonCode;
    message: string;
    required?: boolean;
    subjects?: string[];
    evidence_refs?: EvidenceRef[];
    missing_fields?: string[];
    assumptions?: string[];
    suggested_actions?: string[];
    property?: string;
    status?: Verdict;
    satisfied?: boolean;
    reason?: string;
  }
): RuleResult {
  const verdict = data.verdict;
  return {
    rule_id: data.rule_id,
    rule_version: data.rule_version || "2026.g5.1",
    scope: data.scope || "product",
    verdict,
    status: data.status || verdict,
    satisfied: data.satisfied !== undefined ? data.satisfied : verdict === "meets",
    reason_code: data.reason_code,
    message: data.message,
    reason: data.reason || data.message,
    required: data.required !== false,
    subjects: data.subjects || [],
    evidence_refs: data.evidence_refs || [],
    missing_fields: data.missing_fields,
    assumptions: data.assumptions,
    suggested_actions: data.suggested_actions,
    property: data.property,
  };
}

/**
 * Evaluation context passed to pure evaluator
 */
export interface ProductEvaluationContext {
  target_instance_id?: string;
  system_requirements?: TechnicalRequirement[];
  evaluated_at?: string;
  parent_system?: any;
  custom_parameters?: Record<string, any>;
}

/**
 * Product-level evaluation result
 */
export interface ProductEvaluationResult {
  target_id: string;
  sku?: string;
  variant_id?: string;
  snapshot_id?: string;
  overall_verdict: Verdict;
  overall_status: Verdict; // Alias for overall_verdict
  overall_satisfied: boolean; // true iff overall_verdict === 'meets'
  rules_version: string;
  rule_set_version: string;
  evaluations: RuleResult[];
  validation_scope: string[];
  unverified_scopes: string[];
  evaluated_at: string;
  reason_code?: string;
  missing_fields?: string[];
}

/**
 * System-level evaluation result for an engineering configuration revision
 */
export interface SystemEvaluationResult {
  configuration_id?: string;
  config_revision?: number;
  overall_verdict: Verdict;
  overall_status: Verdict; // Alias for overall_verdict
  overall_satisfied: boolean; // true iff overall_verdict === 'meets'
  rules_version: string;
  rule_set_version: string;
  evaluations: RuleResult[];
  validation_scope: string[];
  unverified_scopes: string[];
  evaluated_at: string;
  reason_code?: string;
  missing_fields?: string[];
}
