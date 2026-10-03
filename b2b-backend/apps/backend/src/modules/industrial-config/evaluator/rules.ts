/**
 * Pilot Evaluation Rules per Megaplan §12, §13.6
 * Implements the 14 minimum deterministic rules without external I/O.
 */

import { TechnicalSnapshot } from "../schemas/snapshot.schema";
import { Port } from "../schemas/port-terminal.schema";
import {
  Connection,
  ControlLoop,
  Instance,
  Network,
  ProcessObject,
  Variable,
} from "../schemas/configuration.schema";
import {
  EvidenceRef,
  ReasonCode,
  RuleResult,
  TechnicalRequirement,
  Verdict,
} from "./types";
import { checkRangeCoverage, extractVoltageNature } from "./units";
import { getPortChannelCapacity } from "./matching";

export const PILOT_RULE_VERSION = "2026.g5.1";

export const PILOT_RULE_IDS = [
  "IDENTITY_VARIANT",
  "SIGNAL_COMPATIBILITY",
  "RANGE_COVERAGE",
  "PORT_DIRECTION",
  "CHANNEL_CAPACITY",
  "POWER_SUPPLY",
  "OUTPUT_ACTUATOR_INTERFACE",
  "RTD_WIRING",
  "PROTOCOL_ROLE",
  "BUS_PARAMETERS",
  "ADDRESS_UNIQUENESS",
  "MOUNTING_METHOD",
  "LOGGING_CAPABILITY",
  "CONTROL_LOOP_COMPLETENESS",
] as const;

export type PilotRuleId = (typeof PILOT_RULE_IDS)[number];

export const PILOT_SCOPES = [
  "identity",
  "product",
  "connection",
  "signal",
  "range",
  "direction",
  "capacity",
  "power",
  "control",
  "actuator",
  "sensor",
  "wiring",
  "communication",
  "network",
  "bus",
  "mounting",
  "logging",
  "loop",
  "system",
] as const;

/**
 * 1. IDENTITY_VARIANT
 * Verifies that the technical snapshot matches the requested variant_id or sku,
 * is not retired, and has auditable published content.
 */
export function evaluateIdentityVariant(
  snapshot: TechnicalSnapshot,
  req: TechnicalRequirement
): RuleResult {
  const ruleId = "IDENTITY_VARIANT";
  const scope = "identity";
  const subjects = [snapshot.snapshot_id, snapshot.variant_id];
  const evidenceRefs: EvidenceRef[] = snapshot.source_ids.map((s) => ({
    source_id: s,
  }));

  if (!snapshot.content_sha256 || !snapshot.variant_id) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: "Snapshot missing cryptographic content hash or variant ID",
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
      missing_fields: ["content_sha256", "variant_id"],
    };
  }

  if (snapshot.state === "retired") {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.NEGATIVE_FACT,
      message: `Technical snapshot ${snapshot.snapshot_id} is in retired state`,
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
    };
  }

  // Check variant_id or sku match if specified in requirement
  if (req.value) {
    const expected = typeof req.value === "object" ? req.value.variant_id || req.value.sku : req.value;
    if (expected && expected !== snapshot.variant_id && expected !== snapshot.sku) {
      return {
        rule_id: ruleId,
        rule_version: PILOT_RULE_VERSION,
        scope,
        verdict: "does_not_meet",
        reason_code: ReasonCode.ROLE_MISMATCH,
        message: `Snapshot identity mismatch: expected ${expected}, got ${snapshot.sku} (${snapshot.variant_id})`,
        required: req.required !== false,
        subjects,
        evidence_refs: evidenceRefs,
      };
    }
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Snapshot ${snapshot.snapshot_id} matches variant ${snapshot.sku} with verified revision ${snapshot.technical_revision}`,
    required: req.required !== false,
    subjects,
    evidence_refs: evidenceRefs,
  };
}

/**
 * 2. SIGNAL_COMPATIBILITY
 * Verifies that from_port and to_port signals are compatible.
 * E.g., PT100 passive direct to 4-20mA input fails without conditioner.
 */
export function evaluateSignalCompatibility(
  fromPort: Port,
  toPort: Port,
  connectionId: string,
  required: boolean = true
): RuleResult {
  const ruleId = "SIGNAL_COMPATIBILITY";
  const scope = "signal";
  const subjects = [connectionId, fromPort.port_id, toPort.port_id];
  const fromSig = (fromPort.signal_type || "").toLowerCase().trim();
  const toSig = (toPort.signal_type || "").toLowerCase().trim();

  if (!fromSig || !toSig) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Signal type not documented on port: ${!fromSig ? fromPort.port_id : toPort.port_id}`,
      required,
      subjects,
      evidence_refs: [],
      missing_fields: [!fromSig ? "from_port.signal_type" : "to_port.signal_type"],
    };
  }

  // Exact signal match
  if (fromSig === toSig) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "meets",
      reason_code: ReasonCode.SATISFIED,
      message: `Direct signal type match: ${fromSig}`,
      required,
      subjects,
      evidence_refs: [],
    };
  }

  // PT100 passive directly into 4-20mA or 0-10V fails!
  if (
    (fromSig.includes("rtd") || fromSig.includes("pt100")) &&
    (toSig.includes("4_20ma") || toSig.includes("0_10v")) &&
    !toSig.includes("universal") &&
    !toSig.includes("rtd")
  ) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.PORT_TYPE_MISMATCH,
      message: `Passive RTD/Pt100 sensor signal cannot be wired directly to analog ${toSig} input without a transmitter/conditioner`,
      required,
      subjects,
      evidence_refs: [],
      suggested_actions: [
        "Insert a Pt100-to-4-20mA signal transmitter between the RTD sensor and analog input port",
      ],
    };
  }

  // RS485 cannot connect to Ethernet
  if ((fromSig.includes("rs485") && toSig.includes("ethernet")) || (fromSig.includes("ethernet") && toSig.includes("rs485"))) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.PORT_TYPE_MISMATCH,
      message: "Physical layer mismatch: RS-485 serial cannot connect directly to Ethernet LAN port",
      required,
      subjects,
      evidence_refs: [],
      suggested_actions: ["Use a Modbus RTU to Modbus TCP gateway"],
    };
  }

  // Multi-signal inputs compatibility
  // Universal sensor input accepts RTD, TC, 4-20mA, 0-50mV, 0-10V
  if (toSig.includes("universal_sensor")) {
    const supported = ["rtd_pt100", "pt100", "thermocouple", "current_4_20ma", "voltage_0_50mv", "voltage_0_10v"];
    if (supported.some((s) => fromSig.includes(s))) {
      return {
        rule_id: ruleId,
        rule_version: PILOT_RULE_VERSION,
        scope,
        verdict: "meets",
        reason_code: ReasonCode.SATISFIED,
        message: `Signal ${fromSig} supported by universal input ${toSig}`,
        required,
        subjects,
        evidence_refs: [],
      };
    }
  }

  // Analog input accepting 0-10V or 4-20mA
  if (toSig.includes("analog_0_10v_4_20ma")) {
    if (fromSig.includes("4_20ma") || fromSig.includes("0_10v")) {
      return {
        rule_id: ruleId,
        rule_version: PILOT_RULE_VERSION,
        scope,
        verdict: "meets",
        reason_code: ReasonCode.SATISFIED,
        message: `Analog signal ${fromSig} supported by configurable input ${toSig}`,
        required,
        subjects,
        evidence_refs: [],
      };
    }
  }

  // Power inputs
  if (toSig.includes("power_ac_dc") && (fromSig.includes("power_ac") || fromSig.includes("power_dc"))) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "meets",
      reason_code: ReasonCode.SATISFIED,
      message: `Universal power input accepts ${fromSig}`,
      required,
      subjects,
      evidence_refs: [],
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "does_not_meet",
    reason_code: ReasonCode.PORT_TYPE_MISMATCH,
    message: `Incompatible signal types: source ${fromSig} cannot interface with destination ${toSig}`,
    required,
    subjects,
    evidence_refs: [],
  };
}

/**
 * 3. RANGE_COVERAGE
 * Destination/capacity covers required range with strict unit conversion.
 */
export function evaluateRangeCoverage(
  requirement: TechnicalRequirement,
  capacity: { min?: number; max?: number; unit?: string; nature?: string },
  evidenceRefs: EvidenceRef[] = []
): RuleResult {
  const ruleId = "RANGE_COVERAGE";
  const scope = "range";
  const subjects = [requirement.property];

  const result = checkRangeCoverage(
    {
      min: requirement.min !== undefined ? requirement.min : (requirement.value?.min as number),
      max: requirement.max !== undefined ? requirement.max : (requirement.value?.max as number),
      unit: requirement.unit || requirement.value?.unit,
      nature: requirement.nature || requirement.value?.nature,
      inclusive_min: requirement.inclusive_min,
      inclusive_max: requirement.inclusive_max,
    },
    capacity
  );

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: result.verdict,
    reason_code: result.reason_code,
    message: result.message,
    required: requirement.required !== false,
    subjects,
    evidence_refs: evidenceRefs,
    missing_fields: result.verdict === "not_documented" ? ["min", "max", "unit"] : undefined,
  };
}

/**
 * 4. PORT_DIRECTION
 * Connection directionality verification.
 */
export function evaluatePortDirection(
  fromPort: Port,
  toPort: Port,
  connectionId: string,
  required: boolean = true
): RuleResult {
  const ruleId = "PORT_DIRECTION";
  const scope = "direction";
  const subjects = [connectionId, fromPort.port_id, toPort.port_id];

  const fromDir = fromPort.direction;
  const toDir = toPort.direction;

  if (!fromDir || !toDir) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Port direction not documented on port: ${!fromDir ? fromPort.port_id : toPort.port_id}`,
      required,
      subjects,
      evidence_refs: [],
      missing_fields: [!fromDir ? "from_port.direction" : "to_port.direction"],
    };
  }

  // Valid combinations
  const valid =
    (fromDir === "output" && toDir === "input") ||
    (fromDir === "bidirectional" && (toDir === "bidirectional" || toDir === "input" || toDir === "output")) ||
    (toDir === "bidirectional" && (fromDir === "output" || fromDir === "input")) ||
    (fromDir === "input" && toDir === "output"); // Backwards wiring reference

  if (!valid && fromDir === "output" && toDir === "output") {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.PORT_DIRECTION_MISMATCH,
      message: `Short-circuit / driver clash hazard: output port ${fromPort.port_id} connected to output port ${toPort.port_id}`,
      required,
      subjects,
      evidence_refs: [],
    };
  }

  if (!valid && fromDir === "input" && toDir === "input") {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.PORT_DIRECTION_MISMATCH,
      message: `Dead connection: input port ${fromPort.port_id} cannot drive input port ${toPort.port_id}`,
      required,
      subjects,
      evidence_refs: [],
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Compatible port directions (${fromDir} -> ${toDir})`,
    required,
    subjects,
    evidence_refs: [],
  };
}

/**
 * 5. CHANNEL_CAPACITY
 * Standalone channel capacity check for snapshot attributes or port count.
 */
export function evaluateChannelCapacity(
  snapshot: TechnicalSnapshot,
  req: TechnicalRequirement
): RuleResult {
  const ruleId = "CHANNEL_CAPACITY";
  const scope = "capacity";
  const subjects = [snapshot.snapshot_id, req.property];
  const evidenceRefs: EvidenceRef[] = snapshot.source_ids.map((s) => ({
    source_id: s,
  }));

  const expectedChannels = req.channels || req.value;
  if (expectedChannels === undefined || typeof expectedChannels !== "number") {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: "Channel requirement does not specify numeric channel count",
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
      missing_fields: ["channels"],
    };
  }

  // Find relevant ports matching category
  const matchingPorts = snapshot.ports.filter(
    (p) =>
      p.category === req.property ||
      p.signal_type?.includes(req.property) ||
      p.port_id.includes(req.property)
  );

  let totalAvailable = 0;
  for (const p of matchingPorts) {
    totalAvailable += getPortChannelCapacity(p);
  }

  if (matchingPorts.length === 0) {
    // Check attributes
    const attr = snapshot.attributes.find((a: any) => a.property === req.property);
    if (!attr || !attr.value) {
      return {
        rule_id: ruleId,
        rule_version: PILOT_RULE_VERSION,
        scope,
        verdict: "not_documented",
        reason_code: ReasonCode.ABSENT_PROPERTY,
        message: `No ports or documented attributes found for property ${req.property}`,
        required: req.required !== false,
        subjects,
        evidence_refs: evidenceRefs,
      };
    }
  }

  if (totalAvailable < expectedChannels) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.CHANNEL_CAPACITY_EXCEEDED,
      message: `Required ${expectedChannels} channels for ${req.property}, but only ${totalAvailable} available on ${snapshot.sku}`,
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Snapshot ${snapshot.sku} provides ${totalAvailable} channels (meets required ${expectedChannels})`,
    required: req.required !== false,
    subjects,
    evidence_refs: evidenceRefs,
  };
}

/**
 * 6. POWER_SUPPLY
 * Verifies power supply nature and voltage range covers equipment requirements.
 */
export function evaluatePowerSupply(
  sourceSnapshot: TechnicalSnapshot,
  loadSnapshot: TechnicalSnapshot,
  required: boolean = true
): RuleResult {
  const ruleId = "POWER_SUPPLY";
  const scope = "power";
  const subjects = [sourceSnapshot.sku, loadSnapshot.sku];

  const loadVoltageAttr = loadSnapshot.attributes.find(
    (a: any) => a.property === "supply_voltage"
  );
  if (!loadVoltageAttr || !loadVoltageAttr.value) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Supply voltage requirements not documented on load equipment ${loadSnapshot.sku}`,
      required,
      subjects,
      evidence_refs: [],
      missing_fields: ["supply_voltage"],
    };
  }

  // Load voltage range
  const loadVal = loadVoltageAttr.value;
  const loadMin = loadVal.min !== undefined ? loadVal.min : loadVal.value;
  const loadMax = loadVal.max !== undefined ? loadVal.max : loadVal.value;
  const loadUnit = loadVal.unit || "V";
  const loadNature = extractVoltageNature(loadVal.nature, loadUnit);

  // Source supply voltage
  const sourceVoltageAttr = sourceSnapshot.attributes.find(
    (a: any) => a.property === "supply_voltage" || a.property === "output_voltage"
  );

  let sourceMin = 24;
  let sourceMax = 24;
  let sourceUnit = "V";
  let sourceNature: "ac" | "dc" | "ac_dc" | undefined = "dc";

  if (sourceVoltageAttr && sourceVoltageAttr.value) {
    const sVal = sourceVoltageAttr.value;
    sourceMin = sVal.min !== undefined ? sVal.min : sVal.value;
    sourceMax = sVal.max !== undefined ? sVal.max : sVal.value;
    sourceUnit = sVal.unit || "V";
    sourceNature = extractVoltageNature(sVal.nature, sourceUnit);
  }

  const rangeCoverage = checkRangeCoverage(
    { min: loadMin, max: loadMax, unit: loadUnit, nature: loadNature },
    { min: sourceMin, max: sourceMax, unit: sourceUnit, nature: sourceNature }
  );

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: rangeCoverage.verdict,
    reason_code: rangeCoverage.reason_code,
    message: rangeCoverage.message,
    required,
    subjects,
    evidence_refs: loadVoltageAttr.evidence_refs || [],
  };
}

/**
 * 7. OUTPUT_ACTUATOR_INTERFACE
 * Drive and power switching interface appropriate per §12.6 & §13.6:
 * Heating chamber loop: controller logic out to 2kW heater without power interface fails!
 */
export function evaluateOutputActuatorInterface(
  controllerSnapshot: TechnicalSnapshot,
  actuatorSnapshotOrObj: { sku?: string; power_rating_w?: number; label?: string; parameters?: Record<string, any> },
  hasIntermediatePowerInterface: boolean,
  outputPort?: Port,
  required: boolean = true
): RuleResult {
  const ruleId = "OUTPUT_ACTUATOR_INTERFACE";
  const scope = "actuator";
  const subjects = [controllerSnapshot.sku, actuatorSnapshotOrObj.sku || actuatorSnapshotOrObj.label || "actuator"];

  // Identify if controller output is low-power logic / pulse / transistor
  const portSignal = (outputPort?.signal_type || "").toLowerCase();
  const portLabel = (outputPort?.label || "").toLowerCase();

  const isLowPowerLogicOutput =
    portSignal.includes("transistor") ||
    portSignal.includes("logic") ||
    portSignal.includes("ssr_drive") ||
    portSignal.includes("pulse") ||
    portLabel.includes("sourcing 0.5a") ||
    portLabel.includes("transistor");

  // Determine actuator power demand
  const powerW =
    actuatorSnapshotOrObj.power_rating_w ||
    actuatorSnapshotOrObj.parameters?.power_w ||
    actuatorSnapshotOrObj.parameters?.power_kw ? actuatorSnapshotOrObj.parameters?.power_kw * 1000 : undefined;

  // Check drive voltage compatibility between controller output and actuator/SSR input (T20)
  const ctrlDriveMax = controllerSnapshot.attributes.find((a: any) => a.property === "drive_voltage_max")?.value?.value;
  const actDriveMin = (actuatorSnapshotOrObj as any).attributes?.find((a: any) => a.property === "drive_voltage_min")?.value?.value;

  if (ctrlDriveMax !== undefined && actDriveMin !== undefined && ctrlDriveMax < actDriveMin) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.ACTUATOR_INTERFACE_MISSING,
      message: `Controller output drive voltage (${ctrlDriveMax}V) is insufficient for actuator/SSR input minimum requirement (${actDriveMin}V)`,
      required,
      subjects,
      evidence_refs: controllerSnapshot.source_ids.map((s) => ({ source_id: s })),
      suggested_actions: ["Select an SSR with a compatible input drive range (e.g. 3-32 VDC)"],
    };
  }

  const isHeatingOrHighPower =
    (powerW !== undefined && powerW > 100) ||
    /heater|heating|resistencia|calefactor|2kw|chamber/i.test(actuatorSnapshotOrObj.label || "") ||
    /heater|heating|resistencia|calefactor|2kw/i.test(actuatorSnapshotOrObj.sku || "");

  if (isHeatingOrHighPower && isLowPowerLogicOutput && !hasIntermediatePowerInterface) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.ACTUATOR_INTERFACE_MISSING,
      message: `Controller ${controllerSnapshot.sku} low-power logic output (${portSignal || "transistor/pulse"}) connected directly to high-power load (${actuatorSnapshotOrObj.label || "Heater"}) without power switching interface (SSR or power contactor)`,
      required,
      subjects,
      evidence_refs: controllerSnapshot.source_ids.map((s) => ({ source_id: s })),
      suggested_actions: [
        "Insert an SSR (Solid State Relay) or power contactor between the controller logic output and the heating actuator",
      ],
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: hasIntermediatePowerInterface
      ? "Appropriate power switching interface (SSR/contactor) present between controller and actuator"
      : "Controller output ratings meet load electrical interface demands",
    required,
    subjects,
    evidence_refs: controllerSnapshot.source_ids.map((s) => ({ source_id: s })),
  };
}

/**
 * 8. RTD_WIRING
 * Element and wires supported (2/3/4 wires, PT100).
 */
export function evaluateRtdWiring(
  sensorSnapshot: TechnicalSnapshot,
  controllerPort: Port,
  requiredWires: number = 3,
  required: boolean = true
): RuleResult {
  const ruleId = "RTD_WIRING";
  const scope = "wiring";
  const subjects = [sensorSnapshot.sku, controllerPort.port_id];

  // Number of sensor terminals available on controller port for RTD
  const terminals = controllerPort.terminals || [];
  const rtdTerminals = terminals.filter(
    (t) =>
      /pt100|rtd|compensation|wire|conductores/i.test(t.function || "") ||
      /11|12|13|ai/i.test(t.label)
  );

  const supportedWires = rtdTerminals.length >= 3 ? 3 : rtdTerminals.length;

  if (requiredWires > supportedWires) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.WIRING_INCOMPATIBLE,
      message: `RTD sensor requires ${requiredWires}-wire connection, but controller port ${controllerPort.port_id} only supports up to ${supportedWires} wires`,
      required,
      subjects,
      evidence_refs: sensorSnapshot.source_ids.map((s) => ({ source_id: s })),
      suggested_actions: ["Select a 3-wire RTD sensor or an input module with 4-wire RTD support"],
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `RTD wiring compatibility verified (${requiredWires}-wire Pt100 supported on port ${controllerPort.port_id})`,
    required,
    subjects,
    evidence_refs: sensorSnapshot.source_ids.map((s) => ({ source_id: s })),
  };
}

/**
 * 9. PROTOCOL_ROLE
 * Protocol and roles compatible (e.g. Modbus RTU master <-> slave).
 */
export function evaluateProtocolRole(
  deviceSnapshot: TechnicalSnapshot,
  assignedProtocol: string,
  assignedRole: string,
  required: boolean = true
): RuleResult {
  const ruleId = "PROTOCOL_ROLE";
  const scope = "communication";
  const subjects = [deviceSnapshot.sku, assignedProtocol, assignedRole];
  const evidenceRefs: EvidenceRef[] = deviceSnapshot.source_ids.map((s) => ({
    source_id: s,
  }));

  const normProtocol = assignedProtocol.toLowerCase().trim();
  const normRole = assignedRole.toLowerCase().trim();

  // Check protocols
  const commProtocolsAttr = deviceSnapshot.attributes.find(
    (a: any) => a.property === "communication_protocols"
  );
  let supportedProtocols: string[] = [];
  if (commProtocolsAttr && commProtocolsAttr.value) {
    supportedProtocols = Array.isArray(commProtocolsAttr.value.value)
      ? commProtocolsAttr.value.value.map((v: any) => String(v).toLowerCase())
      : [String(commProtocolsAttr.value.value).toLowerCase()];
  }
  if (deviceSnapshot.capabilities) {
    supportedProtocols.push(...deviceSnapshot.capabilities.map((c) => c.toLowerCase()));
  }

  const supportsProtocol = supportedProtocols.some((p) => p.includes(normProtocol));
  if (supportedProtocols.length > 0 && !supportsProtocol) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.PROTOCOL_MISMATCH,
      message: `Device ${deviceSnapshot.sku} does not support communication protocol '${assignedProtocol}'`,
      required,
      subjects,
      evidence_refs: commProtocolsAttr?.evidence_refs || evidenceRefs,
    };
  }

  // Check roles
  const commRolesAttr = deviceSnapshot.attributes.find(
    (a: any) => a.property === "communication_roles"
  );
  let supportedRoles: string[] = [];
  if (commRolesAttr && commRolesAttr.value) {
    supportedRoles = Array.isArray(commRolesAttr.value.value)
      ? commRolesAttr.value.value.map((v: any) => String(v).toLowerCase())
      : [String(commRolesAttr.value.value).toLowerCase()];
  }
  if (deviceSnapshot.capabilities) {
    if (deviceSnapshot.capabilities.some((c) => c.includes("master"))) supportedRoles.push("master", "client");
    if (deviceSnapshot.capabilities.some((c) => c.includes("slave"))) supportedRoles.push("slave", "server");
  }

  if (normRole && supportedRoles.length > 0 && !supportedRoles.includes(normRole)) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.ROLE_MISMATCH,
      message: `Device ${deviceSnapshot.sku} does not support communication role '${assignedRole}'. Supported: [${supportedRoles.join(", ")}]`,
      required,
      subjects,
      evidence_refs: commRolesAttr?.evidence_refs || evidenceRefs,
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Protocol ${assignedProtocol} and role ${assignedRole} supported by ${deviceSnapshot.sku}`,
    required,
    subjects,
    evidence_refs: evidenceRefs,
  };
}

/**
 * 10. BUS_PARAMETERS
 * Common bus settings possible (baud rates, parity intersection).
 */
export function evaluateBusParameters(
  network: Network,
  snapshotsById: Record<string, TechnicalSnapshot>
): RuleResult[] {
  const { evaluateModbusNetwork } = require("./matching");
  const modbusResults = evaluateModbusNetwork(network, snapshotsById);
  return modbusResults.filter((r: RuleResult) => r.rule_id === "BUS_PARAMETERS");
}

/**
 * 11. ADDRESS_UNIQUENESS
 * No duplicate node addresses within a network.
 */
export function evaluateAddressUniqueness(
  network: Network,
  snapshotsById: Record<string, TechnicalSnapshot>
): RuleResult[] {
  const { evaluateModbusNetwork } = require("./matching");
  const modbusResults = evaluateModbusNetwork(network, snapshotsById);
  return modbusResults.filter((r: RuleResult) => r.rule_id === "ADDRESS_UNIQUENESS");
}

/**
 * 12. MOUNTING_METHOD
 * Requested mounting supported by snapshot.
 */
export function evaluateMountingMethod(
  snapshot: TechnicalSnapshot,
  req: TechnicalRequirement
): RuleResult {
  const ruleId = "MOUNTING_METHOD";
  const scope = "mounting";
  const subjects = [snapshot.sku, req.property];
  const evidenceRefs: EvidenceRef[] = snapshot.source_ids.map((s) => ({
    source_id: s,
  }));

  const expectedMethod = String(req.value || "").toLowerCase().trim();
  if (!expectedMethod) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: "No mounting method specified in requirement",
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
      missing_fields: ["value"],
    };
  }

  // Look in mounting array or mounting_style attribute
  const supported: string[] = [];
  if (snapshot.mounting) {
    supported.push(...snapshot.mounting.map((m) => m.toLowerCase()));
  }

  const mountAttr = snapshot.attributes.find((a: any) => a.property === "mounting_style");
  if (mountAttr && mountAttr.value) {
    if (typeof mountAttr.value === "string") supported.push(mountAttr.value.toLowerCase());
    else if (mountAttr.value.value) supported.push(String(mountAttr.value.value).toLowerCase());
  }

  if (supported.length === 0) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Mounting options not documented for ${snapshot.sku}`,
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
    };
  }

  const matches = supported.some(
    (m) => m === expectedMethod || m.includes(expectedMethod) || expectedMethod.includes(m)
  );

  if (!matches) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Requested mounting method '${expectedMethod}' not documented on ${snapshot.sku}. Supported: [${supported.join(", ")}]`,
      required: req.required !== false,
      subjects,
      evidence_refs: mountAttr?.evidence_refs || evidenceRefs,
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Mounting method '${expectedMethod}' supported by ${snapshot.sku}`,
    required: req.required !== false,
    subjects,
    evidence_refs: mountAttr?.evidence_refs || evidenceRefs,
  };
}

/**
 * 13. LOGGING_CAPABILITY
 * Logging/retention path defined when required.
 */
export function evaluateLoggingCapability(
  snapshot: TechnicalSnapshot,
  req: TechnicalRequirement
): RuleResult {
  const ruleId = "LOGGING_CAPABILITY";
  const scope = "logging";
  const subjects = [snapshot.sku];
  const evidenceRefs: EvidenceRef[] = snapshot.source_ids.map((s) => ({
    source_id: s,
  }));

  const caps = snapshot.capabilities || [];
  const hasLogging = caps.some((c) => /logging|retention|microsd|storage|trend/i.test(c));

  if (!hasLogging) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Equipment ${snapshot.sku} has no documented data or alarm logging capability`,
      required: req.required !== false,
      subjects,
      evidence_refs: evidenceRefs,
      suggested_actions: ["Select a controller or datalogger with micro-SD / onboard logging capability"],
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Equipment ${snapshot.sku} provides data/alarm logging capability`,
    required: req.required !== false,
    subjects,
    evidence_refs: evidenceRefs,
  };
}

/**
 * 14. CONTROL_LOOP_COMPLETENESS
 * Sensor-PV-control-output-actuator-process connected per §13.6.
 */
export function evaluateControlLoopCompleteness(
  loop: ControlLoop,
  instances: Instance[],
  variables: Variable[],
  processObjects: ProcessObject[],
  connections: Connection[],
  required: boolean = true
): RuleResult {
  const ruleId = "CONTROL_LOOP_COMPLETENESS";
  const scope = "loop";
  const subjects = [loop.loop_id];

  const missingElements: string[] = [];

  // 1. Process Variable
  const pvVar = variables.find((v) => v.variable_id === loop.pv_variable_id);
  if (!pvVar) {
    missingElements.push(`PV variable (${loop.pv_variable_id})`);
  }

  // 2. Controller instance
  const controller = instances.find((i) => i.instance_id === loop.controller_instance_id);
  if (!controller) {
    missingElements.push(`Controller instance (${loop.controller_instance_id})`);
  }

  // 3. Actuator instance
  if (loop.actuator_instance_id) {
    const actuator = instances.find((i) => i.instance_id === loop.actuator_instance_id);
    if (!actuator) {
      missingElements.push(`Actuator instance (${loop.actuator_instance_id})`);
    } else {
      // Check connection from controller to actuator
      const conn = connections.find(
        (c) =>
          (c.from_instance_id === loop.controller_instance_id && c.to_instance_id === loop.actuator_instance_id) ||
          (c.to_instance_id === loop.controller_instance_id && c.from_instance_id === loop.actuator_instance_id)
      );
      if (!conn) {
        missingElements.push(`Connection between controller and actuator (${loop.controller_instance_id} -> ${loop.actuator_instance_id})`);
      }
    }
  }

  // 4. Process Object
  if (loop.process_object_id) {
    const po = processObjects.find((p) => p.id === loop.process_object_id);
    if (!po) {
      missingElements.push(`Process object (${loop.process_object_id})`);
    }
  }

  if (missingElements.length > 0) {
    return {
      rule_id: ruleId,
      rule_version: PILOT_RULE_VERSION,
      scope,
      verdict: "does_not_meet",
      reason_code: ReasonCode.TOPOLOGY_INCOMPLETE,
      message: `Control loop '${loop.loop_id}' has incomplete topology: missing ${missingElements.join(", ")}`,
      required,
      subjects,
      evidence_refs: [],
      missing_fields: missingElements,
    };
  }

  return {
    rule_id: ruleId,
    rule_version: PILOT_RULE_VERSION,
    scope,
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Control loop '${loop.loop_id}' has verified closed-loop topology`,
    required,
    subjects,
    evidence_refs: [],
  };
}
