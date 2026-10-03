# Gate G1: Runtime & Test Regression Report

**Document ID:** `docs/gates/g1-runtime-report.md`  
**Gate:** G1 (Runtime & Reproduction of Store)  
**Host Machine:** EC2 Linux (`x86_64`, Amazon Linux 2023.12, Node v22.23.3)  
**Audit Date:** 2026-10-03  
**Governing Plan:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§33 G1)

---

## 1. Executive Summary of Test Suites

| Component | Test Suite | Total Tests | Passed | Failed | Success Rate | Root Cause of Failures |
|---|---|---|---|---|---|---|
| **b2b-storefront** | `yarn test:unit` | 39 | 39 | 0 | **100% PASS** | None. All unit suites green. |
| **b2b-storefront** | `yarn build` | 1 | 1 | 0 | **100% PASS** | Production Next.js build compiled successfully (`BUILD_ID: 6r5cjhg2k2_Z8LtPv-QXt`). |
| **b2b-backend** | `npm run build` | 1 | 1 | 0 | **100% PASS** | Backend and dashboard compile cleanly (`.medusa/server` emitted). |
| **b2b-backend** | `npm run test:unit` | 462 | 384 | 78 | **83.1% PASS** | 10 legacy suites authored against old synthetic SKU names (`CN-DEMO-...`) rather than real manufacturer SKUs seeded in Medusa. |
| **ReportLab PDF Engine** | `generate-quote-pdf.py` | 4 execution modes | 4 | 0 | **100% PASS** | Verified priced quote, manual review quote, persistent worker, and binary `%PDF-1.4`. |
| **v1 Routes Smoke** | Search, Evaluate, Detail, Offer, Quote, PDF | 6 endpoints | 6 | 0 | **100% PASS** | Live HTTP 200/201 on `http://localhost:9000` with local PostgreSQL 16.15. |

---

## 2. b2b-storefront Test Execution Detail

- **Command:** `yarn test:unit`
- **Output:**
  ```text
  PASS src/lib/catalog/__tests__/category-tree-images.unit.spec.ts (8 tests)
  PASS src/lib/catalog/__tests__/catalog-mappers.unit.spec.ts (15 tests)
  PASS src/lib/catalog/__tests__/catalog-revalidate.unit.spec.ts (4 tests)
  PASS src/lib/catalog/__tests__/demo-product-pdp.unit.spec.ts (12 tests)

  Test Suites: 4 passed, 4 total
  Tests:       39 passed, 39 total
  Snapshots:   0 total
  Time:        0.558 s
  ```
- **Observations:** Storefront is fully decoupled from backend availability during build due to `try/catch` guard on `generateStaticParams`.

---

## 3. b2b-backend Unit Test Baseline Analysis

- **Command:** `TEST_TYPE=unit NODE_OPTIONS=--experimental-vm-modules npx jest --silent --runInBand --forceExit`
- **Suites Passing (15 suites, 384 tests):**
  1. `src/lib/__tests__/catalog-revalidation-client.unit.spec.ts`
  2. `src/lib/__tests__/muse-sanitizer.unit.spec.ts`
  3. `src/lib/muse/__tests__/money.unit.spec.ts`
  4. `src/lib/__tests__/muse-config.unit.spec.ts`
  5. `src/lib/__tests__/catalog-revalidation-tags.unit.spec.ts`
  6. `src/api/admin/products/[id]/pim/__tests__/validators.unit.spec.ts`
  7. `src/lib/muse/__tests__/auth-guard.unit.spec.ts`
  8. `src/lib/__tests__/muse-logger.unit.spec.ts`
  9. `src/lib/muse/__tests__/schema-validator.unit.spec.ts`
  10. `src/lib/muse/__tests__/idempotency.unit.spec.ts`
  11. `src/lib/muse/__tests__/evaluator.unit.spec.ts`
  12. `src/lib/muse/__tests__/pt100-contraexamples.spec.ts`
  13. `src/lib/muse/__tests__/pid-contraexamples.spec.ts`
  14. `src/lib/muse/__tests__/pdf-generator.unit.spec.ts`
  15. `src/api/api/muse/v1/quotes/[quoteId]/pdf/__tests__/route.unit.spec.ts`

- **Suites Failing (10 suites, 78 tests) — Root Cause Analysis:**
  - **Root Cause: Synthetic SKU vs. Real Manufacturer SKU Discrepancy (§4.3 Discrepancy #11 & #12)**:
    - Legacy tests (`src/api/api/muse/v1/products/search/__tests__/route.unit.spec.ts`, `plc-contraexamples.spec.ts`, `db.integration.spec.ts`, `offer.unit.spec.ts`) strictly assert that SKUs must start with `CN-DEMO-` and match synthetic identifiers (e.g., `CN-DEMO-PLC-DIN-420-MR1`, `CN-DIN-PLC-A1`).
    - The actual active demo catalog seeded into Medusa (`seed-hackday-demo.ts`) uses real manufacturer SKUs per MEGAPLAN v2:
      - `CN-X5PRIME-HE-XP5` (Horner OCS Controller, model `HE-XP5`)
      - `CN-N1200` (NOVUS Process Controller, model `N1200`)
      - `CN-THT02` (TZ Temperature/Humidity Sensor, model `THT-02`)
    - Per MEGAPLAN §33 Gate G1 rules: *"Save failures BEFORE changing expected results. Fix only blockers for boot/build/release safety."*
    - Therefore, the test assertions were intentionally preserved unchanged. The update to harmonize test expectations with real manufacturer SKUs is scheduled for Gate G3 / G4 (Data Module & Usable Catalog).

---

## 4. Live v1 Route Smoke Verification

With local PostgreSQL 16.15 and Medusa backend daemon running on `http://localhost:9000`:

1. **`GET /health`**
   - Result: `200 OK`, body: `"OK"`
2. **`GET /store/products` (with publishable key `pk_b0bd7e...`)**
   - Result: `200 OK`, returns 7 products including all 3 industrial demo SKUs.
3. **`GET /api/muse/v1/products/search?q=PLC` (Bearer token)**
   - Result: `200 OK`, returns `CN-X5PRIME-HE-XP5` with facts, excerpts, and USD pricing.
4. **`GET /api/muse/v1/products/CN-X5PRIME-HE-XP5`**
   - Result: `200 OK`, full technical profile and 7 technical facts with document citations.
5. **`POST /api/muse/v1/evaluate`**
   - Result: `200 OK`, `overall_satisfied: true`, deterministic range evaluation against primary power facts.
6. **`GET /api/muse/v1/products/variant_01M41R18MQK0GXGPTYSX0EDZBH/offer?quantity=2`**
   - Result: `200 OK`, `unit_price: 890 USD`, `subtotal: 1780 USD`, `state: "priced"`.
7. **`POST /api/muse/v1/preliminary-quotes`**
   - Result: `201 Created`, persists quote, returns `quote_id`, `opaque_public_id`, and `pdf_url`.
8. **`GET /api/muse/v1/quotes/{opaque_id}/pdf?token={download_token}`**
   - Result: `200 OK`, `Content-Type: application/pdf`, `Content-Length: 5297`, streamed valid PDF.

---

## 5. Security & Isolation Verification

1. **Fail-Fast Production Boot:**
   - Booting with `NODE_ENV=production` without configured secrets throws:
     `[FATAL] Missing required production secrets: JWT_SECRET (must be configured and non-default), COOKIE_SECRET (must be configured and non-default). Refusing to boot.`
2. **Bearer Token Guard:**
   - Unauthenticated requests to `/api/muse/v1/...` return `401 Unauthorized`.
3. **Price/Stock Tampering:**
   - Client-injected prices in quote requests are ignored; price is fetched exclusively from Medusa pricing module.
