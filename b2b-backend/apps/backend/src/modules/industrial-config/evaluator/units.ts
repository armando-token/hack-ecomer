/**
 * Deterministic Unit Conversion and Range Coverage Engine
 * Per Megaplan §8.2, §13.5
 */

import { ReasonCode, Verdict } from "./types";

export type PhysicalQuantity =
  | "current"
  | "voltage"
  | "temperature"
  | "resistance"
  | "frequency"
  | "length"
  | "pressure"
  | "power"
  | "time"
  | "dimensionless";

export interface UnitDefinition {
  canonicalSymbol: string;
  quantity: PhysicalQuantity;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
  baseUnit: string;
}

const EPSILON = 1e-9;

/**
 * Closed conversion table for canonical industrial units
 */
const UNIT_TABLE: Record<string, UnitDefinition> = {
  // Current: Base unit A
  a: {
    canonicalSymbol: "A",
    quantity: "current",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "A",
  },
  ma: {
    canonicalSymbol: "mA",
    quantity: "current",
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000.0,
    baseUnit: "A",
  },

  // Voltage: Base unit V
  v: {
    canonicalSymbol: "V",
    quantity: "voltage",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "V",
  },
  mv: {
    canonicalSymbol: "mV",
    quantity: "voltage",
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000.0,
    baseUnit: "V",
  },
  kv: {
    canonicalSymbol: "kV",
    quantity: "voltage",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "V",
  },

  // Temperature: Base unit °C (Cel)
  "°c": {
    canonicalSymbol: "°C",
    quantity: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "°C",
  },
  c: {
    canonicalSymbol: "°C",
    quantity: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "°C",
  },
  cel: {
    canonicalSymbol: "°C",
    quantity: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "°C",
  },
  degc: {
    canonicalSymbol: "°C",
    quantity: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "°C",
  },
  celsius: {
    canonicalSymbol: "°C",
    quantity: "temperature",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "°C",
  },
  k: {
    canonicalSymbol: "K",
    quantity: "temperature",
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
    baseUnit: "°C",
  },
  kelvin: {
    canonicalSymbol: "K",
    quantity: "temperature",
    toBase: (v) => v - 273.15,
    fromBase: (v) => v + 273.15,
    baseUnit: "°C",
  },
  "°f": {
    canonicalSymbol: "°F",
    quantity: "temperature",
    toBase: (v) => (v - 32.0) * (5.0 / 9.0),
    fromBase: (v) => (v * 9.0) / 5.0 + 32.0,
    baseUnit: "°C",
  },
  f: {
    canonicalSymbol: "°F",
    quantity: "temperature",
    toBase: (v) => (v - 32.0) * (5.0 / 9.0),
    fromBase: (v) => (v * 9.0) / 5.0 + 32.0,
    baseUnit: "°C",
  },
  degf: {
    canonicalSymbol: "°F",
    quantity: "temperature",
    toBase: (v) => (v - 32.0) * (5.0 / 9.0),
    fromBase: (v) => (v * 9.0) / 5.0 + 32.0,
    baseUnit: "°C",
  },
  fahrenheit: {
    canonicalSymbol: "°F",
    quantity: "temperature",
    toBase: (v) => (v - 32.0) * (5.0 / 9.0),
    fromBase: (v) => (v * 9.0) / 5.0 + 32.0,
    baseUnit: "°C",
  },

  // Resistance: Base unit ohm
  ohm: {
    canonicalSymbol: "ohm",
    quantity: "resistance",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "ohm",
  },
  ohms: {
    canonicalSymbol: "ohm",
    quantity: "resistance",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "ohm",
  },
  "ω": {
    canonicalSymbol: "ohm",
    quantity: "resistance",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "ohm",
  },
  kohm: {
    canonicalSymbol: "kohm",
    quantity: "resistance",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "ohm",
  },
  "kω": {
    canonicalSymbol: "kohm",
    quantity: "resistance",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "ohm",
  },
  mohm: {
    canonicalSymbol: "Mohm",
    quantity: "resistance",
    toBase: (v) => v * 1000000.0,
    fromBase: (v) => v * 0.000001,
    baseUnit: "ohm",
  },
  "mω": {
    canonicalSymbol: "Mohm",
    quantity: "resistance",
    toBase: (v) => v * 1000000.0,
    fromBase: (v) => v * 0.000001,
    baseUnit: "ohm",
  },

  // Frequency: Base unit Hz
  hz: {
    canonicalSymbol: "Hz",
    quantity: "frequency",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "Hz",
  },
  khz: {
    canonicalSymbol: "kHz",
    quantity: "frequency",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "Hz",
  },

  // Length: Base unit m
  m: {
    canonicalSymbol: "m",
    quantity: "length",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "m",
  },
  mm: {
    canonicalSymbol: "mm",
    quantity: "length",
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000.0,
    baseUnit: "m",
  },

  // Pressure: Base unit Pa
  pa: {
    canonicalSymbol: "Pa",
    quantity: "pressure",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "Pa",
  },
  kpa: {
    canonicalSymbol: "kPa",
    quantity: "pressure",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "Pa",
  },
  bar: {
    canonicalSymbol: "bar",
    quantity: "pressure",
    toBase: (v) => v * 100000.0,
    fromBase: (v) => v * 0.00001,
    baseUnit: "Pa",
  },
  mbar: {
    canonicalSymbol: "mbar",
    quantity: "pressure",
    toBase: (v) => v * 100.0,
    fromBase: (v) => v * 0.01,
    baseUnit: "Pa",
  },

  // Power: Base unit W
  w: {
    canonicalSymbol: "W",
    quantity: "power",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "W",
  },
  kw: {
    canonicalSymbol: "kW",
    quantity: "power",
    toBase: (v) => v * 1000.0,
    fromBase: (v) => v * 0.001,
    baseUnit: "W",
  },

  // Time: Base unit s
  s: {
    canonicalSymbol: "s",
    quantity: "time",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "s",
  },
  ms: {
    canonicalSymbol: "ms",
    quantity: "time",
    toBase: (v) => v * 0.001,
    fromBase: (v) => v * 1000.0,
    baseUnit: "s",
  },

  // Dimensionless / Percentage
  "%rh": {
    canonicalSymbol: "%RH",
    quantity: "dimensionless",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "%RH",
  },
  "%": {
    canonicalSymbol: "%",
    quantity: "dimensionless",
    toBase: (v) => v,
    fromBase: (v) => v,
    baseUnit: "%",
  },
};

/**
 * Normalizes unit key for lookup
 */
export function normalizeUnitString(unit?: string | null): string {
  if (!unit || typeof unit !== "string") return "";
  return unit
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, "")
    .replace(/["']/g, "");
}

/**
 * Extracts electrical voltage nature from unit or explicit nature property
 */
export function extractVoltageNature(
  nature?: string | null,
  unit?: string | null
): "ac" | "dc" | "ac_dc" | undefined {
  if (nature) {
    const norm = nature.trim().toLowerCase();
    if (norm === "ac/dc" || norm === "ac_dc" || norm === "universal") return "ac_dc";
    if (norm === "ac") return "ac";
    if (norm === "dc") return "dc";
  }

  if (unit) {
    const norm = unit.trim().toLowerCase();
    if (norm.includes("ac/dc") || norm.includes("ac_dc") || norm.includes("vac/dc")) return "ac_dc";
    if (norm.includes("vdc") || norm.includes("v dc") || norm.includes("v_dc")) return "dc";
    if (norm.includes("vac") || norm.includes("v ac") || norm.includes("v_ac")) return "ac";
  }

  return undefined;
}

/**
 * Checks compatibility between two electrical voltage natures
 */
export function areVoltageNaturesCompatible(
  natureReq?: "ac" | "dc" | "ac_dc",
  natureCap?: "ac" | "dc" | "ac_dc"
): boolean {
  if (!natureReq || !natureCap) return true;
  if (natureReq === natureCap) return true;
  if (natureCap === "ac_dc") return true;
  if (natureReq === "ac_dc") return true;
  return false;
}

/**
 * Resolves a unit string to its canonical definition
 */
export function resolveUnit(unitStr?: string | null): UnitDefinition | null {
  if (!unitStr) return null;
  const key = normalizeUnitString(unitStr);
  // Handle compound electrical symbols like VDC -> V, VAC -> V
  if (key === "vdc" || key === "vac" || key === "vac/dc" || key === "vdc/ac") {
    return UNIT_TABLE["v"];
  }
  return UNIT_TABLE[key] || null;
}

/**
 * Converts a numeric value with unit to its canonical base value
 */
export function convertToBase(
  value: number,
  unitStr: string
): { value: number; baseUnit: string; quantity: PhysicalQuantity } | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const def = resolveUnit(unitStr);
  if (!def) return null;
  return {
    value: def.toBase(value),
    baseUnit: def.baseUnit,
    quantity: def.quantity,
  };
}

export interface RangeSpecification {
  min?: number;
  max?: number;
  unit?: string;
  nature?: "ac" | "dc" | "ac_dc" | string;
  inclusive_min?: boolean;
  inclusive_max?: boolean;
}

export interface RangeCoverageResult {
  verdict: Verdict;
  reason_code: ReasonCode;
  message: string;
  converted_req?: { min: number; max: number; base_unit: string; nature?: string };
  converted_capacity?: { min: number; max: number; base_unit: string; nature?: string };
}

/**
 * Evaluates strict range coverage per Megaplan §13.5
 * Condition A only:
 *   capacity.min <= requirement.min AND capacity.max >= requirement.max
 * NEVER admits inverse condition B.
 */
export function checkRangeCoverage(
  requirement: RangeSpecification,
  capacity: RangeSpecification
): RangeCoverageResult {
  // 1. Incomplete bounds check
  if (
    requirement.min === undefined ||
    requirement.max === undefined ||
    requirement.unit === undefined ||
    capacity.min === undefined ||
    capacity.max === undefined ||
    capacity.unit === undefined ||
    !Number.isFinite(requirement.min) ||
    !Number.isFinite(requirement.max) ||
    !Number.isFinite(capacity.min) ||
    !Number.isFinite(capacity.max)
  ) {
    return {
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: "Range bounds or units are incomplete or missing",
    };
  }

  // 2. Inverted bounds validation
  if (requirement.min > requirement.max) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: `Inverted requirement range: min (${requirement.min}) > max (${requirement.max})`,
    };
  }
  if (capacity.min > capacity.max) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: `Inverted capacity range: min (${capacity.min}) > max (${capacity.max})`,
    };
  }

  // 3. Electrical nature check
  const reqNature = extractVoltageNature(requirement.nature, requirement.unit);
  const capNature = extractVoltageNature(capacity.nature, capacity.unit);

  if (reqNature && capNature && !areVoltageNaturesCompatible(reqNature, capNature)) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.NATURE_MISMATCH,
      message: `Voltage nature mismatch: requirement requires ${reqNature} but capacity provides ${capNature}`,
    };
  }

  if (reqNature && !capNature) {
    // Nature was required by the caller but capacity does not document nature
    return {
      verdict: "not_documented",
      reason_code: ReasonCode.ABSENT_PROPERTY,
      message: `Requirement specifies electrical nature '${reqNature}' which is not documented on capacity`,
    };
  }

  // 4. Convert both ranges to base units
  const reqMinBase = convertToBase(requirement.min, requirement.unit);
  const reqMaxBase = convertToBase(requirement.max, requirement.unit);
  const capMinBase = convertToBase(capacity.min, capacity.unit);
  const capMaxBase = convertToBase(capacity.max, capacity.unit);

  if (!reqMinBase || !reqMaxBase || !capMinBase || !capMaxBase) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.UNIT_MISMATCH,
      message: `Unrecognized engineering unit in requirement (${requirement.unit}) or capacity (${capacity.unit})`,
    };
  }

  if (reqMinBase.quantity !== capMinBase.quantity) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.UNIT_MISMATCH,
      message: `Incompatible physical quantities: requirement is ${reqMinBase.quantity} (${requirement.unit}) while capacity is ${capMinBase.quantity} (${capacity.unit})`,
    };
  }

  const convertedReq = {
    min: reqMinBase.value,
    max: reqMaxBase.value,
    base_unit: reqMinBase.baseUnit,
    nature: reqNature,
  };
  const convertedCap = {
    min: capMinBase.value,
    max: capMaxBase.value,
    base_unit: capMinBase.baseUnit,
    nature: capNature,
  };

  // 5. Strict range coverage check (Condition A only)
  // capacity.min <= req.min AND capacity.max >= req.max
  const coversMin = convertedCap.min <= convertedReq.min + EPSILON;
  const coversMax = convertedCap.max >= convertedReq.max - EPSILON;

  if (!coversMin || !coversMax) {
    const reasons: string[] = [];
    if (!coversMin) {
      reasons.push(
        `capacity min (${capacity.min} ${capacity.unit} -> ${convertedCap.min.toFixed(4)} ${convertedCap.base_unit}) > requirement min (${requirement.min} ${requirement.unit} -> ${convertedReq.min.toFixed(4)} ${convertedReq.base_unit})`
      );
    }
    if (!coversMax) {
      reasons.push(
        `capacity max (${capacity.max} ${capacity.unit} -> ${convertedCap.max.toFixed(4)} ${convertedCap.base_unit}) < requirement max (${requirement.max} ${requirement.unit} -> ${convertedReq.max.toFixed(4)} ${convertedReq.base_unit})`
      );
    }
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: `Range capacity [${capacity.min}..${capacity.max} ${capacity.unit}] does not cover required range [${requirement.min}..${requirement.max} ${requirement.unit}]. (${reasons.join(", ")})`,
      converted_req: convertedReq,
      converted_capacity: convertedCap,
    };
  }

  // 6. Boundary inclusivity check
  const reqIncMin = requirement.inclusive_min !== false;
  const reqIncMax = requirement.inclusive_max !== false;
  const capIncMin = capacity.inclusive_min !== false;
  const capIncMax = capacity.inclusive_max !== false;

  if (Math.abs(convertedCap.min - convertedReq.min) < EPSILON && reqIncMin && !capIncMin) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: "Capacity does not inclusively cover required lower bound",
      converted_req: convertedReq,
      converted_capacity: convertedCap,
    };
  }
  if (Math.abs(convertedCap.max - convertedReq.max) < EPSILON && reqIncMax && !capIncMax) {
    return {
      verdict: "does_not_meet",
      reason_code: ReasonCode.RANGE_OUT_OF_BOUNDS,
      message: "Capacity does not inclusively cover required upper bound",
      converted_req: convertedReq,
      converted_capacity: convertedCap,
    };
  }

  return {
    verdict: "meets",
    reason_code: ReasonCode.SATISFIED,
    message: `Capacity [${capacity.min}..${capacity.max} ${capacity.unit}] strictly covers required range [${requirement.min}..${requirement.max} ${requirement.unit}]`,
    converted_req: convertedReq,
    converted_capacity: convertedCap,
  };
}
