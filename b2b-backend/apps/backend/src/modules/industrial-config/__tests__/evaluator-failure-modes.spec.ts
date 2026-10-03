/**
 * Evaluator Known Failure Modes & Regressions Test Suite
 *
 * Governing Document: MEGAPLAN_MUSE_API_3D_V2.md (§13 & §31)
 *
 * This test suite reproduces the historical failure modes and false positives
 * identified in legacy and naive evaluators, asserting strict tri-state behavior:
 *
 * 1. Missing property + not_equals: must NEVER meet (not_documented, satisfied: false) (T02)
 * 2. Inverse range coverage: capacity [4, 20] mA vs requirement [0, 25] mA must be does_not_meet (T04)
 * 3. Unit mismatch: 20 mA vs 20 A must be does_not_meet (T07)
 * 4. Unit conversion: 0.02 A vs 20 mA in same dimension must meet (T07)
 * 5. Supply nature: 24 VAC supply vs 24 VDC requirement must be does_not_meet (T08)
 * 6. Missing protocol: RS-485 physical interface without documented Modbus protocol -> not_documented (T15)
 * 7. Family option inheritance without variant proof -> not_documented (T09)
 * 8. Empty requirements array [] -> not_documented with reason code NO_REQUIREMENTS (T22)
 * 9. Incomplete range bounds (no max) -> not_documented (T06)
 * 10. Contradictory evidence sources -> not_documented with reason code EVIDENCE_CONFLICT (T10)
 */

import { evaluateProduct, REASON_CODES, EvaluatorRequirement } from "../evaluator"
import {
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
} from "../data/g4-catalog-snapshots"
import { TechnicalSnapshot } from "../schemas/snapshot.schema"

describe("Evaluator Known Failure Modes (Megaplan §13 & §31)", () => {
  // 1. Missing property + not_equals operator (T02)
  describe("1. Missing property + not_equals operator (Megaplan §13.4 & T02)", () => {
    it("never returns meets when property is absent on variant/snapshot; returns not_documented", () => {
      // Create snapshot with no communication_protocols attribute or port
      const snapshotWithoutProtocols: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_mock_no_comm",
        attributes: TZONE_THT02_SNAPSHOT.attributes.filter(
          (a) => a.property !== "communication_protocols"
        ),
        ports: TZONE_THT02_SNAPSHOT.ports.filter((p) => p.category !== "serial_comm"),
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_not_equals_modbus",
        property: "communication_protocols",
        operator: "not_equals",
        value: "modbus_tcp",
        required: true,
      }

      const result = evaluateProduct(snapshotWithoutProtocols, [req])

      // Historical failure mode: naive evaluators returned true/meets because undefined !== "modbus_tcp"
      // Strict rule: absence of fact does NOT prove inequality
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
      expect(result.evaluations[0].satisfied).toBe(false)
      expect(result.overall_status).not.toBe("meets")
    })
  })

  // 2. Inverse range coverage (T04)
  describe("2. Inverse range coverage (Megaplan §13.5 & T04)", () => {
    it("returns does_not_meet when capacity is [4, 20] mA and requirement asks for [0, 25] mA", () => {
      // Mock snapshot with strictly documented [4, 20] mA analog input capacity
      const snapshot4to20: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_mock_4_20ma",
        attributes: [
          {
            attribute_id: "attr_ai_range",
            property: "analog_input_range",
            scope: "equipment",
            value: { kind: "range", min: 4, max: 20, unit: "mA", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_range_0_25",
        property: "analog_input_range",
        operator: "covers_range",
        value: { kind: "range", min: 0, max: 25, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshot4to20, [req])

      // Historical bug in legacy evaluator (evaluator.ts:751):
      // if (factCoversReq || reqCoversFact) -> reqCoversFact was true for [0, 25] covering [4, 20]!
      // Strict rule: capacity must cover the requirement, never the inverse!
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("does_not_meet")
      expect(result.evaluations[0].satisfied).toBe(false)
      expect(result.overall_status).not.toBe("meets")
    })
  })

  // 3. Unit mismatch (T07)
  describe("3. Unit mismatch (Megaplan §13.5 & T07)", () => {
    it("returns does_not_meet when comparing 20 mA capacity against 20 A requirement", () => {
      const snapshotMA: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_mock_ma",
        attributes: [
          {
            attribute_id: "attr_curr_ma",
            property: "current_rating",
            scope: "equipment",
            value: { kind: "quantity", value: 20, unit: "mA", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_curr_a",
        property: "current_rating",
        operator: "gte",
        value: { kind: "quantity", value: 20, unit: "A", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshotMA, [req])

      // Numeric value 20 is equal, but 20 mA is 0.02 A, far below 20 A
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("does_not_meet")
      expect(result.evaluations[0].satisfied).toBe(false)
    })
  })

  // 4. Unit conversion in same dimension (T07)
  describe("4. Unit conversion in same dimension (Megaplan §13.5 & T07)", () => {
    it("returns meets when comparing 0.02 A capacity with 20 mA requirement in electric current dimension", () => {
      const snapshotAmperes: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_mock_amp",
        attributes: [
          {
            attribute_id: "attr_out_curr",
            property: "analog_output_range",
            scope: "port",
            value: { kind: "range", min: 0, max: 0.02, unit: "A", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_out_ma",
        property: "analog_output_range",
        operator: "covers_range",
        value: { kind: "range", min: 4, max: 20, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshotAmperes, [req])

      // 0.02 A = 20 mA; 0 A = 0 mA; [0, 20] mA covers [4, 20] mA
      expect(result.overall_status).toBe("meets")
      expect(result.overall_satisfied).toBe(true)
      expect(result.evaluations[0].status).toBe("meets")
      expect(result.evaluations[0].satisfied).toBe(true)
    })
  })

  // 5. Supply nature: 24 VAC supply vs 24 VDC requirement (T08)
  describe("5. Supply nature: 24 VAC supply vs 24 VDC requirement (Megaplan §13.5 & T08)", () => {
    it("returns does_not_meet when voltage magnitude matches but electrical nature (ac vs dc) differs", () => {
      const snapshotAC: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_mock_ac",
        attributes: [
          {
            attribute_id: "attr_supp_vac",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "quantity", value: 24, unit: "V", nature: "ac" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_supp_vdc",
        property: "supply_voltage",
        operator: "equals",
        value: { kind: "quantity", value: 24, unit: "V", nature: "dc" },
        required: true,
      }

      const result = evaluateProduct(snapshotAC, [req])

      // 24 VAC and 24 VDC are incompatible electrical natures
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("does_not_meet")
      expect(result.evaluations[0].satisfied).toBe(false)
    })
  })

  // 6. Missing protocol on physical interface (T15)
  describe("6. Missing protocol on physical interface (Megaplan §12.2, §13.6 & T15)", () => {
    it("returns not_documented when RS-485 physical interface exists without documented Modbus protocol", () => {
      // Device has physical RS-485 port, but protocol is unstated
      const snapshotGenericRS485: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_mock_rs485_generic",
        capabilities: ["temperature_sensing"], // no modbus mentioned
        attributes: [
          {
            attribute_id: "attr_phys_comm",
            property: "physical_interface",
            scope: "port",
            value: { kind: "enum", value: "rs485" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
        ports: [
          {
            port_id: "p_serial",
            label: "RS-485 Port",
            category: "serial_comm",
            direction: "bidirectional",
            signal_type: "rs485",
            terminals: [{ label: "A+" }, { label: "B-" }],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_modbus_rtu",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotGenericRS485, [req])

      // Physical RS-485 does NOT prove application-layer Modbus RTU
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
      expect(result.evaluations[0].reason_code).toMatch(/PROTOCOL_ROLE|NOT_DOCUMENTED/i)
    })
  })

  // 7. Family option inheritance without variant proof (T09)
  describe("7. Family option inheritance without variant proof (Megaplan §13.4 & T09)", () => {
    it("returns not_documented when option is present in family/series documentation but absent on this variant", () => {
      // Novus N1200 base variant does NOT have RS-485 expansion option installed
      const snapshotBaseVariant: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_mock_novus_base",
        attributes: NOVUS_N1200_SNAPSHOT.attributes.filter(
          (a) => a.property !== "communication_protocols"
        ),
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_rs485_comm",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotBaseVariant, [req])

      // Option from sibling or catalog family cannot be assumed without variant proof
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
    })
  })

  // 8. Empty requirements array [] (T22)
  describe("8. Empty requirements array [] (Megaplan §13.2 & T22)", () => {
    it("returns not_documented with reason code NO_REQUIREMENTS and overall_satisfied: false", () => {
      const result = evaluateProduct(HORNER_X5_SNAPSHOT, [])

      // An empty requirement array does not demonstrate compliance
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.reason_code).toBe(REASON_CODES.NO_REQUIREMENTS)
      expect(result.evaluations).toHaveLength(0)
    })
  })

  // 9. Incomplete range bounds (no max) (T06)
  describe("9. Incomplete range bounds (Megaplan §13.5 & T06)", () => {
    it("returns not_documented when range requirement lacks max bound", () => {
      const reqWithMissingMax: EvaluatorRequirement = {
        requirement_id: "req_incomplete_range",
        property: "analog_input_range",
        operator: "covers_range",
        value: { kind: "range", min: 0, unit: "mA" }, // missing max
        required: true,
      }

      const result = evaluateProduct(HORNER_X5_SNAPSHOT, [reqWithMissingMax])

      // Missing min/max bound cannot fallback to true
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
    })
  })

  // 10. Contradictory evidence sources (T10)
  describe("10. Contradictory evidence sources (Megaplan §13.4 & T10)", () => {
    it("returns not_documented with reason code EVIDENCE_CONFLICT when two sources contradict each other", () => {
      // Snapshot with contradictory supply voltage facts from two sources with equal priority
      const snapshotWithConflict: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_mock_conflict",
        attributes: [
          {
            attribute_id: "attr_supp_v1",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "range", min: 10, max: 30, unit: "V", nature: "dc" },
            data_status: "documented",
            evidence_refs: [
              {
                source_id: "SRC_DATASHEET_A",
                page: 1,
                excerpt: "Power: 10-30 VDC",
              },
            ],
          },
          {
            attribute_id: "attr_supp_v2",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "quantity", value: 120, unit: "V", nature: "ac" },
            data_status: "documented",
            evidence_refs: [
              {
                source_id: "SRC_MANUAL_B",
                page: 5,
                excerpt: "Power: 120 VAC",
              },
            ],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_supply",
        property: "supply_voltage",
        operator: "covers_range",
        value: { kind: "range", min: 12, max: 24, unit: "V", nature: "dc" },
        required: true,
      }

      const result = evaluateProduct(snapshotWithConflict, [req])

      // Evaluator must NOT arbitrarily pick the DC fact to approve; it must return EVIDENCE_CONFLICT
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      const hasConflictCode =
        result.reason_code === REASON_CODES.EVIDENCE_CONFLICT ||
        result.evaluations.some((e) => e.reason_code === REASON_CODES.EVIDENCE_CONFLICT)
      expect(hasConflictCode).toBe(true)
    })
  })
})
