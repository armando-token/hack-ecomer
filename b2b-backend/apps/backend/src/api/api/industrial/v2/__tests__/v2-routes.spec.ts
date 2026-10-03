import { GET as getCapabilities } from "../capabilities/route"
import { GET as searchProducts } from "../products/search/route"
import { GET as getProductDetail } from "../products/[idOrSku]/route"
import { GET as getProductModel3D } from "../products/[idOrSku]/model3d/route"
import { POST as evaluateProduct } from "../evaluate/route"
import { GET as getHeatingChamberBundle } from "../configurations/heating-chamber/bundle/route"

describe("Industrial API v2 - Meta Muse Architecture Demo Suite", () => {
  const originalEnvToken = process.env.MUSE_API_TOKEN
  const TEST_VALID_TOKEN = "mus_test_valid_bearer_token_2026_demo"

  beforeAll(() => {
    process.env.MUSE_API_TOKEN = TEST_VALID_TOKEN
  })

  afterAll(() => {
    process.env.MUSE_API_TOKEN = originalEnvToken
  })

  function createMockContext(options: {
    headers?: Record<string, string>
    params?: Record<string, string>
    query?: Record<string, any>
    body?: any
    method?: string
    url?: string
  } = {}) {
    const headersMap: Record<string, string> = {}
    if (options.headers) {
      for (const [k, v] of Object.entries(options.headers)) {
        headersMap[k.toLowerCase()] = v
      }
    }

    const responseHeaders: Record<string, string> = {}
    let responseStatus = 200
    let responseBody: any = null

    const req: any = {
      headers: headersMap,
      params: options.params || {},
      query: options.query || {},
      body: options.body || {},
      method: options.method || "GET",
      url: options.url || "/",
      originalUrl: options.url || "/",
    }

    const res: any = {
      statusCode: 200,
      setHeader: jest.fn((name: string, value: string) => {
        responseHeaders[name] = value
      }),
      getHeader: jest.fn((name: string) => responseHeaders[name]),
      status: jest.fn((code: number) => {
        responseStatus = code
        res.statusCode = code
        return res
      }),
      json: jest.fn((body: any) => {
        responseBody = body
        return res
      }),
    }

    return {
      req,
      res,
      getResponse: () => ({
        status: responseStatus,
        body: responseBody,
        headers: responseHeaders,
      }),
    }
  }

  // =========================================================================
  // 1. CAPABILITIES ENDPOINT
  // =========================================================================
  describe("GET /api/industrial/v2/capabilities", () => {
    it("returns capabilities JSON structure and system vocabulary (public read)", async () => {
      const { req, res, getResponse } = createMockContext({
        url: "/api/industrial/v2/capabilities",
      })

      await getCapabilities(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body).toBeDefined()
      expect(body.api_version).toBe("2.0.0")
      expect(body.rules_version).toBe("2026.g5.1")
      expect(body.process_families).toEqual(["Heating Chamber"])
      expect(body.pilot_skus).toEqual(["CN-X5PRIME-HE-XP5", "CN-N1200", "CN-THT02"])

      // Search filters
      expect(body.search).toBeDefined()
      expect(body.search.max_limit).toBe(50)
      expect(body.search.default_limit).toBe(10)
      expect(body.search.supported_filters).toContain("q")
      expect(body.search.supported_filters).toContain("sku")
      expect(body.search.supported_filters).toContain("manufacturer")
      expect(body.search.supported_filters).toContain("role")
      expect(body.search.supported_filters).toContain("signal_type")
      expect(body.search.supported_filters).toContain("protocol")
      expect(body.search.supported_filters).toContain("mounting_type")
      expect(body.search.supported_filters).toContain("has_model3d")

      // Models 3D
      expect(body.models_3d).toBeDefined()
      expect(body.models_3d.supported_format).toBe("model/gltf-binary")
      expect(body.models_3d.coordinate_system).toBe("right_handed_y_up_z_forward")
      expect(body.models_3d.units).toBe("meters")
      expect(body.models_3d.default_fidelity).toBe("dimensional_proxy_verified")
      expect(body.models_3d.base_url).toBe("https://data.controlnautas.com/industrial-assets")

      // Evaluation
      expect(body.evaluation).toBeDefined()
      expect(body.evaluation.engine).toBe("strict_evaluator_pure")
      expect(body.evaluation.verdicts).toEqual(["meets", "does_not_meet", "not_documented"])
      expect(body.evaluation.supports_evidence_refs).toBe(true)

      // Auth
      expect(body.auth).toBeDefined()
      expect(body.auth.scheme).toBe("Bearer")
      expect(body.auth.header).toBe("Authorization: Bearer <MUSE_API_TOKEN>")
      expect(body.auth.read_operations).toEqual([
        "capabilities",
        "products/search",
        "products/{idOrSku}",
        "products/{idOrSku}/model3d",
        "evaluate",
        "configurations/heating-chamber/bundle",
      ])
    })

    it("allows authenticated read with valid Bearer token", async () => {
      const { req, res, getResponse } = createMockContext({
        headers: {
          authorization: `Bearer ${TEST_VALID_TOKEN}`,
        },
      })

      await getCapabilities(req, res)
      const { status, body } = getResponse()
      expect(status).toBe(200)
      expect(body.api_version).toBe("2.0.0")
    })

    it("rejects invalid Bearer token with HTTP 401 Unauthorized", async () => {
      const { req, res, getResponse } = createMockContext({
        headers: {
          authorization: "Bearer invalid_token_12345",
        },
      })

      await getCapabilities(req, res)
      const { status, body } = getResponse()
      expect(status).toBe(401)
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe("UNAUTHORIZED")
    })
  })

  // =========================================================================
  // 2. PRODUCTS SEARCH ENDPOINT
  // =========================================================================
  describe("GET /api/industrial/v2/products/search", () => {
    it("returns all pilot products when q is empty", async () => {
      const { req, res, getResponse } = createMockContext({
        query: { q: "" },
      })

      await searchProducts(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.products).toBeDefined()
      expect(body.products.length).toBe(3)
      expect(body.count).toBe(3)
      expect(body.total).toBe(3)

      const skus = body.products.map((p: any) => p.sku)
      expect(skus).toContain("CN-X5PRIME-HE-XP5")
      expect(skus).toContain("CN-N1200")
      expect(skus).toContain("CN-THT02")
    })

    it("verifies all required contract fields on search results", async () => {
      const { req, res, getResponse } = createMockContext({
        query: { sku: "CN-X5PRIME-HE-XP5" },
      })

      await searchProducts(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.products.length).toBe(1)
      const product = body.products[0]

      expect(product.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(product.title).toBe("X5 Prime OCS All-in-One Controller (HE-XP5)")
      expect(product.manufacturer).toBe("Horner Automation")
      expect(product.role).toBe("controller")
      expect(product.snapshot_id).toBe("snp_cn_x5prime_he_xp5_v1")
      expect(product.technical_summary).toContain("Horner Automation OCS")
      expect(product.envelope_m).toEqual([0.120, 0.091, 0.060])
      expect(product.ports_count).toBe(6)
      expect(product.has_model3d).toBe(true)
      expect(product.model3d_url).toMatch(
        /^https:\/\/data\.controlnautas\.com\/industrial-assets\/[a-f0-9]{64}\/CN-X5PRIME-HE-XP5\.glb$/
      )
      expect(product.fidelity).toBe("dimensional_proxy_verified")
      expect(product.product_url).toContain("/us/products/cn-x5prime-he-xp5")
    })

    it("filters products by exact/partial SKU", async () => {
      const { req, res, getResponse } = createMockContext({
        query: { sku: "CN-N1200" },
      })

      await searchProducts(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.products.length).toBe(1)
      expect(body.products[0].sku).toBe("CN-N1200")
      expect(body.products[0].manufacturer).toBe("NOVUS Automation")
    })

    it("filters products by role ('controller' vs 'sensor')", async () => {
      // Controllers: Horner X5 & Novus N1200
      const ctxControllers = createMockContext({ query: { role: "controller" } })
      await searchProducts(ctxControllers.req, ctxControllers.res)
      const resCtrl = ctxControllers.getResponse()
      expect(resCtrl.status).toBe(200)
      expect(resCtrl.body.products.length).toBe(2)
      const ctrlSkus = resCtrl.body.products.map((p: any) => p.sku)
      expect(ctrlSkus).toContain("CN-X5PRIME-HE-XP5")
      expect(ctrlSkus).toContain("CN-N1200")

      // Sensor: TZone THT-02
      const ctxSensors = createMockContext({ query: { role: "sensor" } })
      await searchProducts(ctxSensors.req, ctxSensors.res)
      const resSens = ctxSensors.getResponse()
      expect(resSens.status).toBe(200)
      expect(resSens.body.products.length).toBe(1)
      expect(resSens.body.products[0].sku).toBe("CN-THT02")
    })

    it("filters products by manufacturer (Horner, NOVUS, TZone)", async () => {
      const ctxHorner = createMockContext({ query: { manufacturer: "Horner" } })
      await searchProducts(ctxHorner.req, ctxHorner.res)
      expect(ctxHorner.getResponse().body.products.length).toBe(1)
      expect(ctxHorner.getResponse().body.products[0].sku).toBe("CN-X5PRIME-HE-XP5")

      const ctxNovus = createMockContext({ query: { manufacturer: "NOVUS" } })
      await searchProducts(ctxNovus.req, ctxNovus.res)
      expect(ctxNovus.getResponse().body.products.length).toBe(1)
      expect(ctxNovus.getResponse().body.products[0].sku).toBe("CN-N1200")

      const ctxTzone = createMockContext({ query: { manufacturer: "TZone" } })
      await searchProducts(ctxTzone.req, ctxTzone.res)
      expect(ctxTzone.getResponse().body.products.length).toBe(1)
      expect(ctxTzone.getResponse().body.products[0].sku).toBe("CN-THT02")
    })

    it("filters products by signal_type ('rs485')", async () => {
      const { req, res, getResponse } = createMockContext({
        query: { signal_type: "rs485" },
      })

      await searchProducts(req, res)
      const { status, body } = getResponse()
      expect(status).toBe(200)
      // Horner X5 and TZone THT02 both have explicit rs485 ports
      expect(body.products.length).toBeGreaterThanOrEqual(2)
      const skus = body.products.map((p: any) => p.sku)
      expect(skus).toContain("CN-X5PRIME-HE-XP5")
      expect(skus).toContain("CN-THT02")
    })

    it("rejects invalid limit parameter (> 50 or < 1)", async () => {
      const ctxOver = createMockContext({ query: { limit: "51" } })
      await searchProducts(ctxOver.req, ctxOver.res)
      expect(ctxOver.getResponse().status).toBe(400)
      expect(ctxOver.getResponse().body.error.code).toBe("INVALID_PARAM")

      const ctxUnder = createMockContext({ query: { limit: "0" } })
      await searchProducts(ctxUnder.req, ctxUnder.res)
      expect(ctxUnder.getResponse().status).toBe(400)
      expect(ctxUnder.getResponse().body.error.code).toBe("INVALID_PARAM")
    })

    it("rejects search query longer than 200 characters", async () => {
      const { req, res, getResponse } = createMockContext({
        query: { q: "a".repeat(201) },
      })

      await searchProducts(req, res)
      const { status, body } = getResponse()
      expect(status).toBe(400)
      expect(body.error.code).toBe("INVALID_PARAM")
    })
  })

  // =========================================================================
  // 3. PRODUCT SNAPSHOT DETAIL ENDPOINT
  // =========================================================================
  describe("GET /api/industrial/v2/products/[idOrSku]", () => {
    it("resolves product by SKU (CN-X5PRIME-HE-XP5) and returns complete snapshot", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-X5PRIME-HE-XP5" },
      })

      await getProductDetail(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(body.variant_id).toBe("variant_01M41R18MQK0GXGPTYSX0EDZBH")
      expect(body.snapshot_id).toBe("snp_cn_x5prime_he_xp5_v1")
      expect(body.manufacturer).toBe("Horner Automation")
      expect(body.role).toBe("controller")
      expect(body.state).toBe("published")

      // Metric envelope
      expect(body.metric_envelope).toEqual([0.120, 0.091, 0.060])

      // Ports with categories, directions, terminals
      expect(Array.isArray(body.ports)).toBe(true)
      expect(body.ports.length).toBe(6)
      const powerPort = body.ports.find((p: any) => p.port_id === "p_power_in")
      expect(powerPort).toBeDefined()
      expect(powerPort.category).toBe("power")
      expect(powerPort.direction).toBe("input")
      expect(powerPort.signal_type).toBe("power_dc")
      expect(powerPort.terminals.length).toBeGreaterThanOrEqual(2)

      // Facts / Attributes
      expect(Array.isArray(body.facts)).toBe(true)
      expect(body.facts.length).toBeGreaterThanOrEqual(10)
      const voltageFact = body.facts.find((f: any) => f.property === "supply_voltage")
      expect(voltageFact).toBeDefined()
      expect(voltageFact.value.min).toBe(10)
      expect(voltageFact.value.max).toBe(30)

      // 3D Asset link + fidelity
      expect(body.model3d).toBeDefined()
      expect(body.model3d.has_model3d).toBe(true)
      expect(body.model3d.fidelity).toBe("dimensional_proxy_verified")
      expect(body.model3d.url).toContain("CN-X5PRIME-HE-XP5.glb")
      expect(body.model3d.sha256).toBe(
        "47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5"
      )
    })

    it("resolves product by snapshot_id (snp_cn_n1200_v1)", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "snp_cn_n1200_v1" },
      })

      await getProductDetail(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-N1200")
      expect(body.snapshot_id).toBe("snp_cn_n1200_v1")
      expect(body.manufacturer).toBe("NOVUS Automation")
    })

    it("resolves product by variant_id (variant_01M41R193J5MPJ16MTX9CAWWRM)", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "variant_01M41R193J5MPJ16MTX9CAWWRM" },
      })

      await getProductDetail(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-THT02")
      expect(body.manufacturer).toBe("TZ / Tzone")
    })

    it("returns HTTP 404 for unknown product identifier", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "NON_EXISTENT_IDENTIFIER_XYZ" },
      })

      await getProductDetail(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(404)
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe("PRODUCT_NOT_FOUND")
    })
  })

  // =========================================================================
  // 4. MODEL 3D ENDPOINT
  // =========================================================================
  describe("GET /api/industrial/v2/products/[idOrSku]/model3d", () => {
    it("returns complete 3D asset metadata and anchors for Horner X5 Prime", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-X5PRIME-HE-XP5" },
      })

      await getProductModel3D(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.asset_id).toBe("ast_cn_x5prime_he_xp5_glb_v1")
      expect(body.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(body.fidelity).toBe("dimensional_proxy_verified")
      expect(body.format).toBe("model/gltf-binary")
      expect(body.units).toBe("meters")
      expect(body.url).toBe(
        "https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb"
      )
      expect(body.sha256).toBe("47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5")
      expect(body.bytes).toBe(27340)
      expect(Array.isArray(body.anchors)).toBe(true)
      expect(body.anchors.length).toBeGreaterThan(0)

      // Anchors should contain orientation and coordinates in meters
      const powerAnchor = body.anchors.find((a: any) => a.port_id === "p_power_in")
      expect(powerAnchor).toBeDefined()
      expect(powerAnchor.position.length).toBe(3)
      expect(powerAnchor.orientation.length).toBe(4)

      expect(body.manifest_url).toBe(
        "/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.manifest.json"
      )
    })

    it("returns complete 3D asset metadata for Novus N1200", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-N1200" },
      })

      await getProductModel3D(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-N1200")
      expect(body.sha256).toBe("73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2")
      expect(body.bytes).toBe(31408)
    })

    it("returns complete 3D asset metadata for TZone THT02", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-THT02" },
      })

      await getProductModel3D(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-THT02")
      expect(body.sha256).toBe("7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327")
      expect(body.bytes).toBe(15420)
    })

    it("returns 404 for unknown product 3D asset", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "UNKNOWN_PART_NO_3D" },
      })

      await getProductModel3D(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(404)
      expect(body.error).toBeDefined()
      expect(body.error.code).toBe("ASSET_NOT_FOUND")
    })
  })

  // =========================================================================
  // 5. EVALUATE ENDPOINT
  // =========================================================================
  describe("POST /api/industrial/v2/evaluate", () => {
    it("evaluates known requirement satisfying Horner X5 (supply_voltage 12-24V DC) -> meets", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "POST",
        body: {
          sku: "CN-X5PRIME-HE-XP5",
          requirements: [
            {
              requirement_id: "req_supply_voltage",
              target: "product",
              property: "supply_voltage",
              operator: "covers_range",
              value: { min: 12, max: 24, unit: "V", nature: "dc" },
              required: true,
            },
          ],
        },
      })

      await evaluateProduct(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(body.overall_verdict).toBe("meets")
      expect(body.rule_set_version).toBe("2026.g5.1")
      expect(Array.isArray(body.evaluations)).toBe(true)
      expect(body.evaluations.length).toBe(1)
      expect(body.evaluations[0].verdict).toBe("meets")
      expect(body.evaluated_at).toBeDefined()
    })

    it("evaluates requirement that exceeds product capabilities -> does_not_meet", async () => {
      // Horner X5 supply voltage is 10-30 VDC. Requesting 100-240V AC -> does_not_meet
      const { req, res, getResponse } = createMockContext({
        method: "POST",
        body: {
          sku: "CN-X5PRIME-HE-XP5",
          requirements: [
            {
              requirement_id: "req_high_ac_voltage",
              target: "product",
              property: "supply_voltage",
              operator: "covers_range",
              value: { min: 100, max: 240, unit: "V", nature: "ac" },
              required: true,
            },
          ],
        },
      })

      await evaluateProduct(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(body.overall_verdict).toBe("does_not_meet")
      expect(body.evaluations[0].verdict).toBe("does_not_meet")
    })

    it("returns tri-state 'not_documented' when requirements are empty or scope undocumented", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "POST",
        body: {
          sku: "CN-X5PRIME-HE-XP5",
          requirements: [],
        },
      })

      await evaluateProduct(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.sku).toBe("CN-X5PRIME-HE-XP5")
      expect(body.overall_verdict).toBe("not_documented")
    })

    it("returns 400 when sku is missing from request body", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "POST",
        body: {
          requirements: [],
        },
      })

      await evaluateProduct(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(400)
      expect(body.error.code).toBe("INVALID_PARAM")
    })

    it("returns 404 when sku does not exist in catalog", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "POST",
        body: {
          sku: "UNKNOWN_DEVICE_SKU_999",
          requirements: [],
        },
      })

      await evaluateProduct(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(404)
      expect(body.error.code).toBe("PRODUCT_NOT_FOUND")
    })
  })

  // =========================================================================
  // 6. HEATING CHAMBER BUNDLE ENDPOINT
  // =========================================================================
  describe("GET /api/industrial/v2/configurations/heating-chamber/bundle", () => {
    it("returns unified engineering bundle for Heating Chamber pilot", async () => {
      const { req, res, getResponse } = createMockContext({
        url: "/api/industrial/v2/configurations/heating-chamber/bundle",
      })

      await getHeatingChamberBundle(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.bundle_version).toBe("2.0.0")
      expect(body.configuration.process_family).toBe("Heating Chamber")
      expect(body.configuration.configuration_id).toBe("cfg_heating_chamber_pilot")

      // Pilot instances
      expect(body.configuration.instances.length).toBe(3)
      const instanceSkus = body.configuration.instances.map((i: any) => i.sku)
      expect(instanceSkus).toContain("CN-X5PRIME-HE-XP5")
      expect(instanceSkus).toContain("CN-N1200")
      expect(instanceSkus).toContain("CN-THT02")

      // Connections & Missing Roles
      expect(body.configuration.connections.length).toBe(3)
      expect(body.configuration.missing_roles.length).toBe(2)

      // Evaluation
      expect(body.evaluation.overall_verdict).toBeDefined()
      expect(body.evaluation.rule_set_version).toBe("2026.g5.1")

      // 3D Assets delivery
      expect(body.assets["inst_x5prime"]).toBeDefined()
      expect(body.assets["inst_x5prime"].glb_url).toContain("https://data.controlnautas.com/industrial-assets")
      expect(body.assets["inst_n1200"]).toBeDefined()
      expect(body.assets["inst_tht02"]).toBeDefined()
      expect(body.readiness.ready_for_3d_presentation).toBe(true)
    })
  })
})
