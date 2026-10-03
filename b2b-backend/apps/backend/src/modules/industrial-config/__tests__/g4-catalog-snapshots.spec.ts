import { TechnicalSnapshotSchema } from "../schemas/snapshot.schema"
import { PortSchema } from "../schemas/port-terminal.schema"
import { EvidenceRefSchema } from "../schemas/evidence.schema"
import { SnapshotDimensionsSchema } from "../schemas/snapshot.schema"
import {
  G4_SNAPSHOTS,
  G4_DEFINITIONS,
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
} from "../data/g4-catalog-snapshots"
import { canonicalContentSha256 } from "../hash"
import { getDatabasePool } from "../repository"
import { Pool } from "pg"

describe("Gate G4: Catalog Snapshot Verification & Industrial Evidence Auditing", () => {
  let pool: Pool | null = null
  let dbAvailable = false

  beforeAll(async () => {
    try {
      pool = getDatabasePool()
      await pool.query("SELECT 1;")
      dbAvailable = true
    } catch {
      dbAvailable = false
      if (pool) {
        await pool.end().catch(() => {})
        pool = null
      }
    }
  })

  afterAll(async () => {
    if (pool) {
      await pool.end().catch(() => {})
    }
  })

  // ==========================================================================
  // 1. Technical Snapshot Schema Compliance per SKU
  // ==========================================================================
  describe("1. TechnicalSnapshotSchema Validation", () => {
    it("validates CN-X5PRIME-HE-XP5 snapshot against TechnicalSnapshotSchema", () => {
      const parsed = TechnicalSnapshotSchema.parse(HORNER_X5_SNAPSHOT)
      expect(parsed.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(parsed.manufacturer).toBe("Horner Automation")
      expect(parsed.manufacturer_part_number).toBe("HE-XP5")
      expect(parsed.schema_version).toBe("technical_snapshot/2.0")
      expect(parsed.state).toBe("published")
      expect(parsed.snapshot_id).toBe("snp_cn_x5prime_he_xp5_v1")
      expect(parsed.variant_id).toBe("variant_01M41R18MQK0GXGPTYSX0EDZBH")
      expect(parsed.source_ids).toContain("SRC-HE-XP5-DS-MAN1363-R21")
    })

    it("validates CN-N1200 snapshot against TechnicalSnapshotSchema", () => {
      const parsed = TechnicalSnapshotSchema.parse(NOVUS_N1200_SNAPSHOT)
      expect(parsed.sku).toBe("CN-N1200")
      expect(parsed.manufacturer).toBe("NOVUS Automation")
      expect(parsed.manufacturer_part_number).toBe("N1200")
      expect(parsed.schema_version).toBe("technical_snapshot/2.0")
      expect(parsed.state).toBe("published")
      expect(parsed.snapshot_id).toBe("snp_cn_n1200_v1")
      expect(parsed.variant_id).toBe("variant_01M41R18XQ6QNWMX8Z39NMR2NW")
      expect(parsed.source_ids).toContain("SRC-N1200-UG-V2")
    })

    it("validates CN-THT02 snapshot against TechnicalSnapshotSchema", () => {
      const parsed = TechnicalSnapshotSchema.parse(TZONE_THT02_SNAPSHOT)
      expect(parsed.sku).toBe("CN-THT02")
      expect(parsed.manufacturer).toBe("TZ / Tzone")
      expect(parsed.manufacturer_part_number).toBe("THT-02")
      expect(parsed.schema_version).toBe("technical_snapshot/2.0")
      expect(parsed.state).toBe("published")
      expect(parsed.snapshot_id).toBe("snp_cn_tht02_v1")
      expect(parsed.variant_id).toBe("variant_01M41R193J5MPJ16MTX9CAWWRM")
      expect(parsed.source_ids).toContain("SRC-THT02-UM-V1.1")
    })

    it("verifies canonical SHA-256 hash stability for all three snapshots", () => {
      for (const [sku, snapshot] of Object.entries(G4_SNAPSHOTS)) {
        const { content_sha256, ...dataWithoutHash } = snapshot
        const computed = canonicalContentSha256(dataWithoutHash)
        expect(content_sha256).toBe(computed)
        expect(content_sha256).toMatch(/^[a-f0-9]{64}$/)
      }
    })
  })

  // ==========================================================================
  // 2. Critical Attribute & EvidenceRef Audit
  // ==========================================================================
  describe("2. Critical Attribute & EvidenceRef Audit (Megaplan §9.3 & §10.1)", () => {
    const CRITICAL_PROPERTIES = [
      "supply_voltage",
      "supply_nature",
      "input_signals",
      "sensor_compatibility",
      "output_capacities",
      "communication_protocols",
      "communication_roles",
      "baud_rates",
      "mounting_style",
      "physical_dimensions",
    ]

    it.each([
      ["CN-X5PRIME-HE-XP5", HORNER_X5_SNAPSHOT, "SRC-HE-XP5-DS-MAN1363-R21"],
      ["CN-N1200", NOVUS_N1200_SNAPSHOT, "SRC-N1200-UG-V2"],
      ["CN-THT02", TZONE_THT02_SNAPSHOT, "SRC-THT02-UM-V1.1"],
    ])("%s contains all 10 critical industrial attributes with valid EvidenceRefs", (sku, snapshot, expectedSourceId) => {
      expect(snapshot.attributes).toBeDefined()
      expect(snapshot.attributes.length).toBeGreaterThanOrEqual(10)

      for (const prop of CRITICAL_PROPERTIES) {
        const attr = snapshot.attributes.find((a: any) => a.property === prop)
        expect(attr).toBeDefined()
        expect(attr.data_status).toBe("documented")
        expect(attr.value).toBeDefined()
        expect(attr.evidence_refs).toBeDefined()
        expect(attr.evidence_refs.length).toBeGreaterThanOrEqual(1)

        // Validate each evidence ref against EvidenceRefSchema
        for (const ref of attr.evidence_refs) {
          const parsedRef = EvidenceRefSchema.parse(ref)
          expect(parsedRef.source_id).toBe(expectedSourceId)
          expect(parsedRef.page).toBeGreaterThanOrEqual(1)
          expect(Number.isInteger(parsedRef.page)).toBe(true)
          expect(parsedRef.section).toBeDefined()
          expect(parsedRef.section?.length).toBeGreaterThan(0)
          expect(parsedRef.excerpt).toBeDefined()
          expect(parsedRef.excerpt?.length).toBeGreaterThan(0)
        }
      }
    })

    it("verifies explicit power voltage ranges and nature per product", () => {
      // Horner: 10-30 VDC
      const x5Voltage = HORNER_X5_SNAPSHOT.attributes.find((a: any) => a.property === "supply_voltage")
      expect(x5Voltage.value).toEqual({ kind: "range", min: 10, max: 30, unit: "V", nature: "dc" })
      const x5Nature = HORNER_X5_SNAPSHOT.attributes.find((a: any) => a.property === "supply_nature")
      expect(x5Nature.value.value).toBe("dc")

      // Novus: 100-240 VAC
      const n1200Voltage = NOVUS_N1200_SNAPSHOT.attributes.find((a: any) => a.property === "supply_voltage")
      expect(n1200Voltage.value).toEqual({ kind: "range", min: 100, max: 240, unit: "V", nature: "ac" })
      const n1200Nature = NOVUS_N1200_SNAPSHOT.attributes.find((a: any) => a.property === "supply_nature")
      expect(n1200Nature.value.value).toBe("ac")

      // TZone: 5-24 VDC
      const tht02Voltage = TZONE_THT02_SNAPSHOT.attributes.find((a: any) => a.property === "supply_voltage")
      expect(tht02Voltage.value).toEqual({ kind: "range", min: 5, max: 24, unit: "V", nature: "dc" })
      const tht02Nature = TZONE_THT02_SNAPSHOT.attributes.find((a: any) => a.property === "supply_nature")
      expect(tht02Nature.value.value).toBe("dc")
    })

    it("verifies sensor element compatibility per product", () => {
      // Novus N1200 supports universal Pt100 RTD and thermocouples
      const n1200Sensors = NOVUS_N1200_SNAPSHOT.attributes.find((a: any) => a.property === "sensor_compatibility")
      expect(n1200Sensors.value.value).toContain("pt100_3_wire")
      expect(n1200Sensors.value.value).toContain("thermocouple_k")

      // TZone THT02 uses integrated SHT30 element
      const tht02Sensors = TZONE_THT02_SNAPSHOT.attributes.find((a: any) => a.property === "sensor_compatibility")
      expect(tht02Sensors.value.value).toContain("integrated_sht30")
      expect(tht02Sensors.value.value).not.toContain("pt100_3_wire")
    })

    it("verifies communication protocols and RS-485 roles", () => {
      // Horner X5: Modbus RTU master/slave + Modbus TCP
      const x5Protocols = HORNER_X5_SNAPSHOT.attributes.find((a: any) => a.property === "communication_protocols")
      expect(x5Protocols.value.value).toContain("modbus_rtu_master")
      expect(x5Protocols.value.value).toContain("modbus_rtu_slave")
      const x5Roles = HORNER_X5_SNAPSHOT.attributes.find((a: any) => a.property === "communication_roles")
      expect(x5Roles.value.value).toContain("master")

      // Novus N1200: Modbus RTU slave
      const n1200Protocols = NOVUS_N1200_SNAPSHOT.attributes.find((a: any) => a.property === "communication_protocols")
      expect(n1200Protocols.value.value).toContain("modbus_rtu")
      const n1200Role = NOVUS_N1200_SNAPSHOT.attributes.find((a: any) => a.property === "communication_roles")
      expect(n1200Role.value.value).toBe("slave")

      // TZone THT02: Modbus RTU slave
      const tht02Protocols = TZONE_THT02_SNAPSHOT.attributes.find((a: any) => a.property === "communication_protocols")
      expect(tht02Protocols.value.value).toContain("modbus_rtu")
      const tht02Role = TZONE_THT02_SNAPSHOT.attributes.find((a: any) => a.property === "communication_roles")
      expect(tht02Role.value.value).toBe("slave")
    })
  })

  // ==========================================================================
  // 3. Port & Terminal Topology Validation
  // ==========================================================================
  describe("3. PortSchema & Terminal Verification", () => {
    it("validates all ports for Horner X5 against PortSchema", () => {
      expect(HORNER_X5_SNAPSHOT.ports.length).toBe(6)
      for (const port of HORNER_X5_SNAPSHOT.ports) {
        const parsed = PortSchema.parse(port)
        expect(parsed.port_id).toBeDefined()
        expect(parsed.label).toBeDefined()
        expect(parsed.category).toBeDefined()
        expect(parsed.direction).toBeDefined()
        expect(parsed.terminals.length).toBeGreaterThanOrEqual(1)
        for (const term of parsed.terminals) {
          expect(term.label.length).toBeGreaterThan(0)
        }
      }

      const pwr = HORNER_X5_SNAPSHOT.ports.find((p) => p.port_id === "p_power_in")
      expect(pwr?.category).toBe("power")
      expect(pwr?.direction).toBe("input")
      expect(pwr?.terminals.map((t) => t.label)).toEqual(["V+", "V-"])

      const serial = HORNER_X5_SNAPSHOT.ports.find((p) => p.port_id === "p_rs485_mj1")
      expect(serial?.category).toBe("serial_comm")
      expect(serial?.direction).toBe("bidirectional")

      const ethernet = HORNER_X5_SNAPSHOT.ports.find((p) => p.port_id === "p_ethernet_lan")
      expect(ethernet?.category).toBe("ethernet")
      expect(ethernet?.direction).toBe("bidirectional")

      const analogIn = HORNER_X5_SNAPSHOT.ports.find((p) => p.port_id === "p_analog_in")
      expect(analogIn?.category).toBe("analog_input")
      expect(analogIn?.direction).toBe("input")
      expect(analogIn?.terminals.length).toBe(5) // 4 channels + AGND

      const digitalOut = HORNER_X5_SNAPSHOT.ports.find((p) => p.port_id === "p_digital_out")
      expect(digitalOut?.category).toBe("discrete_output")
      expect(digitalOut?.direction).toBe("output")
    })

    it("validates all ports for Novus N1200 against PortSchema", () => {
      expect(NOVUS_N1200_SNAPSHOT.ports.length).toBe(7)
      for (const port of NOVUS_N1200_SNAPSHOT.ports) {
        const parsed = PortSchema.parse(port)
        expect(parsed.port_id).toBeDefined()
        expect(parsed.terminals.length).toBeGreaterThanOrEqual(1)
      }

      const sensorIn = NOVUS_N1200_SNAPSHOT.ports.find((p) => p.port_id === "p_universal_sensor_in")
      expect(sensorIn?.category).toBe("sensor")
      expect(sensorIn?.direction).toBe("input")
      expect(sensorIn?.terminals.map((t) => t.label)).toEqual(["11", "12", "13"])

      const out1 = NOVUS_N1200_SNAPSHOT.ports.find((p) => p.port_id === "p_out1_control")
      expect(out1?.category).toBe("discrete_output")
      expect(out1?.direction).toBe("output")
      expect(out1?.terminals.map((t) => t.label)).toEqual(["4", "5"])

      const analogRetrans = NOVUS_N1200_SNAPSHOT.ports.find((p) => p.port_id === "p_analog_out_retrans")
      expect(analogRetrans?.category).toBe("analog_output")
      expect(analogRetrans?.direction).toBe("output")
      expect(analogRetrans?.terminals.map((t) => t.label)).toEqual(["9", "10"])
    })

    it("validates all ports for TZone THT-02 against PortSchema", () => {
      expect(TZONE_THT02_SNAPSHOT.ports.length).toBe(3)
      for (const port of TZONE_THT02_SNAPSHOT.ports) {
        const parsed = PortSchema.parse(port)
        expect(parsed.port_id).toBeDefined()
        expect(parsed.terminals.length).toBeGreaterThanOrEqual(1)
      }

      const pwr = TZONE_THT02_SNAPSHOT.ports.find((p) => p.port_id === "p_power_in")
      expect(pwr?.category).toBe("power")
      expect(pwr?.direction).toBe("input")
      expect(pwr?.terminals.map((t) => t.label)).toEqual(["V+", "GND"])

      const rs485 = TZONE_THT02_SNAPSHOT.ports.find((p) => p.port_id === "p_rs485")
      expect(rs485?.category).toBe("serial_comm")
      expect(rs485?.direction).toBe("bidirectional")
      expect(rs485?.terminals.map((t) => t.label)).toEqual(["A+", "B-"])

      const sht30 = TZONE_THT02_SNAPSHOT.ports.find((p) => p.port_id === "p_sensor_sht30")
      expect(sht30?.category).toBe("sensor")
      expect(sht30?.direction).toBe("input")
    })
  })

  // ==========================================================================
  // 4. Exact Physical Envelope Dimensions in Meters
  // ==========================================================================
  describe("4. Exact Envelope Dimensions in Meters (Megaplan §8.2 & §9.5)", () => {
    it("validates Horner X5 Prime envelope: 0.120 x 0.091 x 0.060 m (120 x 91 x 60 mm)", () => {
      const dims = SnapshotDimensionsSchema.parse(HORNER_X5_SNAPSHOT.dimensions)
      expect(dims.width_mm).toBe(120.0)
      expect(dims.height_mm).toBe(91.0)
      expect(dims.depth_mm).toBe(60.0)

      expect(dims.envelope_m[0]).toBeCloseTo(0.12, 3)
      expect(dims.envelope_m[1]).toBeCloseTo(0.091, 3)
      expect(dims.envelope_m[2]).toBeCloseTo(0.06, 3)

      expect(dims.envelope_m[0] * 1000).toBe(dims.width_mm)
      expect(dims.envelope_m[1] * 1000).toBe(dims.height_mm)
      expect(dims.envelope_m[2] * 1000).toBe(dims.depth_mm)
    })

    it("validates Novus N1200 envelope: 0.048 x 0.048 x 0.110 m (48 x 48 x 110 mm)", () => {
      const dims = SnapshotDimensionsSchema.parse(NOVUS_N1200_SNAPSHOT.dimensions)
      expect(dims.width_mm).toBe(48.0)
      expect(dims.height_mm).toBe(48.0)
      expect(dims.depth_mm).toBe(110.0)

      expect(dims.envelope_m[0]).toBeCloseTo(0.048, 3)
      expect(dims.envelope_m[1]).toBeCloseTo(0.048, 3)
      expect(dims.envelope_m[2]).toBeCloseTo(0.11, 3)

      expect(dims.envelope_m[0] * 1000).toBe(dims.width_mm)
      expect(dims.envelope_m[1] * 1000).toBe(dims.height_mm)
      expect(dims.envelope_m[2] * 1000).toBe(dims.depth_mm)
    })

    it("validates TZone THT-02 envelope: 0.110 x 0.085 x 0.040 m (110 x 85 x 40 mm)", () => {
      const dims = SnapshotDimensionsSchema.parse(TZONE_THT02_SNAPSHOT.dimensions)
      expect(dims.width_mm).toBe(110.0)
      expect(dims.height_mm).toBe(85.0)
      expect(dims.depth_mm).toBe(40.0)

      expect(dims.envelope_m[0]).toBeCloseTo(0.11, 3)
      expect(dims.envelope_m[1]).toBeCloseTo(0.085, 3)
      expect(dims.envelope_m[2]).toBeCloseTo(0.04, 3)

      expect(dims.envelope_m[0] * 1000).toBe(dims.width_mm)
      expect(dims.envelope_m[1] * 1000).toBe(dims.height_mm)
      expect(dims.envelope_m[2] * 1000).toBe(dims.depth_mm)
    })
  })

  // ==========================================================================
  // 5. Database Persistence Verification (Live PostgreSQL or Mock)
  // ==========================================================================
  describe("5. Live Database Persistence & Catalog Entry Verification", () => {
    it("queries industrial_technical_snapshot for all 3 products in live DB or validates definition consistency", async () => {
      if (!dbAvailable || !pool) {
        console.warn("⚠️ Live PostgreSQL not reachable; performing mock validation of snapshot definitions.")
        expect(G4_DEFINITIONS.length).toBe(3)
        return
      }

      for (const def of G4_DEFINITIONS) {
        const { snapshot } = def
        const res = await pool.query(
          `SELECT id, variant_id, revision, state, schema_version, content_json, content_sha256, reviewed_by
           FROM industrial_technical_snapshot
           WHERE id = $1 AND deleted_at IS NULL;`,
          [snapshot.snapshot_id]
        )

        expect(res.rows.length).toBe(1)
        const row = res.rows[0]
        expect(row.variant_id).toBe(snapshot.variant_id)
        expect(row.state).toBe("published")
        expect(row.revision).toBe(1)
        expect(row.schema_version).toBe("technical_snapshot/2.0")
        expect(row.content_sha256).toBe(snapshot.content_sha256)

        // Verify content_json parses against TechnicalSnapshotSchema
        const content = typeof row.content_json === "string" ? JSON.parse(row.content_json) : row.content_json
        const parsedDbSnapshot = TechnicalSnapshotSchema.parse(content)
        expect(parsedDbSnapshot.sku).toBe(snapshot.sku)
        expect(parsedDbSnapshot.content_sha256).toBe(snapshot.content_sha256)
      }
    })

    it("queries industrial_catalog_entry for all 3 products and verifies active_snapshot_id pointer", async () => {
      if (!dbAvailable || !pool) {
        console.warn("⚠️ Live PostgreSQL not reachable; performing mock validation of catalog entry definitions.")
        expect(G4_DEFINITIONS.length).toBe(3)
        return
      }

      for (const def of G4_DEFINITIONS) {
        const { snapshot, catalogEntryId, catalogMode } = def
        const res = await pool.query(
          `SELECT id, variant_id, active_snapshot_id, enabled, catalog_mode
           FROM industrial_catalog_entry
           WHERE id = $1 AND deleted_at IS NULL;`,
          [catalogEntryId]
        )

        expect(res.rows.length).toBe(1)
        const row = res.rows[0]
        expect(row.variant_id).toBe(snapshot.variant_id)
        expect(row.active_snapshot_id).toBe(snapshot.snapshot_id)
        expect(row.enabled).toBe(true)
        expect(row.catalog_mode).toBe(catalogMode)
      }
    })

    it("verifies that target variant IDs exist in core commerce product_variant table", async () => {
      if (!dbAvailable || !pool) {
        return
      }

      for (const def of G4_DEFINITIONS) {
        const { snapshot } = def
        const res = await pool.query(
          "SELECT id, sku FROM product_variant WHERE id = $1 AND deleted_at IS NULL;",
          [snapshot.variant_id]
        )
        expect(res.rows.length).toBe(1)
        expect(res.rows[0].sku).toBe(snapshot.sku)
      }
    })
  })
})
