# Scope P0: Controlnautas Industrial Conversational Engineering & Commerce (Muse Architecture)

**Document ID:** `docs/industrial/scope.md` (also aliased by `docs/industrial/scope-p0.md`)  
**Status:** Normative & Approved  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§1.1–§1.3, §2, §5, §6)  
**Superseded Record:** Previous ZooWork P0 Scope in `scope-p0.md` is **SUPERSEDED**.

---

## 1. Executive Summary & Architecture Boundary

The objective of Scope P0 is to deliver a robust, verifiable integration between **Meta Muse** and the **Controlnautas Industrial Commerce Stack**.

The architectural boundary is strictly defined:
- **Meta Muse:** Executes the conversational interface, user dialogue management, solution reasoning, and 3D artifact scene presentation.
- **Controlnautas Stack:** Provides the Industrial API v2, technical catalog snapshots with documented manufacturer evidence, deterministic constraint evaluator, standardized GLB asset delivery, authoritative USD pricing from Medusa 2, multi-item preliminary quotes, and correlated PDF generation.
- **No Second Chatbot:** Controlnautas does not host a secondary conversational agent, LLM runtime, or internal 3D scene builder in the pilot.

---

## 2. In-Scope: The 5 Pillars of P0

### 2.1 Pillar 1 — Industrial API v2 & Compatibility
- **API Namespace:** `/api/industrial/v2` (and `/api/muse/v2`) providing structured endpoints for catalog queries, system evaluations, configuration management, GLB asset manifests, and quotes.
- **Backward Compatibility:** Preserves legacy `/api/muse/v1` routes (`search`, `products/[id]`, `evaluate`, `offer`, `preliminary-quotes`, `quotes/[id]/pdf`).
- **Deterministic Adapter:** Adapts strict tri-state evaluation to legacy v1 response format (`meets` -> `satisfied=true`, `does_not_meet` -> `false`, `not_documented` -> `false`) with additive diagnostic fields.

### 2.2 Pillar 2 — Technical Catalog, Evidence & Strict Evaluator
- **Catalog Ground Truth:** Snapshots built strictly from official manufacturer technical documentation for verified SKUs:
  - `CN-X5PRIME-HE-XP5` (Horner Automation OCS X5 Prime all-in-one controller/HMI).
  - `CN-N1200` (NOVUS Automation N1200 Universal Process Controller).
  - `CN-THT02` (TZone Digital THT-02 Temperature/Humidity Transmitter, RS-485 Modbus RTU).
- **Evidence Mapping:** Technical facts (voltages, ranges, signal types, communication ports) cite explicit source documents, section, and page numbers.
- **Strict Evaluator:** Deterministic pure TypeScript rule engine applying tri-state logic:
  - `meets`: Confirmed by documented evidence.
  - `does_not_meet`: Documented conflict or violated rating.
  - `not_documented`: Missing fact; never assumed or hallucinated.

### 2.3 Pillar 3 — 3D Asset Registry & GLB Delivery Path
- **Standardized GLB Delivery:** Verified assets served in glTF 2.0 / GLB binary format.
- **Conventions:** Right-handed coordinates, +Y up, +Z front, dimensions in meters (`[1,1,1]` scale), origin at designated mounting base or envelope center.
- **Dimensional Verification:** Bounding boxes verified against manufacturer technical drawings.
- **Delivery Mechanism:** High-performance static/signed delivery endpoints accessible to Muse connector and 3D artifact loader.

### 2.4 Pillar 4 — Authoritative Commerce, Quotes & Correlated PDF
- **Medusa 2 Authority:** Medusa 2 is the sole system of record for real-time USD prices and inventory availability. LLMs never invent prices.
- **Multi-Item Quotes:** Transactional creation of preliminary quote records with immutable snapshots of line items, unit prices, and quantities.
- **Exact Monetary Math:** Integer minor units (cents) with zero floating-point inaccuracies.
- **Correlated PDF Worker:** Python ReportLab quote generator with explicit `job_id` tracking, preventing FIFO queue race conditions.

### 2.5 Pillar 5 — Web Catalog, Configurations & Administration
- **Next.js Storefront:** Extended with configuration review and quote download views.
- **Medusa Admin:** Custom administrative pages to inspect technical catalog snapshots, evidence sources, and asset manifests.

---

## 3. Explicit Exclusions (Out of Scope for P0)

The following items are strictly excluded from P0:
- **ZooWork / Anthropic Claude Agent Runtime:** ZooWork path is abandoned; no ZooWork credentials or infrastructure.
- **Secondary Web Chatbot:** No in-house chatbot interface competing with Muse.
- **Vector Database / RAG Pipeline:** No pgvector, Milvus, Pinecone, or embeddings. Catalog lookup is structured and deterministic.
- **Server-Side GPU Rendering & Blender CAD Kernels:** No server-side 3D rendering or CAD generation on EC2.
- **Solver Frameworks:** No Z3 theorem provers, Prolog engines, or external constraint services.
- **Alternative Backend Frameworks:** No FastAPI, Flask, or separate microservices beyond Medusa/Next.
- **Complex Industrial Plant Simulators:** Numerical simulation in pilot is restricted to optional first-order lumped thermal models (§22.2) when requested; no general multi-physics simulators.
- **Automated Financial Transactions:** No automated payment capture or binding order placement; outputs are strictly preliminary quotes.

---

## 4. Initial Process Family Governed by P0 (§2.3)

- **Selected Family:** **Industrial Heating Chamber / Thermal Enclosure** (`cámara de calentamiento`).
- **Justification:** Aligns directly with ambient air temperature and humidity sensing (`CN-THT02`), PID temperature control (`CN-N1200`), and supervisory HMI/PLC monitoring (`CN-X5PRIME-HE-XP5`), supported by existing application domain history.
- **Real Catalog SKUs:** `CN-X5PRIME-HE-XP5`, `CN-N1200`, `CN-THT02`.
- **Identified Missing Circuit Roles:** Power switching (SSR/contactor), heating element (electric resistance heater), direct process temperature sensor (Pt100 probe for N1200), and 24 VDC power supply. The system flags these missing roles honestly rather than hallucinating fake catalog SKUs.
