/**
 * Comprehensive Unit Tests for Pure Evaluator Core & Rules Engine
 * Gate G5 - Per Megaplan §12, §13, §14
 */

import {
  ReasonCode,
  checkRangeCoverage,
  convertToBase,
  extractVoltageNature,
  areVoltageNaturesCompatible,
  assignConnectionsDeterministically,
  ReservationTracker,
  evaluateModbusNetwork,
  evaluateProduct,
  evaluateSystem,
  aggregateVerdicts,
  RULE_SET_VERSION,
  TechnicalRequirement,
  RuleResult,
  PILOT_RULE_IDS,
  evaluateSignalCompatibility,
  evaluatePortDirection,
  evaluateOutputActuatorInterface,
  evaluateRtdWiring,
} from "../evaluator";
import {
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
} from "../data/g4-catalog-snapshots";
import { ConfigurationRevision } from "../schemas/revision.schema";
import { Port } from "../schemas/port-terminal.schema";
import { TechnicalSnapshot } from "../schemas/snapshot.schema";

describe("Pure Evaluator Core - Gate G5 (§12, §13, §14)", () => {
  describe("1. Unit Conversion & Strict Range Coverage (units.ts)", () => {
    it("converts current units accurately to base (A)", () => {
      const ma = convertToBase(20, "mA");
      expect(ma).not.toBeNull();
      expect(ma!.value).toBeCloseTo(0.02, 6);
      expect(ma!.baseUnit).toBe("A");
      expect(ma!.quantity).toBe("current");

      const a = convertToBase(1.5, "A");
      expect(a!.value).toBe(1.5);
      expect(a!.baseUnit).toBe("A");
    });

    it("converts voltage units accurately to base (V)", () => {
      const mv = convertToBase(50, "mV");
      expect(mv!.value).toBeCloseTo(0.05, 6);
      expect(mv!.baseUnit).toBe("V");

      const kv = convertToBase(1.2, "kV");
      expect(kv!.value).toBe(1200);
      expect(kv!.baseUnit).toBe("V");
    });

    it("converts temperature units (°C, K, °F) accurately to base (°C)", () => {
      const c = convertToBase(100, "°C");
      expect(c!.value).toBe(100);
      expect(c!.baseUnit).toBe("°C");

      const k = convertToBase(373.15, "K");
      expect(k!.value).toBeCloseTo(100, 4);

      const f = convertToBase(212, "°F");
      expect(f!.value).toBeCloseTo(100, 4);

      const fZero = convertToBase(32, "°F");
      expect(fZero!.value).toBeCloseTo(0, 4);
    });

    it("converts resistance units (ohm, kohm, Mohm) accurately to base", () => {
      const kohm = convertToBase(4.7, "kohm");
      expect(kohm!.value).toBe(4700);
      expect(kohm!.baseUnit).toBe("ohm");

      const mohm = convertToBase(1.5, "Mohm");
      expect(mohm!.value).toBe(1500000);
      expect(mohm!.baseUnit).toBe("ohm");
    });

    it("converts frequency units (Hz, kHz) accurately to base", () => {
      const khz = convertToBase(2.4, "kHz");
      expect(khz!.value).toBe(2400);
      expect(khz!.baseUnit).toBe("Hz");
    });

    it("evaluates voltage nature compatibility (ac vs dc)", () => {
      expect(extractVoltageNature("dc", "VDC")).toBe("dc");
      expect(extractVoltageNature("ac", "VAC")).toBe("ac");
      expect(extractVoltageNature("ac_dc", "100-240 VAC/DC")).toBe("ac_dc");

      // VAC and VDC are incompatible if documented
      expect(areVoltageNaturesCompatible("ac", "dc")).toBe(false);
      expect(areVoltageNaturesCompatible("dc", "ac")).toBe(false);

      // Universal power supply is compatible with both
      expect(areVoltageNaturesCompatible("ac", "ac_dc")).toBe(true);
      expect(areVoltageNaturesCompatible("dc", "ac_dc")).toBe(true);
    });

    it("strictly evaluates condition A (capacity covers requirement), rejecting condition B", () => {
      // Condition A: Capacity [0, 25] mA covers Requirement [4, 20] mA -> MEETS
      const resA = checkRangeCoverage(
        { min: 4, max: 20, unit: "mA" },
        { min: 0, max: 25, unit: "mA" }
      );
      expect(resA.verdict).toBe("meets");
      expect(resA.reason_code).toBe(ReasonCode.SATISFIED);

      // Condition B (INVERSE): Requirement [0, 25] mA, Capacity [4, 20] mA -> DOES_NOT_MEET
      const resB = checkRangeCoverage(
        { min: 0, max: 25, unit: "mA" },
        { min: 4, max: 20, unit: "mA" }
      );
      expect(resB.verdict).toBe("does_not_meet");
      expect(resB.reason_code).toBe(ReasonCode.RANGE_OUT_OF_BOUNDS);
    });

    it("evaluates range with unit conversion across scales (mV to V)", () => {
      // Capacity [0, 10] V covers Requirement [0, 5000] mV
      const res = checkRangeCoverage(
        { min: 0, max: 5000, unit: "mV" },
        { min: 0, max: 10, unit: "V" }
      );
      expect(res.verdict).toBe("meets");
      expect(res.reason_code).toBe(ReasonCode.SATISFIED);
    });

    it("rejects mismatched physical dimensions (Current vs Voltage)", () => {
      const res = checkRangeCoverage(
        { min: 4, max: 20, unit: "mA" },
        { min: 0, max: 10, unit: "V" }
      );
      expect(res.verdict).toBe("does_not_meet");
      expect(res.reason_code).toBe(ReasonCode.UNIT_MISMATCH);
    });

    it("rejects incompatible voltage natures (AC source for DC requirement)", () => {
      const res = checkRangeCoverage(
        { min: 24, max: 24, unit: "V", nature: "dc" },
        { min: 100, max: 240, unit: "V", nature: "ac" }
      );
      expect(res.verdict).toBe("does_not_meet");
      expect(res.reason_code).toBe(ReasonCode.NATURE_MISMATCH);
    });

    it("returns not_documented when bounds are incomplete, never fallback to true", () => {
      const res1 = checkRangeCoverage(
        { min: undefined, max: 20, unit: "mA" },
        { min: 0, max: 25, unit: "mA" }
      );
      expect(res1.verdict).toBe("not_documented");
      expect(res1.reason_code).toBe(ReasonCode.ABSENT_PROPERTY);

      const res2 = checkRangeCoverage(
        { min: 4, max: 20, unit: "mA" },
        { min: 0, max: undefined, unit: "mA" }
      );
      expect(res2.verdict).toBe("not_documented");
      expect(res2.reason_code).toBe(ReasonCode.ABSENT_PROPERTY);
    });
  });

  describe("2. Deterministic Bipartite Matching & Reservations (matching.ts)", () => {
    it("allocates connections to available channels without collision", () => {
      const connections = [
        {
          connection_id: "c1",
          from_instance_id: "sensor1",
          from_port_id: "p_out",
          to_instance_id: "x5_plc",
          to_port_id: "p_analog_in",
        },
        {
          connection_id: "c2",
          from_instance_id: "sensor2",
          from_port_id: "p_out",
          to_instance_id: "x5_plc",
          to_port_id: "p_analog_in",
        },
      ];

      const snapshotsById = {
        x5_plc: HORNER_X5_SNAPSHOT,
      };

      const result = assignConnectionsDeterministically(connections, snapshotsById);
      expect(result.success).toBe(true);
      expect(result.verdict).toBe("meets");
      expect(result.reservations).toHaveLength(2);
      expect(result.reservations[0].reservation_key).toBe("x5_plc:p_analog_in:0");
      expect(result.reservations[1].reservation_key).toBe("x5_plc:p_analog_in:1");
    });

    it("detects channel capacity exceeded when connections exceed available channels", () => {
      // Novus N1200 p_universal_sensor_in has only 1 channel
      const connections = [
        {
          connection_id: "c1",
          from_instance_id: "pt100_probe_1",
          from_port_id: "p_leads",
          to_instance_id: "n1200_ctrl",
          to_port_id: "p_universal_sensor_in",
        },
        {
          connection_id: "c2",
          from_instance_id: "pt100_probe_2",
          from_port_id: "p_leads",
          to_instance_id: "n1200_ctrl",
          to_port_id: "p_universal_sensor_in",
        },
      ];

      const snapshotsById = {
        n1200_ctrl: NOVUS_N1200_SNAPSHOT,
      };

      const result = assignConnectionsDeterministically(connections, snapshotsById);
      expect(result.success).toBe(false);
      expect(result.verdict).toBe("does_not_meet");
      expect(result.rule_results[0].reason_code).toBe(ReasonCode.CHANNEL_CAPACITY_EXCEEDED);
    });

    it("detects multifunction mode conflict on single-mode port (RTD vs 4-20mA)", () => {
      const tracker = new ReservationTracker();
      const port: Port = {
        port_id: "p_univ",
        label: "Universal Sensor Port",
        category: "sensor",
        direction: "input",
        signal_type: "universal",
        terminals: [
          { label: "1", function: "Terminal 1" },
          { label: "2", function: "Terminal 2" },
        ],
      };

      // First reservation sets mode to rtd_pt100
      const ok1 = tracker.reserveChannel("inst1", "p_univ", 0, "conn1", port, "rtd_pt100");
      expect(ok1).toBe(true);

      // Second reservation tries to use mode current_4_20ma on same port
      const ok2 = tracker.reserveChannel("inst1", "p_univ", 0, "conn2", port, "current_4_20ma");
      expect(ok2).toBe(false);

      const conflicts = tracker.getConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe("channel_collision");
    });

    it("evaluates Modbus networks: detects duplicate node addresses", () => {
      const network = {
        network_id: "net_modbus_1",
        protocol: "modbus_rtu",
        members: [
          { instance_id: "x5_plc", role: "master" },
          { instance_id: "tht_temp1", role: "slave", address: 1 },
          { instance_id: "tht_temp2", role: "slave", address: 1 }, // DUPLICATE!
        ],
      };

      const snapshotsById = {
        x5_plc: HORNER_X5_SNAPSHOT,
        tht_temp1: TZONE_THT02_SNAPSHOT,
        tht_temp2: TZONE_THT02_SNAPSHOT,
      };

      const results = evaluateModbusNetwork(network, snapshotsById);
      const addrRule = results.find((r) => r.rule_id === "ADDRESS_UNIQUENESS");
      expect(addrRule).toBeDefined();
      expect(addrRule!.verdict).toBe("does_not_meet");
      expect(addrRule!.reason_code).toBe(ReasonCode.DUPLICATE_ADDRESS);
    });

    it("evaluates Modbus networks: computes baud rate intersection", () => {
      const network = {
        network_id: "net_modbus_1",
        protocol: "modbus_rtu",
        members: [
          { instance_id: "x5_plc", role: "master" },
          { instance_id: "tht_temp1", role: "slave", address: 1 },
        ],
      };

      const snapshotsById = {
        x5_plc: HORNER_X5_SNAPSHOT,
        tht_temp1: TZONE_THT02_SNAPSHOT,
      };

      const results = evaluateModbusNetwork(network, snapshotsById);
      const baudRule = results.find((r) => r.rule_id === "BUS_PARAMETERS");
      expect(baudRule).toBeDefined();
      expect(baudRule!.verdict).toBe("meets");
      expect(baudRule!.reason_code).toBe(ReasonCode.SATISFIED);
    });
  });

  describe("3. Pilot Rules per §13.6 (rules.ts)", () => {
    it("SIGNAL_COMPATIBILITY: rejects passive RTD PT100 wired directly to 4-20mA input", () => {
      const pt100Port: Port = {
        port_id: "p_sensor",
        label: "RTD Sensor Wires",
        category: "sensor",
        direction: "output",
        signal_type: "rtd_pt100",
        terminals: [],
      };

      const analogInPort: Port = {
        port_id: "p_analog",
        label: "4-20mA Analog Input",
        category: "analog_input",
        direction: "input",
        signal_type: "current_4_20ma",
        terminals: [],
      };

      const res = evaluateSignalCompatibility(pt100Port, analogInPort, "conn_fail");
      expect(res.verdict).toBe("does_not_meet");
      expect(res.reason_code).toBe(ReasonCode.PORT_TYPE_MISMATCH);
      expect(res.suggested_actions).toBeDefined();
    });

    it("PORT_DIRECTION: rejects output-to-output connection", () => {
      const out1: Port = {
        port_id: "out1",
        label: "Digital Out 1",
        category: "discrete_output",
        direction: "output",
        terminals: [],
      };
      const out2: Port = {
        port_id: "out2",
        label: "Digital Out 2",
        category: "discrete_output",
        direction: "output",
        terminals: [],
      };

      const res = evaluatePortDirection(out1, out2, "conn_out_out");
      expect(res.verdict).toBe("does_not_meet");
      expect(res.reason_code).toBe(ReasonCode.PORT_DIRECTION_MISMATCH);
    });

    it("OUTPUT_ACTUATOR_INTERFACE: fails controller logic out to 2kW heater without power interface (§12.6, §13.6)", () => {
      const controllerSnapshot = HORNER_X5_SNAPSHOT;
      const logicOutPort = controllerSnapshot.ports.find((p) => p.port_id === "p_digital_out");
      const highPowerHeater = {
        sku: "HEATER-2KW-230V",
        label: "2kW Industrial Heating Chamber",
        power_rating_w: 2000,
      };

      // Without intermediate power interface -> DOES_NOT_MEET
      const resFail = evaluateOutputActuatorInterface(
        controllerSnapshot,
        highPowerHeater,
        false, // NO SSR
        logicOutPort
      );
      expect(resFail.verdict).toBe("does_not_meet");
      expect(resFail.reason_code).toBe(ReasonCode.ACTUATOR_INTERFACE_MISSING);
      expect(resFail.suggested_actions).toBeDefined();

      // With intermediate SSR -> MEETS
      const resPass = evaluateOutputActuatorInterface(
        controllerSnapshot,
        highPowerHeater,
        true, // Has SSR
        logicOutPort
      );
      expect(resPass.verdict).toBe("meets");
      expect(resPass.reason_code).toBe(ReasonCode.SATISFIED);
    });

    it("RTD_WIRING: checks element and wire count support", () => {
      const sensorSnapshot = {
        ...NOVUS_N1200_SNAPSHOT,
        sku: "PT100-PROBE-4WIRE",
      };

      const port3Wire = NOVUS_N1200_SNAPSHOT.ports.find(
        (p) => p.port_id === "p_universal_sensor_in"
      )!;

      // 4-wire requested on 3-terminal input -> does_not_meet
      const res = evaluateRtdWiring(sensorSnapshot, port3Wire, 4);
      expect(res.verdict).toBe("does_not_meet");
      expect(res.reason_code).toBe(ReasonCode.WIRING_INCOMPATIBLE);

      // 3-wire requested on 3-terminal input -> meets
      const resPass = evaluateRtdWiring(sensorSnapshot, port3Wire, 3);
      expect(resPass.verdict).toBe("meets");
      expect(resPass.reason_code).toBe(ReasonCode.SATISFIED);
    });
  });

  describe("4. Pure Evaluator Core & §13.2 Aggregation (core.ts)", () => {
    it("returns not_documented with NO_REQUIREMENTS on empty requirements array", () => {
      const result = evaluateProduct(HORNER_X5_SNAPSHOT, []);
      expect(result.overall_verdict).toBe("not_documented");
      expect(result.reason_code).toBe(ReasonCode.NO_REQUIREMENTS);
      expect(result.evaluations).toHaveLength(0);
      expect(result.rule_set_version).toBe(RULE_SET_VERSION);
    });

    it("evaluates product snapshot against range requirement successfully", () => {
      const reqs: TechnicalRequirement[] = [
        {
          requirement_id: "req_supply_voltage",
          target: "product",
          property: "supply_voltage",
          operator: "covers_range",
          value: { min: 12, max: 24, unit: "V", nature: "dc" },
          required: true,
        },
      ];

      const result = evaluateProduct(HORNER_X5_SNAPSHOT, reqs);
      expect(result.overall_verdict).toBe("meets");
      expect(result.evaluations[0].reason_code).toBe(ReasonCode.SATISFIED);
    });

    it("handles not_equals operator per §13.4: requires evidence of difference, not absent fact", () => {
      const reqAbsent: TechnicalRequirement = [
        {
          requirement_id: "req_absent_property",
          target: "product",
          property: "non_existent_property_xyz",
          operator: "not_equals",
          value: "some_value",
          required: true,
        },
      ][0];

      const res = evaluateProduct(HORNER_X5_SNAPSHOT, [reqAbsent]);
      // Per §13.4: 'not_equals' requires evidence of difference. Absence is not_documented!
      expect(res.overall_verdict).toBe("not_documented");
      expect(res.evaluations[0].reason_code).toBe(ReasonCode.ABSENT_PROPERTY);
    });

    it("registers unverified scopes and ensures overall verdict does not approve", () => {
      const reqUnverified: TechnicalRequirement = {
        requirement_id: "req_cybersec",
        target: "cybersecurity_iec62443",
        property: "security_level",
        operator: "equals",
        value: "SL3",
        required: true,
      };

      const result = evaluateProduct(HORNER_X5_SNAPSHOT, [reqUnverified]);
      expect(result.overall_verdict).toBe("not_documented");
      expect(result.evaluations[0].reason_code).toBe(ReasonCode.RULE_NOT_IMPLEMENTED);
      expect(result.unverified_scopes).toContain("cybersecurity_iec62443");
    });

    it("evaluates a complete engineering system configuration revision", () => {
      const revision: ConfigurationRevision = {
        id: "rev_01",
        configuration_id: "cfg_01",
        revision: 1,
        schema_version: "configuration_revision/2.0",
        content_sha256: "a".repeat(64),
        graph_json: {
          instances: [
            {
              instance_id: "inst_plc",
              variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
              snapshot_id: HORNER_X5_SNAPSHOT.snapshot_id,
            },
            {
              instance_id: "inst_sensor",
              variant_id: "variant_01M41R193J5MPJ16MTX9CAWWRM",
              snapshot_id: TZONE_THT02_SNAPSHOT.snapshot_id,
            },
          ],
          connections: [
            {
              connection_id: "conn_rs485",
              from_instance_id: "inst_plc",
              from_port_id: "p_rs485_mj1",
              to_instance_id: "inst_sensor",
              to_port_id: "p_rs485",
            },
          ],
          networks: [
            {
              network_id: "net_modbus_rs485",
              protocol: "modbus_rtu",
              members: [
                { instance_id: "inst_plc", role: "master" },
                { instance_id: "inst_sensor", role: "slave", address: 1 },
              ],
            },
          ],
          control_loops: [],
        },
      };

      const snapshotsById = {
        [HORNER_X5_SNAPSHOT.snapshot_id]: HORNER_X5_SNAPSHOT,
        [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
      };

      const systemResult = evaluateSystem(revision, snapshotsById);
      expect(systemResult.overall_verdict).toBe("meets");
      expect(systemResult.evaluations.length).toBeGreaterThan(0);
      expect(systemResult.validation_scope).toContain("network");
    });

    it("§13.2 Aggregation logic: does_not_meet > not_documented > meets", () => {
      const meetRule: RuleResult = {
        rule_id: "R1",
        rule_version: "2026.g5.1",
        scope: "product",
        verdict: "meets",
        reason_code: ReasonCode.SATISFIED,
        message: "OK",
        required: true,
        subjects: [],
        evidence_refs: [],
      };

      const notDocRule: RuleResult = {
        rule_id: "R2",
        rule_version: "2026.g5.1",
        scope: "power",
        verdict: "not_documented",
        reason_code: ReasonCode.ABSENT_PROPERTY,
        message: "Missing",
        required: true,
        subjects: [],
        evidence_refs: [],
      };

      const failRule: RuleResult = {
        rule_id: "R3",
        rule_version: "2026.g5.1",
        scope: "wiring",
        verdict: "does_not_meet",
        reason_code: ReasonCode.WIRING_INCOMPATIBLE,
        message: "Fail",
        required: true,
        subjects: [],
        evidence_refs: [],
      };

      // 1. All meets -> meets
      expect(aggregateVerdicts([meetRule]).overall_verdict).toBe("meets");

      // 2. Meets + not_documented -> not_documented
      expect(aggregateVerdicts([meetRule, notDocRule]).overall_verdict).toBe("not_documented");

      // 3. Any does_not_meet -> does_not_meet
      expect(aggregateVerdicts([meetRule, notDocRule, failRule]).overall_verdict).toBe("does_not_meet");
    });
  });
});
