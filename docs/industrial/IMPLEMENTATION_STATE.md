# Project Implementation State Ledger

**Current Gate:** `G9_COMMERCE_V2`  
**Status:** `G9_COMMERCE_V2_COMPLETED`  
**Last Updated:** `2026-10-03T22:54:00Z`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md`  

---

## 1. Gate Execution Progress (MEGAPLAN §33)

| Gate | Name | Status | Notes |
|---|---|---|---|
| **G0** | **Baseline, Sources & Pilot Scope** | ✅ **COMPLETED** | Working tree verified against ZIP SHA `39c46d38...`, MEGAPLAN adopted, ADR-001 rewritten for Muse, Heating Chamber selected, discrepancies documented. |
| **G1** | **Runtime & Reproduction of Store** | ✅ **COMPLETED** | PostgreSQL 16.15 verified, Medusa DB migrated (148 tables), Corepack Yarn Berry enabled, both packages build, ReportLab PDF worker verified, live v1 routes smoked. |
| **G2** | **Early Muse GLB Delivery Capability** | ⚠️ **PARTIAL / BLOCKED_EXTERNAL** | Standalone SYN GLB (43,276 bytes, SHA `4730b336...`) and compact proxy (2,296 bytes) created, Khronos validated (0 errors), delivery endpoints deployed with immutable cache, CORS `*`, and signed URL expiration. Awaiting human operator with Muse credentials per `g2-operator-muse-checklist.md`. Does not block G3. |
| **G3** | **Schemas, Data Module & Migrations** | ✅ **COMPLETED** | `industrialConfig` module registered, 13 PostgreSQL tables and 21 indexes migrated, Zod contracts, canonical hash engine, CAS revision conflict guard, tenant isolation, idempotency replay, reversible SYN fixtures, 89/89 tests passing. |
| **G4** | **Usable Catalog & Real Evidence** | ✅ **COMPLETED** | Verified snapshots for Horner X5, NOVUS N1200, and TZone THT-02; all critical attributes anchored to manufacturer datasheets with page >= 1; exact envelopes in meters; missing circuit roles declared without fake SKUs; 108/108 tests passing. Next: G5. |
| **G5** | **Strict Rule Evaluator Engine** | ✅ **COMPLETED** | 100% deterministic pure evaluator core, closed tri-state verdicts (`meets`, `does_not_meet`, `not_documented`), elimination of 12 false positives, strict unit conversion table, bipartite channel matching, 14 pilot rules, v1 evaluate route adapter, 272/272 tests passing. Next: G6. |
| **G6** | **Product 3D Assets & Dimensional QA** | ✅ **COMPLETED** | glTF 2.0 binary (.glb) assets generated in exact meters (+Y up, +Z front) for all 3 pilot SKUs, Khronos glTF-Validator 0 errors/0 warnings, 0.0 mm envelope delta, PortSchema anchor alignment, CAS delivery active, PostgreSQL seeded reversibly, 100% QA tests passing. Next: DEMO P0. |
| **DEMO P0** | **Sprint DEMO P0 Consolidated Gate** | ✅ **COMPLETED** | Public Edge TLS on `https://data.controlnautas.com`, API v2 thin surface, Heating Chamber bundle, Medusa 2 USD preliminary quotes & PDF, Next.js `/solution` studio page. Ready for Muse Connector Test. |
| **REAL_OEM_SYNC** | **OEM Sources Audit, Public HTTPS & Catalog Guard** | ✅ **COMPLETED** | Nginx public HTTPS publishing of OEM sources and datasheets, provenance registry updated (SRC-28 to SRC-32), manifest generated, and Muse operator behavioral doctrine enforced. |
| G7 | Industrial API v2 & Routing | ⏳ Thin Complete (Full post-demo) | Clean discovery, search, detail, model3d, and strict evaluate endpoints active. |
| G8 | Engineering Bundle & Muse Payload | ⏳ Thin Complete (Full post-demo) | Heating chamber unified bundle and scene references deployed. |
| **G9** | **Multi-Item Quotes & Correlated PDF** | ✅ **COMPLETED** | Live Medusa 2 integration, exact integer minor cents ($1,445.00 total), multiline preliminary quotes, ReportLab PDF streaming, commercial bundle block, and public HTTPS verification. |
| G10 | Web Storefront & Admin Extensions | ⏳ Min Complete (Full post-demo) | English Solution Studio `/solution` page live in Next.js storefront. |
| G11 | Optional Thermal Simulation | ⏳ Pending | Pure TypeScript first-order lumped model (§22.2) when requested. |
| G12 | D1 Milestone Acceptance | ⏳ Pending | Complete integration test of catalog, evaluation, GLB delivery, and quote snapshot. |
| G13 | Operations, Sizing & Rollback | ⏳ Pending | Backup/restore drills, metrics, and deployment verification. |
| G14 | D2 Delivery & Project Handover | ⏳ Pending | Final release verification and operational runbooks. |

---

## 2. Completed Gates Log

### Gate G0: Baseline, Sources & Pilot Scope
- **Date Completed:** 2026-10-03
- **Governing Architecture:** Meta Muse for conversation and 3D presentation; Controlnautas for Industrial API v2, catalog evidence, deterministic evaluation, GLB delivery, and Medusa 2 USD commerce.
- **Artifacts Produced:** `docs/gates/G0.md`, `docs/industrial/sources.json`, `docs/industrial/baseline.md`, `docs/industrial/scope.md`, `docs/industrial/ADR-001-platform.md`, `docs/industrial/pilot-process.md`.

### Gate G1: Runtime & Reproduction of the Storefront & Backend
- **Date Completed:** 2026-10-03
- **Accomplishments:** PostgreSQL 16.15 provisioned and running natively; Medusa database migrated (148 tables); npm/yarn locks authoritative; Node v22.23.3 LTS retained; `medusa-config` resolution documented; fail-fast production guards active; 5 broken symlinks fixed; Python venv with ReportLab 5.0.1 verified; backend and storefront production builds passed; live v1 smoke tests 100% OK.
- **Artifacts Produced:** `docs/gates/G1.md`, `docs/gates/g1-runtime-report.md`, `docs/industrial/versions.md`, `scripts/requirements.txt`.

### Gate G2: Early Muse GLB Delivery Capability
- **Date Completed (Server-side):** 2026-10-03
- **Accomplishments:**
  - Standalone synthetic 3D model `SYN-IND-CTRL-01.glb` generated in exact METERS (`0.10m × 0.08m × 0.05m`), right-handed system with `+Y up, +Z front`, 4 explicit attachment anchors, and PBR materials.
  - Zero errors in Khronos glTF-Validator; pure binary glTF 2.0 without Draco/Meshopt/KTX2 extensions.
  - Deployed Medusa 2 delivery endpoints: `/industrial-assets/{sha256}/{filename}`, `/api/industrial/v2/experimental/assets/...`, and `/api/muse/v1/experimental/assets/.../download`.
  - Implemented immutable caching (`public, max-age=31536000`), ETag validation, Range requests, wildcard CORS without credentials, signed token expiration (HTTP 410 Gone), and tampering protection (HTTP 403 Forbidden).
  - Drafted OpenAPI 3.1 specification, operator checklist, and machine-readable capability ledger.
- **Artifacts Produced:**
  - `docs/gates/G2.md`
  - `docs/industrial/muse-capability-report.json`
  - `docs/industrial/g2-operator-muse-checklist.md`
  - `docs/industrial/openapi-g2-experimental-assets.yaml`
  - `storage/industrial/assets/4730b336b910dd4edfb2104dbf272ee05000e708e37e9a68c8031b46170045b6/SYN-IND-CTRL-01.glb`
  - `scripts/generate-syn-glb.py`
  - `b2b-backend/apps/backend/src/api/industrial-assets/[sha256]/[filename]/route.ts`
  - `b2b-backend/apps/backend/src/api/api/industrial/v2/experimental/assets/...`
  - `b2b-backend/apps/backend/src/api/api/muse/v1/experimental/assets/...`

### Gate G3: Schemas, Data Module & Migrations
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Medusa 2 module `industrial-config` registered under `industrialConfig` in `medusa-config.ts` and `medusa-config.js`.
  - 13 dedicated PostgreSQL tables migrated with 21 indexes and compound UNIQUE constraints via `Migration20261003211048.ts`.
  - Zod validation contracts implemented for physical quantities, canonical units, evidence references, ports/terminals, snapshots, assets, configurations, revisions, evaluations, exact integer-minor currency arithmetic, and quotes.
  - Domain repository with Compare-and-Swap (CAS) revision updates (HTTP 412 `REVISION_CONFLICT`), strict tenant ownership isolation (HTTP 404 `NOT_FOUND`), and idempotency replay/conflict detection (HTTP 409 `IDEMPOTENCY_CONFLICT`).
  - Canonical SHA-256 hash engine with stable deep key sorting and volatile signed URL token normalization.
  - Reversible fixtures seed script `seed-syn-industrial-fixtures.ts` and rollback `revert-syn-industrial-fixtures.ts` for `SYN-IND-CTRL-01` linked to G2 SYN asset `ast_syn_ctrl_01_v1` without mutating Medusa core commerce tables.
  - All 8 Jest test suites passing (89/89 tests) and production build passing (`medusa build`).
- **Artifacts Produced:**
  - `docs/gates/G3.md`
  - `docs/industrial/g3-schema-map.md`
  - `b2b-backend/apps/backend/src/modules/industrial-config/`
  - `b2b-backend/apps/backend/src/scripts/seed-syn-industrial-fixtures.ts`
  - `b2b-backend/apps/backend/src/scripts/revert-syn-industrial-fixtures.ts`

### Gate G4: Usable Catalog & Real Evidence
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Implemented immutable `TechnicalSnapshot` definitions for Horner X5 Prime OCS (`CN-X5PRIME-HE-XP5`), NOVUS N1200 PID Controller (`CN-N1200`), and TZone THT-02 Environmental Transmitter (`CN-THT02`).
  - Verified 100% of critical industrial attributes (supply voltage, nature, inputs, sensors, outputs, protocols, roles, baud rates, mounting, dimensions) anchored to physical manufacturer datasheets with `page >= 1`, named sections, and literal excerpts.
  - Validated physical ports and terminal mappings against `PortSchema` with closed categories and directionalities.
  - Verified exact metric bounding box envelopes in meters (`[0.120, 0.091, 0.060]`, `[0.048, 0.048, 0.110]`, `[0.110, 0.085, 0.040]`).
  - Seeded snapshots and catalog entries into PostgreSQL 16.15 (`industrial_technical_snapshot` and `industrial_catalog_entry`) with reversible seed/revert scripts and zero mutation of core commerce tables.
  - Formally cataloged missing circuit roles for the Heating Chamber process family (`process_temperature_sensor`, `power_actuator_ssr`, `electric_heater_element`, `instrument_power_supply_24vdc`, `high_limit_safety_thermostat`) enforcing the Zero Fabricated SKUs doctrine.
  - All 9 Jest test suites passing (108/108 tests) and production build clean (`medusa build`). Next: G5.
- **Artifacts Produced:**
  - `docs/gates/G4.md`
  - `docs/industrial/g4-coverage-report.md`
  - `b2b-backend/apps/backend/src/modules/industrial-config/data/g4-catalog-snapshots.ts`
  - `b2b-backend/apps/backend/src/modules/industrial-config/__tests__/g4-catalog-snapshots.spec.ts`
  - `b2b-backend/apps/backend/src/scripts/seed-g4-catalog-fixtures.ts`
  - `b2b-backend/apps/backend/src/scripts/revert-g4-catalog-fixtures.ts`

### Gate G5: Strict Rule Evaluator Engine & v1 Regression
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Implemented 100% deterministic pure evaluator core without external I/O in `src/modules/industrial-config/evaluator/`.
  - Enforced closed tri-state verdict system: `meets`, `does_not_meet`, `not_documented`. Unknown/missing properties never yield overall approval.
  - Eliminated all 12 historical false positive failure modes (missing property + `not_equals`, inverse range coverage Condition B, unit scale mismatches like 20 A vs 20 mA, supply nature VAC vs VDC, missing protocol on RS-485, unverified family option inheritance, empty requirements, open range bounds, contradictory evidence sources, missing power actuator interface in heating chamber loops, Modbus slave address collisions, and baud/parity disjoint configurations).
  - Built unit conversion engine with closed conversion table (current, voltage, temperature, resistance, pressure, power) and strict range coverage Condition A.
  - Built deterministic bipartite matching for channel allocation, multifunction port conflict avoidance, Modbus slave address uniqueness, and baud/parity intersection.
  - Implemented all 14 pilot rules for the Heating Chamber process family (`IDENTITY_VARIANT`, `SIGNAL_COMPATIBILITY`, `RANGE_COVERAGE`, `PORT_DIRECTION`, `CHANNEL_CAPACITY`, `POWER_SUPPLY`, `OUTPUT_ACTUATOR_INTERFACE`, `RTD_WIRING`, `PROTOCOL_ROLE`, `BUS_PARAMETERS`, `ADDRESS_UNIQUENESS`, `MOUNTING_METHOD`, `LOGGING_CAPABILITY`, `CONTROL_LOOP_COMPLETENESS`).
  - Adapted legacy `/api/muse/v1/evaluate` route: 100% backward compatible for v1 consumers while adding v2 tri-state details and dual resolution for both `variant_id` and `sku`.
  - All 17 focused test suites (272 tests) passing; production build (`medusa build`) passing cleanly. Next: G6.
- **Artifacts Produced:**
  - `docs/gates/G5.md`
  - `docs/industrial/g5-semantic-change-report.md`
  - `b2b-backend/apps/backend/src/modules/industrial-config/evaluator/`
  - `b2b-backend/apps/backend/src/modules/industrial-config/__tests__/evaluator-failure-modes.spec.ts`
  - `b2b-backend/apps/backend/src/modules/industrial-config/__tests__/strict-evaluator-t01-t24.spec.ts`

### Gate G6: Product 3D Assets & Dimensional QA
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Pure Python 3 generator `scripts/generate-g6-assets.py` implemented for all 3 Gate G4 pilot SKUs (`CN-X5PRIME-HE-XP5`, `CN-N1200`, `CN-THT02`).
  - Constructed mathematically precise glTF 2.0 binary (`.glb`) assets in exact METERS (`linear_unit: "m"`), normalized to right-handed coordinate system (+Y up, +Z forward) with zero required extensions (no Draco, no Meshopt, no KTX2).
  - Verified honest fidelity tier `dimensional_proxy_verified` derived from official manufacturer engineering drawings (Horner MAN1363-R21, NOVUS UG-V2.0xQ, TZone UM-V1.1).
  - Validated 0.0 mm dimensional delta between nominal datasheet bounding boxes and computed GLB envelopes across all axes.
  - Established 1:1 PortSchema topological anchor bindings in glTF node hierarchy for all power, sensor, control, and communication ports.
  - Automated Khronos `gltf-validator` checks via `scripts/validate-g6-assets.js`: 0 errors, 0 warnings, 0 infos, 0 hints across all 3 models.
  - Generated 512×512 PNG dark-mode isometric preview thumbnails in `docs/industrial/assets/thumbnails/` and `storage/industrial/assets/thumbnails/`.
  - Seeded `industrial_asset` and `industrial_asset_binding` records into PostgreSQL 16.15 with reversible migration scripts (`seed-g6-assets.ts` and `revert-g6-assets.ts`) without mutating core commerce tables.
  - Developed Jest acceptance QA test suite `src/modules/industrial-config/__tests__/g6-assets-qa.spec.ts` (23/23 tests passing) covering CAS integrity, SHA-256 digests, bounding boxes, PortSchema anchors, PostgreSQL records, and HTTP delivery routes.
  - Created human operator Meta Muse verification checklist `docs/industrial/g6-operator-muse-checklist.md` tracking external spatial import under BLK-06.
- **Artifacts Produced:**
  - `docs/gates/G6.md`
  - `docs/industrial/g6-asset-qa-report.md`
  - `docs/industrial/g6-operator-muse-checklist.md`
  - `docs/industrial/assets/CN-X5PRIME-HE-XP5.qa.md`
  - `docs/industrial/assets/CN-N1200.qa.md`
  - `docs/industrial/assets/CN-THT02.qa.md`
  - `docs/industrial/assets/*.manifest.json`
  - `docs/industrial/assets/*.glb`
  - `docs/industrial/assets/thumbnails/*.png`
  - `scripts/generate-g6-assets.py`
  - `scripts/validate-g6-assets.js`
  - `b2b-backend/apps/backend/src/scripts/seed-g6-assets.ts`
  - `b2b-backend/apps/backend/src/scripts/revert-g6-assets.ts`
  - `b2b-backend/apps/backend/src/modules/industrial-config/__tests__/g6-assets-qa.spec.ts`

### Sprint DEMO P0: Public Edge, Industrial API v2, 3D Assets, Commerce & Solution Studio
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Automated deployment of public edge TLS 1.3 reverse-proxy with Let's Encrypt certificates on `https://data.controlnautas.com` (Port 80 auto-redirects to 443; raw Medusa port 9000 encapsulated).
  - Deployed thin Industrial API v2 surface: capabilities discovery, parametric search, product technical detail, 3D model metadata, and Gate G5 strict tri-state evaluator adapter.
  - Published authoritative OpenAPI 3.1 contract at `https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml`.
  - Implemented Heating Chamber unified configuration bundle endpoint (`/api/industrial/v2/configurations/heating-chamber/bundle`) linking component manifests, spatial poses, G5 evaluation, and direct GLB links.
  - Deployed and verified Medusa 2 USD preliminary multiline BOM quotation (`/api/muse/v1/preliminary-quotes`) and ReportLab 5.0.1 signed PDF generation/download (`/api/muse/v1/quotes/{id}/pdf`).
  - Implemented English "Industrial Solution Studio — Controlnautas Pilot" page in Next.js storefront (`/solution` and `/[countryCode]/solution`) with Meta Muse quickstart, 3D digital twins, G5 safety architecture callout, and instant quotation demo.
  - Formalized comprehensive human operator test guide in `docs/industrial/muse-operator-demo-p0.md`.
- **Artifacts Produced:**
  - `docs/gates/SPRINT_DEMO_P0.md`
  - `docs/industrial/muse-operator-demo-p0.md`
  - `b2b-storefront/src/app/[countryCode]/(main)/solution/page.tsx`
  - `b2b-storefront/src/app/solution/page.tsx`
  - `b2b-storefront/public/images/industrial/*.png`

### Gate REAL_OEM_SYNC: Real OEM Documentation Audit, HTTPS Publishing & Catalog Protection
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Audited 5 operator-dropped OEM technical PDF manuals and datasheets in `docs/industrial/oem-sources/` (Horner X4 manual & datasheet, TZone THT-02 manual, UniStream PumpHouse and WEB).
  - Verified cryptographic SHA-256 hashes, file sizes, and page counts; determined technical distinction between Horner X4 (3.5" non-pilot reference) and Horner X5 Prime OCS (`CN-X5PRIME-HE-XP5` 4.3" pilot SKU), preventing catalog/model corruption.
  - Published static `/demo/datasheets/` and `/oem-sources/` directories via Nginx on public HTTPS (`data.controlnautas.com`) with TLS 1.3, CORS `*`, `Cache-Control: public, max-age=86400`, and `autoindex off`.
  - Verified live HTTP 200 responses and `Content-Type: application/pdf` across all 8 public PDF endpoints.
  - Updated authoritative provenance registry `docs/industrial/sources.json` registering `SRC-28` through `SRC-32` and updating `generated_at`.
  - Created machine-readable audit manifest `docs/industrial/oem-sources/manifests/oem-sources-manifest.json`.
  - Encoded strict behavioral doctrine for Meta Muse operators in `docs/industrial/muse-operator-demo-p0.md` and `docs/industrial/g6-operator-muse-checklist.md` enforcing catalog GLB protection, generic missing roles, and visual verification via public HTTPS PDF links without model substitution.
- **Artifacts Produced:**
  - `docs/gates/REAL_OEM_SYNC.md`
  - `docs/industrial/sources.json` (updated)
  - `docs/industrial/oem-sources/manifests/oem-sources-manifest.json`
  - `docs/industrial/muse-operator-demo-p0.md` (updated)
  - `docs/industrial/g6-operator-muse-checklist.md` (updated)
  - `/etc/nginx/conf.d/controlnautas.conf` (updated)

### Gate G9: Live B2B Commerce, Multiline Preliminary Quotes & Correlated PDF
- **Date Completed:** 2026-10-03
- **Accomplishments:**
  - Integrated real-time pricing and inventory calculation directly with Medusa 2 commerce database without fabricated prices or hardcoded dummy estimates.
  - Implemented wire-exact integer minor currency unit arithmetic (USD cents) across all offer and preliminary quote operations, avoiding floating point precision errors.
  - Deployed verified commercial endpoints on public HTTPS (`https://data.controlnautas.com`):
    - `GET /api/industrial/v2/products/{idOrSku}/offer` for live single-SKU pricing and inventory availability.
    - `POST /api/industrial/v2/preliminary-quotes` for multiline preliminary quotation calculation.
    - `GET /api/industrial/v2/quotes/{quoteId}/pdf` for streaming official signed `%PDF-1.4` quotation documents.
  - Enriched Heating Chamber unified configuration bundle (`GET /api/industrial/v2/configurations/heating-chamber/bundle`) with full `commercial` block:
    - Itemized lines for Horner X5 ($890.00 / 89,000 ¢), NOVUS N1200 ($480.00 / 48,000 ¢), and TZone THT-02 ($75.00 / 7,500 ¢).
    - Catalog total of $1,445.00 USD (144,500 cents).
    - Missing roles explicitly documented unpriced (`power_actuator_ssr`, `electric_heater_element`) enforcing Zero Fabricated SKUs doctrine.
    - Readiness flags decoupled: `ready_for_3d_presentation: true`, `ready_for_commercial_estimate: true`, `ready_for_procurement: false` (gated by G5 incomplete loop verdict).
  - Updated authoritative OpenAPI 3.1 specification (`docs/openapi-industrial-v2-demo.yaml`) and synced to Nginx root.
  - Updated Meta Muse operator testing guide (`docs/industrial/muse-operator-demo-p0.md`) with live offer and multiline curl verification commands, natural language operator prompt, and commercial rubric criteria.
- **Artifacts Produced:**
  - `docs/gates/G9_COMMERCE_V2.md`
  - `docs/gates/G9.md`
  - `docs/openapi-industrial-v2-demo.yaml` (updated)
  - `docs/industrial/muse-operator-demo-p0.md` (updated)
  - `docs/industrial/IMPLEMENTATION_STATE.md` (updated)

---

## 3. Open Failures and Operational Blockers

| ID | Issue Description | Impact | Target Gate | Resolution Path |
|---|---|---|---|---|
| **BLK-01** | Remote Git HTTPS authentication prompt disabled non-interactively | Push blocked to private remote `armando-token/hack-ecomer.git` | G0+ | Keep commits local until human operator configures Git credentials or SSH key. |
| ~**BLK-02**~ | ~PostgreSQL / Docker not installed on EC2 host~ | **CLEARED in G1** | G1 | PostgreSQL 16.15 native service installed, running, and migrated. |
| ~**BLK-03**~ | ~Yarn package manager not installed on EC2 host~ | **CLEARED in G1** | G1 | Enabled Yarn 4.12.0 via Corepack. |
| ~**BLK-04**~ | ~Python `reportlab` library not installed~ | **CLEARED in G1** | G1 | Installed `reportlab==5.0.1` and `pillow==11.3.0` in `.venv`. |
| ~**BLK-05**~ | ~ZooWork account credentials missing~ | **CLEARED in G0** | N/A | ZooWork path abandoned. Human has Muse available; Gate G2 will test GLB delivery. |
| **BLK-06** | Meta Muse external account execution requires human operator credentials | External verification of GLB import in Meta Muse pending for G2 synthetic & G6 real pilot assets | G2 / G6 / DEMO P0 | Server-side endpoints fully verified over HTTPS. Human operator follows `docs/industrial/muse-operator-demo-p0.md`. Does not block platform readiness. |

---

## 4. Environment & Host Inventory Notes

- **Operating System:** Linux (EC2 `x86_64`, Amazon Linux 2023.12, kernel 6.18)
- **User / Working Directory:** `ec2-user` / `/home/ec2-user/projects/hack-ecomer`
- **Public Domain / Elastic IP:** `data.controlnautas.com` → `54.84.170.82` (Let's Encrypt TLS 1.3 Active on Port 443; Nginx reverse proxy to Medusa :9000; Port 80 redirects to HTTPS)
- **Node.js Runtime:** `v22.23.3` (Active LTS line)
- **Package Managers:** npm `10.9.9` (`b2b-backend`), Yarn `4.12.0` (`b2b-storefront`)
- **Python Runtime:** `3.9.25` (`.venv/bin/python3`)
- **Database Engine:** PostgreSQL `16.15` (Native on `localhost:5432`)
- **Target Remote:** `https://github.com/armando-token/hack-ecomer.git` (branch: `main`)
- **Active Currency:** `USD` ($)
- **Active Locale & Copy Language:** `en-US` (English)
- **Pilot Security Principal:** `guest / demo operator`
- **Pilot Process Family:** `Industrial Heating Chamber` (`cámara de calentamiento`)
