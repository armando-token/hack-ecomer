# Gate G9: Live B2B Commerce, Multiline Preliminary Quotes & Correlated PDF Acceptance Report

**Gate Identifier:** `G9_COMMERCE_V2` / `G9`  
**Execution Date:** 2026-10-03  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Status:** ✅ **PASSED**  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§23 Ofertas, BOM y cotizaciones de varios artículos, §24 PDF y descarga de cotizaciones, §33 G9)  
**Public Edge Domain:** `https://data.controlnautas.com` (TLS 1.3, port 443 active)  
**Target Process Family:** `Industrial Heating Chamber` (`cámara de calentamiento`)  

---

## 1. Executive Summary & Gate Mandate

Gate **G9** establishes production-grade agentic B2B commerce capabilities on the Controlnautas platform, enabling the **Meta Muse** spatial agent to query real-time commercial pricing, evaluate multiline preliminary quotations, and retrieve official signed PDF documents for industrial pilot solutions.

The implementation strictly fulfills the principles defined in `MEGAPLAN_MUSE_API_3D_V2.md`:
1. **Live Medusa Commerce Integration:** Live pricing and inventory availability are queried directly from the underlying Medusa 2 commerce database. No prices are read from static Markdown, hallucinated by LLM memory, or hardcoded into templates.
2. **Exact Minor Currency Arithmetic:** Pricing calculations are executed entirely using canonical integer minor units (USD cents), eliminating IEEE 754 floating-point rounding errors and ensuring wire-level monetary accuracy.
3. **Engineering and Commerce Decoupling:** Technical evaluation and commercial readiness are maintained as distinct architectural dimensions. Incomplete engineering topologies (such as our heating chamber lacking a solid-state relay and heating element) can safely receive an honest preliminary commercial estimate (`ready_for_commercial_estimate: true`) while procurement execution remains strictly blocked (`ready_for_procurement: false`, `overall_verdict: "does_not_meet"`).
4. **Zero Fabricated SKUs Doctrine:** Accessories and required circuit roles not currently in the catalog (`power_actuator_ssr`, `electric_heater_element`) remain explicitly documented under `missing_roles_unpriced` and are neither assigned fictional part numbers nor priced at $0.00.
5. **Correlated Signed PDF Quotation:** The native Python ReportLab 5.0.1 worker renders official preliminary quotation documents directly from immutable database snapshots with unique job IDs and cryptographic download tokens.

```
                   ┌────────────────────────────────────────┐
                   │        META MUSE SPATIAL AGENT         │
                   └───────────────────┬────────────────────┘
                                       │
                      1. Query Live    │  2. Generate
                      Offer by SKU     │     Multiline Quote
                                       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │              Controlnautas Industrial Edge API v2                      │
  │                  https://data.controlnautas.com                        │
  │                                                                        │
  │  GET  /api/industrial/v2/products/{idOrSku}/offer                     │
  │  POST /api/industrial/v2/preliminary-quotes                            │
  │  GET  /api/industrial/v2/quotes/{quoteId}/pdf                          │
  │  GET  /api/industrial/v2/configurations/heating-chamber/bundle         │
  └──────────────┬─────────────────────────┬───────────────────────────────┘
                 │                         │
                 │ Live Pricing & Stock    │ Immutable Quote & PDF Job
                 ▼                         ▼
  ┌──────────────────────────────┐  ┌──────────────────────────────────────┐
  │   Medusa 2 Commerce Engine   │  │   Python ReportLab PDF Engine        │
  │  - Integer Cents Arithmetic  │  │  - Worker venv (ReportLab 5.0.1)     │
  │  - Active USD Price Sets     │  │  - Official B2B Letterhead           │
  │  - Stock / Reservation State │  │  - Validated Binary %PDF-1.4 Stream  │
  └──────────────────────────────┘  └──────────────────────────────────────┘
```

---

## 2. Verified Commercial Endpoints & Contracts

All endpoints are operational on the public edge domain `https://data.controlnautas.com` with TLS 1.3 encryption, CORS `*`, and zero exposed raw development ports.

### 2.1 Live Product Offer Endpoint
- **Route:** `GET /api/industrial/v2/products/{idOrSku}/offer?quantity={n}&region_id={id}`
- **Operation ID:** `getProductLiveOffer`
- **Security:** Public demo access or Bearer token (`Authorization: Bearer <MUSE_API_TOKEN>`).
- **Functionality:** Resolves product SKU or variant ID, queries live Medusa pricing and inventory state, and returns exact minor units (USD cents) and formatted decimal strings.

```json
{
  "sku": "CN-X5PRIME-HE-XP5",
  "variant_id": "variant_01JUS00HACKDAY26XP500000",
  "title": "X5 Prime OCS All-in-One Controller (HE-XP5)",
  "model": "HE-XP5",
  "quantity": 1,
  "state": "priced",
  "currency": "usd",
  "unit_price_minor": 89000,
  "unit_price": 890.0,
  "subtotal_minor": 89000,
  "subtotal": 890.0,
  "scale": 2,
  "availability": {
    "status": "in_stock",
    "available_quantity": 10,
    "stocked_quantity": 10,
    "reserved_quantity": 0,
    "manage_inventory": true,
    "allow_backorder": false
  },
  "availability_status": "in_stock",
  "tax_status": "tax_excluded",
  "shipping_status": "to_be_confirmed",
  "observed_at": "2026-10-03T22:50:00.000Z",
  "product_url": "https://data.controlnautas.com/us/products/cn-x5prime-he-xp5"
}
```

### 2.2 Multiline Preliminary Quote Endpoint
- **Route:** `POST /api/industrial/v2/preliminary-quotes`
- **Operation ID:** `createPreliminaryQuote`
- **Security:** Public demo access or Bearer token.
- **Functionality:** Accepts an array of item objects `{ sku, quantity }` and optional customer metadata. Client-provided prices, subtotals, and fake SKUs are strictly stripped. Computes exact minor unit subtotals and totals, stores immutable quote snapshot in PostgreSQL, queues a ReportLab PDF compilation job, and returns the quote ID and signed download URL.
- **Backward Compatibility:** Legacy route `POST /api/muse/v1/preliminary-quotes` remains fully functional.

```json
{
  "quote_id": "qte_01JUS00HACKDAY26QUOTE001",
  "opaque_public_id": "pub_01JUS00HACKDAY26001",
  "status": "preliminary",
  "currency": "USD",
  "total_cents": 144500,
  "total_usd": 1445.0,
  "items": [
    {
      "sku": "CN-X5PRIME-HE-XP5",
      "variant_id": "variant_01JUS00HACKDAY26XP500000",
      "title": "X5 Prime OCS All-in-One Controller (HE-XP5)",
      "model": "HE-XP5",
      "quantity": 1,
      "currency": "USD",
      "unit_price_cents": 89000,
      "unit_price_usd": 890.0,
      "subtotal_cents": 89000,
      "subtotal_usd": 890.0,
      "availability": "in_stock",
      "observed_at": "2026-10-03T22:50:00.000Z"
    },
    {
      "sku": "CN-N1200",
      "variant_id": "variant_01JUS00HACKDAY26N1200000",
      "title": "N1200 Universal Process Controller",
      "model": "N1200",
      "quantity": 1,
      "currency": "USD",
      "unit_price_cents": 48000,
      "unit_price_usd": 480.0,
      "subtotal_cents": 48000,
      "subtotal_usd": 480.0,
      "availability": "in_stock",
      "observed_at": "2026-10-03T22:50:00.000Z"
    },
    {
      "sku": "CN-THT02",
      "variant_id": "variant_01JUS00HACKDAY26THT02000",
      "title": "THT-02 Temperature and Humidity Transmitter",
      "model": "THT-02",
      "quantity": 1,
      "currency": "USD",
      "unit_price_cents": 7500,
      "unit_price_usd": 75.0,
      "subtotal_cents": 7500,
      "subtotal_usd": 75.0,
      "availability": "in_stock",
      "observed_at": "2026-10-03T22:50:00.000Z"
    }
  ],
  "pdf_download_url": "https://data.controlnautas.com/api/industrial/v2/quotes/qte_01JUS00HACKDAY26QUOTE001/pdf?token=sec_tok_01abc",
  "observed_at": "2026-10-03T22:50:00.000Z",
  "expires_at": "2026-11-02T22:50:00.000Z"
}
```

### 2.3 Official Correlated PDF Quotation Download Endpoint
- **Route:** `GET /api/industrial/v2/quotes/{quoteId}/pdf?token={downloadToken}`
- **Operation ID:** `downloadQuotePdf`
- **Security:** Scoped cryptographic download token.
- **Functionality:** Streams the compiled binary `%PDF-1.4` document with headers `Content-Type: application/pdf`, `Content-Disposition: inline; filename="quote_{id}.pdf"`, and `Referrer-Policy: no-referrer`.
- **Backward Compatibility:** Legacy route `GET /api/muse/v1/quotes/{quoteId}/pdf` remains fully supported.

---

## 3. Commercial Bundle Schema & Pricing Breakdown

The Heating Chamber unified configuration bundle (`GET /api/industrial/v2/configurations/heating-chamber/bundle`) combines spatial poses, G5 evaluation results, and the live commercial pricing block:

### 3.1 Commercial Breakdown Table

| SKU | Model / Equipment Title | Primary Role | Quantity | Unit Price (USD) | Unit Price (Cents) | Subtotal (USD) | Stock Status |
|---|---|---|:---:|:---:|:---:|:---:|:---:|
| `CN-X5PRIME-HE-XP5` | Horner X5 Prime OCS (4.3" HMI + PLC) | Master Controller | 1 | $890.00 | 89,000 ¢ | $890.00 | In Stock (10) |
| `CN-N1200` | NOVUS N1200 Universal Process PID | Loop Controller | 1 | $480.00 | 48,000 ¢ | $480.00 | In Stock (10) |
| `CN-THT02` | TZone THT-02 Temp & Humidity Sensor | Ambient Monitor | 1 | $75.00 | 7,500 ¢ | $75.00 | In Stock (10) |
| *Missing Role* | Solid-State Relay Actuator (`power_actuator_ssr`) | Power Switching | 1 | *Unpriced* | *Unpriced* | *Unpriced* | Required for loop |
| *Missing Role* | Electric Heating Element (`electric_heater_element`) | Thermal Load | 1 | *Unpriced* | *Unpriced* | *Unpriced* | Required for loop |
| **CATALOG TOTAL** | **3 Verified Industrial Pilot Devices** | — | **3** | **$1,445.00** | **144,500 ¢** | **$1,445.00** | **Priced** |

### 3.2 Bundle Commercial Schema Excerpt

```json
{
  "commercial": {
    "currency": "USD",
    "catalog_total_usd_cents": 144500,
    "catalog_total_usd": 1445.0,
    "items": [
      {
        "sku": "CN-X5PRIME-HE-XP5",
        "title": "X5 Prime OCS All-in-One Controller (HE-XP5)",
        "quantity": 1,
        "unit_price_usd_cents": 89000,
        "unit_price_usd": 890.0,
        "subtotal_usd_cents": 89000,
        "subtotal_usd": 890.0,
        "availability": "in_stock"
      },
      {
        "sku": "CN-N1200",
        "title": "N1200 Universal Process Controller",
        "quantity": 1,
        "unit_price_usd_cents": 48000,
        "unit_price_usd": 480.0,
        "subtotal_usd_cents": 48000,
        "subtotal_usd": 480.0,
        "availability": "in_stock"
      },
      {
        "sku": "CN-THT02",
        "title": "THT-02 Temperature and Humidity Transmitter",
        "quantity": 1,
        "unit_price_usd_cents": 7500,
        "unit_price_usd": 75.0,
        "subtotal_usd_cents": 7500,
        "subtotal_usd": 75.0,
        "availability": "in_stock"
      }
    ],
    "missing_roles_unpriced": [
      "power_actuator_ssr",
      "electric_heater_element"
    ],
    "quote_readiness": "ready_for_preliminary_estimate"
  }
}
```

---

## 4. Architectural Readiness Dimensions

The platform enforces three explicit orthogonal readiness flags:

```json
{
  "readiness": {
    "ready_for_3d_presentation": true,
    "ready_for_commercial_estimate": true,
    "ready_for_procurement": false,
    "blockers": [
      "Power actuator stage (SSR) missing from topology",
      "Heating element load missing from topology"
    ]
  }
}
```

1. **`ready_for_3d_presentation`: `true`**  
   All 3 pilot SKUs possess verified glTF 2.0 binary (`.glb`) assets normalized in meters (+Y up, +Z front) with zero Khronos validator errors and 0.0 mm envelope deltas.
2. **`ready_for_commercial_estimate`: `true`**  
   All catalog pilot components resolve valid USD prices and inventory stock in Medusa 2. An honest preliminary budget can be established ($1,445.00 USD).
3. **`ready_for_procurement`: `false`**  
   The Gate G5 strict deterministic evaluator returns `does_not_meet` (`INCOMPLETE_CONTROL_LOOP`). Controlnautas prevents generative AI from authorizing procurement orders when the physical control loop is incomplete.

---

## 5. Verification & Test Evidence

### 5.1 Test Suites Execution
- **Integer Cents Pricing Calculation:** Verified deterministic multiplication `price_minor * quantity` across all catalog items.
- **Idempotency Conflict Tests:** Confirmed identical requests return existing quote snapshot (HTTP 200), whereas modified bodies reusing idempotency keys trigger `IDEMPOTENCY_CONFLICT` (HTTP 409).
- **ReportLab PDF Compilation:** Verified generation of binary document starting with `%PDF-1.4`, containing correct B2B letterhead, tabulated BOM items, and total amount.
- **Public Edge HTTPS Smokes:**
  - `GET https://data.controlnautas.com/api/industrial/v2/products/CN-N1200/offer` → HTTP 200 ($480.00 / 48000 cents)
  - `GET https://data.controlnautas.com/api/industrial/v2/products/CN-X5PRIME-HE-XP5/offer` → HTTP 200 ($890.00 / 89000 cents)
  - `GET https://data.controlnautas.com/api/industrial/v2/products/CN-THT02/offer` → HTTP 200 ($75.00 / 7500 cents)
  - `POST https://data.controlnautas.com/api/industrial/v2/preliminary-quotes` → HTTP 201 ($1,445.00 total)
  - `GET https://data.controlnautas.com/api/industrial/v2/quotes/{id}/pdf` → HTTP 200 (`application/pdf`)
  - `GET https://data.controlnautas.com/api/industrial/v2/configurations/heating-chamber/bundle` → HTTP 200 (`commercial` block + `ready_for_commercial_estimate: true`)

### 5.2 PDF Template Status & Pricing Alignment Fix
- **Identified Condition:** Preliminary quotes JSON returned live prices, but the ReportLab PDF generation worker checked `status == 'priced'` strictly, causing it to fall back to the manual-review template when `status: 'preliminary'` was passed.
- **Resolution Implemented:**
  1. `preliminary-quotes/route.ts` and `quotes/[quoteId]/pdf/route.ts`: Evaluates whether all quote lines have positive unit prices from Medusa; if so, passes `status: "priced"` in the PDF payload while preserving JSON `status: "preliminary"` with the demo disclaimer.
  2. `scripts/generate-quote-pdf.py`: Updated to automatically treat `status: 'preliminary'` as `priced` whenever items contain positive unit prices.
  3. PDF payload explicitly passes item `model`, `unit_price`, `subtotal`, and `total` so `build_priced_section` renders the complete commercial breakdown.
  4. Verified via public HTTPS smoke test: downloaded PDF text confirmed to contain `$890.00 USD`, `$480.00 USD`, `$75.00 USD`, and `$1,445.00 USD` alongside the simulation disclaimer watermark.

---

## 6. Acceptance Decision & Sign-Off

Gate **G9 (Live B2B Commerce, Multiline Preliminary Quotes & Correlated PDF)** is **ACCEPTED AND PASSED**.

- **Pricing Accuracy:** 100% exact integer minor cents; zero floating point drift.
- **Data Integrity:** No fabricated prices, no dummy SKUs for missing roles.
- **Safety Decoupling:** Commercial estimate permitted while procurement is safely gated.
- **External Integration:** OpenAPI 3.1 specification published and operator testing runbook updated.
