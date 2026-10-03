# Observed Runtime & Package Dependency Manifests

**Document ID:** `docs/industrial/versions.md`  
**Host Machine:** EC2 Linux (`x86_64`, Amazon Linux 2023.12.20260930, kernel 6.18)  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Audit Timestamp:** 2026-10-03  
**Gate:** G0 (Baseline, Sources & Pilot Scope)  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§5.4, §33 G0)  

---

## 1. Host Environment Runtimes (Observed)

The following versions were directly queried and observed on the host system without making modifications or upgrades:

| Runtime / Tool | Observed Version | Status / Notes |
|---|---|---|
| **Operating System** | Amazon Linux 2023.12.20260930 | Kernel `6.18.51-120.163.amzn2023.x86_64` |
| **Node.js** | `v22.23.3` | Active on PATH; Node >= 20 compatible |
| **npm** | `10.9.9` | Active on PATH |
| **Yarn CLI** | Not Installed (`command not found`) | Storefront declared `yarn@4.12.0` in packageManager |
| **Python** | `3.9.25` | Active on PATH (`/usr/bin/python3`) |
| **Git** | `2.50.1` | Active on PATH |
| **Docker** | Not Installed (`command not found`) | Docker engine absent |
| **Docker Compose** | Not Installed (`command not found`) | Compose absent |
| **PostgreSQL (`psql`)** | Not Installed (`no psql in PATH`) | Database service not yet provisioned |
| **Python `reportlab`** | Not Installed (`ModuleNotFoundError`) | Required for PDF generator |
| **Python `pydantic`** | Not Installed (`ModuleNotFoundError`) | Not present |

---

## 2. Package Manifests & Declared Versions

### 2.1 Backend Monorepo (`b2b-backend`)
- **Root `package.json`:**
  - `packageManager`: `npm@11.12.1`
  - Workspace members: `apps/backend`, `packages/*`
- **Application `apps/backend/package.json`:**
  - `@medusajs/framework`: `2.17.0`
  - `@medusajs/medusa`: `2.17.0`
  - `@medusajs/cli`: `2.17.0`
  - `@medusajs/admin-sdk`: `2.17.0`
  - `@medusajs/dashboard`: `2.17.0`
  - `@medusajs/caching`: `2.17.0`
  - `@medusajs/ui`: `4.1.15`
  - `zod`: `4.2.0`
  - `react`: `^18.3.1` (peer/dev)
  - `react-dom`: `^18.3.1` (peer/dev)

### 2.2 Storefront Application (`b2b-storefront`)
- **Storefront `package.json`:**
  - `name`: `medusa-next`
  - `version`: `1.0.3`
  - `packageManager`: `yarn@4.12.0`
  - `next`: `15.3.9`
  - `react`: `19.0.5`
  - `react-dom`: `19.0.5`
  - `zod`: `^4.5.4`
  - `@headlessui/react`: `^2.2.0`
  - `@radix-ui/react-accordion`: `^1.2.1`
  - `@stripe/react-stripe-js`: `^5.3.0`
  - `@medusajs/js-sdk`: `latest` (floating version; to be pinned in G1)
  - `@medusajs/ui`: `latest` (floating version; to be pinned in G1)
  - `@medusajs/types`: `latest` (floating version; to be pinned in G1)

---

## 3. Package Lockfiles Present on Disk

| Lockfile Path | Size (Bytes) | SHA-256 Hash | Notes |
|---|---|---|---|
| `b2b-backend/package-lock.json` | 786,215 | `26d8af26f595f6be7d9e25369b7eb6a415d14c19bc7f39623d855e8ca35ca1a6` | Authoritative lock for backend |
| `b2b-storefront/package-lock.json` | 691,433 | `290c6d20778d83bf298ef31e3204fa85b05de6418e7844c970f1cb451354e5b6` | Present alongside `yarn.lock` |
| `b2b-storefront/yarn.lock` | 380,024 | `641bceb910b22345df13baa97064689b0170f8816c3e3fbf9b1a2b92ddb53824` | Yarn Berry v4 lockfile |

---

## 4. Observations vs. Target Strategy (§5.4)

In Gate G0, **no package upgrades or lockfile modifications were made**. The following discrepancies are flagged for controlled handling in Gate G1:

1. **Floating `latest` Dependencies:**
   - Storefront declares `@medusajs/js-sdk: latest`, `@medusajs/ui: latest`, `@medusajs/types: latest`. In G1, these must be resolved to exact compatible versions and pinned.
2. **Next.js & React Alignment:**
   - Next.js is observed at `15.3.9` with React `19.0.5`. Per §5.4, G1 will assess upgrading to the supported security patched line (e.g., 15.5.x) without breaking dependencies.
3. **Dual Lockfiles in Storefront:**
   - `b2b-storefront` contains both `yarn.lock` and `package-lock.json`, but Yarn is not installed on the host. In G1, a single package manager (npm or Yarn) will be chosen and proven reproducible.
4. **Node Runtime:**
   - Active host Node is `v22.23.3` (LTS line). MEGAPLAN notes Node 24 LTS target; Node 22 LTS serves as valid supported fallback.
