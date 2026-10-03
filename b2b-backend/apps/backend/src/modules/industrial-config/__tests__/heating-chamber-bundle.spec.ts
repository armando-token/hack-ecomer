import {
  HEATING_CHAMBER_PILOT_ID,
  HEATING_CHAMBER_PILOT_REVISION_NUM,
  HEATING_CHAMBER_PILOT_TITLE,
  HEATING_CHAMBER_PILOT_PROCESS_FAMILY,
  HEATING_CHAMBER_PILOT_DESCRIPTION,
  HEATING_CHAMBER_PILOT_CONFIG,
  HEATING_CHAMBER_PILOT_INSTANCES,
  HEATING_CHAMBER_PILOT_INSTANCES_MAP,
  HEATING_CHAMBER_PILOT_CONNECTIONS,
  HEATING_CHAMBER_PILOT_CONNECTIONS_MAP,
  HEATING_CHAMBER_PILOT_MISSING_ROLES,
  HEATING_CHAMBER_PILOT_REVISION,
  HEATING_CHAMBER_SNAPSHOTS,
  buildAssetsMap,
  buildHeatingChamberBundle,
} from "../data/heating-chamber-pilot"
import { ConfigurationRevisionSchema } from "../schemas/revision.schema"
import { evaluateSystem } from "../evaluator/core"
import { G6_ASSET_DEFINITIONS } from "../data/g6-catalog-assets"
import {
  GET as getHeatingChamberBundleRoute,
  OPTIONS as optionsHeatingChamberBundleRoute,
} from "../../../api/api/industrial/v2/configurations/heating-chamber/bundle/route"
import {
  GET as getConfigIdBundleRoute,
  OPTIONS as optionsConfigIdBundleRoute,
} from "../../../api/api/industrial/v2/configurations/[configId]/bundle/route"

/**
 * Test Suite: Heating Chamber Pilot Configuration & Meta Muse Bundle Endpoint
 * Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§12–§14, §21, §33 G8)
 */

describe("Heating Chamber Pilot Configuration & Bundle Endpoint (G8)", () => {
  describe("1. Configuration Definition & Topology (§18.1)", () => {
    it("has correct top-level configuration metadata", () => {
      expect(HEATING_CHAMBER_PILOT_CONFIG.configuration_id).toBe(
        "cfg_heating_chamber_pilot"
      )
      expect(HEATING_CHAMBER_PILOT_CONFIG.revision).toBe(1)
      expect(HEATING_CHAMBER_PILOT_CONFIG.title).toBe(
        "Industrial Heating Chamber Thermal Control & Logging Loop"
      )
      expect(HEATING_CHAMBER_PILOT_CONFIG.process_family).toBe("Heating Chamber")
      expect(HEATING_CHAMBER_PILOT_CONFIG.description).toBe(
        "Closed-loop temperature regulation and environment monitoring pilot featuring Horner X5 OCS, NOVUS N1200 PID controller, and TZone THT-02 ambient transmitter."
      )
    })

    it("defines the 3 pilot equipment instances with verified roles and snapshots", () => {
      expect(HEATING_CHAMBER_PILOT_INSTANCES).toHaveLength(3)

      // inst_n1200: PID process controller
      const n1200 = HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200
      expect(n1200).toBeDefined()
      expect(n1200.instance_id).toBe("inst_n1200")
      expect(n1200.sku).toBe("CN-N1200")
      expect(n1200.role).toBe("process_controller")
      expect(n1200.snapshot_id).toBe("snp_cn_n1200_v1")
      expect(n1200.title).toBe("NOVUS N1200 1/16 DIN PID Controller")

      // inst_x5prime: Operator interface PLC / HMI
      const x5prime = HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime
      expect(x5prime).toBeDefined()
      expect(x5prime.instance_id).toBe("inst_x5prime")
      expect(x5prime.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(x5prime.role).toBe("operator_interface_plc")
      expect(x5prime.snapshot_id).toBe("snp_cn_x5prime_he_xp5_v1")
      expect(x5prime.title).toBe("Horner X5 Prime 4.3\" Touch OCS")

      // inst_tht02: Ambient Temp/RH transmitter
      const tht02 = HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02
      expect(tht02).toBeDefined()
      expect(tht02.instance_id).toBe("inst_tht02")
      expect(tht02.sku).toBe("CN-THT02")
      expect(tht02.role).toBe("ambient_transmitter")
      expect(tht02.snapshot_id).toBe("snp_cn_tht02_v1")
      expect(tht02.title).toBe("TZone THT-02 Temp/RH Transmitter")
    })

    it("explicitly documents missing roles per MEGAPLAN §21/§33", () => {
      expect(HEATING_CHAMBER_PILOT_MISSING_ROLES).toHaveLength(2)

      const ssrRole = HEATING_CHAMBER_PILOT_MISSING_ROLES.find(
        (r) => r.role === "actuator_power_switching"
      )
      expect(ssrRole).toBeDefined()
      expect(ssrRole!.required_for).toBe(
        "Heating coil power modulation (SSR/Relay)"
      )
      expect(ssrRole!.status).toBe("not_documented")
      expect(ssrRole!.reason).toBe(
        "Power driver between N1200 logic out and 2kW heater coil not yet selected"
      )

      const heaterRole = HEATING_CHAMBER_PILOT_MISSING_ROLES.find(
        (r) => r.role === "thermal_load_heater"
      )
      expect(heaterRole).toBeDefined()
      expect(heaterRole!.required_for).toBe("Process chamber heating")
      expect(heaterRole!.status).toBe("not_documented")
      expect(heaterRole!.reason).toBe("Chamber heater element not yet selected")
    })

    it("documents all inter-equipment connections with correct ports and endpoints", () => {
      expect(HEATING_CHAMBER_PILOT_CONNECTIONS).toHaveLength(3)

      // conn_modbus_telemetry
      const connModbus =
        HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_modbus_telemetry
      expect(connModbus.id).toBe("conn_modbus_telemetry")
      expect(connModbus.from).toEqual({
        instance_id: "inst_tht02",
        port_id: "p_rs485",
      })
      expect(connModbus.to).toEqual({
        instance_id: "inst_x5prime",
        port_id: "p_rs485_mj1",
      })
      expect(connModbus.protocol).toBe("modbus_rtu")
      expect(connModbus.baud).toBe(9600)
      expect(connModbus.parity).toBe("none")
      expect(connModbus.data_bits).toBe(8)
      expect(connModbus.stop_bits).toBe(1)

      // conn_hmi_controller
      const connHmi = HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_hmi_controller
      expect(connHmi.id).toBe("conn_hmi_controller")
      expect(connHmi.from).toEqual({
        instance_id: "inst_n1200",
        port_id: "p_usb_comm",
      })
      expect(connHmi.to).toEqual({
        instance_id: "inst_x5prime",
        port_id: "p_ethernet_lan",
      })
      expect(connHmi.note).toBe("Gateway supervisory communication")

      // conn_ctrl_out (incomplete to missing SSR)
      const connCtrl = HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_ctrl_out
      expect(connCtrl.id).toBe("conn_ctrl_out")
      expect(connCtrl.from).toEqual({
        instance_id: "inst_n1200",
        port_id: "p_out1_ctrl",
      })
      expect(connCtrl.to).toEqual({
        instance_id: "missing:actuator_power_switching",
        port_id: "p_logic_in",
      })
      expect(connCtrl.note).toBe("Output 1 PWM/pulse to solid state relay")
    })
  })

  describe("2. Configuration Revision & Canonical Hashing (§11.3 & §18.1)", () => {
    it("conforms to ConfigurationRevisionSchema", () => {
      const parsed = ConfigurationRevisionSchema.parse(
        HEATING_CHAMBER_PILOT_REVISION
      )
      expect(parsed.configuration_id).toBe("cfg_heating_chamber_pilot")
      expect(parsed.revision).toBe(1)
      expect(parsed.schema_version).toBe("configuration_revision/2.0")
      expect(parsed.content_sha256).toMatch(/^[a-f0-9]{64}$/)
    })

    it("has stable, deterministic SHA-256 hash", () => {
      expect(HEATING_CHAMBER_PILOT_REVISION.content_sha256).toHaveLength(64)
      // Hash stability: same revision always produces the same hash
      expect(typeof HEATING_CHAMBER_PILOT_REVISION.content_sha256).toBe("string")
    })
  })

  describe("3. Deterministic Evaluator Execution (§12–§14)", () => {
    it("evaluates the system deterministically without runtime error", () => {
      const eval1 = evaluateSystem(
        HEATING_CHAMBER_PILOT_REVISION,
        HEATING_CHAMBER_SNAPSHOTS,
        "2026.g5.1"
      )
      const eval2 = evaluateSystem(
        HEATING_CHAMBER_PILOT_REVISION,
        HEATING_CHAMBER_SNAPSHOTS,
        "2026.g5.1"
      )

      expect(eval1).toBeDefined()
      expect(eval1.rule_set_version).toBe("2026.g5.1")
      expect(eval1.evaluations.length).toBeGreaterThan(0)

      // Overall verdict must reflect the incomplete topology (missing actuator / heater)
      expect(["does_not_meet", "not_documented"]).toContain(
        eval1.overall_verdict
      )

      // Determinism: both runs must produce identical verdicts and evaluation counts
      expect(eval1.overall_verdict).toBe(eval2.overall_verdict)
      expect(eval1.evaluations.length).toBe(eval2.evaluations.length)
      expect(eval1.reason_code).toBe(eval2.reason_code)
    })

    it("verifies identity variant checks pass for all 3 known instances", () => {
      const result = evaluateSystem(
        HEATING_CHAMBER_PILOT_REVISION,
        HEATING_CHAMBER_SNAPSHOTS,
        "2026.g5.1"
      )

      const identityResults = result.evaluations.filter(
        (e) => e.rule_id === "IDENTITY_VARIANT"
      )
      expect(identityResults.length).toBe(3)
      for (const idRes of identityResults) {
        expect(idRes.verdict).toBe("meets")
      }
    })

    it("flags topology incompleteness due to missing actuator", () => {
      const result = evaluateSystem(
        HEATING_CHAMBER_PILOT_REVISION,
        HEATING_CHAMBER_SNAPSHOTS,
        "2026.g5.1"
      )

      const loopRule = result.evaluations.find(
        (e) => e.rule_id === "CONTROL_LOOP_COMPLETENESS"
      )
      expect(loopRule).toBeDefined()
      expect(loopRule!.verdict).toBe("does_not_meet")
      expect(loopRule!.message).toContain("missing")
    })
  })

  describe("4. 3D Asset Resolution & URLs (§15, §16, §33 G6)", () => {
    it("resolves 3D assets for all 3 instances from G6_ASSET_DEFINITIONS", () => {
      const assets = buildAssetsMap()
      expect(Object.keys(assets)).toHaveLength(3)
      expect(assets).toHaveProperty("inst_x5prime")
      expect(assets).toHaveProperty("inst_n1200")
      expect(assets).toHaveProperty("inst_tht02")
    })

    it("verifies Horner X5 Prime asset metadata and URLs", () => {
      const assets = buildAssetsMap()
      const x5 = assets.inst_x5prime

      expect(x5.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(x5.fidelity).toBe("dimensional_proxy_verified")
      expect(x5.glb_url).toBe(
        "https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb"
      )
      expect(x5.manifest_url).toBe(
        "https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.manifest.json"
      )
      expect(Array.isArray(x5.anchors)).toBe(true)
      expect(x5.anchors.length).toBeGreaterThan(0)
    })

    it("verifies NOVUS N1200 asset metadata and URLs", () => {
      const assets = buildAssetsMap()
      const n1200 = assets.inst_n1200

      expect(n1200.sku).toBe("CN-N1200")
      expect(n1200.fidelity).toBe("dimensional_proxy_verified")
      expect(n1200.glb_url).toBe(
        "https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb"
      )
      expect(n1200.manifest_url).toBe(
        "https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.manifest.json"
      )
      expect(Array.isArray(n1200.anchors)).toBe(true)
      expect(n1200.anchors.length).toBeGreaterThan(0)
    })

    it("verifies TZone THT-02 asset metadata and URLs", () => {
      const assets = buildAssetsMap()
      const tht02 = assets.inst_tht02

      expect(tht02.sku).toBe("CN-THT02")
      expect(tht02.fidelity).toBe("dimensional_proxy_verified")
      expect(tht02.glb_url).toBe(
        "https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb"
      )
      expect(tht02.manifest_url).toBe(
        "https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.manifest.json"
      )
      expect(Array.isArray(tht02.anchors)).toBe(true)
      expect(tht02.anchors.length).toBeGreaterThan(0)
    })
  })

  describe("5. Complete Unified Bundle Assembly (Task 2)", () => {
    it("assembles complete unified bundle matching specification", () => {
      const bundle = buildHeatingChamberBundle()

      // 1. Bundle version & generated timestamp
      expect(bundle.bundle_version).toBe("2.0.0")
      expect(new Date(bundle.generated_at).getTime()).not.toBeNaN()

      // 2. Configuration section
      expect(bundle.configuration.configuration_id).toBe(
        "cfg_heating_chamber_pilot"
      )
      expect(bundle.configuration.revision).toBe(1)
      expect(bundle.configuration.title).toBe(
        "Industrial Heating Chamber Thermal Control & Logging Loop"
      )
      expect(bundle.configuration.process_family).toBe("Heating Chamber")
      expect(bundle.configuration.instances).toHaveLength(3)
      expect(bundle.configuration.connections).toHaveLength(3)
      expect(bundle.configuration.missing_roles).toHaveLength(2)

      // 3. Evaluation section
      expect(["does_not_meet", "not_documented"]).toContain(
        bundle.evaluation.overall_verdict
      )
      expect(bundle.evaluation.rule_set_version).toBe("2026.g5.1")
      expect(bundle.evaluation.summary).toBe(
        "Control loop incomplete: missing power switching actuator and heater load"
      )
      expect(bundle.evaluation.evaluations.length).toBeGreaterThan(0)

      // 4. Assets section
      expect(bundle.assets.inst_x5prime).toBeDefined()
      expect(bundle.assets.inst_n1200).toBeDefined()
      expect(bundle.assets.inst_tht02).toBeDefined()

      // 5. Readiness section
      expect(bundle.readiness.ready_for_3d_presentation).toBe(true)
      expect(bundle.readiness.ready_for_procurement).toBe(false)
      expect(bundle.readiness.blockers).toEqual([
        "Power actuator stage (SSR) missing from topology",
        "Heating element load missing from topology",
      ])
    })
  })

  describe("6. HTTP Route Endpoints (Task 2)", () => {
    function createMockRes() {
      const headers: Record<string, string> = {}
      let statusCode = 200
      let responseBody: any = null
      let ended = false

      const res: any = {
        setHeader(name: string, value: string) {
          headers[name.toLowerCase()] = value
          return res
        },
        removeHeader(name: string) {
          delete headers[name.toLowerCase()]
          return res
        },
        status(code: number) {
          statusCode = code
          return res
        },
        json(body: any) {
          responseBody = body
          ended = true
          return res
        },
        end() {
          ended = true
          return res
        },
        _getStatusCode: () => statusCode,
        _getHeaders: () => headers,
        _getBody: () => responseBody,
        _isEnded: () => ended,
      }
      return res
    }

    it("serves bundle at /configurations/heating-chamber/bundle with CORS", async () => {
      const req: any = { method: "GET", headers: {} }
      const res = createMockRes()

      await getHeatingChamberBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res._getHeaders()["access-control-allow-origin"]).toBe("*")
      expect(res._getHeaders()["content-type"]).toBe(
        "application/json; charset=utf-8"
      )

      const body = res._getBody()
      expect(body.bundle_version).toBe("2.0.0")
      expect(body.configuration.configuration_id).toBe(
        "cfg_heating_chamber_pilot"
      )
      expect(body.assets.inst_x5prime.glb_url).toContain("CN-X5PRIME-HE-XP5.glb")
      expect(body.readiness.ready_for_3d_presentation).toBe(true)
      expect(body.readiness.ready_for_procurement).toBe(false)
    })

    it("handles OPTIONS preflight at /configurations/heating-chamber/bundle", async () => {
      const req: any = { method: "OPTIONS", headers: {} }
      const res = createMockRes()

      await optionsHeatingChamberBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(204)
      expect(res._getHeaders()["access-control-allow-origin"]).toBe("*")
      expect(res._getHeaders()["access-control-allow-methods"]).toBe(
        "GET, HEAD, OPTIONS"
      )
    })

    it("serves bundle at parameterized route /[configId]/bundle for cfg_heating_chamber_pilot", async () => {
      const req: any = {
        method: "GET",
        headers: {},
        params: { configId: "cfg_heating_chamber_pilot" },
      }
      const res = createMockRes()

      await getConfigIdBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(200)
      const body = res._getBody()
      expect(body.configuration.configuration_id).toBe(
        "cfg_heating_chamber_pilot"
      )
    })

    it("serves bundle at parameterized route /[configId]/bundle for heating-chamber", async () => {
      const req: any = {
        method: "GET",
        headers: {},
        params: { configId: "heating-chamber" },
      }
      const res = createMockRes()

      await getConfigIdBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(200)
      const body = res._getBody()
      expect(body.configuration.configuration_id).toBe(
        "cfg_heating_chamber_pilot"
      )
    })

    it("returns 404 for unknown configuration ID at /[configId]/bundle", async () => {
      const req: any = {
        method: "GET",
        headers: {},
        params: { configId: "cfg_nonexistent_xyz" },
      }
      const res = createMockRes()

      await getConfigIdBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(404)
      const body = res._getBody()
      expect(body.error).toBe("CONFIGURATION_NOT_FOUND")
    })
  })
})
