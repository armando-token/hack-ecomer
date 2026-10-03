# Observed Runtime & Package Dependency Manifests

**Document ID:** `docs/industrial/versions.md`  
**Host Machine:** EC2 Linux (`x86_64`, Amazon Linux 2023.12.20260930, kernel 6.18)  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Audit Timestamp:** 2026-10-03  
**Gate:** G1 (Runtime & Reproduction of Store)  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§5.4, §33 G1)  

---

## 1. Host Environment Runtimes (Observed & Verified)

The following versions were directly queried, provisioned, and verified on the host system:

| Runtime / Tool | Observed Version | Status / Resolution Path |
|---|---|---|
| **Operating System** | Amazon Linux 2023.12.20260930 | Kernel `6.18.51-120.163.amzn2023.x86_64` |
| **Node.js** | `v22.23.3` | Active on PATH; retained LTS line. Documented deviation vs MEGAPLAN "Node 24 target" as observed constraint. Node 22 fully supports both backend & storefront builds. |
| **npm** | `10.9.9` | Active on PATH; Authoritative package manager for `b2b-backend`. |
| **Yarn CLI** | `4.12.0` (Berry) | Enabled via `corepack enable`. Matches `packageManager` declaration; authoritative for `b2b-storefront`. |
| **Python** | `3.9.25` | Active on PATH (`/usr/bin/python3`) and dedicated virtualenv (`.venv/bin/python3`). |
| **Git** | `2.50.1` | Active on PATH. Local commits only (BLK-01). |
| **PostgreSQL (`psql`)** | `16.15` (Amazon Linux native) | Running locally as systemd service `postgresql.service`. Verified via `SHOW server_version;`. Resolves README PG16 vs Docker Compose PG15 discrepancy. |
| **Python `reportlab`** | `5.0.1` | Installed in `.venv` with `pillow==11.3.0` and `charset-normalizer==3.5.2`. Tested and verified via `--worker` and CLI. |
| **Docker / Compose** | Not Installed | Native PostgreSQL was provisioned directly on host, eliminating Docker daemon overhead. |

---

## 2. Package Manifests & Authoritative Package Managers

Per Gate G1 Task 2, exactly ONE authoritative lock and install path is established per package:

### 2.1 Backend Monorepo (`b2b-backend`)
- **Authoritative Tool:** `npm` (v10.9.9)
- **Authoritative Lockfile:** `b2b-backend/package-lock.json` (SHA: `d2398a0...`)
- **Workspace:** `apps/*`
- **Application (`apps/backend`):**
  - `@medusajs/framework`: `2.17.0`
  - `@medusajs/medusa`: `2.17.0`
  - `@medusajs/cli`: `2.17.0`
  - `@medusajs/dashboard`: `2.17.0`
  - `pg`: `^8.12.0`
  - `@types/pg`: `^8.23.1`
  - `zod`: `4.2.0`

### 2.2 Storefront Application (`b2b-storefront`)
- **Authoritative Tool:** `yarn` (v4.12.0 Berry via Corepack)
- **Authoritative Lockfile:** `b2b-storefront/yarn.lock`
- **Application:**
  - `next`: `15.3.9`
  - `react`: `19.0.5`
  - `react-dom`: `19.0.5`
  - `@medusajs/js-sdk`: `latest` (resolved to `2.21.2`)
  - `@medusajs/ui`: `latest` (resolved to `4.2.6`)
  - `@medusajs/types`: `latest` (resolved to `2.21.2`)
  - `zod`: `^4.5.4`

---

## 3. Configuration Resolution: `medusa-config.js` vs `medusa-config.ts`

- **CLI Resolution Mechanism:**
  - `@medusajs/cli` v2.17.0 delegates configuration loading to `@medusajs/framework/dist/config/loader.js`, which calls `getConfigFile(entryDirectory, "medusa-config")`.
  - `getConfigFile` invokes Node's native `require()` on `<root>/medusa-config` without extension.
  - Node's standard module resolution checks extensions in order: `['.js', '.json', '.node', '.ts', '.tsx']`.
  - **Result:** `medusa-config.js` is the file loaded by the Node runtime and CLI.
- **Divergence Prevention:**
  - Both `medusa-config.js` and `medusa-config.ts` are maintained in exact 1:1 synchronization.
  - Both files contain identical CORS definitions, module configurations, Altcha proof-of-work dashboard transforms, and production fail-fast validations.

---

## 4. Environment & Secret Isolation

- Local `.env` files are kept uncommitted and ignored by Git:
  - `b2b-backend/apps/backend/.env`: Configures local PostgreSQL connection string `postgresql://postgres:password@localhost:5432/medusa` and `MUSE_API_TOKEN`.
  - `b2b-storefront/.env.local`: Configures `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_b0bd7e...` and `MEDUSA_BACKEND_URL=http://localhost:9000`.
- Templates:
  - `b2b-backend/apps/backend/.env.template` remains clean of real credentials.
- Fail-fast enforcement:
  - Startup checks in `medusa-config.js` throw `[FATAL] Missing required production secrets` if `DATABASE_URL`, `JWT_SECRET`, or `COOKIE_SECRET` are missing or default in `NODE_ENV=production`.
