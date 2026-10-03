import {
  buildHeatingChamberBundle,
  buildHeatingChamberBundleWithCommerce,
  HEATING_CHAMBER_COMMERCIAL_FALLBACK,
  HEATING_CHAMBER_PILOT_ID,
  CommercialLineItem,
  BundleCommercialBlock,
} from "../data/heating-chamber-pilot"
import { closePool } from "../../../lib/muse/db"
import {
  GET as getHeatingChamberBundleRoute,
} from "../../../api/api/industrial/v2/configurations/heating-chamber/bundle/route"
import {
  GET as getConfigIdBundleRoute,
} from "../../../api/api/industrial/v2/configurations/[configId]/bundle/route"

/**
 * Gate G9: Bundle Commercial Block & Medusa Live Integration Test Suite
 * Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§23–§24, §33 G9)
 */

describe("Heating Chamber Bundle Commercial Block & Medusa Integration (Gate G9)", () => {
  afterAll(async () => {
    await closePool()
  })

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

  describe("1. Live Commercial Integration (buildHeatingChamberBundleWithCommerce)", () => {
    it("asynchronously builds bundle with live commercial pricing from Medusa", async () => {
      const bundle = await buildHeatingChamberBundleWithCommerce()

      expect(bundle).toBeDefined()
      expect(bundle.bundle_version).toBe("2.0.0")

      // Commercial block verification
      expect(bundle.commercial).toBeDefined()
      const comm = bundle.commercial!

      expect(comm.currency).toBe("USD")
      expect(comm.status).toBe("priced")
      expect(comm.quote_readiness).toBe("ready_for_commercial_estimate")

      // Exact total calculation: 89000 + 48000 + 7500 = 144500 cents ($1,445.00 USD)
      expect(comm.catalog_total_usd_cents).toBe(144500)
      expect(comm.catalog_total_usd).toBe(1445.0)

      // Line items verification (3 pilot equipment instances)
      expect(comm.items).toHaveLength(3)

      // 1. Horner X5 Prime ($890.00 / 89000 cents)
      const x5 = comm.items.find((i) => i.sku === "CN-X5PRIME-HE-XP5")
      expect(x5).toBeDefined()
      expect(x5!.instance_id).toBe("inst_x5prime")
      expect(x5!.quantity).toBe(1)
      expect(x5!.unit_price_usd_cents).toBe(89000)
      expect(x5!.unit_price_usd).toBe(890.0)
      expect(x5!.subtotal_usd_cents).toBe(89000)
      expect(x5!.subtotal_usd).toBe(890.0)
      expect(x5!.pricing_state).toBe("priced")
      expect(x5!.availability_status).toBe("in_stock")
      expect(x5!.stocked_quantity).toBeGreaterThanOrEqual(1)

      // 2. NOVUS N1200 ($480.00 / 48000 cents)
      const n1200 = comm.items.find((i) => i.sku === "CN-N1200")
      expect(n1200).toBeDefined()
      expect(n1200!.instance_id).toBe("inst_n1200")
      expect(n1200!.quantity).toBe(1)
      expect(n1200!.unit_price_usd_cents).toBe(48000)
      expect(n1200!.unit_price_usd).toBe(480.0)
      expect(n1200!.subtotal_usd_cents).toBe(48000)
      expect(n1200!.subtotal_usd).toBe(480.0)
      expect(n1200!.pricing_state).toBe("priced")
      expect(n1200!.availability_status).toBe("in_stock")
      expect(n1200!.stocked_quantity).toBeGreaterThanOrEqual(1)

      // 3. TZone THT-02 ($75.00 / 7500 cents)
      const tht02 = comm.items.find((i) => i.sku === "CN-THT02")
      expect(tht02).toBeDefined()
      expect(tht02!.instance_id).toBe("inst_tht02")
      expect(tht02!.quantity).toBe(1)
      expect(tht02!.unit_price_usd_cents).toBe(7500)
      expect(tht02!.unit_price_usd).toBe(75.0)
      expect(tht02!.subtotal_usd_cents).toBe(7500)
      expect(tht02!.subtotal_usd).toBe(75.0)
      expect(tht02!.pricing_state).toBe("priced")
      expect(tht02!.availability_status).toBe("in_stock")
      expect(tht02!.stocked_quantity).toBeGreaterThanOrEqual(1)
    })

    it("keeps missing roles explicitly unpriced without inventing line items or unit prices (§23.1)", async () => {
      const bundle = await buildHeatingChamberBundleWithCommerce()
      const comm = bundle.commercial!

      // Missing roles must be recorded in missing_roles_unpriced
      expect(comm.missing_roles_unpriced).toEqual([
        "actuator_power_switching",
        "thermal_load_heater",
      ])

      // Missing roles MUST NOT appear as commercial line items
      const itemSkus = comm.items.map((i) => i.sku)
      expect(itemSkus).not.toContain("actuator_power_switching")
      expect(itemSkus).not.toContain("thermal_load_heater")
      expect(itemSkus).not.toContain("missing:actuator_power_switching")
      expect(itemSkus).not.toContain("missing:thermal_load_heater")

      // Only the 3 catalog items are priced
      expect(comm.items).toHaveLength(3)
    })

    it("verifies readiness flags: procurement is FALSE, commercial estimate is TRUE (§23.2)", async () => {
      const bundle = await buildHeatingChamberBundleWithCommerce()

      // Procurement MUST remain false while missing_roles exist!
      expect(bundle.readiness.ready_for_procurement).toBe(false)

      // Ready for commercial estimate is true since prices exist for catalog lines
      expect(bundle.readiness.ready_for_commercial_estimate).toBe(true)

      // 3D presentation remains true
      expect(bundle.readiness.ready_for_3d_presentation).toBe(true)

      // Blockers must identify the missing equipment
      expect(bundle.readiness.blockers).toEqual([
        "Power actuator stage (SSR) missing from topology",
        "Heating element load missing from topology",
      ])
    })
  })

  describe("2. Synchronous Fallback & Fallback Snapshot (§23.3)", () => {
    it("preserves synchronous buildHeatingChamberBundle() with deterministic commercial snapshot", () => {
      const bundle = buildHeatingChamberBundle()

      expect(bundle.commercial).toBeDefined()
      expect(bundle.commercial!.currency).toBe("USD")
      expect(bundle.commercial!.status).toBe("priced")
      expect(bundle.commercial!.catalog_total_usd_cents).toBe(144500)
      expect(bundle.commercial!.catalog_total_usd).toBe(1445.0)
      expect(bundle.commercial!.items).toHaveLength(3)
      expect(bundle.commercial!.missing_roles_unpriced).toEqual([
        "actuator_power_switching",
        "thermal_load_heater",
      ])
      expect(bundle.commercial!.quote_readiness).toBe(
        "ready_for_commercial_estimate"
      )

      expect(bundle.readiness.ready_for_procurement).toBe(false)
      expect(bundle.readiness.ready_for_commercial_estimate).toBe(true)
    })

    it("HEATING_CHAMBER_COMMERCIAL_FALLBACK provides valid static commercial block", () => {
      expect(HEATING_CHAMBER_COMMERCIAL_FALLBACK.catalog_total_usd_cents).toBe(
        144500
      )
      expect(HEATING_CHAMBER_COMMERCIAL_FALLBACK.catalog_total_usd).toBe(1445.0)
      expect(HEATING_CHAMBER_COMMERCIAL_FALLBACK.items).toHaveLength(3)
      expect(
        HEATING_CHAMBER_COMMERCIAL_FALLBACK.missing_roles_unpriced
      ).toHaveLength(2)
    })

    it("falls back to deterministic bundle when database query fails", async () => {
      const failingClient = {
        query: jest.fn().mockRejectedValue(new Error("Connection terminated")),
      } as any

      const bundle = await buildHeatingChamberBundleWithCommerce(failingClient)

      expect(bundle).toBeDefined()
      expect(bundle.commercial).toBeDefined()
      expect(bundle.commercial!.catalog_total_usd_cents).toBe(144500)
      expect(bundle.readiness.ready_for_procurement).toBe(false)
      expect(bundle.readiness.ready_for_commercial_estimate).toBe(true)
    })
  })

  describe("3. Mock Client Edge Cases & Pricing State Isolation", () => {
    it("marks quote_readiness as not_priced and commercial estimate false if an item is not priced", async () => {
      // Mock client that returns manual_review (unpriced) for N1200
      const mockClient = {
        query: jest.fn().mockImplementation((queryText: string, params: any[]) => {
          const sku = params[0]
          if (sku === "CN-N1200") {
            return Promise.resolve({
              rows: [
                {
                  profile_id: "tp_n1200",
                  variant_id: "variant_n1200",
                  model: "N1200",
                  revision: "rev-1",
                  demo: true,
                  medusa_variant_id: "variant_n1200",
                  sku: "CN-N1200",
                  variant_title: "NOVUS N1200",
                  manage_inventory: true,
                  allow_backorder: false,
                  product_id: "prod_n1200",
                  product_title: "NOVUS N1200 Universal Process Controller",
                  product_handle: "novus-n1200",
                  price_id: null,
                  price_amount: null, // Unpriced!
                  currency_code: null,
                  stocked_quantity: 2,
                  reserved_quantity: 0,
                },
              ],
            })
          }
          // Default priced row for others
          const price = sku === "CN-X5PRIME-HE-XP5" ? "890" : "75"
          return Promise.resolve({
            rows: [
              {
                profile_id: `tp_${sku}`,
                variant_id: `variant_${sku}`,
                model: sku,
                revision: "rev-1",
                demo: true,
                medusa_variant_id: `variant_${sku}`,
                sku,
                variant_title: sku,
                manage_inventory: true,
                allow_backorder: false,
                product_id: `prod_${sku}`,
                product_title: `Product ${sku}`,
                product_handle: `product-${sku.toLowerCase()}`,
                price_id: `pr_${sku}`,
                price_amount: price,
                currency_code: "usd",
                stocked_quantity: 5,
                reserved_quantity: 0,
              },
            ],
          })
        }),
      } as any

      const bundle = await buildHeatingChamberBundleWithCommerce(mockClient)

      expect(bundle.commercial!.quote_readiness).toBe("not_priced")
      expect(bundle.commercial!.status).toBe("partial")
      expect(bundle.readiness.ready_for_commercial_estimate).toBe(false)
      expect(bundle.readiness.ready_for_procurement).toBe(false)

      const unpricedItem = bundle.commercial!.items.find(
        (i) => i.sku === "CN-N1200"
      )
      expect(unpricedItem!.pricing_state).toBe("manual_review")
      expect(unpricedItem!.unit_price_usd_cents).toBe(0)
    })
  })

  describe("4. HTTP Route Integration with Commercial Block (Task 2)", () => {
    it("serves enriched bundle with commercial block at /configurations/heating-chamber/bundle", async () => {
      const req: any = { method: "GET", headers: {} }
      const res = createMockRes()

      await getHeatingChamberBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(200)
      const body = res._getBody()

      expect(body.commercial).toBeDefined()
      expect(body.commercial.currency).toBe("USD")
      expect(body.commercial.catalog_total_usd_cents).toBe(144500)
      expect(body.commercial.catalog_total_usd).toBe(1445.0)
      expect(body.commercial.items).toHaveLength(3)
      expect(body.commercial.missing_roles_unpriced).toEqual([
        "actuator_power_switching",
        "thermal_load_heater",
      ])
      expect(body.commercial.quote_readiness).toBe(
        "ready_for_commercial_estimate"
      )

      expect(body.readiness.ready_for_3d_presentation).toBe(true)
      expect(body.readiness.ready_for_procurement).toBe(false)
      expect(body.readiness.ready_for_commercial_estimate).toBe(true)
    })

    it("serves bundle with commercial block at /[configId]/bundle for cfg_heating_chamber_pilot", async () => {
      const req: any = {
        method: "GET",
        headers: {},
        params: { configId: HEATING_CHAMBER_PILOT_ID },
      }
      const res = createMockRes()

      await getConfigIdBundleRoute(req, res)

      expect(res._getStatusCode()).toBe(200)
      const body = res._getBody()

      expect(body.commercial).toBeDefined()
      expect(body.commercial.catalog_total_usd_cents).toBe(144500)
      expect(body.commercial.items).toHaveLength(3)
      expect(body.readiness.ready_for_procurement).toBe(false)
      expect(body.readiness.ready_for_commercial_estimate).toBe(true)
    })
  })
})
