/**
 * Deterministic Pure Evaluator Core Engine
 * Per Megaplan §12, §13, §14, §31
 * 100% Deterministic, Reproducible, Auditable - No HTTP or Database I/O.
 */

import { TechnicalSnapshot } from "../schemas/snapshot.schema";
import { ConfigurationRevision } from "../schemas/revision.schema";
import {
  Connection,
  ControlLoop,
  Instance,
  Network,
  ProcessObject,
  Variable,
} from "../schemas/configuration.schema";
import {
  createRuleResult,
  EvidenceRef,
  ProductEvaluationContext,
  ProductEvaluationResult,
  ReasonCode,
  RuleResult,
  SystemEvaluationResult,
  TechnicalRequirement,
  Verdict,
} from "./types";
import {
  areVoltageNaturesCompatible,
  checkRangeCoverage,
  convertToBase,
  extractVoltageNature,
} from "./units";
import {
  assignConnectionsDeterministically,
  evaluateModbusNetwork,
} from "./matching";
import {
  evaluateChannelCapacity,
  evaluateControlLoopCompleteness,
  evaluateIdentityVariant,
  evaluateLoggingCapability,
  evaluateMountingMethod,
  evaluateOutputActuatorInterface,
  evaluatePortDirection,
  evaluateRangeCoverage,
  evaluateRtdWiring,
  evaluateSignalCompatibility,
  PILOT_RULE_VERSION,
  PILOT_SCOPES,
} from "./rules";

export const RULE_SET_VERSION = "2026.g5.1";

/**
 * Aggregates individual rule evaluation verdicts per Megaplan §13.2
 * 1. If any required rule is 'does_not_meet' -> overall is 'does_not_meet'
 * 2. If none fails and any required rule is 'not_documented' -> overall is 'not_documented'
 * 3. If all required rules are 'meets' -> overall is 'meets'
 * 4. Empty requirements array -> 'not_documented' with NO_REQUIREMENTS
 */
export function aggregateVerdicts(evaluations: RuleResult[]): {
  overall_verdict: Verdict;
  validation_scope: string[];
  unverified_scopes: string[];
} {
  const scopeSet = new Set<string>();
  const unverifiedSet = new Set<string>();

  for (const ev of evaluations) {
    if (ev.scope) {
      scopeSet.add(ev.scope);
    }
    if (ev.reason_code === ReasonCode.RULE_NOT_IMPLEMENTED) {
      unverifiedSet.add(ev.scope);
    }
  }

  if (evaluations.length === 0) {
    return {
      overall_verdict: "not_documented",
      validation_scope: [],
      unverified_scopes: [],
    };
  }

  const requiredEvaluations = evaluations.filter((e) => e.required);

  if (requiredEvaluations.length === 0) {
    // If all are optional, any does_not_meet fails, otherwise meets if at least one meets
    if (evaluations.some((e) => e.verdict === "does_not_meet")) {
      return {
        overall_verdict: "does_not_meet",
        validation_scope: Array.from(scopeSet).sort(),
        unverified_scopes: Array.from(unverifiedSet).sort(),
      };
    }
    const hasMeets = evaluations.some((e) => e.verdict === "meets");
    return {
      overall_verdict: hasMeets ? "meets" : "not_documented",
      validation_scope: Array.from(scopeSet).sort(),
      unverified_scopes: Array.from(unverifiedSet).sort(),
    };
  }

  if (requiredEvaluations.some((e) => e.verdict === "does_not_meet")) {
    return {
      overall_verdict: "does_not_meet",
      validation_scope: Array.from(scopeSet).sort(),
      unverified_scopes: Array.from(unverifiedSet).sort(),
    };
  }

  if (requiredEvaluations.some((e) => e.verdict === "not_documented")) {
    return {
      overall_verdict: "not_documented",
      validation_scope: Array.from(scopeSet).sort(),
      unverified_scopes: Array.from(unverifiedSet).sort(),
    };
  }

  return {
    overall_verdict: "meets",
    validation_scope: Array.from(scopeSet).sort(),
    unverified_scopes: Array.from(unverifiedSet).sort(),
  };
}

/**
 * Evaluates a single technical requirement against a product TechnicalSnapshot
 */
export function evaluateRequirementAgainstSnapshot(
  snapshot: TechnicalSnapshot,
  req: TechnicalRequirement
): RuleResult {
  const prop = req.property.toLowerCase().trim();
  const operator = (req.operator || "equals").toLowerCase().trim();
  const required = req.required !== false;

  // 1. Identity & Variant checks
  if (prop === "identity" || prop === "variant_id" || prop === "sku") {
    return createRuleResult(evaluateIdentityVariant(snapshot, req));
  }

  // 2. Mounting method
  if (prop === "mounting" || prop === "mounting_style" || prop === "mounting_method") {
    return createRuleResult(evaluateMountingMethod(snapshot, req));
  }

  // 3. Logging capability
  if (prop === "logging" || prop === "data_logging" || prop === "retention") {
    return createRuleResult(evaluateLoggingCapability(snapshot, req));
  }

  // 4. Channel capacity
  if (req.channels !== undefined || prop.includes("channel") || prop === "analog_inputs" || prop === "discrete_inputs") {
    return createRuleResult(evaluateChannelCapacity(snapshot, req));
  }

  // 5. Check if requested scope is outside pilot implemented scopes
  const isRecognizedScope = PILOT_SCOPES.some(
    (s) => s === prop || s === (typeof req.target === "string" ? req.target.toLowerCase() : "")
  );

  // 6. Look for matching attributes in snapshot
  const matchingAttrs = snapshot.attributes.filter(
    (a: any) =>
      a.property.toLowerCase() === prop ||
      a.attribute_id.toLowerCase().includes(prop)
  );

  // Check for contradictory evidence sources per Megaplan §13.4 & T10
  if (matchingAttrs.length > 1) {
    const distinctNatures = new Set(
      matchingAttrs.map((a: any) => extractVoltageNature(a.value?.nature, a.value?.unit)).filter(Boolean)
    );
    if (distinctNatures.has("ac") && distinctNatures.has("dc")) {
      return createRuleResult({
        rule_id: req.requirement_id || "EVIDENCE_CONFLICT",
        rule_version: PILOT_RULE_VERSION,
        scope: typeof req.target === "string" ? req.target : "product",
        verdict: "not_documented",
        reason_code: ReasonCode.EVIDENCE_CONFLICT,
        message: `Contradictory evidence sources for property '${prop}': conflicting electrical natures (${Array.from(distinctNatures).join(" vs ")})`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: matchingAttrs.flatMap((a: any) => a.evidence_refs || []),
      });
    }
  }

  const attr = matchingAttrs[0];
  const evidenceRefs: EvidenceRef[] = attr?.evidence_refs || snapshot.source_ids.map((s) => ({ source_id: s }));

  if (!attr) {
    // Check if property exists on snapshot root (capabilities, ports, dimensions)
    if (prop === "capabilities" && snapshot.capabilities) {
      if (operator === "includes_all") {
        const requiredCaps = Array.isArray(req.value) ? req.value : [req.value];
        const missing = requiredCaps.filter((rc: string) => !snapshot.capabilities!.includes(rc));
        if (missing.length > 0) {
          return createRuleResult({
            rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
            rule_version: PILOT_RULE_VERSION,
            scope: "product",
            verdict: "does_not_meet",
            reason_code: ReasonCode.ABSENT_PROPERTY,
            message: `Snapshot missing required capabilities: [${missing.join(", ")}]`,
            required,
            subjects: [snapshot.sku, prop],
            evidence_refs: evidenceRefs,
          });
        }
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "meets",
          reason_code: ReasonCode.SATISFIED,
          message: `Snapshot provides all required capabilities: [${requiredCaps.join(", ")}]`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }
    }

    // Communication protocol property absent on snapshot
    if (prop === "communication_protocols") {
      const hasCap = snapshot.capabilities?.some((c) => c.toLowerCase().includes(String(req.value).toLowerCase()));
      if (!hasCap) {
        return createRuleResult({
          rule_id: req.requirement_id || "PROTOCOL_ROLE",
          rule_version: PILOT_RULE_VERSION,
          scope: "communication",
          verdict: "not_documented",
          reason_code: ReasonCode.PROTOCOL_ROLE,
          message: `Communication protocol '${req.value}' is not documented on snapshot ${snapshot.sku}`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: [],
          missing_fields: [prop],
        });
      }
    }

    // Negative facts check per Megaplan §13.4 & T02:
    // 'not_equals' requires evidence of difference, cannot be satisfied by absence!
    if (operator === "not_equals") {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: typeof req.target === "string" ? req.target : "product",
        verdict: "not_documented",
        reason_code: ReasonCode.ABSENT_PROPERTY,
        message: `Property '${req.property}' is absent: 'not_equals' requires documented evidence of difference`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
        missing_fields: [req.property],
      });
    }

    if (!isRecognizedScope) {
      return createRuleResult({
        rule_id: req.requirement_id || `UNVERIFIED_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: typeof req.target === "string" ? req.target : prop,
        verdict: "not_documented",
        reason_code: ReasonCode.RULE_NOT_IMPLEMENTED,
        message: `Scope or property '${req.property}' is not implemented in pilot ruleset`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: [],
        missing_fields: [req.property],
      });
    }

    return createRuleResult({
      rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
      rule_version: PILOT_RULE_VERSION,
      scope: typeof req.target === "string" ? req.target : "product",
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Property '${req.property}' is not documented on snapshot ${snapshot.sku}`,
      required,
      subjects: [snapshot.sku, prop],
      evidence_refs: evidenceRefs,
      missing_fields: [req.property],
    });
  }

  // Attribute is present: evaluate based on operator
  const attrValue = attr.value;

  // 1. covers_range
  if (operator === "covers_range" || req.min !== undefined || req.max !== undefined) {
    let reqMin = req.min;
    let reqMax = req.max;
    let reqUnit = req.unit;
    let reqNature = req.nature;

    if (req.value && typeof req.value === "object") {
      if (req.value.min !== undefined) reqMin = req.value.min;
      if (req.value.max !== undefined) reqMax = req.value.max;
      if (req.value.unit !== undefined) reqUnit = req.value.unit;
      if (req.value.nature !== undefined) reqNature = req.value.nature;
      if (req.value.value !== undefined && reqMin === undefined && reqMax === undefined) {
        reqMin = req.value.value;
        reqMax = req.value.value;
      }
    }

    let capMin: number | undefined;
    let capMax: number | undefined;
    let capUnit: string | undefined;
    let capNature: string | undefined;

    if (attrValue) {
      if (attrValue.min !== undefined) capMin = attrValue.min;
      if (attrValue.max !== undefined) capMax = attrValue.max;
      if (attrValue.unit !== undefined) capUnit = attrValue.unit;
      if (attrValue.nature !== undefined) capNature = attrValue.nature;
      if (attrValue.value !== undefined && capMin === undefined && capMax === undefined) {
        if (typeof attrValue.value === "number") {
          capMin = attrValue.value;
          capMax = attrValue.value;
        }
      }
    }

    const rangeResult = evaluateRangeCoverage(
      {
        requirement_id: req.requirement_id,
        target: req.target,
        property: req.property,
        operator: req.operator,
        required,
        min: reqMin,
        max: reqMax,
        unit: reqUnit,
        nature: reqNature,
        inclusive_min: req.inclusive_min,
        inclusive_max: req.inclusive_max,
      },
      { min: capMin, max: capMax, unit: capUnit, nature: capNature },
      evidenceRefs
    );
    return createRuleResult({
      ...rangeResult,
      rule_id: req.requirement_id || "RANGE_COVERAGE",
      subjects: [snapshot.sku, prop],
    });
  }

  // 2. equals
  if (operator === "equals") {
    // Check if both are quantities with units that can be compared
    let attrNum: number | undefined;
    let attrUnit: string | undefined;
    if (typeof attrValue === "number") {
      attrNum = attrValue;
    } else if (attrValue && typeof attrValue.value === "number") {
      attrNum = attrValue.value;
      attrUnit = attrValue.unit;
    }

    let reqNum: number | undefined;
    let reqUnit: string | undefined;
    if (typeof req.value === "number") {
      reqNum = req.value;
      reqUnit = req.unit;
    } else if (req.value && typeof req.value.value === "number") {
      reqNum = req.value.value;
      reqUnit = req.value.unit || req.unit;
    }

    if (attrNum !== undefined && reqNum !== undefined && (attrUnit || reqUnit)) {
      const uAttr = attrUnit || reqUnit!;
      const uReq = reqUnit || attrUnit!;

      const attrNature = extractVoltageNature(attrValue.nature, uAttr);
      const reqNature = extractVoltageNature(req.value?.nature || req.nature, uReq);

      if (attrNature && reqNature && !areVoltageNaturesCompatible(reqNature, attrNature)) {
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "does_not_meet",
          reason_code: ReasonCode.NATURE_MISMATCH,
          message: `Voltage nature mismatch in equals: requirement expects ${reqNature} but property is ${attrNature}`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }

      const baseAttr = convertToBase(attrNum, uAttr);
      const baseReq = convertToBase(reqNum, uReq);

      if (!baseAttr || !baseReq) {
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "does_not_meet",
          reason_code: ReasonCode.UNIT_MISMATCH,
          message: `Unrecognized unit in equals comparison (${uAttr} vs ${uReq})`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }

      if (baseAttr.quantity !== baseReq.quantity) {
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "does_not_meet",
          reason_code: ReasonCode.UNIT_MISMATCH,
          message: `Incompatible physical quantities in equals: ${baseAttr.quantity} (${uAttr}) vs ${baseReq.quantity} (${uReq})`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }

      const isClose = Math.abs(baseAttr.value - baseReq.value) < 1e-9;
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: isClose ? "meets" : "does_not_meet",
        reason_code: isClose ? ReasonCode.SATISFIED : ReasonCode.RANGE_OUT_OF_BOUNDS,
        message: isClose
          ? `Property '${prop}' (${attrNum} ${uAttr}) equals '${reqNum} ${uReq}'`
          : `Property '${prop}' (${attrNum} ${uAttr}) does not equal expected '${reqNum} ${uReq}'`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    }

    const rawVal = attrValue.value !== undefined ? attrValue.value : attrValue;
    const reqVal = req.value;

    const matches =
      typeof rawVal === "string" && typeof reqVal === "string"
        ? rawVal.trim().toLowerCase() === reqVal.trim().toLowerCase()
        : rawVal === reqVal;

    if (matches) {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "meets",
        reason_code: ReasonCode.SATISFIED,
        message: `Property '${prop}' equals '${reqVal}'`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    } else {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "does_not_meet",
        reason_code: ReasonCode.NEGATIVE_FACT,
        message: `Property '${prop}' value '${JSON.stringify(rawVal)}' does not equal expected '${JSON.stringify(reqVal)}'`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    }
  }

  // 3. not_equals per Megaplan §13.4
  if (operator === "not_equals") {
    const rawVal = attrValue.value !== undefined ? attrValue.value : attrValue;
    const reqVal = req.value;

    const matches =
      typeof rawVal === "string" && typeof reqVal === "string"
        ? rawVal.trim().toLowerCase() === reqVal.trim().toLowerCase()
        : rawVal === reqVal;

    if (!matches) {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "meets",
        reason_code: ReasonCode.SATISFIED,
        message: `Property '${prop}' is verified not equal to '${reqVal}' (current: '${rawVal}')`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    } else {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "does_not_meet",
        reason_code: ReasonCode.NEGATIVE_FACT,
        message: `Property '${prop}' equals forbidden value '${reqVal}'`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    }
  }

  // 4. includes_all
  if (operator === "includes_all") {
    const reqList: string[] = Array.isArray(req.value) ? req.value : [req.value];
    let snapshotList: string[] = [];
    if (Array.isArray(attrValue.value)) {
      snapshotList = attrValue.value.map((v: any) => String(v).toLowerCase());
    } else if (typeof attrValue.value === "string") {
      snapshotList = [attrValue.value.toLowerCase()];
    }

    const missing = reqList.filter((item) => !snapshotList.includes(String(item).toLowerCase()));
    if (missing.length > 0) {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "does_not_meet",
        reason_code: ReasonCode.ABSENT_PROPERTY,
        message: `Missing required items for '${prop}': [${missing.join(", ")}]`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    }

    return createRuleResult({
      rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
      rule_version: PILOT_RULE_VERSION,
      scope: "product",
      verdict: "meets",
      reason_code: ReasonCode.SATISFIED,
      message: `All items for '${prop}' are supported: [${reqList.join(", ")}]`,
      required,
      subjects: [snapshot.sku, prop],
      evidence_refs: evidenceRefs,
    });
  }

  // 5. gte / lte with unit conversion
  if (operator === "gte" || operator === "lte") {
    let numVal: number | undefined;
    let numUnit: string | undefined;
    if (typeof attrValue === "number") {
      numVal = attrValue;
    } else if (attrValue && typeof attrValue.value === "number") {
      numVal = attrValue.value;
      numUnit = attrValue.unit;
    } else if (typeof attrValue?.value === "string") {
      numVal = parseFloat(attrValue.value);
      numUnit = attrValue.unit;
    }

    let targetVal: number | undefined;
    let targetUnit: string | undefined;
    if (typeof req.value === "number") {
      targetVal = req.value;
      targetUnit = req.unit;
    } else if (req.value && typeof req.value.value === "number") {
      targetVal = req.value.value;
      targetUnit = req.value.unit || req.unit;
    } else if (typeof req.value?.value === "string") {
      targetVal = parseFloat(req.value.value);
      targetUnit = req.value.unit || req.unit;
    }

    if (numVal === undefined || targetVal === undefined || isNaN(numVal) || isNaN(targetVal)) {
      return createRuleResult({
        rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
        rule_version: PILOT_RULE_VERSION,
        scope: "product",
        verdict: "not_documented",
        reason_code: ReasonCode.ABSENT_PROPERTY,
        message: `Non-numeric value in ${operator} comparison for property ${prop}`,
        required,
        subjects: [snapshot.sku, prop],
        evidence_refs: evidenceRefs,
      });
    }

    let finalNum = numVal;
    let finalTarget = targetVal;

    // Convert units to base if units are present
    if (numUnit && targetUnit) {
      const baseNum = convertToBase(numVal, numUnit);
      const baseTarget = convertToBase(targetVal, targetUnit);

      if (!baseNum || !baseTarget) {
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "does_not_meet",
          reason_code: ReasonCode.UNIT_MISMATCH,
          message: `Unrecognized unit in comparison (${numUnit} vs ${targetUnit})`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }

      if (baseNum.quantity !== baseTarget.quantity) {
        return createRuleResult({
          rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
          rule_version: PILOT_RULE_VERSION,
          scope: "product",
          verdict: "does_not_meet",
          reason_code: ReasonCode.UNIT_MISMATCH,
          message: `Incompatible physical quantities in ${operator}: ${baseNum.quantity} (${numUnit}) vs ${baseTarget.quantity} (${targetUnit})`,
          required,
          subjects: [snapshot.sku, prop],
          evidence_refs: evidenceRefs,
        });
      }

      finalNum = baseNum.value;
      finalTarget = baseTarget.value;
    }

    const passes = operator === "gte" ? finalNum >= finalTarget - 1e-9 : finalNum <= finalTarget + 1e-9;
    return createRuleResult({
      rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
      rule_version: PILOT_RULE_VERSION,
      scope: "product",
      verdict: passes ? "meets" : "does_not_meet",
      reason_code: passes ? ReasonCode.SATISFIED : ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: passes
        ? `Numeric ${operator} satisfied: ${numVal} ${numUnit || ""} vs ${targetVal} ${targetUnit || ""}`
        : `Numeric ${operator} failed: ${numVal} ${numUnit || ""} vs ${targetVal} ${targetUnit || ""}`,
      required,
      subjects: [snapshot.sku, prop],
      evidence_refs: evidenceRefs,
    });
  }

  // Fallback for unknown operator
  return createRuleResult({
    rule_id: req.requirement_id || `REQ_${prop.toUpperCase()}`,
    rule_version: PILOT_RULE_VERSION,
    scope: "product",
    verdict: "not_documented",
    reason_code: ReasonCode.RULE_NOT_IMPLEMENTED,
    message: `Unsupported evaluation operator '${req.operator}'`,
    required,
    subjects: [snapshot.sku, prop],
    evidence_refs: evidenceRefs,
  });
}

/**
 * Pure product evaluator function per Megaplan §13.1
 * Evaluates a TechnicalSnapshot against an array of TechnicalRequirements.
 */
export function evaluateProduct(
  snapshot: TechnicalSnapshot,
  requirements: TechnicalRequirement[],
  context?: ProductEvaluationContext,
  ruleSetVersion: string = RULE_SET_VERSION
): ProductEvaluationResult {
  const evaluatedAt = context?.evaluated_at || new Date().toISOString();

  if (!requirements || requirements.length === 0) {
    return {
      target_id: snapshot.snapshot_id,
      sku: snapshot.sku,
      variant_id: snapshot.variant_id,
      snapshot_id: snapshot.snapshot_id,
      overall_verdict: "not_documented",
      overall_status: "not_documented",
      overall_satisfied: false,
      reason_code: ReasonCode.NO_REQUIREMENTS,
      rules_version: PILOT_RULE_VERSION,
      rule_set_version: ruleSetVersion,
      evaluations: [],
      validation_scope: [],
      unverified_scopes: [],
      evaluated_at: evaluatedAt,
    };
  }

  const evaluations: RuleResult[] = [];
  for (const req of requirements) {
    const res = evaluateRequirementAgainstSnapshot(snapshot, req);
    evaluations.push(createRuleResult(res));
  }

  const aggregation = aggregateVerdicts(evaluations);
  const overallVerdict = aggregation.overall_verdict;
  const overallSatisfied = overallVerdict === "meets";

  let principalReasonCode: string | undefined;
  if (requirements.every((r) => r.required === false)) {
    principalReasonCode = ReasonCode.NO_REQUIREMENTS;
  } else if (overallVerdict === "does_not_meet") {
    principalReasonCode = evaluations.find((e) => e.verdict === "does_not_meet")?.reason_code;
  } else if (overallVerdict === "not_documented") {
    principalReasonCode = evaluations.find((e) => e.verdict === "not_documented")?.reason_code;
  } else {
    principalReasonCode = ReasonCode.SATISFIED;
  }

  return {
    target_id: snapshot.snapshot_id,
    sku: snapshot.sku,
    variant_id: snapshot.variant_id,
    snapshot_id: snapshot.snapshot_id,
    overall_verdict: overallVerdict,
    overall_status: overallVerdict,
    overall_satisfied: overallSatisfied,
    reason_code: principalReasonCode,
    rules_version: PILOT_RULE_VERSION,
    rule_set_version: ruleSetVersion,
    evaluations,
    validation_scope: aggregation.validation_scope,
    unverified_scopes: aggregation.unverified_scopes,
    evaluated_at: evaluatedAt,
  };
}

/**
 * Pure system evaluator function per Megaplan §13.1
 * Evaluates an entire engineering solution graph (instances, connections, networks, loops).
 */
export function evaluateSystem(
  configurationRevision: ConfigurationRevision | any,
  snapshotsById: Record<string, TechnicalSnapshot>,
  ruleSetVersion: string = RULE_SET_VERSION,
  systemRequirements?: TechnicalRequirement[]
): SystemEvaluationResult {
  const evaluatedAt = new Date().toISOString();
  const graph = configurationRevision.graph_json || {};

  const instances: Instance[] = graph.instances || [];
  const connections: Connection[] = graph.connections || [];
  const networks: Network[] = graph.networks || [];
  const controlLoops: ControlLoop[] = graph.control_loops || [];
  const processObjects: ProcessObject[] = graph.process_objects || [];
  const variables: Variable[] = graph.variables || [];

  // Build unified snapshot map indexed by both snapshot_id and instance_id
  const resolvedSnapshots: Record<string, TechnicalSnapshot> = { ...snapshotsById };
  for (const inst of instances) {
    const snap = snapshotsById[inst.snapshot_id] || snapshotsById[inst.instance_id];
    if (snap) {
      resolvedSnapshots[inst.instance_id] = snap;
      resolvedSnapshots[inst.snapshot_id] = snap;
    }
  }

  const evaluations: RuleResult[] = [];

  // 1. Evaluate Instances & Identity
  for (const inst of instances) {
    const snapshot = resolvedSnapshots[inst.instance_id] || resolvedSnapshots[inst.snapshot_id];
    if (!snapshot) {
      evaluations.push(
        createRuleResult({
          rule_id: "IDENTITY_VARIANT",
          rule_version: PILOT_RULE_VERSION,
          scope: "identity",
          verdict: "not_documented",
          reason_code: ReasonCode.ABSENT_PROPERTY,
          message: `Technical snapshot '${inst.snapshot_id}' for instance '${inst.instance_id}' not found in provided catalog snapshots`,
          required: true,
          subjects: [inst.instance_id, inst.snapshot_id],
          evidence_refs: [],
          missing_fields: ["snapshot"],
        })
      );
      continue;
    }

    evaluations.push(
      createRuleResult(
        evaluateIdentityVariant(snapshot, {
          requirement_id: `ID_${inst.instance_id}`,
          target: "instance",
          property: "identity",
          operator: "equals",
          value: snapshot.variant_id,
          required: true,
        })
      )
    );
  }

  // 2. Evaluate Connections & Channel Matching
  const matchingResult = assignConnectionsDeterministically(connections, resolvedSnapshots);
  evaluations.push(...matchingResult.rule_results.map((r) => createRuleResult(r)));

  for (const conn of connections) {
    const fromSnap = resolvedSnapshots[conn.from_instance_id] || Object.values(resolvedSnapshots).find((s) => s.ports.some((p) => p.port_id === conn.from_port_id));
    const toSnap = resolvedSnapshots[conn.to_instance_id] || Object.values(resolvedSnapshots).find((s) => s.ports.some((p) => p.port_id === conn.to_port_id));

    const fromPort = fromSnap?.ports.find((p) => p.port_id === conn.from_port_id);
    const toPort = toSnap?.ports.find((p) => p.port_id === conn.to_port_id);

    if (!fromPort || !toPort) {
      evaluations.push(
        createRuleResult({
          rule_id: "SIGNAL_COMPATIBILITY",
          rule_version: PILOT_RULE_VERSION,
          scope: "connection",
          verdict: "not_documented",
          reason_code: ReasonCode.ABSENT_PROPERTY,
          message: `Port not found for connection ${conn.connection_id}: from_port=${conn.from_port_id}, to_port=${conn.to_port_id}`,
          required: true,
          subjects: [conn.connection_id],
          evidence_refs: [],
        })
      );
      continue;
    }

    // Directionality check
    evaluations.push(createRuleResult(evaluatePortDirection(fromPort, toPort, conn.connection_id, true)));

    // Signal compatibility check
    evaluations.push(createRuleResult(evaluateSignalCompatibility(fromPort, toPort, conn.connection_id, true)));

    // RTD Wiring check if applicable
    if (fromPort.signal_type?.includes("rtd") || toPort.signal_type?.includes("rtd")) {
      const sensorSnap = fromPort.signal_type?.includes("rtd") ? fromSnap! : toSnap!;
      const controllerP = fromPort.signal_type?.includes("rtd") ? toPort : fromPort;
      evaluations.push(createRuleResult(evaluateRtdWiring(sensorSnap, controllerP, 3, true)));
    }
  }

  // 3. Evaluate Modbus / Fieldbus Networks
  for (const network of networks) {
    const netResults = evaluateModbusNetwork(network, resolvedSnapshots);
    evaluations.push(...netResults.map((r) => createRuleResult(r)));
  }

  // 4. Evaluate Control Loops & Actuator Power Interface
  for (const loop of controlLoops) {
    evaluations.push(
      createRuleResult(
        evaluateControlLoopCompleteness(
          loop,
          instances,
          variables,
          processObjects,
          connections,
          true
        )
      )
    );

    // OUTPUT_ACTUATOR_INTERFACE check:
    // Controller logic output directly connected to 2kW heater without power interface fails!
    const controllerInst = instances.find((i) => i.instance_id === loop.controller_instance_id);
    const controllerSnap = controllerInst ? resolvedSnapshots[controllerInst.instance_id] || resolvedSnapshots[controllerInst.snapshot_id] : undefined;

    if (controllerSnap) {
      const actuatorInst = loop.actuator_instance_id
        ? instances.find((i) => i.instance_id === loop.actuator_instance_id)
        : undefined;
      const actuatorSnap = actuatorInst ? resolvedSnapshots[actuatorInst.instance_id] || resolvedSnapshots[actuatorInst.snapshot_id] : undefined;
      const procObj = loop.process_object_id
        ? processObjects.find((p) => p.id === loop.process_object_id)
        : undefined;

      const actuatorTarget = actuatorSnap || procObj || { label: "Heater Actuator" };

      // Look for intermediate power interface instance (SSR, contactor)
      const hasPowerInterface = instances.some(
        (inst) =>
          inst.user_label?.toLowerCase().includes("ssr") ||
          inst.user_label?.toLowerCase().includes("contactor") ||
          inst.variant_id?.toLowerCase().includes("ssr") ||
          inst.snapshot_id?.toLowerCase().includes("ssr")
      ) || Boolean(loop.parameters?.has_intermediate_power_interface);

      // Find controller output port connected to actuator/process
      const ctrlConn = connections.find(
        (c) =>
          c.from_instance_id === loop.controller_instance_id ||
          c.to_instance_id === loop.controller_instance_id
      );
      const outPortId = ctrlConn
        ? ctrlConn.from_instance_id === loop.controller_instance_id
          ? ctrlConn.from_port_id
          : ctrlConn.to_port_id
        : undefined;
      const outPort = controllerSnap.ports.find((p) => p.port_id === outPortId || p.direction === "output");

      evaluations.push(
        createRuleResult(
          evaluateOutputActuatorInterface(
            controllerSnap,
            actuatorTarget,
            hasPowerInterface,
            outPort,
            true
          )
        )
      );
    }
  }

  // 5. Evaluate System-level Requirements if provided
  const rawReqs = systemRequirements || (configurationRevision as any).requirements_json;
  const sysReqs: TechnicalRequirement[] = Array.isArray(rawReqs)
    ? rawReqs
    : rawReqs && typeof rawReqs === "object"
    ? Object.values(rawReqs)
    : [];

  if (sysReqs.length > 0) {
    for (const req of sysReqs) {
      const propNorm = req.property.toLowerCase();

      // Check system-level compatibility requirements
      if (propNorm.includes("bus_parameters") || propNorm === "bus_parameters_compatibility") {
        const netRule = evaluations.find((e) => e.rule_id === "BUS_PARAMETERS");
        if (netRule) {
          evaluations.push(
            createRuleResult({
              rule_id: req.requirement_id || "BUS_PARAMETERS_SYS",
              rule_version: PILOT_RULE_VERSION,
              scope: "network",
              verdict: netRule.verdict,
              reason_code: netRule.reason_code,
              message: netRule.message,
              required: req.required !== false,
              subjects: [req.property],
              evidence_refs: netRule.evidence_refs,
            })
          );
          continue;
        }
      }

      if (propNorm.includes("address_uniqueness")) {
        const addrRule = evaluations.find((e) => e.rule_id === "ADDRESS_UNIQUENESS");
        if (addrRule) {
          evaluations.push(
            createRuleResult({
              rule_id: req.requirement_id || "ADDRESS_UNIQUENESS_SYS",
              rule_version: PILOT_RULE_VERSION,
              scope: "network",
              verdict: addrRule.verdict,
              reason_code: addrRule.reason_code,
              message: addrRule.message,
              required: req.required !== false,
              subjects: [req.property],
              evidence_refs: addrRule.evidence_refs,
            })
          );
          continue;
        }
      }

      if (propNorm.includes("output_actuator_interface")) {
        const actRule = evaluations.find((e) => e.rule_id === "OUTPUT_ACTUATOR_INTERFACE");
        if (actRule) {
          evaluations.push(
            createRuleResult({
              ...actRule,
              rule_id: req.requirement_id || "OUTPUT_ACTUATOR_INTERFACE_SYS",
            })
          );
          continue;
        }

        let foundConnEvaluation = false;
        for (const conn of connections) {
          const fromInst = instances.find((i) => i.instance_id === conn.from_instance_id);
          const toInst = instances.find((i) => i.instance_id === conn.to_instance_id);
          const fromSnap = fromInst ? resolvedSnapshots[fromInst.instance_id] || resolvedSnapshots[fromInst.snapshot_id] : undefined;
          const toSnap = toInst ? resolvedSnapshots[toInst.instance_id] || resolvedSnapshots[toInst.snapshot_id] : undefined;

          if (fromSnap && toSnap) {
            const outPort = fromSnap.ports.find((p) => p.port_id === conn.from_port_id);
            const actResult = evaluateOutputActuatorInterface(
              fromSnap,
              toSnap,
              true,
              outPort,
              req.required !== false
            );
            evaluations.push(
              createRuleResult({
                ...actResult,
                rule_id: req.requirement_id || "OUTPUT_ACTUATOR_INTERFACE",
              })
            );
            foundConnEvaluation = true;
            break;
          }
        }
        if (foundConnEvaluation) continue;
      }

      const targetInst = instances.find((i) => i.instance_id === req.target);
      if (targetInst && resolvedSnapshots[targetInst.snapshot_id]) {
        evaluations.push(
          createRuleResult(
            evaluateRequirementAgainstSnapshot(resolvedSnapshots[targetInst.snapshot_id], req)
          )
        );
      } else {
        evaluations.push(
          createRuleResult({
            rule_id: req.requirement_id || "GLOBAL_SYS_REQ",
            rule_version: PILOT_RULE_VERSION,
            scope: "system",
            verdict: "not_documented",
            reason_code: ReasonCode.RULE_NOT_IMPLEMENTED,
            message: `System requirement ${req.property} cannot be mapped to a single target`,
            required: req.required !== false,
            subjects: [req.property],
            evidence_refs: [],
          })
        );
      }
    }
  }

  const aggregation = aggregateVerdicts(evaluations);
  const overallVerdict = aggregation.overall_verdict;
  const overallSatisfied = overallVerdict === "meets";

  let principalReasonCode: string | undefined;
  if (overallVerdict === "does_not_meet") {
    principalReasonCode = evaluations.find((e) => e.verdict === "does_not_meet")?.reason_code;
  } else if (overallVerdict === "not_documented") {
    principalReasonCode = evaluations.find((e) => e.verdict === "not_documented")?.reason_code;
  } else {
    principalReasonCode = ReasonCode.SATISFIED;
  }

  return {
    configuration_id: configurationRevision.configuration_id,
    config_revision: configurationRevision.revision,
    overall_verdict: overallVerdict,
    overall_status: overallVerdict,
    overall_satisfied: overallSatisfied,
    reason_code: principalReasonCode,
    rules_version: PILOT_RULE_VERSION,
    rule_set_version: ruleSetVersion,
    evaluations,
    validation_scope: aggregation.validation_scope,
    unverified_scopes: aggregation.unverified_scopes,
    evaluated_at: evaluatedAt,
  };
}
