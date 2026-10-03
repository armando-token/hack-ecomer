# Baseline Checkout & Code Inventory Report: Controlnautas Hack AI Commerce

**Document ID:** `docs/industrial/baseline.md`  
**Host Machine:** EC2 Linux (`x86_64`, Amazon Linux 2023, kernel 6.18)  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Audit Timestamp:** 2026-10-03  
**Gate:** G0 (Baseline, Sources & Pilot Scope)  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§3, §4, §33 G0)  

---

## 1. Executive Summary & Authoritative Working Baseline

The active working checkout at `/home/ec2-user/projects/hack-ecomer` is verified as the authoritative code baseline for the Controlnautas project.

### 1.1 Source Archives and Checksums
- **Baseline Archive (SRC-01):** `/home/ec2-user/sources/hackday26_F-cursor-full-project-import-5dca.zip`
  - Size: 18,866,230 bytes
  - SHA-256: `39c46d38cb4108882603da18782b3da7237c85384810f59d4ce62a5398bc2313`
  - Extracted Path: `/home/ec2-user/sources/zip-extract/hackday26_F-cursor-full-project-import-5dca`
- **Comparison Repository (SRC-02):** `/home/ec2-user/sources/hackday26`
  - Cloned From: `https://github.com/armando-token/hackday26.git`
  - Commit SHA: `04d5e6c3493400bcd7e4fe5ff68b87e064225600`
- **Governing Master Plan:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md`
  - Size: 196,004 bytes
  - SHA-256: `eba0fd5f9c730444151eaec757f859de8ab85225bd02f6a861a4345c8bb3fed9`
  - Supersedes `PLAN_MAESTRO.md` (`cc380cc95c9f35310fc0b976c7cfb8969790110b49e90cd43225773435f2cfd9`).

---

## 2. Parity Verifications

### 2.1 Working Tree vs. Baseline ZIP Archive
A recursive diff between `/home/ec2-user/projects/hack-ecomer` and `/home/ec2-user/sources/zip-extract/hackday26_F-cursor-full-project-import-5dca` (excluding `.git`, `docs/gates`, and `docs/industrial`) confirmed **byte-for-byte identity**:
- Zero file differences across all existing code, configurations, schemas, and assets.
- The checkout represents a complete and uncorrupted extraction of the original project archive.

### 2.2 Working Tree vs. Comparison Repository (`hackday26`)
Audit of `https://github.com/armando-token/hackday26.git` revealed that the repository is a presentation-only shell:
- It contains only: `LICENSE` (MIT), `README.md`, pitch deck PDF (`docs/pitch/Controlnautas-Muse-API-Pitch.pdf`), and banner images.
- It completely lacks: `b2b-backend/`, `b2b-storefront/`, `scripts/`, `docker-compose.yml`, datasheets, and OpenAPI specifications.
- **Conclusion:** The working tree in `/home/ec2-user/projects/hack-ecomer` derived from the baseline ZIP is the sole functional codebase.

---

## 3. Inventory of Monorepo, Schemas, and Endpoints

### 3.1 Monorepo Architecture
- Root: Turbo / monorepo workspace.
- **Backend (`b2b-backend`):**
  - Application: `apps/backend` running Medusa 2.17.0.
  - Core Modules: `b2b-pim` (technical profile, facts, sources), `brand`.
- **Storefront (`b2b-storefront`):**
  - Application: Next.js 15.3.9, React 19.0.5.

### 3.2 Database Migrations (PostgreSQL)
Existing migrations in `b2b-backend/apps/backend/src/modules/`:
- `b2b-pim`:
  - `Migration20260626013101.ts`: Creates `pim_info`.
  - `Migration20260815011014.ts`: Adds specs, SEO, purchase modes.
  - `Migration20260831212957.ts`: Unique indexes on `product_id`.
  - `Migration20260929181517.ts`: Creates `technical_fact`, `technical_profile`, `technical_source`.
- `brand`:
  - `Migration20260815011008.ts`: Creates `brand` table.

### 3.3 Preserved Legacy Muse v1 Endpoints
As required by MEGAPLAN §6.1, the following routes must remain functional and backward-compatible:
1. `GET /healthz` — Service health check.
2. `GET /api/muse/v1/products/search` — Product keyword and role search.
3. `GET /api/muse/v1/products/{variantId}` — Product technical profile lookup.
4. `POST /api/muse/v1/evaluate` — Single-product requirement evaluation (adapted to strict tri-state core).
5. `GET /api/muse/v1/products/{variantId}/offer` — Real-time price and inventory offer in USD.
6. `POST /api/muse/v1/preliminary-quotes` — Single-product preliminary quote generation.
7. `GET /api/muse/v1/quotes/{quoteId}/pdf` — Correlated quote PDF download.

---

## 4. Symlinks Audit and Portability Analysis

A filesystem audit (`find . -type l`) detected 7 symbolic links in the working tree. 5 are broken due to hardcoded paths referencing an external Ubuntu machine (`/home/ubuntu/hackday26/...`):

| Symlink Path | Current Target | Status | Resolution Proposal for G1 |
|---|---|---|---|
| `./b2b-storefront/public/demo/datasheets` | `/home/ubuntu/hackday26/docs/datasheets` | ❌ **BROKEN** | Replace with relative link `../../../../docs/datasheets` or copy during build. |
| `./b2b-storefront/public/demo/specs` | `/home/ubuntu/hackday26/docs/demo-specs` | ❌ **BROKEN** | Replace with relative link `../../../../docs/demo-specs` or copy during build. |
| `./docs/datasheets/CN-DEMO-PID-PT100-RS1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PID-PT100-RS1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PID-PT100-RS1.pdf` (exists in same directory). |
| `./docs/datasheets/CN-DEMO-PLC-DIN-420-MR1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PLC-DIN-420-MR1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PLC-DIN-420-MR1.pdf` (exists in same directory). |
| `./docs/datasheets/CN-DEMO-PT100-3W-A1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PT100-3W-A1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PT100-3W-A1.pdf` (exists in same directory). |
| `./b2b-backend/apps/backend/src/api/muse` | `api/muse` | ⚠️ **VALID (ALIAS)** | Preserved for legacy routing; new v2 endpoints will not create symlink aliases. |
| `./b2b-backend/apps/backend/src/scripts/seed-demo-catalog.ts` | `seed-hackday-demo.ts` | ✅ **VALID** | Target exists in same directory. |

*Per G0 constraints, no symlinks have been mutated during G0.*

---

## 5. Technical Documentation & Manufacturer Fact Sheets on Disk

The checkout contains official manufacturer documentation for the verified 3-SKU catalog:
1. `CN-X5PRIME-HE-XP5`:
   - Datasheet PDF: `docs/datasheets/CN-X5PRIME-HE-XP5.pdf` (2,220,450 bytes, SHA-256: `70278736e6b8f3ab...`)
   - Markdown Docs: `real-products-publish/docs/x5prime/X5_Prime_Datasheet.md`, `X5_Prime_User_Manual.md`, `X5_Prime_Quick_Reference.md`.
2. `CN-N1200`:
   - Datasheet PDF: `docs/datasheets/CN-N1200.pdf` (1,280,893 bytes, SHA-256: `53384720600d70cd...`)
   - Markdown Docs: `real-products-publish/docs/n1200/N1200_User_Guide.md`, `NOVUS_Controllers_Selection_Guide.md`.
3. `CN-THT02`:
   - Datasheet PDF: `docs/datasheets/CN-THT02.pdf` (671,763 bytes, SHA-256: `48718e7159641349...`)
   - Markdown Docs: `real-products-publish/docs/tht02/THT02_User_Manual.md`.

---

## 6. The 12 Discrepancies (§4.3) and Resolution Matrix

1. **PostgreSQL 16 (README) vs. PostgreSQL 15 (`docker-compose.yml`):** Effective version to be verified upon database provisioning via `SHOW server_version`. Do not perform arbitrary major upgrades without schema validation.
2. **Package Managers (npm backend vs. Yarn storefront):** Storefront contains both `package-lock.json` and `yarn.lock`. In G1, establish reproducible installation without mixing package managers in the same package.
3. **Quote PDF Route URL:** Code handler and OpenAPI specify `/api/muse/v1/quotes/{quoteId}/pdf`. Authoritative path is the code handler.
4. **Currency Handling (USD in API vs. PEN hardcoded in `money.ts`):** `money.ts` strictly rejects non-PEN currencies. For v2, build a dedicated monetary module with integer cents in USD.
5. **Floating-Point Math in `offer.ts`:** Legacy code divides/multiplies by 100 via standard JS floats. v2 calculations must eliminate IEEE 754 precision issues using integer minor unit math.
6. **Hardcoded DB Credentials Fallback in `db.ts`:** Production / authenticated configurations must fail fast if `DATABASE_URL` is undefined.
7. **Dual Medusa Configurations (`medusa-config.ts` vs. `medusa-config.js`):** In G1, designate `medusa-config.ts` as authoritative.
8. **Hardcoded `/home/ubuntu/...` in PDF Generator & Storage:** Parameterize storage base paths relative to runtime deployment.
9. **API Symlink Aliasing (`src/api/muse` -> `api/muse`):** Ensure `/api/industrial/v2` is cleanly namespaced without creating route aliases.
10. **Hardcoded CORS Origins:** Parameterize CORS via environment variables, removing hardcoded host IPs.
11. **Static Prices in `docs/llms.txt`:** Replace static hardcoded prices with dynamic API query instructions.
12. **FIFO Worker Queue Race Condition in PDF Generator:** Correlate worker jobs via explicit `job_id` or isolate processes.
