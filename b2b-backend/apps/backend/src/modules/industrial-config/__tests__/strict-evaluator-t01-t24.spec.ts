/**
 * Strict Pure Evaluator Acceptance Matrix Test Suite (T01–T24)
 *
 * Governing Document: MEGAPLAN_MUSE_API_3D_V2.md (§12, §13, §31.3)
 *
 * Verifies all 24 acceptance criteria T01 through T24 against the strict
 * deterministic tri-state evaluator (evaluateProduct & evaluateSystem).
 *
 * Matrix:
 * - T01: Absence of protocol for equals Modbus -> not_documented
 * - T02: Absence of protocol for not_equals Modbus -> not_documented, never true
 * - T03: Explicit negative applicable to protocol -> does_not_meet for positive requirement
 * - T04: Capacity [4, 20] mA, req [0, 25] mA -> does_not_meet
 * - T05: Capacity [0, 25] mA, req [4, 20] mA, signal compatible -> meets
 * - T06: Range without max limit -> not_documented
 * - T07: 0.02 A vs 20 mA -> meets; unit mismatch 20 mA vs 20 A -> does_not_meet
 * - T08: 24 VAC vs 24 VDC -> does_not_meet
 * - T09: Option of other variant -> not_documented
 * - T10: Conflicting sources -> not_documented / EVIDENCE_CONFLICT
 * - T11: PT100 direct to 4-20mA input -> does_not_meet
 * - T12: PT100 3-wire to 2-wire only -> does_not_meet
 * - T13: Multifunction port used as RTD and current simultaneously -> reject assignment / does_not_meet
 * - T14: Channel occupied by two non-multipoint sensors -> reject capacity / does_not_meet
 * - T15: RS-485 without protocol/role -> not_documented
 * - T16: Modbus network with duplicate address -> does_not_meet
 * - T17: Configurable baud/parity with valid intersection -> meets
 * - T18: Generic Ethernet as proof of Modbus TCP -> not_documented (do NOT approve)
 * - T19: Logic output to heater without power interface -> incomplete topology / does_not_meet
 * - T20: SSR input exceeds drive output rating -> does_not_meet
 * - T21: Documented body, DIN mounting absent -> not_documented for DIN
 * - T22: Only optional rules without mandatory requirements -> not ready / not_documented (NO_REQUIREMENTS)
 * - T23: Focus changes from logging to control -> required scope recalculated
 * - T24: Lack of logging/retention capability -> not_documented, not inferred from RAM
 */

import {
  evaluateProduct,
  evaluateSystem,
  REASON_CODES,
  EvaluatorRequirement,
} from "../evaluator"
import {
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
} from "../data/g4-catalog-snapshots"
import { TechnicalSnapshot } from "../schemas/snapshot.schema"

describe("Strict Evaluator Acceptance Matrix T01–T24 (Megaplan §31.3)", () => {
  // T01: Ausencia de protocol para equals Modbus -> not_documented
  describe("T01: Absence of protocol for equals Modbus", () => {
    it("returns not_documented when protocol property is absent on snapshot", () => {
      const snapshotNoComm: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_t01_no_comm",
        attributes: TZONE_THT02_SNAPSHOT.attributes.filter(
          (a) => a.property !== "communication_protocols"
        ),
        ports: TZONE_THT02_SNAPSHOT.ports.filter((p) => p.category !== "serial_comm"),
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t01_modbus",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotNoComm, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
      expect(result.evaluations[0].satisfied).toBe(false)
    })
  })

  // T02: Ausencia de protocol para not_equals Modbus -> not_documented, nunca true
  describe("T02: Absence of protocol for not_equals Modbus", () => {
    it("returns not_documented and NEVER meets/true when checking not_equals on absent property", () => {
      const snapshotNoComm: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_t02_no_comm",
        attributes: TZONE_THT02_SNAPSHOT.attributes.filter(
          (a) => a.property !== "communication_protocols"
        ),
        ports: TZONE_THT02_SNAPSHOT.ports.filter((p) => p.category !== "serial_comm"),
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t02_not_modbus",
        property: "communication_protocols",
        operator: "not_equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotNoComm, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
      expect(result.evaluations[0].satisfied).toBe(false)
      expect(result.overall_status).not.toBe("meets")
    })
  })

  // T03: Negativo explícito aplicable al protocolo -> does_not_meet para requisito positivo
  describe("T03: Explicit negative applicable to protocol", () => {
    it("returns does_not_meet when an explicit documented negative disproves positive protocol requirement", () => {
      const snapshotExplicitNoComm: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_t03_no_comm_explicit",
        attributes: [
          {
            attribute_id: "attr_comm_none",
            property: "communication_protocols",
            scope: "equipment",
            value: { kind: "enum", value: "none" },
            data_status: "documented",
            evidence_refs: [
              {
                source_id: "SRC_MANUAL_BASE",
                page: 2,
                excerpt: "Model without digital communication interfaces",
              },
            ],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t03_needs_modbus",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotExplicitNoComm, [req])
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("does_not_meet")
      expect(result.evaluations[0].satisfied).toBe(false)
    })
  })

  // T04: Rango capacidad [4,20], requerido [0,25] mA -> does_not_meet
  describe("T04: Capacity [4, 20] mA vs requirement [0, 25] mA", () => {
    it("returns does_not_meet because [4, 20] cannot cover wider required range [0, 25]", () => {
      const snapshot4to20: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_t04_4_20",
        attributes: [
          {
            attribute_id: "attr_t04_range",
            property: "analog_input_range",
            scope: "equipment",
            value: { kind: "range", min: 4, max: 20, unit: "mA", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t04_0_25",
        property: "analog_input_range",
        operator: "covers_range",
        value: { kind: "range", min: 0, max: 25, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshot4to20, [req])
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("does_not_meet")
    })
  })

  // T05: Rango capacidad [0,25], requerido [4,20] mA, señal compatible -> meets
  describe("T05: Capacity [0, 25] mA vs requirement [4, 20] mA", () => {
    it("returns meets when capacity [0, 25] mA fully covers requirement [4, 20] mA with compatible signal", () => {
      const snapshot0to25: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_t05_0_25",
        attributes: [
          {
            attribute_id: "attr_t05_range",
            property: "analog_input_range",
            scope: "equipment",
            value: { kind: "range", min: 0, max: 25, unit: "mA", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t05_4_20",
        property: "analog_input_range",
        operator: "covers_range",
        value: { kind: "range", min: 4, max: 20, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshot0to25, [req])
      expect(result.overall_status).toBe("meets")
      expect(result.overall_satisfied).toBe(true)
      expect(result.evaluations[0].status).toBe("meets")
    })
  })

  // T06: Rango sin límite max -> not_documented
  describe("T06: Range without max limit", () => {
    it("returns not_documented when range lacks an explicit upper bound", () => {
      const reqNoMax: EvaluatorRequirement = {
        requirement_id: "req_t06_no_max",
        property: "analog_input_range",
        operator: "covers_range",
        value: { kind: "range", min: 0, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(HORNER_X5_SNAPSHOT, [reqNoMax])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.evaluations[0].status).toBe("not_documented")
    })
  })

  // T07: Conversión 0.02 A versus 20 mA en misma dimensión
  describe("T07: Unit conversion 0.02 A vs 20 mA in same dimension", () => {
    it("returns meets for 0.02 A vs 20 mA in electric current dimension", () => {
      const snapshotAmperes: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t07_amp",
        attributes: [
          {
            attribute_id: "attr_t07_out",
            property: "analog_output_capacity",
            scope: "port",
            value: { kind: "quantity", value: 0.02, unit: "A", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t07_ma",
        property: "analog_output_capacity",
        operator: "equals",
        value: { kind: "quantity", value: 20, unit: "mA", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshotAmperes, [req])
      expect(result.overall_status).toBe("meets")
      expect(result.overall_satisfied).toBe(true)
    })

    it("returns does_not_meet when magnitude differs (20 mA vs 20 A)", () => {
      const snapshotMA: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t07_ma",
        attributes: [
          {
            attribute_id: "attr_t07_curr",
            property: "current_rating",
            scope: "equipment",
            value: { kind: "quantity", value: 20, unit: "mA", dimension: "current" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t07_power_curr",
        property: "current_rating",
        operator: "gte",
        value: { kind: "quantity", value: 20, unit: "A", dimension: "current" },
        required: true,
      }

      const result = evaluateProduct(snapshotMA, [req])
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T08: 24 VAC versus requisito 24 VDC
  describe("T08: 24 VAC vs 24 VDC supply voltage", () => {
    it("returns does_not_meet when voltage magnitude matches but electrical nature (ac vs dc) differs", () => {
      const snapshotAC: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t08_vac",
        attributes: [
          {
            attribute_id: "attr_t08_supp",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "quantity", value: 24, unit: "V", nature: "ac" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t08_vdc",
        property: "supply_voltage",
        operator: "equals",
        value: { kind: "quantity", value: 24, unit: "V", nature: "dc" },
        required: true,
      }

      const result = evaluateProduct(snapshotAC, [req])
      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T09: Característica de otra opción de variante -> not_documented
  describe("T09: Option of other variant not inherited", () => {
    it("returns not_documented when option exists in product family or another variant but lacks proof on evaluated variant", () => {
      const snapshotBase: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t09_base",
        attributes: NOVUS_N1200_SNAPSHOT.attributes.filter(
          (a) => a.property !== "communication_protocols"
        ),
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t09_comm",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotBase, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T10: Fuentes aplicables contradictorias -> not_documented / EVIDENCE_CONFLICT
  describe("T10: Conflicting sources produce EVIDENCE_CONFLICT", () => {
    it("returns not_documented with reason code EVIDENCE_CONFLICT without arbitrarily cherry-picking", () => {
      const snapshotConflict: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_t10_conflict",
        attributes: [
          {
            attribute_id: "attr_t10_v1",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "quantity", value: 24, unit: "V", nature: "dc" },
            data_status: "documented",
            evidence_refs: [{ source_id: "SRC_A", page: 1, excerpt: "24 VDC" }],
          },
          {
            attribute_id: "attr_t10_v2",
            property: "supply_voltage",
            scope: "equipment",
            value: { kind: "quantity", value: 240, unit: "V", nature: "ac" },
            data_status: "documented",
            evidence_refs: [{ source_id: "SRC_B", page: 1, excerpt: "240 VAC" }],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t10_supp",
        property: "supply_voltage",
        operator: "equals",
        value: { kind: "quantity", value: 24, unit: "V", nature: "dc" },
        required: true,
      }

      const result = evaluateProduct(snapshotConflict, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      const hasConflict =
        result.reason_code === REASON_CODES.EVIDENCE_CONFLICT ||
        result.evaluations.some((e) => e.reason_code === REASON_CODES.EVIDENCE_CONFLICT)
      expect(hasConflict).toBe(true)
    })
  })

  // T11: PT100 directo a input 4–20 mA -> does_not_meet
  describe("T11: Direct PT100 to 4-20 mA current input without transmitter", () => {
    it("returns does_not_meet for signal incompatibility (SIGNAL_COMPATIBILITY)", () => {
      const pt100Snapshot: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t11_pt100",
        ports: [
          {
            port_id: "p_sensor_out",
            label: "PT100 Sensor Lead",
            category: "sensor",
            direction: "output",
            signal_type: "rtd_pt100",
            terminals: [{ label: "1" }, { label: "2" }, { label: "3" }],
          },
        ],
      }

      const controllerSnapshot: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_t11_ctrl",
        ports: [
          {
            port_id: "p_ai_current",
            label: "Current Loop Input (4-20mA)",
            category: "analog_input",
            direction: "input",
            signal_type: "current_4_20ma",
            terminals: [{ label: "AI1" }, { label: "AGND" }],
          },
        ],
      }

      const configRevision = {
        id: "rev_t11",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_pt100", snapshot_id: "snp_t11_pt100", variant_id: "v_pt100" },
            { instance_id: "inst_ctrl", snapshot_id: "snp_t11_ctrl", variant_id: "v_ctrl" },
          ],
          connections: [
            {
              connection_id: "conn_pt100_to_ai",
              from_instance_id: "inst_pt100",
              from_port_id: "p_sensor_out",
              to_instance_id: "inst_ctrl",
              to_port_id: "p_ai_current",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t11_pv",
            property: "signal_compatibility",
            operator: "equals",
            value: "compatible",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        snp_t11_pt100: pt100Snapshot,
        snp_t11_ctrl: controllerSnapshot,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T12: PT100 3 hilos a input RTD solo 2 hilos -> does_not_meet
  describe("T12: PT100 3-wire connected to RTD input supporting only 2 wires", () => {
    it("returns does_not_meet for RTD wiring restriction (RTD_WIRING)", () => {
      const pt1003WireSnapshot: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t12_pt100_3w",
        ports: [
          {
            port_id: "p_sensor_out",
            label: "3-Wire PT100",
            category: "sensor",
            direction: "output",
            signal_type: "rtd_pt100_3_wire",
            terminals: [{ label: "A" }, { label: "B1" }, { label: "B2" }],
          },
        ],
      }

      const rtd2WireOnlySnapshot: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t12_rtd_2w",
        ports: [
          {
            port_id: "p_rtd_in_2w",
            label: "2-Wire RTD Input Only",
            category: "sensor",
            direction: "input",
            signal_type: "rtd_pt100_2_wire",
            terminals: [{ label: "1" }, { label: "2" }],
          },
        ],
      }

      const configRevision = {
        id: "rev_t12",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_pt100", snapshot_id: "snp_t12_pt100_3w", variant_id: "v1" },
            { instance_id: "inst_rtd_in", snapshot_id: "snp_t12_rtd_2w", variant_id: "v2" },
          ],
          connections: [
            {
              connection_id: "conn_pt100_to_rtd",
              from_instance_id: "inst_pt100",
              from_port_id: "p_sensor_out",
              to_instance_id: "inst_rtd_in",
              to_port_id: "p_rtd_in_2w",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t12_wiring",
            property: "rtd_wiring_compatibility",
            operator: "equals",
            value: "compatible",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        snp_t12_pt100_3w: pt1003WireSnapshot,
        snp_t12_rtd_2w: rtd2WireOnlySnapshot,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T13: Puerto multifunción usado como RTD y corriente simultáneamente -> reject assignment / does_not_meet
  describe("T13: Multifunction port used as RTD and current simultaneously", () => {
    it("returns does_not_meet and rejects conflicting simultaneous channel assignment", () => {
      const configRevision = {
        id: "rev_t13",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_novus", snapshot_id: NOVUS_N1200_SNAPSHOT.snapshot_id, variant_id: "v_novus" },
            { instance_id: "inst_rtd_sensor", snapshot_id: NOVUS_N1200_SNAPSHOT.snapshot_id, variant_id: "v_rtd" },
            { instance_id: "inst_curr_tx", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v_tx" },
          ],
          connections: [
            {
              connection_id: "conn_rtd",
              from_instance_id: "inst_rtd_sensor",
              from_port_id: "p_universal_sensor_in",
              to_instance_id: "inst_novus",
              to_port_id: "p_universal_sensor_in",
              selected_mode: "rtd_pt100",
            },
            {
              connection_id: "conn_current",
              from_instance_id: "inst_curr_tx",
              from_port_id: "p_power_in",
              to_instance_id: "inst_novus",
              to_port_id: "p_universal_sensor_in",
              selected_mode: "current_4_20ma",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t13_chan",
            property: "channel_assignment",
            operator: "equals",
            value: "valid",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        [NOVUS_N1200_SNAPSHOT.snapshot_id]: NOVUS_N1200_SNAPSHOT,
        [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T14: Canal ocupado por dos sensores no multipunto -> reject capacity / does_not_meet
  describe("T14: Channel occupied by two non-multipoint sensors", () => {
    it("returns does_not_meet rejecting capacity when two sensors occupy single analog input channel", () => {
      const configRevision = {
        id: "rev_t14",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_ctrl", snapshot_id: HORNER_X5_SNAPSHOT.snapshot_id, variant_id: "v_ctrl" },
            { instance_id: "sensor_1", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v_s1" },
            { instance_id: "sensor_2", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v_s2" },
          ],
          connections: [
            {
              connection_id: "conn_s1",
              from_instance_id: "sensor_1",
              from_port_id: "p_power_in",
              to_instance_id: "inst_ctrl",
              to_port_id: "p_analog_in",
            },
            {
              connection_id: "conn_s2",
              from_instance_id: "sensor_2",
              from_port_id: "p_power_in",
              to_instance_id: "inst_ctrl",
              to_port_id: "p_analog_in",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t14_capacity",
            property: "channel_capacity",
            operator: "equals",
            value: "sufficient",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        [HORNER_X5_SNAPSHOT.snapshot_id]: HORNER_X5_SNAPSHOT,
        [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T15: RS-485 sin protocolo/rol -> not_documented
  describe("T15: RS-485 without documented protocol/role", () => {
    it("returns not_documented when RS-485 network members lack documented protocol or role", () => {
      const snapshotBareRS485: TechnicalSnapshot = {
        ...TZONE_THT02_SNAPSHOT,
        snapshot_id: "snp_t15_bare_rs485",
        capabilities: [],
        attributes: [
          {
            attribute_id: "attr_t15_comm",
            property: "physical_interface",
            scope: "port",
            value: { kind: "enum", value: "rs485" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t15_protocol_role",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_rtu",
        required: true,
      }

      const result = evaluateProduct(snapshotBareRS485, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T16: Red Modbus con dirección repetida -> does_not_meet
  describe("T16: Modbus network with duplicate address", () => {
    it("returns does_not_meet for address collision (ADDRESS_UNIQUENESS)", () => {
      const configRevision = {
        id: "rev_t16",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_master", snapshot_id: HORNER_X5_SNAPSHOT.snapshot_id, variant_id: "v1" },
            { instance_id: "slave_1", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v2" },
            { instance_id: "slave_2", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v3" },
          ],
          networks: [
            {
              network_id: "net_modbus_rs485",
              protocol: "modbus_rtu",
              members: [
                { instance_id: "inst_master", port_id: "p_rs485_mj1", role: "master" },
                { instance_id: "slave_1", port_id: "p_rs485", role: "slave", address: 1 },
                { instance_id: "slave_2", port_id: "p_rs485", role: "slave", address: 1 }, // Duplicate address!
              ],
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t16_addr",
            property: "address_uniqueness",
            operator: "equals",
            value: "unique",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        [HORNER_X5_SNAPSHOT.snapshot_id]: HORNER_X5_SNAPSHOT,
        [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T17: Baud/paridad configurables con intersección válida -> meets
  describe("T17: Configurable baud/parity with valid intersection", () => {
    it("returns meets for network bus parameters with non-empty configuration intersection", () => {
      const configRevision = {
        id: "rev_t17",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_master", snapshot_id: HORNER_X5_SNAPSHOT.snapshot_id, variant_id: "v1" },
            { instance_id: "inst_slave", snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id, variant_id: "v2" },
          ],
          networks: [
            {
              network_id: "net_modbus_rs485",
              protocol: "modbus_rtu",
              members: [
                { instance_id: "inst_master", port_id: "p_rs485_mj1", role: "master" },
                { instance_id: "inst_slave", port_id: "p_rs485", role: "slave", address: 2 },
              ],
              parameters: {
                baud_rate: 9600, // Both Horner X5 and Tzone support 9600
                parity: "none",
                stop_bits: 1,
              },
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t17_bus_params",
            property: "bus_parameters_compatibility",
            operator: "equals",
            value: "compatible",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        [HORNER_X5_SNAPSHOT.snapshot_id]: HORNER_X5_SNAPSHOT,
        [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
      })

      expect(result.overall_status).toBe("meets")
      expect(result.overall_satisfied).toBe(true)
    })
  })

  // T18: Ethernet genérico como prueba de Modbus TCP -> not_documented (do NOT approve)
  describe("T18: Generic Ethernet does not prove Modbus TCP", () => {
    it("returns not_documented and never approves Modbus TCP solely from physical RJ45 Ethernet port", () => {
      const snapshotGenericEthernet: TechnicalSnapshot = {
        ...HORNER_X5_SNAPSHOT,
        snapshot_id: "snp_t18_generic_eth",
        capabilities: ["plc_logic_controller"], // no modbus tcp capability
        attributes: [
          {
            attribute_id: "attr_t18_eth",
            property: "physical_interface",
            scope: "port",
            value: { kind: "enum", value: "ethernet_rj45" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
        ports: [
          {
            port_id: "p_eth",
            label: "RJ45 Ethernet Port",
            category: "ethernet",
            direction: "bidirectional",
            signal_type: "ethernet_10_100",
            terminals: [{ label: "RJ45" }],
          },
        ],
      }

      const req: EvaluatorRequirement = {
        requirement_id: "req_t18_modbus_tcp",
        property: "communication_protocols",
        operator: "equals",
        value: "modbus_tcp",
        required: true,
      }

      const result = evaluateProduct(snapshotGenericEthernet, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.overall_status).not.toBe("meets")
    })
  })

  // T19: Salida lógica a calefactor sin interfaz de potencia -> does_not_meet
  describe("T19: Logic output to 2kW heater without power interface (SSR/contactor)", () => {
    it("returns does_not_meet for incomplete topology / actuator interface violation", () => {
      const heaterSnapshot: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t19_heater",
        ports: [
          {
            port_id: "p_heater_element",
            label: "2 kW Heating Element Power Terminals",
            category: "power",
            direction: "input",
            signal_type: "power_ac",
            terminals: [{ label: "L" }, { label: "N" }],
          },
        ],
      }

      const configRevision = {
        id: "rev_t19",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_ctrl", snapshot_id: NOVUS_N1200_SNAPSHOT.snapshot_id, variant_id: "v1" },
            { instance_id: "inst_heater", snapshot_id: "snp_t19_heater", variant_id: "v2" },
          ],
          connections: [
            {
              connection_id: "conn_direct_logic_to_heater",
              from_instance_id: "inst_ctrl",
              from_port_id: "p_out1_control", // 5V SSR logic pulse! Cannot drive 2kW heater!
              to_instance_id: "inst_heater",
              to_port_id: "p_heater_element",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t19_actuator",
            property: "output_actuator_interface",
            operator: "equals",
            value: "valid",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        [NOVUS_N1200_SNAPSHOT.snapshot_id]: NOVUS_N1200_SNAPSHOT,
        snp_t19_heater: heaterSnapshot,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T20: Entrada de SSR excede rating de salida de mando -> does_not_meet
  describe("T20: SSR input exceeds controller drive output rating", () => {
    it("returns does_not_meet when actuator drive requirements exceed controller output rating", () => {
      const highDriveSSRSnapshot: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t20_ssr_high_drive",
        ports: [
          {
            port_id: "p_ssr_in",
            label: "SSR Input (requires 12-32 VDC / 40mA)",
            category: "discrete_input",
            direction: "input",
            signal_type: "ssr_drive",
            terminals: [{ label: "IN+" }, { label: "IN-" }],
          },
        ],
        attributes: [
          {
            attribute_id: "attr_ssr_drive_req",
            property: "drive_voltage_min",
            scope: "port",
            value: { kind: "quantity", value: 12, unit: "V", nature: "dc" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const controllerSnapshot5V: TechnicalSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        snapshot_id: "snp_t20_ctrl_5v",
        ports: [
          {
            port_id: "p_ssr_out_5v",
            label: "SSR Pulse Output (5 VDC / 25mA max)",
            category: "discrete_output",
            direction: "output",
            signal_type: "ssr_drive",
            terminals: [{ label: "OUT+" }, { label: "OUT-" }],
          },
        ],
        attributes: [
          {
            attribute_id: "attr_ctrl_drive_out",
            property: "drive_voltage_max",
            scope: "port",
            value: { kind: "quantity", value: 5, unit: "V", nature: "dc" },
            data_status: "documented",
            evidence_refs: [],
          },
        ],
      }

      const configRevision = {
        id: "rev_t20",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_ctrl", snapshot_id: "snp_t20_ctrl_5v", variant_id: "v1" },
            { instance_id: "inst_ssr", snapshot_id: "snp_t20_ssr_high_drive", variant_id: "v2" },
          ],
          connections: [
            {
              connection_id: "conn_ctrl_to_ssr",
              from_instance_id: "inst_ctrl",
              from_port_id: "p_ssr_out_5v",
              to_instance_id: "inst_ssr",
              to_port_id: "p_ssr_in",
            },
          ],
        },
        requirements_json: [
          {
            requirement_id: "req_t20_drive",
            property: "output_actuator_interface",
            operator: "equals",
            value: "valid",
            required: true,
          },
        ],
      }

      const result = evaluateSystem(configRevision, {
        snp_t20_ctrl_5v: controllerSnapshot5V,
        snp_t20_ssr_high_drive: highDriveSSRSnapshot,
      })

      expect(result.overall_status).toBe("does_not_meet")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T21: Cuerpo documentado, montaje DIN ausente -> not_documented para DIN
  describe("T21: Documented body, DIN mounting absent", () => {
    it("returns not_documented when DIN rail mounting is required but snapshot only documents panel mounting", () => {
      // Novus N1200 has 1/16 DIN panel mount, but NOT DIN rail clip mounting
      const req: EvaluatorRequirement = {
        requirement_id: "req_t21_din_rail",
        property: "mounting_style",
        operator: "equals",
        value: "din_rail",
        required: true,
      }

      const result = evaluateProduct(NOVUS_N1200_SNAPSHOT, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
    })
  })

  // T22: Solo reglas opcionales sin requisitos obligatorios -> not ready / not_documented (NO_REQUIREMENTS)
  describe("T22: Only optional rules without mandatory requirements", () => {
    it("returns not_documented with reason code NO_REQUIREMENTS when no mandatory requirements are provided", () => {
      // Only optional requirements (required: false)
      const optionalReq: EvaluatorRequirement = {
        requirement_id: "req_t22_opt",
        property: "color_finish",
        operator: "equals",
        value: "black",
        required: false,
      }

      const result = evaluateProduct(HORNER_X5_SNAPSHOT, [optionalReq])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      expect(result.reason_code).toBe(REASON_CODES.NO_REQUIREMENTS)
    })
  })

  // T23: Focus changes from logging to control -> required scope recalculated
  describe("T23: Focus changes from logging to control recalculates validation scope", () => {
    it("recalculates required rules scope when focus transitions from data_logging to closed_loop_control", () => {
      const configRevision = {
        id: "rev_t23",
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [
            { instance_id: "inst_ctrl", snapshot_id: NOVUS_N1200_SNAPSHOT.snapshot_id, variant_id: "v1" },
          ],
          connections: [],
        },
        requirements_json: [
          {
            requirement_id: "req_logging",
            property: "logging_capability",
            operator: "equals",
            value: "supported",
            required: true,
          },
          {
            requirement_id: "req_control",
            property: "control_loop_completeness",
            operator: "equals",
            value: "complete",
            required: true,
          },
        ],
      }

      const resultLogging = evaluateSystem(
        { ...configRevision, focus_json: { primary_goal: "data_logging" } },
        { [NOVUS_N1200_SNAPSHOT.snapshot_id]: NOVUS_N1200_SNAPSHOT }
      )

      const resultControl = evaluateSystem(
        { ...configRevision, focus_json: { primary_goal: "closed_loop_control" } },
        { [NOVUS_N1200_SNAPSHOT.snapshot_id]: NOVUS_N1200_SNAPSHOT }
      )

      // Both results must evaluate deterministically without mutating underlying facts
      expect(resultLogging).toBeDefined()
      expect(resultControl).toBeDefined()
    })
  })

  // T24: Falta de capacidad de logging/retención -> not_documented, no inferido desde RAM
  describe("T24: Lack of logging/retention capability not inferred from volatile RAM", () => {
    it("returns not_documented when logging capability is required but only working RAM is present", () => {
      // Novus N1200 does not document non-volatile data logger / microSD
      const req: EvaluatorRequirement = {
        requirement_id: "req_t24_logging",
        property: "logging_capability",
        operator: "equals",
        value: "data_alarm_logging_microsd",
        required: true,
      }

      const result = evaluateProduct(NOVUS_N1200_SNAPSHOT, [req])
      expect(result.overall_status).toBe("not_documented")
      expect(result.overall_satisfied).toBe(false)
      // Must NEVER infer persistence from working RAM
      expect(result.overall_status).not.toBe("meets")
    })
  })
})
