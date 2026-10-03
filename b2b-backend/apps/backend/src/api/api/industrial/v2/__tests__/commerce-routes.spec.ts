import { GET as getProductOffer, OPTIONS as optionsProductOffer } from "../products/[idOrSku]/offer/route"
import { POST as createPreliminaryQuote, OPTIONS as optionsPreliminaryQuote } from "../preliminary-quotes/route"
import { POST as createQuoteAlias } from "../quotes/route"
import { GET as getQuotePdf, OPTIONS as optionsQuotePdf } from "../quotes/[quoteId]/pdf/route"
import { saveV2Quote, clearV2Quotes, type V2QuoteRecord } from "../quotes-store"
import fs from "fs"
import path from "path"
import os from "os"

describe("V2 Commerce Endpoints - Meta Muse Agent Commerce Suite", () => {
  const originalEnvToken = process.env.MUSE_API_TOKEN
  const TEST_VALID_TOKEN = "mus_test_valid_bearer_token_2026_demo"

  beforeAll(() => {
    process.env.MUSE_API_TOKEN = TEST_VALID_TOKEN
  })

  afterAll(() => {
    process.env.MUSE_API_TOKEN = originalEnvToken
    clearV2Quotes()
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
    let responseBuffer: Buffer | null = null

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
      headersSent: false,
      setHeader: jest.fn((name: string, value: string) => {
        responseHeaders[name.toLowerCase()] = value
      }),
      getHeader: jest.fn((name: string) => responseHeaders[name.toLowerCase()]),
      status: jest.fn((code: number) => {
        responseStatus = code
        res.statusCode = code
        return res
      }),
      json: jest.fn((body: any) => {
        res.headersSent = true
        responseBody = body
        return res
      }),
      send: jest.fn((data: any) => {
        res.headersSent = true
        if (Buffer.isBuffer(data)) {
          responseBuffer = data
        } else if (typeof data === "object") {
          responseBody = data
        } else {
          responseBody = data
        }
        return res
      }),
      end: jest.fn(() => {
        res.headersSent = true
        return res
      }),
      pipe: jest.fn((destination: any) => {
        res.headersSent = true
        return destination
      }),
    }

    return {
      req,
      res,
      getResponse: () => ({
        status: responseStatus,
        body: responseBody,
        buffer: responseBuffer,
        headers: responseHeaders,
      }),
    }
  }

  // =========================================================================
  // 1. PRODUCT OFFER ENDPOINT: GET /api/industrial/v2/products/[idOrSku]/offer
  // =========================================================================
  describe("GET /api/industrial/v2/products/[idOrSku]/offer", () => {
    it("handles OPTIONS preflight with CORS headers (*)", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "OPTIONS",
      })

      await optionsProductOffer(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(204)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(headers["access-control-allow-methods"]).toContain("GET")
    })

    it("returns 200 with live offer for SKU 'CN-N1200' via public read", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-N1200" },
      })

      await getProductOffer(req, res)
      const { status, body, headers } = getResponse()

      expect(status).toBe(200)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(headers["cache-control"]).toBe("no-store")

      expect(body).toBeDefined()
      expect(body.sku).toBe("CN-N1200")
      expect(body.variant_id).toMatch(/^variant_/)
      expect(body.model).toBe("N1200")
      expect(body.quantity).toBe(1)
      expect(body.currency).toBe("USD")
      expect(body.unit_price_cents).toBe(48000)
      expect(body.unit_price_usd).toBe(480)
      expect(body.subtotal_cents).toBe(48000)
      expect(body.subtotal_usd).toBe(480)
      expect(body.state).toBe("priced")
      expect(body.availability_status).toBe("in_stock")
      expect(body.availability).toBeDefined()
      expect(body.tax_status).toBe("tax_excluded")
      expect(body.shipping_status).toBe("to_be_confirmed")
      expect(Array.isArray(body.limitations)).toBe(true)
      expect(typeof body.observed_at).toBe("string")
      expect(body.product_url).toContain("/us/products/")
    })

    it("resolves offer using snapshot_id or variant_id", async () => {
      // Test snapshot_id
      const { req: req1, res: res1, getResponse: getResp1 } = createMockContext({
        params: { idOrSku: "snp_cn_n1200_v1" },
      })
      await getProductOffer(req1, res1)
      expect(getResp1().status).toBe(200)
      expect(getResp1().body.sku).toBe("CN-N1200")
      expect(getResp1().body.unit_price_cents).toBe(48000)

      // Test variant_id
      const { req: req2, res: res2, getResponse: getResp2 } = createMockContext({
        params: { idOrSku: "variant_01M41R18XQ6QNWMX8Z39NMR2NW" },
      })
      await getProductOffer(req2, res2)
      expect(getResp2().status).toBe(200)
      expect(getResp2().body.sku).toBe("CN-N1200")
    })

    it("calculates correct subtotals when custom quantity is passed", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-N1200" },
        query: { quantity: "3" },
      })

      await getProductOffer(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(200)
      expect(body.quantity).toBe(3)
      expect(body.unit_price_cents).toBe(48000)
      expect(body.subtotal_cents).toBe(144000)
      expect(body.subtotal_usd).toBe(1440)
    })

    it("returns 400 when quantity is invalid (out of bounds or non-integer)", async () => {
      const cases = ["0", "21", "-5", "abc", "1.5"]
      for (const invalidQty of cases) {
        const { req, res, getResponse } = createMockContext({
          params: { idOrSku: "CN-N1200" },
          query: { quantity: invalidQty },
        })

        await getProductOffer(req, res)
        const { status, body } = getResponse()

        expect(status).toBe(400)
        expect(body.error.code).toBe("INVALID_PARAM")
      }
    })

    it("returns 400 when idOrSku is missing or empty", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "   " },
      })

      await getProductOffer(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(400)
      expect(body.error.code).toBe("INVALID_PARAM")
    })

    it("returns 404 when product is not found in catalog", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { idOrSku: "CN-NONEXISTENT-999" },
      })

      await getProductOffer(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(404)
      expect(body.error.code).toBe("NOT_FOUND")
    })

    it("allows valid Bearer token and rejects invalid Bearer token", async () => {
      // Valid token -> 200
      const { req: validReq, res: validRes, getResponse: getValidResp } = createMockContext({
        params: { idOrSku: "CN-N1200" },
        headers: { authorization: `Bearer ${TEST_VALID_TOKEN}` },
      })
      await getProductOffer(validReq, validRes)
      expect(getValidResp().status).toBe(200)

      // Invalid token -> 401
      const { req: invalidReq, res: invalidRes, getResponse: getInvalidResp } = createMockContext({
        params: { idOrSku: "CN-N1200" },
        headers: { authorization: "Bearer invalid_secret_token" },
      })
      await getProductOffer(invalidReq, invalidRes)
      expect(getInvalidResp().status).toBe(401)
      expect(getInvalidResp().body.error.code).toBe("UNAUTHORIZED")
    })
  })

  // =========================================================================
  // 2. PRELIMINARY QUOTES ENDPOINT: POST /api/industrial/v2/preliminary-quotes
  // =========================================================================
  describe("POST /api/industrial/v2/preliminary-quotes", () => {
    it("handles OPTIONS preflight with CORS headers (*)", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "OPTIONS",
      })

      await optionsPreliminaryQuote(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(204)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(headers["access-control-allow-methods"]).toContain("POST")
    })

    it("creates preliminary quote for single pilot SKU", async () => {
      const { req, res, getResponse } = createMockContext({
        body: { sku: "CN-N1200", quantity: 1 },
      })

      await createPreliminaryQuote(req, res)
      const { status, body, headers } = getResponse()

      expect(status).toBe(201)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(body).toBeDefined()
      expect(body.quote_id).toMatch(/^quo_/)
      expect(body.opaque_public_id).toBeDefined()
      expect(body.status).toBe("preliminary")
      expect(body.currency).toBe("USD")
      expect(body.total_cents).toBe(48000)
      expect(body.total_usd).toBe(480)
      expect(body.items).toHaveLength(1)
      expect(body.items[0].sku).toBe("CN-N1200")
      expect(body.items[0].unit_price_cents).toBe(48000)
      expect(body.items[0].unit_price_usd).toBe(480)
      expect(body.pdf_url).toContain(`/api/industrial/v2/quotes/${body.opaque_public_id}/pdf?token=`)
      expect(body.download_token).toBeDefined()
      expect(body.expires_at).toBeDefined()
      expect(body.disclaimer).toContain("Preliminary commercial estimate")
    })

    it("creates multiline preliminary quote for all 3 pilot SKUs with deterministic totals", async () => {
      const { req, res, getResponse } = createMockContext({
        body: {
          items: [
            { sku: "CN-X5PRIME-HE-XP5", quantity: 1 },
            { sku: "CN-N1200", quantity: 1 },
            { sku: "CN-THT02", quantity: 1 },
          ],
        },
      })

      await createPreliminaryQuote(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(201)
      expect(body.total_cents).toBe(144500)
      expect(body.total_usd).toBe(1445)
      expect(body.currency).toBe("USD")
      expect(body.items).toHaveLength(3)

      const x5 = body.items.find((i: any) => i.sku === "CN-X5PRIME-HE-XP5")
      expect(x5).toBeDefined()
      expect(x5.unit_price_cents).toBe(89000)
      expect(x5.unit_price_usd).toBe(890)
      expect(x5.subtotal_cents).toBe(89000)
      expect(x5.availability_status).toBe("in_stock")

      const n1200 = body.items.find((i: any) => i.sku === "CN-N1200")
      expect(n1200).toBeDefined()
      expect(n1200.unit_price_cents).toBe(48000)
      expect(n1200.unit_price_usd).toBe(480)
      expect(n1200.subtotal_cents).toBe(48000)

      const tht02 = body.items.find((i: any) => i.sku === "CN-THT02")
      expect(tht02).toBeDefined()
      expect(tht02.unit_price_cents).toBe(7500)
      expect(tht02.unit_price_usd).toBe(75)
      expect(tht02.subtotal_cents).toBe(7500)
    })

    it("accepts 'lines' property synonym for items", async () => {
      const { req, res, getResponse } = createMockContext({
        body: {
          lines: [
            { sku: "CN-N1200", quantity: 2 },
            { sku: "CN-THT02", quantity: 1 },
          ],
        },
      })

      await createPreliminaryQuote(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(201)
      expect(body.total_cents).toBe(48000 * 2 + 7500)
      expect(body.items).toHaveLength(2)
    })

    it("rejects request if missing roles are present (e.g. SSR, heater)", async () => {
      // Explicit missing_roles array
      const { req: req1, res: res1, getResponse: getResp1 } = createMockContext({
        body: {
          items: [{ sku: "CN-N1200", quantity: 1 }],
          missing_roles: ["actuator_power_switching", "thermal_load_heater"],
        },
      })
      await createPreliminaryQuote(req1, res1)
      expect(getResp1().status).toBe(400)
      expect(getResp1().body.error.code).toBe("MISSING_ROLES_NOT_QUOTABLE")

      // Unfulfilled missing role item (SSR)
      const { req: req2, res: res2, getResponse: getResp2 } = createMockContext({
        body: {
          items: [
            { sku: "CN-N1200", quantity: 1 },
            { role: "actuator_power_switching" },
          ],
        },
      })
      await createPreliminaryQuote(req2, res2)
      expect(getResp2().status).toBe(400)
      expect(getResp2().body.error.code).toBe("MISSING_ROLE_NOT_QUOTABLE")

      // Missing role indicated by SKU pattern
      const { req: req3, res: res3, getResponse: getResp3 } = createMockContext({
        body: {
          items: [{ sku: "SSR-40DA", quantity: 1 }],
        },
      })
      await createPreliminaryQuote(req3, res3)
      expect(getResp3().status).toBe(400)
      expect(getResp3().body.error.code).toBe("MISSING_ROLE_NOT_QUOTABLE")
    })

    it("rejects non-pilot SKU with descriptive error", async () => {
      const { req, res, getResponse } = createMockContext({
        body: { sku: "CN-UNKNOWN-DEVICE", quantity: 1 },
      })

      await createPreliminaryQuote(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(400)
      expect(body.error.code).toBe("UNSUPPORTED_SKU")
      expect(body.error.message).toContain("CN-UNKNOWN-DEVICE")
    })

    it("rejects invalid quantities per line", async () => {
      const { req, res, getResponse } = createMockContext({
        body: {
          items: [{ sku: "CN-N1200", quantity: 0 }],
        },
      })

      await createPreliminaryQuote(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(400)
      expect(body.error.code).toBe("INVALID_QUANTITY")
    })

    it("works via the /api/industrial/v2/quotes alias route", async () => {
      const { req, res, getResponse } = createMockContext({
        body: { sku: "CN-N1200", quantity: 1 },
      })

      await createQuoteAlias(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(201)
      expect(body.quote_id).toMatch(/^quo_/)
      expect(body.total_cents).toBe(48000)
    })
  })

  // =========================================================================
  // 3. QUOTE PDF RESOLUTION: GET /api/industrial/v2/quotes/[quoteId]/pdf
  // =========================================================================
  describe("GET /api/industrial/v2/quotes/[quoteId]/pdf", () => {
    let testQuoteId: string
    let testOpaqueId: string
    let testDownloadToken: string
    let testPdfPath: string

    beforeAll(() => {
      testQuoteId = `quo_test_${Date.now()}`
      testOpaqueId = `opaque_${Date.now()}_test`
      testDownloadToken = `token_${Date.now()}_secret`

      // Create a temporary valid PDF file on disk for streaming tests
      testPdfPath = path.join(os.tmpdir(), `quote-${testOpaqueId}.pdf`)
      const fakePdfContent = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< >>\n%%EOF\n"
      fs.writeFileSync(testPdfPath, fakePdfContent, "utf8")

      const testRecord: V2QuoteRecord = {
        quote_id: testQuoteId,
        opaque_public_id: testOpaqueId,
        status: "preliminary",
        currency: "USD",
        total_cents: 144500,
        total_usd: 1445,
        items: [
          {
            sku: "CN-X5PRIME-HE-XP5",
            title: "Horner X5 Prime 4.3\" Touch OCS",
            quantity: 1,
            unit_price_cents: 89000,
            unit_price_usd: 890,
            subtotal_cents: 89000,
            subtotal_usd: 890,
            availability_status: "in_stock",
          },
        ],
        pdf_url: `https://data.controlnautas.com/api/industrial/v2/quotes/${testOpaqueId}/pdf?token=${testDownloadToken}`,
        download_token: testDownloadToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        observed_at: new Date().toISOString(),
        disclaimer: "Preliminary commercial estimate for demonstration only.",
        pdf_file_path: testPdfPath,
      }

      saveV2Quote(testRecord)
    })

    afterAll(() => {
      try {
        if (fs.existsSync(testPdfPath)) {
          fs.unlinkSync(testPdfPath)
        }
      } catch {}
    })

    it("handles OPTIONS preflight with CORS headers (*)", async () => {
      const { req, res, getResponse } = createMockContext({
        method: "OPTIONS",
      })

      await optionsQuotePdf(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(204)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(headers["access-control-allow-methods"]).toContain("GET")
    })

    it("resolves quote PDF by opaque_public_id with valid token", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { quoteId: testOpaqueId },
        query: { token: testDownloadToken },
      })

      await getQuotePdf(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(200)
      expect(headers["access-control-allow-origin"]).toBe("*")
      expect(headers["content-type"]).toBe("application/pdf")
      expect(headers["content-disposition"]).toContain(`filename="quote-${testOpaqueId}.pdf"`)
    })

    it("resolves quote PDF by internal quote_id with valid token", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { quoteId: testQuoteId },
        query: { token: testDownloadToken },
      })

      await getQuotePdf(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(200)
      expect(headers["content-type"]).toBe("application/pdf")
    })

    it("allows public demo download when token query parameter is omitted", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { quoteId: testOpaqueId },
        query: {}, // token omitted
      })

      await getQuotePdf(req, res)
      const { status, headers } = getResponse()

      expect(status).toBe(200)
      expect(headers["content-type"]).toBe("application/pdf")
    })

    it("returns 403 when an invalid token is provided", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { quoteId: testOpaqueId },
        query: { token: "wrong_tampered_token" },
      })

      await getQuotePdf(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(403)
      expect(body.error.code).toBe("INVALID_TOKEN")
    })

    it("returns 404 when quote ID does not exist", async () => {
      const { req, res, getResponse } = createMockContext({
        params: { quoteId: "quo_non_existent_9999" },
      })

      await getQuotePdf(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(404)
      expect(body.error.code).toBe("NOT_FOUND")
    })

    it("returns 410 when quote has expired", async () => {
      const expiredOpaqueId = `expired_${Date.now()}`
      const expiredRecord: V2QuoteRecord = {
        quote_id: `quo_exp_${Date.now()}`,
        opaque_public_id: expiredOpaqueId,
        status: "preliminary",
        currency: "USD",
        total_cents: 48000,
        total_usd: 480,
        items: [],
        pdf_url: `https://data.controlnautas.com/api/industrial/v2/quotes/${expiredOpaqueId}/pdf`,
        download_token: "any_token",
        expires_at: new Date(Date.now() - 60000).toISOString(), // expired 1 minute ago
        observed_at: new Date(Date.now() - 25 * 3600 * 1000).toISOString(),
        disclaimer: "Expired quote test",
        pdf_file_path: testPdfPath,
      }
      saveV2Quote(expiredRecord)

      const { req, res, getResponse } = createMockContext({
        params: { quoteId: expiredOpaqueId },
      })

      await getQuotePdf(req, res)
      const { status, body } = getResponse()

      expect(status).toBe(410)
      expect(body.error.code).toBe("QUOTE_EXPIRED")
    })
  })
})
