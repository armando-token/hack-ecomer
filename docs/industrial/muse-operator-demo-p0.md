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

### 2.2 Bearer Authentication
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

### Step 3.6: Heating Chamber Unified Engineering Bundle (Gate G8)
Fetch the consolidated spatial and engineering configuration bundle for the Heating Chamber Pilot.

```bash
curl -s https://data.controlnautas.com/api/industrial/v2/configurations/heating-chamber/bundle | jq .
```

**Expected Response Highlights:**
- `process_family`: `"heating_chamber"`
- `components`: Horner X5 (`CN-X5PRIME-HE-XP5`), NOVUS N1200 (`CN-N1200`), TZone THT-02 (`CN-THT02`).
- `spatial_instances`: Pre-computed world translations and rotations in meters.
- `evaluation`: Gate G5 deterministic evaluation status.

---

### Step 3.7: Instant Preliminary BOM Quotation (Gate G9)
Request a real-time multiline BOM quotation in USD.

```bash
curl -s -X POST https://data.controlnautas.com/api/muse/v1/preliminary-quotes \
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

**Expected Response Highlights:**
- `quote_id`: `qte_...`
- `status`: `preliminary`
- `currency`: `USD`
- `items`: Itemized lines with Medusa 2 USD unit prices and subtotal calculated via exact integer cents.
- `pdf_download_url`: `https://data.controlnautas.com/api/muse/v1/quotes/{quote_id}/pdf`

---

### Step 3.8: Official Correlated PDF Quotation Download (Gate G9)
Download the signed engineering quotation PDF compiled by the native Python ReportLab worker.

```bash
curl -s -o quote_demo.pdf \
  https://data.controlnautas.com/api/muse/v1/quotes/[QUOTE_ID]/pdf

# Verify PDF header magic bytes (%PDF-1.4)
head -n 1 quote_demo.pdf
```

**Expected Output:**
- File begins with `%PDF-1.4`.
- Valid binary PDF document containing Controlnautas letterhead, itemized BOM table, prices in USD, and correlated job ID.

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

### Prompt 3: Commercial BOM Quotation
> "Generate a preliminary B2B quotation for 1 unit of Horner X5 (CN-X5PRIME-HE-XP5), 1 unit of NOVUS N1200 (CN-N1200), and 1 unit of TZone THT-02 (CN-THT02) via https://data.controlnautas.com/api/muse/v1/preliminary-quotes and provide the official PDF download link."

---

## 5. Operator Sign-Off Rubric

| Inspection Item | Success Criteria | Operator Result |
|---|---|---|
| **1. Public HTTPS** | Strict TLS 1.3 on port 443; zero port 9000 leaks | `[ PASS / FAIL ]` |
| **2. OpenAPI 3.1** | Valid YAML schema accessible at `/docs/...` | `[ PASS / FAIL ]` |
| **3. API v2 Discovery** | Capabilities and parametric search return verified facts | `[ PASS / FAIL ]` |
| **4. 3D GLB Delivery** | All 3 GLBs download with HTTP 200, CORS `*`, and immutable cache | `[ PASS / FAIL ]` |
| **5. Spatial Scale** | Bounding box delta is 0.0 mm; units in meters | `[ PASS / FAIL ]` |
| **6. G5 Safety Engine** | Incomplete control loop safely rejected with `does_not_meet` | `[ PASS / FAIL ]` |
| **7. USD Quotation** | Accurate multiline BOM pricing without float rounding | `[ PASS / FAIL ]` |
| **8. Signed PDF** | Valid `%PDF-1.4` binary downloaded and visually legible | `[ PASS / FAIL ]` |
| **9. Solution Studio** | `/solution` renders clean Next.js English documentation | `[ PASS / FAIL ]` |

---

**Operator Notes & Blocker Tracking:**  
Successful execution of this checklist clears operational blocker **BLK-06** and validates complete readiness for live production demonstration.
