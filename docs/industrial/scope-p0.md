# Scope P0: Controlnautas Industrial Conversational Engineering & Commerce

**Document ID:** `docs/industrial/scope-p0.md`  
**Status:** Normative & Approved  
**Target Event:** Hack AI Commerce (October 3, 2026)  
**Governing Document:** `docs/industrial/PLAN_MAESTRO.md` (§2.3, §2.5, §2.6, §33.1)  

---

## 1. Executive Summary & Objective

The objective of Scope P0 is to deliver a complete, robust, and verifiable vertical slice of conversational industrial engineering and B2B commerce. 

A customer explains an industrial automation requirement in conversational English; ZooWork with an explicitly pinned Anthropic Claude model queries verified technical catalog data via backend-executed custom tools, proposes a configuration, requests a deterministic technical evaluation, generates an interactive 3D scene artifact, and issues a formal preliminary quote and PDF backed by Medusa 2.

The entire user experience takes place within Controlnautas' web application, with all 3D assets published on our domain and rendered in a secure client-side sandbox.

---

## 2. In-Scope: The 5 Pillars of P0

### 2.1 Pillar 1 — Commerce Authority & Storefront Operation
- **Medusa 2 Backend:** Preserved as the authoritative system of record for product variants, USD pricing, physical inventory, and quote persistence.
- **Next.js Storefront:** Preserved and operational. Serves standard e-commerce pages (catalog, product details, cart) alongside the new solution workspace.
- **Verified 3-SKU Catalog:** Built around official manufacturer technical documentation:
  1. `CN-X5PRIME-HE-XP5`: Horner Automation OCS X5 Prime all-in-one controller / HMI.
  2. `CN-N1200`: NOVUS Automation N1200 Universal Process Controller.
  3. `CN-THT02`: TZone Digital THT-02 Temperature & Humidity Transmitter (RS-485 Modbus RTU).

### 2.2 Pillar 2 — Industrial API (`/api/industrial/v2`)
- New clean namespace `/api/industrial/v2` decoupling the platform from legacy prototypes.
- Backward compatibility: Legacy `/api/muse/v1` routes remain online and functional.
- Core endpoints:
  - Structured catalog search and specification lookup.
  - Deterministic evaluation engine (`satisfied`, `failed`, `unknown` tri-state logic).
  - Versioned configuration snapshots with cryptographic hash pinning.
  - Multi-item preliminary quote creation and retrieval.

### 2.3 Pillar 3 — Web Conversational UI & Solution Workspace
- Dedicated frontend interface (`/solution`) within the existing Next.js application.
- Real-time turn progress delivered via server-sent events (SSE) from the Controlnautas backend.
- Structured solution panel displaying:
  - Active customer requirements and constraints.
  - Bill of Materials (BOM) with live USD pricing.
  - Technical compliance evaluation matrix with documented evidence citations.
  - Action buttons to inspect the 3D presentation and download the preliminary quote PDF.

### 2.4 Pillar 4 — Commercial Quote & Correlated PDF Generation
- Exact monetary calculations in canonical USD with zero floating-point rounding errors.
- Preliminary quote documents clearly labeled as non-binding technical estimates.
- ReportLab-based PDF generation worker with explicit `job_id` correlation, eliminating queue race conditions.
- Secure, token-authorized quote PDF downloads.

### 2.5 Pillar 5 — Delegated 3D Presentation Pipeline
- Claude in ZooWork outputs two paired artifacts into its workspace: `scene.plan.json` (semantic scene description) and `index.html` (interactive presentation script).
- Controlnautas backend retrieves files via ZooWork Files API, validates `scene.plan.json` against the configuration bundle, and stores them in persistent local storage (`/storage/presentations/...`).
- Served directly by our web application inside a sandboxed iframe with strict Content Security Policy (`script-src 'self' 'unsafe-inline'`, `connect-src 'none'`), rendering with a bundled Three.js library.
- No dependency on ZooWork internal viewers or third-party cloud hosting.

---

## 3. Explicit Exclusions (Out of Scope for P0)

The following capabilities are deliberately excluded from P0 to protect the critical execution path:

| Excluded Capability | Rationale & Status |
|---|---|
| **Muse Integration for New Flow** | Permanently deprecated. WhatsApp/Meta Muse is not part of the conversational or 3D flow. v1 routes are retained solely for backward compatibility. |
| **Vector Database / RAG Infrastructure** | Excluded. A 3-SKU catalog does not require Milvus, Pinecone, or vector embeddings. Structured SQL queries and targeted document excerpts provide 100% deterministic precision. |
| **Automated ZooWork Account Provisioning** | Excluded from automated CI/CD. ZooWork account setup, credit allocation, and API key provisioning are strictly manual tasks performed by the human operator. |
| **P2 Numerical Process Simulation** | Postponed to P2. No differential equation solvers, dynamic heat-transfer models, or PID loop simulation engines will be integrated in P0. |
| **CAD Kernel / Server-Side GPU Rendering** | Excluded. No Blender runtime, OpenCascade, or server-side GPU rendering pipelines on the EC2 host. Models use lightweight WebGL2 in the user's browser. |
| **Automated Order Placement / Payment Capture** | Excluded. Agents cannot execute financial transactions or submit binding purchase orders. All output is strictly preliminary quotes. |
| **PLC Firmware / Ladder Logic Generation** | Excluded. No Cscape automation, ladder logic compilation, or OT network programming. |

---

## 4. Test Scenarios Governed by P0

To validate end-to-end integrity without false claims, P0 must demonstrate two contrasting cases:

1. **Nominal Success Case (Valid Configuration):**
   - User requests a temperature and humidity monitoring loop with Modbus RTU communication to an OCS controller.
   - System configures `CN-X5PRIME-HE-XP5` + `CN-THT02`.
   - Evaluator confirms protocol match (RS-485 Modbus RTU), electrical compatibility, and power supply.
   - Result: All rules `satisfied`; valid 3D scene generated; preliminary quote in USD issued.

2. **Negative / Constraint Conflict Case (Rule Enforcement):**
   - User specifies an incompatible analog output requirement (e.g. 4-20mA current loop directly into an RS-485-only port) or unverified voltage supply.
   - Evaluator returns `failed` or `unknown` with concrete technical reason and missing fact citation.
   - Result: System highlights missing signal conditioning module as an unresolved role; does NOT issue a false compliance pass.
