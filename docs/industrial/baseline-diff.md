# Baseline Diff & Inventory Report: Controlnautas Hack AI Commerce

**Document ID:** `docs/industrial/baseline-diff.md`  
**Host Machine:** EC2 Linux (`x86_64`, kernel 6.1, Amazon Linux 2023)  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Audit Timestamp:** 2026-10-03T19:15:00Z  
**Gate:** G0 (Checkout, Scope & Sources)  

---

## 1. Executive Summary & Chosen Baseline Origin

The active checkout located at `/home/ec2-user/projects/hack-ecomer` is selected as the authoritative working tree for the implementation of the Controlnautas Hack AI Commerce project.

### 1.1 Baseline Sources Contrast
- **Source A (Baseline Archive):** `/home/ec2-user/sources/hackday26_F-cursor-full-project-import-5dca.zip`
  - SHA-256: `39c46d38cb4108882603da18782b3da7237c85384810f59d4ce62a5398bc2313`
  - Extracted to: `/home/ec2-user/sources/zip-extract/hackday26_F-cursor-full-project-import-5dca`
- **Source B (Comparison Git Repo):** `/home/ec2-user/sources/hackday26`
  - Cloned from: `https://github.com/armando-token/hackday26.git`
  - Commit SHA: `04d5e6c3493400bcd7e4fe5ff68b87e064225600`
- **Working Tree:** `/home/ec2-user/projects/hack-ecomer`
  - Configured Git Remote: `https://github.com/armando-token/hack-ecomer.git` (private)

---

## 2. Concrete Path Comparisons

### 2.1 Working Tree vs. Baseline ZIP Extract
A recursive file comparison (`diff -r -q --no-dereference --exclude=".git" --exclude="gates" --exclude="industrial"`) between `/home/ec2-user/projects/hack-ecomer` and `/home/ec2-user/sources/zip-extract/hackday26_F-cursor-full-project-import-5dca` yielded **zero differences**.

All application source code, configuration files, scripts, manifests, and documentation from the baseline archive are byte-for-byte identical in the working tree. The only differences present in the working tree are:
1. `.git/`: Local Git repository initialized on branch `main` with remote pointing to `https://github.com/armando-token/hack-ecomer.git`.
2. `docs/industrial/`: Directory containing `PLAN_MAESTRO.md` (SHA-256: `cc380cc95c9f35310fc0b976c7cfb8969790110b49e90cd43225773435f2cfd9`) and generated G0 artifacts.
3. `docs/gates/`: Directory created to store gate audit logs (`G0.md`, etc.).

### 2.2 Working Tree vs. Comparison Repository (`hackday26`)
A recursive comparison between `/home/ec2-user/sources/hackday26` and `/home/ec2-user/projects/hack-ecomer` reveals that **the comparison repository is a presentation-only shell** and does not contain the operational application codebase:

| Path in Comparison Repo | Present in Working Tree | Status & Notes |
|---|---|---|
| `LICENSE` (MIT) | ❌ Absent | Contains MIT license text; missing from ZIP and working tree. |
| `README.md` | ✅ Present | Byte-for-byte identical (8,413 bytes). |
| `.gitignore` | ✅ Present | Comparison repo has a 23-line subset; working tree has a comprehensive 73-line `.gitignore`. |
| `docs/pitch/Controlnautas-Muse-API-Pitch.pdf` | ❌ Absent | Pitch deck PDF present in comparison repo (6.9 MB). |
| `docs/hackday26-repo-cover.jpg` | ❌ Absent | Cover banner image. |
| `docs/hackday26-social-preview.jpg` | ❌ Absent | Social media preview banner. |
| `b2b-backend/` | ❌ Absent in repo | **Complete Medusa 2 backend absent in comparison repo.** |
| `b2b-storefront/` | ❌ Absent in repo | **Complete Next.js storefront absent in comparison repo.** |
| `scripts/` | ❌ Absent in repo | **All test, verification, and PDF generator scripts absent.** |
| `docker-compose.yml` | ❌ Absent in repo | **Postgres Compose definition absent in comparison repo.** |
| `docs/openapi.*` | ❌ Absent in repo | **OpenAPI schemas absent in comparison repo.** |
| `docs/datasheets/` | ❌ Absent in repo | **Manufacturer and synthetic datasheets absent in comparison repo.** |

**Conclusion:** The working tree `/home/ec2-user/projects/hack-ecomer` derived from the baseline ZIP is the sole complete code baseline.

---

## 3. Inventory of Broken Symlinks & Portability Analysis

A filesystem audit (`find . -type l`) discovered 7 symbolic links in the working tree. 5 are broken due to hardcoded paths referencing a legacy Ubuntu user environment (`/home/ubuntu/hackday26/...`):

| Symlink Path | Current Target | Status | Resolution Proposal for G1 |
|---|---|---|---|
| `./b2b-storefront/public/demo/datasheets` | `/home/ubuntu/hackday26/docs/datasheets` | ❌ **BROKEN** | Replace with relative link `../../../../docs/datasheets` or copy assets during build. |
| `./b2b-storefront/public/demo/specs` | `/home/ubuntu/hackday26/docs/demo-specs` | ❌ **BROKEN** | Replace with relative link `../../../../docs/demo-specs` or static copy. |
| `./docs/datasheets/CN-DEMO-PID-PT100-RS1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PID-PT100-RS1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PID-PT100-RS1.pdf` (target exists in same directory). |
| `./docs/datasheets/CN-DEMO-PLC-DIN-420-MR1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PLC-DIN-420-MR1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PLC-DIN-420-MR1.pdf` (target exists in same directory). |
| `./docs/datasheets/CN-DEMO-PT100-3W-A1-datasheet.pdf` | `/home/ubuntu/hackday26/docs/datasheets/CN-DEMO-PT100-3W-A1.pdf` | ❌ **BROKEN** | Replace with relative link `./CN-DEMO-PT100-3W-A1.pdf` (target exists in same directory). |
| `./b2b-backend/apps/backend/src/api/muse` | `api/muse` | ⚠️ **VALID (ALIAS RISK)** | Target resolves to `src/api/api/muse`. Creates possible URL alias `/muse/v1` alongside `/api/muse/v1`. Keep for legacy compatibility; ensure `/api/industrial/v2` does not alias. |
| `./b2b-backend/apps/backend/src/scripts/seed-demo-catalog.ts` | `seed-hackday-demo.ts` | ✅ **VALID** | Target exists in same directory (`b2b-backend/apps/backend/src/scripts/seed-hackday-demo.ts`). |

*Note for G0:* As mandated by G0 safety rules, no symlinks were deleted or rewritten yet. Portable relative replacements will be applied in G1 prior to installation.

---

## 4. Resolution and Documentation of the 12 Discrepancies (§4.3)

### Discrepancy 1: PostgreSQL 16 (README) vs. PostgreSQL 15 (`docker-compose.yml`)
- **Observed:**
  - `README.md` displays badge `PostgreSQL-16-4169E1`.
  - `docker-compose.yml` specifies `image: postgres:15`.
  - Docker is currently not installed on this host (`bash: line 1: docker: command not found`), and no systemd postgres service is active.
- **Resolution for G1:** Do not arbitrarily upgrade the major version without schema validation. When provisioning PostgreSQL in G1, use PostgreSQL 15 (matching Compose) or verify compatibility before any migration. Determine effective version using `SHOW server_version`.

### Discrepancy 2: Manifests & Lockfiles (npm vs. Yarn)
- **Observed:**
  - `b2b-backend/package.json` specifies `"packageManager": "npm@11.12.1"` and contains `package-lock.json` (786 KB).
  - `b2b-storefront/package.json` specifies `"packageManager": "yarn@4.12.0"` and contains BOTH `package-lock.json` (691 KB) and `yarn.lock` (380 KB).
  - Host environment has `node v22.23.3` and `npm 10.9.9`. `yarn` is not installed (`yarn: command not found`).
- **Resolution for G1:** Select a single reproducible package manager per package. In G1, use npm consistently or install corepack/yarn if strictly necessary for the storefront.

### Discrepancy 3: Quote PDF Route Mismatch
- **Observed:**
  - `README.md` line 130 documents: `GET /api/muse/v1/preliminary-quotes/{id}/pdf`.
  - OpenAPI specification (`docs/openapi.json`, `docs/openapi.yaml`) documents: `GET /api/muse/v1/quotes/{quoteId}/pdf`.
  - Route handler implementation in code: `b2b-backend/apps/backend/src/api/api/muse/v1/quotes/[quoteId]/pdf/route.ts`.
- **Resolution:** The handler code and OpenAPI contract (`/api/muse/v1/quotes/{quoteId}/pdf`) are authoritative. Retain the code-generated URL and update legacy documentation references without altering handler endpoints.

### Discrepancy 4: Currency Handling (USD API vs. PEN `money.ts`)
- **Observed:**
  - The demo API and hackathon requirements use **USD** (`CANONICAL_CURRENCY = "usd"` in `offer.ts`).
  - `b2b-backend/apps/backend/src/lib/muse/money.ts` strictly hardcodes `CURRENCY_PEN = "PEN"` and explicitly throws `TypeError: Invalid currency: expected 'PEN'` in `assertPenCurrency()`.
- **Resolution:** Do not attempt to reuse `money.ts` for USD quotes without refactoring. The new v2 industrial engine will introduce an explicit, multi-currency / canonical USD monetary arithmetic module with fixed 2-decimal BigInt minor unit calculations (`cents`).

### Discrepancy 5: Floating-Point Arithmetic in `offer.ts`
- **Observed:**
  - `b2b-backend/apps/backend/src/lib/muse/offer.ts` computes line items via:
    ```typescript
    const unitPriceMinor = Math.round(numericAmount * 100)
    const unitPrice = unitPriceMinor / 100
    const subtotalMinor = unitPriceMinor * quantity
    const subtotal = subtotalMinor / 100
    ```
- **Resolution:** For the v2 industrial API, monetary calculations must eliminate IEEE 754 floating-point inaccuracies using deterministic string parsing or BigInt arithmetic without intermediate float division.

### Discrepancy 6: Hardcoded Development Fallback in `db.ts`
- **Observed:**
  - `b2b-backend/apps/backend/src/lib/muse/db.ts` contains:
    ```typescript
    const connectionString =
      process.env.DATABASE_URL || "postgres://postgres:password@localhost:5432/medusa"
    ```
- **Resolution:** In production and authenticated runs, the system must halt if `DATABASE_URL` is undefined rather than falling back to default localhost credentials.

### Discrepancy 7: Dual Medusa Configurations (`medusa-config.ts` vs. `medusa-config.js`)
- **Observed:**
  - Both files exist in `b2b-backend/apps/backend/`.
  - `medusa-config.ts` uses ES module syntax (`import { defineConfig }...`), while `medusa-config.js` is CommonJS (`const { defineConfig } = require(...)`).
  - Both contain identical CORS origin resolution logic and hardcoded IPs.
- **Resolution:** Medusa 2 CLI loads TypeScript configuration natively via `jiti`. In G1, designate `medusa-config.ts` as the single authoritative source of truth.

### Discrepancy 8: Hardcoded `/home/ubuntu/...` Paths in PDF Generator & Storage
- **Observed:**
  - `b2b-backend/apps/backend/src/lib/muse/pdf-generator.ts` hardcodes default paths:
    ```typescript
    const DEFAULT_SCRIPT_PATH = process.env.GENERATE_QUOTE_PDF_SCRIPT || "/home/ubuntu/hackday26/scripts/generate-quote-pdf.py"
    const DEFAULT_STORAGE_BASE_DIR = process.env.STORAGE_BASE_DIR || "/home/ubuntu/hackday26/storage"
    ```
  - On this EC2 instance, the user is `ec2-user` and the working tree is `/home/ec2-user/projects/hack-ecomer`.
- **Resolution:** In G1, configure environment variables `STORAGE_BASE_DIR` and `GENERATE_QUOTE_PDF_SCRIPT` relative to `process.cwd()` or the current deployment directory.

### Discrepancy 9: API Muse Symlink and Route Aliasing
- **Observed:**
  - `b2b-backend/apps/backend/src/api/muse` is a symlink pointing to `api/muse`.
  - Actual endpoints reside in `b2b-backend/apps/backend/src/api/api/muse/v1/...`.
  - Medusa auto-registers routes based on filesystem layout, potentially exposing `/muse/v1` as an alias of `/api/muse/v1`.
- **Resolution:** Keep `/api/muse/v1` intact for backward compatibility. Place new v2 routes strictly under `b2b-backend/apps/backend/src/api/api/industrial/v2` without symlink aliases.

### Discrepancy 10: Hardcoded CORS Origins & Broken Domain Filter
- **Observed:**
  - `medusa-config.ts` hardcodes IP `http://52.20.66.203:9000` and `http://52.20.66.203:8000`.
  - `isForbiddenOrigin()` explicitly blocks `controlnautas.com` and `www.controlnautas.com` while allowing `data.controlnautas.com`.
- **Resolution:** Parameterize CORS origins fully via environment variables (`STORE_CORS`, `ADMIN_CORS`, `AUTH_CORS`). Remove hardcoded IP addresses.

### Discrepancy 11: Static Prices and Stock in `docs/llms.txt`
- **Observed:**
  - `docs/llms.txt` lines 6-8 contain hardcoded price and inventory values:
    - Horner X5: `$890 — stock 3`
    - NOVUS N1200: `$480 — stock 2`
    - TZ THT-02: `$75 — stock 8`
- **Resolution:** As governed by §4.3 and §20, dynamic agents must retrieve live price and availability data from Medusa endpoints (`/api/industrial/v2/products/.../offer`), never from static system prompts or text files. `docs/llms.txt` will be updated to document API lookup instructions.

### Discrepancy 12: FIFO Queue Race Condition in PDF Worker
- **Observed:**
  - `b2b-backend/apps/backend/src/lib/muse/pdf-generator.ts` runs a persistent Python subprocess communicating via stdin/stdout.
  - Responses from stdout are matched using `const item = workerQueue.shift()!` without checking a job or correlation ID.
  - If a worker task times out and is removed from the queue, a delayed response from Python will resolve or fail the *subsequent* job in the FIFO queue.
- **Resolution:** For G8 PDF worker implementation, adopt explicit `job_id` correlation in the JSON protocol or use isolated one-shot subprocesses with bounded concurrency.

---

## 5. Inventory of Code, Schemas, Migrations & Endpoints

### 5.1 Package Manifests & Monorepo Structure
- Root: Turbo / monorepo workspace containing `b2b-backend` and `b2b-storefront`.
- `b2b-backend`:
  - `apps/backend`: Medusa 2.17.0 application.
  - Plugins/Modules: `b2b-pim`, `brand`.
- `b2b-storefront`: Next.js 15.3.9, React 19.0.5 application.

### 5.2 Database Migrations (PostgreSQL)
- `b2b-pim` module migrations:
  - `Migration20260626013101.ts`: Creates `pim_info`.
  - `Migration20260815011014.ts`: Adds specs, SEO, purchase modes.
  - `Migration20260831212957.ts`: Unique indexes on `product_id`.
  - `Migration20260929181517.ts`: Creates `technical_fact`, `technical_profile`, `technical_source`.
- `brand` module migrations:
  - `Migration20260815011008.ts`: Creates `brand` table.

### 5.3 Existing Muse v1 Endpoints (to be preserved)
1. `POST /api/muse/v1/evaluate`
2. `POST /api/muse/v1/preliminary-quotes`
3. `GET /api/muse/v1/products/[variantId]`
4. `GET /api/muse/v1/products/[variantId]/offer`
5. `GET /api/muse/v1/products/search`
6. `GET /api/muse/v1/quotes/[quoteId]/pdf`

---

## 6. Files to Modify vs. Files Untouched

### 6.1 Files to Modify in Subsequent Gates (G1+)
- `b2b-storefront/public/demo/*`: Fix broken symlinks with relative paths.
- `docs/datasheets/*`: Replace broken symlinks with portable relative links.
- `b2b-backend/apps/backend/medusa-config.ts`: Parameterize CORS and designate as sole config.
- `docs/llms.txt`: Replace static prices with API dynamic query instructions.
- `b2b-backend/apps/backend/src/api/api/industrial/v2/*`: New industrial API routes (G3, G7).
- `b2b-storefront/src/app/*`: Add solution workspace and presentation viewer (G11).

### 6.2 Files Untouched (Preserved for Stability)
- `b2b-backend/apps/backend/src/api/api/muse/v1/*`: Preserved for compatibility.
- `b2b-backend/apps/backend/src/modules/b2b-pim/models/*`: Preserved data models.
- Baseline product catalogs and real datasheets (`CN-X5PRIME-HE-XP5.pdf`, `CN-N1200.pdf`, `CN-THT02.pdf`).
