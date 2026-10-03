import {
  // Quantity & Range
  QuantitySchema,
  RangeSchema,
  DiscreteSchema,
  DimensionQuantitySchema,
  DimensionRangeSchema,
  CANONICAL_UNITS,
  // Evidence
  EvidenceRefSchema,
  BoundingBoxSchema,
  // Port & Terminal
  PortSchema,
  TerminalSchema,
  PortCategoryEnum,
  PortDirectionEnum,
  // Snapshot
  TechnicalSnapshotSchema,
  SnapshotDimensionsSchema,
  // Asset
  IndustrialAssetSchema,
  AssetBindingSchema,
  AssetKindEnum,
  AssetVisibilityEnum,
  AssetStateEnum,
  BindingKindEnum,
  // Configuration
  ConfigurationSchema,
  InstanceSchema,
  ConnectionSchema,
  ProcessObjectSchema,
  NetworkSchema,
  VariableSchema,
  ControlLoopSchema,
  // Revision
  ConfigurationRevisionSchema,
  // Evaluation
  EvaluationResultSchema,
  VerdictEnum,
  // Money
  MoneyMinorSchema,
  parseDecimalToMoney,
  minorToMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  compareMoney,
  // Quote
  IndustrialQuoteSchema,
  IndustrialQuoteLineSchema,
  QuoteStateEnum,
} from "../schemas";

describe("Industrial Config Zod Schemas Suite (Gate G3)", () => {
  // --------------------------------------------------------------------------
  // 1. Quantity, Range, Discrete & Units
  // --------------------------------------------------------------------------
  describe("1. Quantity, Range, Discrete & Units (quantity-range.schema.ts)", () => {
    it("accepts valid physical quantities across canonical units", () => {
      const samples = [
        { value: 1.85, unit: "m", dimension: "length" },
        { value: 96, unit: "mm", dimension: "dimension" },
        { value: -25.5, unit: "Cel", dimension: "temperature" },
        { value: 20, unit: "mA", dimension: "current" },
        { value: 24, unit: "V", dimension: "voltage", nature: "dc" as const },
        { value: 230, unit: "V", dimension: "voltage", nature: "ac" as const },
        { value: 500, unit: "W", dimension: "power" },
        { value: 65, unit: "%RH", dimension: "humidity" },
        { value: 10, unit: "s", dimension: "time" },
      ];

      for (const sample of samples) {
        const parsed = QuantitySchema.parse(sample);
        expect(parsed.value).toBe(sample.value);
        expect(parsed.unit).toBe(sample.unit);
      }
    });

    it("rejects NaN, Infinity, -Infinity in Quantity", () => {
      expect(() => QuantitySchema.parse({ value: NaN, unit: "Cel" })).toThrow();
      expect(() => QuantitySchema.parse({ value: Infinity, unit: "Cel" })).toThrow();
      expect(() => QuantitySchema.parse({ value: -Infinity, unit: "Cel" })).toThrow();
    });

    it("rejects empty unit in Quantity", () => {
      expect(() => QuantitySchema.parse({ value: 10, unit: "" })).toThrow();
    });

    it("validates DimensionQuantity strictly non-negative", () => {
      expect(DimensionQuantitySchema.parse({ value: 100, unit: "mm" })).toBeDefined();
      expect(DimensionQuantitySchema.parse({ value: 0, unit: "mm" })).toBeDefined();
      expect(() =>
        DimensionQuantitySchema.parse({ value: -5, unit: "mm" })
      ).toThrow(/Dimensional quantities must be non-negative/);
    });

    it("accepts valid Range and defaults inclusive flags to true", () => {
      const range = RangeSchema.parse({
        min: -50,
        max: 150,
        unit: "Cel",
        dimension: "temperature",
      });

      expect(range.min).toBe(-50);
      expect(range.max).toBe(150);
      expect(range.inclusive_min).toBe(true);
      expect(range.inclusive_max).toBe(true);
    });

    it("rejects inverted Range (min > max)", () => {
      expect(() =>
        RangeSchema.parse({
          min: 100,
          max: 20,
          unit: "Cel",
        })
      ).toThrow(/Inverted range: min must be less than or equal to max/);
    });

    it("rejects NaN or Infinity in Range", () => {
      expect(() => RangeSchema.parse({ min: NaN, max: 10, unit: "V" })).toThrow();
      expect(() => RangeSchema.parse({ min: 0, max: Infinity, unit: "V" })).toThrow();
    });

    it("validates DimensionRange strictly non-negative", () => {
      expect(DimensionRangeSchema.parse({ min: 0, max: 100, unit: "mm" })).toBeDefined();
      expect(() => DimensionRangeSchema.parse({ min: -10, max: 50, unit: "mm" })).toThrow();
    });

    it("accepts valid Discrete values (string, integer, boolean)", () => {
      expect(DiscreteSchema.parse({ value: "MODBUS_RTU", label: "Protocol" })).toBeDefined();
      expect(DiscreteSchema.parse({ value: 8, label: "Digital inputs" })).toBeDefined();
      expect(DiscreteSchema.parse({ value: true, label: "Relay energized" })).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 2. EvidenceRef Schema
  // --------------------------------------------------------------------------
  describe("2. EvidenceRef (evidence.schema.ts)", () => {
    it("accepts valid EvidenceRef with complete attributes", () => {
      const evidence = EvidenceRefSchema.parse({
        source_id: "src_novus_n1040_datasheet_v2",
        page: 3,
        section: "3. Specifications",
        excerpt: "Supply: 100 to 240 Vac / dc (± 10 %)",
        attribute_path: "attributes.supply_voltage",
        applicability: "standard_power_option",
        printed_page_label: "Page 3",
        bbox: [72, 140, 480, 220],
      });

      expect(evidence.source_id).toBe("src_novus_n1040_datasheet_v2");
      expect(evidence.page).toBe(3);
      expect(evidence.bbox).toEqual([72, 140, 480, 220]);
    });

    it("rejects 0 or negative page numbers (must be 1-based physical page)", () => {
      expect(() =>
        EvidenceRefSchema.parse({
          source_id: "src_1",
          page: 0,
        })
      ).toThrow(/page must be >= 1/);

      expect(() =>
        EvidenceRefSchema.parse({
          source_id: "src_1",
          page: -2,
        })
      ).toThrow(/page must be >= 1/);
    });

    it("rejects non-integer page numbers", () => {
      expect(() =>
        EvidenceRefSchema.parse({
          source_id: "src_1",
          page: 3.5,
        })
      ).toThrow(/page must be an integer/);
    });

    it("rejects missing required source_id or page", () => {
      expect(() => EvidenceRefSchema.parse({ page: 1 })).toThrow();
      expect(() => EvidenceRefSchema.parse({ source_id: "src_1" })).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Port & Terminal Schema
  // --------------------------------------------------------------------------
  describe("3. Port & Terminal (port-terminal.schema.ts)", () => {
    it("accepts valid ports across all categories and directions", () => {
      const categories = [
        "power",
        "discrete_input",
        "discrete_output",
        "analog_input",
        "analog_output",
        "serial_comm",
        "ethernet",
        "sensor",
      ] as const;

      for (const cat of categories) {
        const port = PortSchema.parse({
          port_id: `port_${cat}`,
          label: `Port for ${cat}`,
          category: cat,
          direction: "bidirectional",
          signal_type: "standard",
          terminals: [
            { label: "1", function: "signal_pos" },
            { label: "2", function: "signal_neg" },
          ],
        });

        expect(port.category).toBe(cat);
        expect(port.terminals).toHaveLength(2);
      }
    });

    it("rejects invalid port category", () => {
      expect(() =>
        PortSchema.parse({
          port_id: "p1",
          label: "Invalid Port",
          category: "wireless_telepathy",
          direction: "input",
        })
      ).toThrow();
    });

    it("rejects invalid port direction", () => {
      expect(() =>
        PortSchema.parse({
          port_id: "p1",
          label: "Invalid Port",
          category: "sensor",
          direction: "both_ways",
        })
      ).toThrow();
    });

    it("validates Terminal schema", () => {
      const term = TerminalSchema.parse({ label: "L1", function: "Phase 1 AC" });
      expect(term.label).toBe("L1");
      expect(() => TerminalSchema.parse({ label: "" })).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Technical Snapshot Schema
  // --------------------------------------------------------------------------
  describe("4. Technical Snapshot (snapshot.schema.ts)", () => {
    const validSha256 =
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    it("accepts a complete TechnicalSnapshot per Megaplan §9.2", () => {
      const snapshot = TechnicalSnapshotSchema.parse({
        snapshot_id: "ts_SYN_CTRL_01_r1",
        variant_id: "variant_SYN_CTRL_01",
        sku: "MUSE-SYN-CTRL-01",
        manufacturer: "Novus",
        manufacturer_part_number: "N1040-PR",
        technical_revision: "rev_1.0.0",
        schema_version: "technical_snapshot/2.0",
        state: "published",
        attributes: [
          { property: "supply_voltage", value: { value: 24, unit: "V", nature: "dc" } },
        ],
        ports: [
          {
            port_id: "p_power",
            label: "Power Input",
            category: "power",
            direction: "input",
            terminals: [{ label: "1" }, { label: "2" }],
          },
        ],
        dimensions: {
          width_mm: 48,
          height_mm: 48,
          depth_mm: 80,
          envelope_m: [0.048, 0.048, 0.08],
        },
        mounting: ["1/16 DIN panel mount"],
        capabilities: ["PID temperature control"],
        source_ids: ["src_novus_n1040_datasheet"],
        content_sha256: validSha256,
        published_at: "2026-10-03T18:00:00Z",
        reviewed_by: "eng_lead_01",
      });

      expect(snapshot.snapshot_id).toBe("ts_SYN_CTRL_01_r1");
      expect(snapshot.state).toBe("published");
      expect(snapshot.schema_version).toBe("technical_snapshot/2.0");
      expect(snapshot.ports).toHaveLength(1);
    });

    it("accepts all valid snapshot states (draft, reviewed, published, retired)", () => {
      const states = ["draft", "reviewed", "published", "retired"] as const;
      for (const st of states) {
        const snap = TechnicalSnapshotSchema.parse({
          snapshot_id: `snap_${st}`,
          variant_id: "var_1",
          sku: "SKU-1",
          technical_revision: "1.0",
          state: st,
          source_ids: [],
          content_sha256: validSha256,
        });
        expect(snap.state).toBe(st);
      }
    });

    it("rejects non-64-char or non-hex content_sha256", () => {
      // Too short
      expect(() =>
        TechnicalSnapshotSchema.parse({
          snapshot_id: "snap_1",
          variant_id: "var_1",
          sku: "SKU-1",
          technical_revision: "1.0",
          state: "draft",
          content_sha256: "short_hash",
        })
      ).toThrow(/Must be a 64-character lowercase hex/);

      // Uppercase characters
      expect(() =>
        TechnicalSnapshotSchema.parse({
          snapshot_id: "snap_1",
          variant_id: "var_1",
          sku: "SKU-1",
          technical_revision: "1.0",
          state: "draft",
          content_sha256: validSha256.toUpperCase(),
        })
      ).toThrow(/Must be a 64-character lowercase hex/);
    });

    it("rejects negative dimensions", () => {
      expect(() =>
        SnapshotDimensionsSchema.parse({
          width_mm: -48,
          height_mm: 48,
          depth_mm: 80,
          envelope_m: [0.048, 0.048, 0.08],
        })
      ).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 5. Industrial Asset Schema
  // --------------------------------------------------------------------------
  describe("5. Industrial Asset & Binding (asset.schema.ts)", () => {
    const validSha256 =
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

    it("accepts valid IndustrialAsset entity", () => {
      const asset = IndustrialAssetSchema.parse({
        id: "asset_glb_ctrl_01",
        variant_id: "var_ctrl_01",
        snapshot_id: "snap_ctrl_01",
        kind: "model_glb",
        revision: "v1.2",
        sha256: validSha256,
        bytes: 1450200,
        mime: "model/gltf-binary",
        storage_key: "models/controllers/ctrl_01_v1.2.glb",
        visibility: "public",
        state: "active",
        manifest_json: { lod: 0, vertices: 2400 },
      });

      expect(asset.kind).toBe("model_glb");
      expect(asset.visibility).toBe("public");
      expect(asset.bytes).toBe(1450200);
    });

    it("rejects non-positive bytes in IndustrialAsset", () => {
      expect(() =>
        IndustrialAssetSchema.parse({
          id: "asset_1",
          kind: "drawing",
          revision: "1",
          sha256: validSha256,
          bytes: 0,
          mime: "image/svg+xml",
          storage_key: "k",
          visibility: "internal",
          state: "active",
        })
      ).toThrow(/bytes must be a positive integer/);
    });

    it("accepts valid AssetBinding entity", () => {
      const binding = AssetBindingSchema.parse({
        id: "binding_01",
        snapshot_id: "snap_01",
        asset_id: "asset_01",
        binding_kind: "primary_3d",
      });

      expect(binding.binding_kind).toBe("primary_3d");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Configuration & Graph Entities Schema
  // --------------------------------------------------------------------------
  describe("6. Configuration & Graph Entities (configuration.schema.ts)", () => {
    it("accepts valid Configuration across lifecycle states", () => {
      const states = ["draft", "evaluated", "ready", "archived"] as const;
      for (const st of states) {
        const config = ConfigurationSchema.parse({
          id: `config_${st}`,
          owner_id: "user_owner_01",
          title: "Thermal Tank Loop Solution",
          current_revision: 1,
          lifecycle: st,
        });

        expect(config.lifecycle).toBe(st);
        expect(config.current_revision).toBe(1);
      }
    });

    it("rejects current_revision < 1", () => {
      expect(() =>
        ConfigurationSchema.parse({
          id: "cfg_1",
          owner_id: "usr_1",
          current_revision: 0,
          lifecycle: "draft",
        })
      ).toThrow(/current_revision must be >= 1/);
    });

    it("validates Instance placed equipment", () => {
      const inst = InstanceSchema.parse({
        instance_id: "inst_controller_01",
        variant_id: "var_ctrl_1",
        snapshot_id: "snap_ctrl_1",
        model_asset_id: "asset_glb_01",
        user_label: "Panel PID Controller",
      });

      expect(inst.instance_id).toBe("inst_controller_01");
    });

    it("validates Connection between instance ports", () => {
      const conn = ConnectionSchema.parse({
        connection_id: "conn_01",
        from_instance_id: "inst_sensor_01",
        from_port_id: "analog_out_1",
        to_instance_id: "inst_controller_01",
        to_port_id: "pv_in_1",
      });

      expect(conn.from_instance_id).toBe("inst_sensor_01");
    });

    it("validates ProcessObject, Network, Variable, and ControlLoop", () => {
      const proc = ProcessObjectSchema.parse({
        id: "po_tank_01",
        family: "thermal_tank",
        dimensional_status: "user_provided",
        parameters: { volume_liters: 200 },
      });
      expect(proc.family).toBe("thermal_tank");

      const net = NetworkSchema.parse({
        network_id: "net_rs485_01",
        protocol: "MODBUS_RTU",
        members: [{ instance_id: "inst_1", address: 1, role: "master" }],
      });
      expect(net.protocol).toBe("MODBUS_RTU");

      const variable = VariableSchema.parse({
        variable_id: "var_temp_pv",
        label: "Tank Temperature",
        unit: "Cel",
        dimension: "temperature",
        source_kind: "port",
        source_reference: "inst_sensor_01:pv_out",
      });
      expect(variable.source_kind).toBe("port");

      const loop = ControlLoopSchema.parse({
        loop_id: "loop_temp_01",
        name: "Tank Heating PID",
        pv_variable_id: "var_temp_pv",
        sp_variable_id: "var_temp_sp",
        controller_instance_id: "inst_controller_01",
        actuator_instance_id: "inst_ssr_01",
        control_algorithm: "PID",
      });
      expect(loop.control_algorithm).toBe("PID");
    });
  });

  // --------------------------------------------------------------------------
  // 7. Configuration Revision Schema
  // --------------------------------------------------------------------------
  describe("7. Configuration Revision (revision.schema.ts)", () => {
    const validSha256 =
      "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae";

    it("accepts valid ConfigurationRevision", () => {
      const rev = ConfigurationRevisionSchema.parse({
        id: "rev_001",
        configuration_id: "cfg_001",
        revision: 1,
        schema_version: "configuration_revision/2.0",
        graph_json: {
          instances: [],
          connections: [],
        },
        requirements_json: {
          pv_range: { min: 20, max: 80, unit: "Cel" },
        },
        content_sha256: validSha256,
        created_by: "usr_lead",
      });

      expect(rev.revision).toBe(1);
      expect(rev.content_sha256).toBe(validSha256);
    });

    it("rejects non-positive revision", () => {
      expect(() =>
        ConfigurationRevisionSchema.parse({
          id: "rev_0",
          configuration_id: "cfg_1",
          revision: 0,
          schema_version: "2.0",
          graph_json: {},
          content_sha256: validSha256,
        })
      ).toThrow(/revision must be an integer >= 1/);
    });
  });

  // --------------------------------------------------------------------------
  // 8. Evaluation Result Schema
  // --------------------------------------------------------------------------
  describe("8. Evaluation Result (evaluation.schema.ts)", () => {
    const validSha256 =
      "fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9";

    it("accepts valid EvaluationResult with tri-state verdicts", () => {
      const result = EvaluationResultSchema.parse({
        id: "eval_01",
        configuration_id: "cfg_01",
        config_revision: 2,
        input_sha256: validSha256,
        snapshot_set_json: ["snap_1", "snap_2"],
        rules_version: "industrial_rules_v2.0",
        result_json: {
          overall_verdict: "meets",
          evaluations: [
            {
              rule_id: "rule_supply_voltage",
              property: "supply_voltage",
              verdict: "meets",
              reason: "Supply 24VDC is compatible with controller power port",
            },
            {
              rule_id: "rule_humidity_limit",
              property: "operating_humidity",
              verdict: "not_documented",
              reason: "Sensor humidity rating not documented in datasheet",
            },
          ],
        },
      });

      expect(result.result_json.overall_verdict).toBe("meets");
      expect(result.result_json.evaluations).toHaveLength(2);
      expect(result.result_json.evaluations[1].verdict).toBe("not_documented");
    });

    it("rejects invalid evaluation verdict outside tri-state set", () => {
      expect(() =>
        EvaluationResultSchema.parse({
          id: "eval_bad",
          input_sha256: validSha256,
          snapshot_set_json: [],
          rules_version: "v1",
          result_json: {
            overall_verdict: "approved", // invalid!
            evaluations: [],
          },
        })
      ).toThrow();
    });
  });

  // --------------------------------------------------------------------------
  // 9. Money Minor Schema & Exact Arithmetic
  // --------------------------------------------------------------------------
  describe("9. Money Minor Schema & Exact Arithmetic (money.schema.ts)", () => {
    it("validates compliant MoneyMinor representation", () => {
      const money = MoneyMinorSchema.parse({
        currency: "USD",
        scale: 2,
        minor: "89000",
        decimal: "890.00",
      });

      expect(money.currency).toBe("USD");
      expect(money.minor).toBe("89000");
      expect(money.decimal).toBe("890.00");
    });

    it("rejects mismatch between minor integer string and decimal string", () => {
      expect(() =>
        MoneyMinorSchema.parse({
          currency: "USD",
          scale: 2,
          minor: "89000",
          decimal: "100.00", // Mismatch!
        })
      ).toThrow(/Monetary integrity error/);
    });

    it("parses decimal string into exact MoneyMinor without IEEE-754 errors", () => {
      // Classic 0.1 + 0.2 floating point anomaly
      const m1 = parseDecimalToMoney("0.10", "USD", 2);
      const m2 = parseDecimalToMoney("0.20", "USD", 2);
      const sum = addMoney(m1, m2);

      expect(sum.minor).toBe("30");
      expect(sum.decimal).toBe("0.30");

      // 1.15 * 100 in IEEE-754 is 114.99999999999999
      const m115 = parseDecimalToMoney("1.15", "USD", 2);
      expect(m115.minor).toBe("115");

      // 19.99 * 100 in IEEE-754 is 1998.9999999999998
      const m1999 = parseDecimalToMoney("19.99", "USD", 2);
      expect(m1999.minor).toBe("1999");
    });

    it("performs exact multiplication and additions", () => {
      const unitPrice = parseDecimalToMoney("19.99", "USD", 2);
      const subtotal = multiplyMoney(unitPrice, 3);

      expect(subtotal.minor).toBe("5997");
      expect(subtotal.decimal).toBe("59.97");

      const shipping = parseDecimalToMoney("10.00", "USD", 2);
      const total = addMoney(subtotal, shipping);

      expect(total.minor).toBe("6997");
      expect(total.decimal).toBe("69.97");

      const discounted = subtractMoney(total, parseDecimalToMoney("5.00", "USD", 2));
      expect(discounted.minor).toBe("6497");
      expect(discounted.decimal).toBe("64.97");
    });

    it("rejects addition/subtraction across mismatched currencies or scales", () => {
      const usd = parseDecimalToMoney("100.00", "USD", 2);
      const pen = parseDecimalToMoney("100.00", "PEN", 2);

      expect(() => addMoney(usd, pen)).toThrow(TypeError);
      expect(() => subtractMoney(usd, pen)).toThrow(TypeError);
    });

    it("rejects non-integer or negative quantities in multiplication", () => {
      const price = parseDecimalToMoney("50.00", "USD", 2);

      expect(() => multiplyMoney(price, 2.5)).toThrow(TypeError);
      expect(() => multiplyMoney(price, -1)).toThrow(TypeError);
    });

    it("rejects decimal strings exceeding scale precision", () => {
      expect(() => parseDecimalToMoney("19.999", "USD", 2)).toThrow(
        /Monetary precision overflow/
      );
    });

    it("compares MoneyMinor amounts accurately", () => {
      const a = parseDecimalToMoney("50.00", "USD", 2);
      const b = parseDecimalToMoney("100.00", "USD", 2);
      const c = parseDecimalToMoney("50.00", "USD", 2);

      expect(compareMoney(a, b)).toBe(-1);
      expect(compareMoney(b, a)).toBe(1);
      expect(compareMoney(a, c)).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Industrial Quote & Quote Line Schema
  // --------------------------------------------------------------------------
  describe("10. Industrial Quote & Quote Line (quote.schema.ts)", () => {
    it("accepts valid IndustrialQuote and IndustrialQuoteLine", () => {
      const quote = IndustrialQuoteSchema.parse({
        id: "quote_001",
        owner_id: "user_owner_01",
        config_id: "cfg_001",
        config_revision: 1,
        state: "priced",
        currency: "USD",
        scale: 2,
        total_minor: "5997",
        snapshot_json: { mode: "demo", priced_at: "2026-10-03T19:00:00Z" },
        expires_at: "2026-10-10T19:00:00Z",
        idempotency_id: "idem_quote_001",
      });

      expect(quote.state).toBe("priced");
      expect(quote.total_minor).toBe("5997");

      const line = IndustrialQuoteLineSchema.parse({
        id: "line_001",
        quote_id: "quote_001",
        line_number: 1,
        variant_id: "var_ctrl_01",
        quantity: 3,
        snapshot_json: { unit_price_minor: "1999" },
        subtotal_minor: "5997",
      });

      expect(line.quantity).toBe(3);
      expect(line.subtotal_minor).toBe("5997");
    });

    it("rejects line quantity <= 0 or exceeding maximum limit 1000", () => {
      expect(() =>
        IndustrialQuoteLineSchema.parse({
          id: "line_1",
          quote_id: "q_1",
          line_number: 1,
          variant_id: "var_1",
          quantity: 0,
          snapshot_json: {},
        })
      ).toThrow();

      expect(() =>
        IndustrialQuoteLineSchema.parse({
          id: "line_1",
          quote_id: "q_1",
          line_number: 1,
          variant_id: "var_1",
          quantity: 1001,
          snapshot_json: {},
        })
      ).toThrow(/quantity exceeds maximum limit/);
    });

    it("accepts null total_minor for unpriced quotes (manual_review / draft)", () => {
      const quote = IndustrialQuoteSchema.parse({
        id: "quote_unpriced",
        owner_id: "user_1",
        state: "manual_review",
        currency: "USD",
        scale: 2,
        total_minor: null,
        snapshot_json: {},
      });

      expect(quote.total_minor).toBeNull();
    });
  });
});
