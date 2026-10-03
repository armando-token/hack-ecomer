# Sprint DEMO P0: Meta Muse Operator Testing Guide

**Document ID:** `docs/industrial/muse-operator-demo-p0.md`  
**Target Gate:** `SPRINT_DEMO_P0` / Operational Blocker `BLK-06`  
**Execution Environment:** Public Edge HTTPS (`https://data.controlnautas.com`)  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§20 Conector e instrucciones operativas de Muse, §33 Fases G0–G14)  
**Security Policy:** Strict HTTPS only. No raw development ports (Port 9000 prohibited in operator client tools). Redacted Bearer authentication.

---

## 1. Overview & Operator Mission

This guide provides a human operator or QA engineer with step-by-step instructions to verify the **Controlnautas Sprint DEMO P0** agentic integration with **Meta Muse**.

The system provides:
1. **Machine-Readable Industrial API v2:** OpenAPI 3.1 spec, parametric search, verified technical snapshots, and PortSchema anchors.
2. **Deterministic 3D Digital Twins:** Metric GLB assets normalized in meters (+Y up, +Z front) with zero runtime scale errors.
3. **Architectural Safety (Gate G5):** Strict tri-state rule evaluation (`meets`, `does_not_meet`, `not_documented`) preventing generative AI hallucinations and rejecting incomplete control loops.
4. **Agentic B2B Commerce (Gate G9):** Real-time multiline BOM quoting with exact integer cents and signed PDF generation.
5. **Next.js Solution Studio (Gate G10):** Interactive English documentation and quickstart at `https://data.controlnautas.com/solution`.

---

## 2. Prerequisites & Authentication

### 2.1 Public Base URLs
- **API Base URL:** `https://data.controlnautas.com`
- **OpenAPI 3.1 Spec:** `https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml`
- **Storefront Solution Studio:** `https://data.controlnautas.com/solution` (redirects to `/us/solution`)

### 2.2 Public OEM Documentation & Datasheets (HTTPS Delivery)
All pilot datasheets and OEM source manuals are published directly via Nginx with TLS 1.3, CORS `*`, and public caching:
- **Pilot Catalog Datasheets:**
  - `https://data.controlnautas.com/demo/datasheets/CN-N1200.pdf` (NOVUS N1200 Universal Process Controller User Manual)
  - `https://data.controlnautas.com/demo/datasheets/CN-X5PRIME-HE-XP5.pdf` (Horner X5 Prime OCS Datasheet)
  - `https://data.controlnautas.com/demo/datasheets/CN-THT02.pdf` (TZone THT-02 Sensor Manual)
- **OEM Source Archive & Reference Manuals:**
  - `https://data.controlnautas.com/oem-sources/horner-x4/MAN1137_21_EN_X4_UM.pdf` (Horner X4 User Manual)
  - `https://data.controlnautas.com/oem-sources/horner-x4/MAN1138_R21_X4_DS.pdf` (Horner X4 Datasheet)
  - `https://data.controlnautas.com/oem-sources/tzone-tht02/THT02_users_manual_v1.1.pdf` (TZone THT-02 User Manual V1.1)
  - `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_PumpHouse_Install.pdf` (King Electric U-Series Pumphouse Heater Installation Guide)
  - `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_WEB.pdf` (King Electric U-Series Pumphouse Heater Overview)

### 2.3 Explicit Behavioral Rules for Meta Muse Operators (Gate REAL_OEM_SYNC)
> [!IMPORTANT]
> **Strict Behavioral Doctrine for Muse Operators:**
> - Muse MUST load ONLY catalog GLBs for pilot SKUs: `CN-X5PRIME-HE-XP5`, `CN-N1200`, `CN-THT02`.
> - SSR and heater heating elements MUST remain unlabeled generic missing_roles; never invent unverified equipment.
> - Muse SHOULD open OEM PDFs over HTTPS (`https://data.controlnautas.com/demo/datasheets/...` and `/oem-sources/...`) to inspect physical appearance, terminal block layouts, and bezel details. Muse MUST NEVER invent alternate controllers/sensors that replace catalog GLBs.

### 2.4 Bearer Authentication
All requests to protected v2 endpoints accept a Bearer token:
```bash
export MUSE_API_TOKEN="[REDACTED_MUSE_BEARER_TOKEN]"
```
*(For read-only public demo endpoints, authentication is optional or accepts `Authorization: Bearer test_operator_token`)*.

---

## 3. Step-by-Step Operator Verification Runbook

### Step 3.1: Discover Agent Capabilities (Gate G7)
Verify platform capabilities, enabled units, active rule engines, and supported process families.

```bash
curl -s https://data.controlnautas.com/api/industrial/v2/capabilities | jq .
```

**Expected Response Highlights:**
- `status`: `ready` / `operational`
- `api_version`: `2.0.0`
- `active_process_families`: includes `heating_chamber`
- `evaluator`: `gate_g5_deterministic`
- `supported_units`: `["Cel", "mA", "VDC", "VAC", "m", "mm", "W", "Ohm", "bps"]`

---

### Step 3.2: Parametric Catalog Search (Gate G7)
Search for verified pilot products by keyword or parametric filter (e.g., query for "novus" or "transmitter").

```bash
curl -s "https://data.controlnautas.com/api/industrial/v2/products/search?q=novus" | jq .
```

**Expected Response Highlights:**
- Array of matching products containing `CN-N1200` (NOVUS Process PID Controller).
- Verified snapshot reference (`snp_cn_n1200_v1`).
- Nominal metric dimensions and primary role (`temperature_process_controller`).

---

### Step 3.3: Product Technical Detail & Evidence Anchors (Gate G7)
Fetch full datasheet facts, electrical ratings, terminal bindings, and page-level evidence references for the NOVUS N1200.

```bash
curl -s https://data.controlnautas.com/api/industrial/v2/products/CN-N1200 | jq .
```

**Expected Response Highlights:**
- `sku`: `"CN-N1200"`
- `ports`: Universal input (RTD/TC), OUT1 SSR pulse, OUT2/3 relays, RS-485 Modbus RTU Slave.
- `evidence`: Datasheet anchor with `page >= 1` (NOVUS N1200 User Manual).
- `mounting`: `1/16 DIN panel cutout (45 x 45 mm)`.

---

### Step 3.4: 3D Model Metadata & Spatial Anchors (Gate G7)
Query 3D digital twin metadata, canonical CAS download URL, metric bounding box, and PortSchema transform nodes.

```bash
curl -s https://data.controlnautas.com/api/industrial/v2/products/CN-N1200/model3d | jq .
```

**Expected Response Highlights:**
- `fidelity`: `"dimensional_proxy_verified"`
- `envelope_meters`: `[0.048, 0.048, 0.110]`
- `linear_unit`: `"m"`
- `download_url`: `https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb`
- `anchors`: 9 named PortSchema nodes (`anchor_power_in`, `anchor_universal_in`, `anchor_out1_ctrl`, `anchor_display_center`, `anchor_mounting_panel`, etc.).

---

### Step 3.5: Direct CAS GLB Binary Inspection (Gate G6)
Verify Content-Addressed Storage delivery headers, caching, and CORS.

```bash
curl -I https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb
```

**Expected HTTP Response Headers:**
```http
HTTP/1.1 200 OK
Content-Type: model/gltf-binary
Content-Length: 31408
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
```

---

### Step 3.6: Heating Chamber Unified Engineering Bundle (Gate G8 & G9)
Fetch the consolidated spatial and engineering configuration bundle for the Heating Chamber Pilot, including the commercial block and readiness flags:

```bash
curl -s https://data.controlnautas.com/api/industrial/v2/configurations/heating-chamber/bundle | jq .
```

**Expected Response Highlights:**
- `process_family`: `"heating_chamber"`
- `components`: Horner X5 (`CN-X5PRIME-HE-XP5`), NOVUS N1200 (`CN-N1200`), TZone THT-02 (`CN-THT02`).
- `spatial_instances`: Pre-computed world translations and rotations in meters.
- `evaluation`: Gate G5 deterministic evaluation status (`does_not_meet` due to missing SSR/heater).
- `commercial`:
  - `currency`: `"USD"`
  - `catalog_total_usd_cents`: `144500`
  - `catalog_total_usd`: `1445.00`
  - `items`: 3 itemized lines with live Medusa unit prices ($890.00, $480.00, $75.00)
  - `missing_roles_unpriced`: `["power_actuator_ssr", "electric_heater_element"]`
  - `quote_readiness`: `"ready_for_preliminary_estimate"`
- `readiness`:
  - `ready_for_3d_presentation`: `true`
  - `ready_for_commercial_estimate`: `true`
  - `ready_for_procurement`: `false`

---

### Step 3.7: Live Commercial Offers & Multiline Quotes (Gate G9)

Verify live pricing from the Medusa commerce engine without invented prices or hallucinated numbers. All pricing is executed using exact integer minor currency units (USD cents).

#### 3.7.1 Query Individual Live Commercial Offers

Query individual verified component pricing:

**1. NOVUS N1200 PID Controller Offer ($480.00 USD / 48,000 cents):**
```bash
curl -s "https://data.controlnautas.com/api/industrial/v2/products/CN-N1200/offer?quantity=1" | jq .
```

**2. Horner X5 Prime OCS Offer ($890.00 USD / 89,000 cents):**
```bash
curl -s "https://data.controlnautas.com/api/industrial/v2/products/CN-X5PRIME-HE-XP5/offer?quantity=1" | jq .
```

**3. TZone THT-02 Transmitter Offer ($75.00 USD / 7,500 cents):**
```bash
curl -s "https://data.controlnautas.com/api/industrial/v2/products/CN-THT02/offer?quantity=1" | jq .
```

**Expected Single Offer Response Highlights:**
- `state`: `"priced"`
- `currency`: `"usd"`
- `unit_price_minor`: Exact integer cents (e.g. `48000` for N1200, `89000` for X5 Prime, `7500` for THT-02).
- `unit_price`: Decimal amount (e.g. `480`, `890`, `75`).
- `availability`: Real-time inventory status (`"in_stock"`).
- `tax_status`: `"tax_excluded"`.
- `shipping_status`: `"to_be_confirmed"`.

#### 3.7.2 Create Multiline Preliminary BOM Quote

Generate an immutable multiline quotation for all three pilot devices:

```bash
curl -s -X POST https://data.controlnautas.com/api/industrial/v2/preliminary-quotes \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      { "sku": "CN-X5PRIME-HE-XP5", "quantity": 1 },
      { "sku": "CN-N1200", "quantity": 1 },
      { "sku": "CN-THT02", "quantity": 1 }
    ],
    "customer": {
      "company": "Industrial Pilot Lab",
      "email": "operator@controlnautas.com"
    }
  }' | jq .
```

*(Note: Legacy `/api/muse/v1/preliminary-quotes` endpoint is also supported for backward compatibility).*

**Expected Response Highlights:**
- `quote_id`: `qte_...`
- `status`: `"preliminary"` (or `"priced"`)
- `currency`: `"USD"`
- `total_cents`: `144500` ($1,445.00 USD exact sum: $890 + $480 + $75)
- `total_usd`: `1445.00`
- `items`: 3 itemized lines with unit prices and subtotals in cents and decimal USD
- `pdf_download_url`: `https://data.controlnautas.com/api/industrial/v2/quotes/{quoteId}/pdf?token=...`

---

### Step 3.8: Official Correlated PDF Quotation Download (Gate G9)
Stream the official signed engineering quotation PDF compiled by the native Python ReportLab worker:

```bash
curl -s -o quote.pdf "https://data.controlnautas.com/api/industrial/v2/quotes/{quoteId}/pdf?token=..."

# Verify PDF header magic bytes (%PDF-1.4)
head -n 1 quote.pdf
```

*(Note: Also downloadable via legacy path `https://data.controlnautas.com/api/muse/v1/quotes/{quoteId}/pdf`).*

**Expected Output:**
- File begins with `%PDF-1.4`.
- Valid binary PDF document containing Controlnautas letterhead, itemized BOM table, exact USD prices ($1,445.00 total), and correlated job ID.

---

### Step 3.9: Web Storefront Solution Studio Check (Gate G10)
Verify the public English Solution Studio page:

```bash
curl -sI https://data.controlnautas.com/solution
```

**Expected HTTP Response:**
- HTTP `307 Temporary Redirect` to `/us/solution` (or HTTP 200).
- Renders the English Industrial Solution Studio with Meta Muse quickstart, 3D digital twins, G5 architectural safety callouts, and quotation links.

---

## 4. Meta Muse Client Conversation Prompts

When interacting directly within the Meta Muse conversational UI, execute the following prompt sequence:

### Prompt 1: Catalog Exploration & Digital Twin Ingestion
> "Query Controlnautas at https://data.controlnautas.com/api/industrial/v2/products/CN-N1200 and import its verified 3D model from https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb. Confirm its bounding envelope is exactly 48 x 48 x 110 mm and inspect its rear electrical terminals."

### Prompt 2: Architectural Safety Verification (Incomplete Loop)
> "Evaluate an industrial heating chamber configuration containing the Horner X5 OCS (CN-X5PRIME-HE-XP5), NOVUS PID controller (CN-N1200), and TZone probe (CN-THT02). Can this configuration directly power a 5 kW heating element?"

**Expected Muse Response:**
> The agent should consult the Gate G5 evaluator and report **does_not_meet** (`INCOMPLETE_CONTROL_LOOP`). It must explain that the instrumentation controllers require an intermediate SSR/power actuator and heating element to safely complete the thermal loop.

### Prompt 3: Commercial BOM Quotation & Live Pricing Verification
> "Query live pricing from https://data.controlnautas.com/api/industrial/v2/products/{sku}/offer for each component. Do NOT use memorized training data or stale chat memory. For the Heating Chamber solution, generate a multiline quote for CN-X5PRIME-HE-XP5, CN-N1200, and CN-THT02, keeping SSR and heater unpriced as missing roles."

**Expected Muse Response:**
> The agent should query live pricing from the `/offer` endpoints, report verified prices ($890.00 for Horner X5, $480.00 for NOVUS N1200, $75.00 for TZone THT-02), calculate the exact total of $1,445.00 USD, generate the multiline preliminary quotation via `https://data.controlnautas.com/api/industrial/v2/preliminary-quotes`, provide the official signed PDF download URL (`https://data.controlnautas.com/api/industrial/v2/quotes/{quoteId}/pdf?token=...`), and explicitly report `power_actuator_ssr` and `electric_heater_element` as unpriced missing roles without fabricating dummy SKUs.

---

## 5. Operator Sign-Off Rubric

| Inspection Item | Success Criteria | Operator Result |
|---|---|---|
| **1. Public HTTPS** | Strict TLS 1.3 on port 443; zero port 9000 leaks | `[ PASS / FAIL ]` |
| **2. OpenAPI 3.1** | Valid YAML schema accessible at `/docs/openapi-industrial-v2-demo.yaml` | `[ PASS / FAIL ]` |
| **3. API v2 Discovery** | Capabilities and parametric search return verified facts and schemas | `[ PASS / FAIL ]` |
| **4. 3D GLB Delivery** | All 3 GLBs download with HTTP 200, CORS `*`, and immutable cache | `[ PASS / FAIL ]` |
| **5. Spatial Scale** | Bounding box delta is 0.0 mm; units in meters (+Y up, +Z front) | `[ PASS / FAIL ]` |
| **6. G5 Safety Engine** | Incomplete control loop safely rejected with `does_not_meet` | `[ PASS / FAIL ]` |
| **7. Live Commercial Offers** | `/offer` endpoints return live Medusa pricing ($890.00, $480.00, $75.00) in USD cents + decimal | `[ PASS / FAIL ]` |
| **8. Multiline BOM Quotation** | `POST /preliminary-quotes` calculates exact $1,445.00 total (144,500 cents) without rounding errors | `[ PASS / FAIL ]` |
| **9. Heating Chamber Commercial Block** | Unified bundle returns `commercial` object ($1,445.00 total) and `ready_for_commercial_estimate: true` | `[ PASS / FAIL ]` |
| **10. Correlated Signed PDF** | Streamed `/quotes/{id}/pdf` returns valid `%PDF-1.4` binary compiled by ReportLab worker | `[ PASS / FAIL ]` |
| **11. Missing Roles Discipline** | SSR and heater elements remain strictly unpriced as `missing_roles_unpriced` (Zero Fabricated SKUs) | `[ PASS / FAIL ]` |
| **12. Solution Studio** | `/solution` renders clean Next.js English documentation with quotation quickstart | `[ PASS / FAIL ]` |
| **13. OEM PDF Delivery** | All 8 PDF datasheets & OEM manuals return HTTP 200 over HTTPS with CORS `*` | `[ PASS / FAIL ]` |
| **14. Catalog Protection** | Muse loads ONLY pilot catalog GLBs; SSR/heater remain unlabeled missing roles | `[ PASS / FAIL ]` |

---

**Operator Notes & Blocker Tracking:**  
Successful execution of this checklist clears operational blocker **BLK-06** and validates complete readiness for live production demonstration.
