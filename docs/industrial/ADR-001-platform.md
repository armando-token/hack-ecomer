# ADR-001: Platform Architecture, Muse Delegation, and Authority Distribution

**Status:** Accepted (Replaces and Supersedes ZooWork ADR-001)  
**Date:** 2026-10-03  
**Deciders:** Builder AI, Controlnautas Engineering Team  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§1.1–§1.3, §2, §5, §6)  
**Superseded Record:** Previous ADR-001 (ZooWork Managed Agents + Claude + Web Iframe 3D) dated 2026-10-03 is **SUPERSEDED**.

---

## 1. Supersession Notice

The previous architectural decision to deploy ZooWork Managed Agents with Anthropic Claude and host an internal Three.js rendering iframe is **abandoned and superseded**. 
ZooWork environment access is unavailable, and introducing an independent conversational orchestrator alongside an internal rendering engine created unnecessary operational complexity and architectural divergence.

The governing architecture is now locked by `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md`.

---

## 2. Context and Problem Statement

Controlnautas operates an industrial B2B commerce platform for automation equipment (controllers, transmitters, power interfaces, and heating solutions). Industrial customers require verified solutions rather than generic chatbot answers:
1. Equipment selections must be backed by documented manufacturer evidence (datasheets, manuals, ports, ranges).
2. Interconnection and operating constraints must be evaluated with deterministic tri-state logic (`meets`, `does_not_meet`, `not_documented`), not probabilistic token generation.
3. Solutions must be presented interactively in 3D with dimensionally verified assets.
4. Commercial quotes, inventory availability, and pricing must remain strictly transactional in USD under authoritative e-commerce control.

---

## 3. Decision Drivers

- **Zero Duplicate Chatbots:** Meta Muse handles conversational interaction, user intent parsing, and 3D artifact presentation. Controlnautas does NOT build or host a second competing conversational orchestrator.
- **Single Source of Truth for Commerce:** Medusa 2 remains the sole authority for product models, variants, USD pricing, stock availability, and immutable quote snapshots.
- **Deterministic Engineering Engine:** Engineering rules (voltage compatibility, protocol matching, channel capacity, power supply) run strictly in pure TypeScript services with zero LLM hallucinations.
- **Standardized 3D Delivery:** Controlnautas delivers valid, standardized GLB assets with metadata (dimensions, anchors) to Muse. Muse renders the interactive 3D scene artifact. No server-side GPU rendering, Blender kernels, or custom web industrial renderer in the pilot.
- **Operational Simplicity:** No FastAPI, pgvector, Elasticsearch, Neo4j, Kafka, Kubernetes, or Z3 solver in the pilot. Persistence is handled by PostgreSQL (Medusa 2 + custom module `industrial-config`).

---

## 4. Considered Alternatives

### Alternative 1: ZooWork Managed Agents + Anthropic Claude + Web Iframe (Previous Plan)
- *Drawbacks:* No ZooWork platform access; duplicate conversational layers; custom iframe-based 3D renderer created redundant maintenance burden outside Muse's native capabilities.
- *Status:* **SUPERSEDED & REJECTED.**

### Alternative 2: FastAPI + pgvector + Local LLM Orchestrator
- *Drawbacks:* Violates hackathon scope constraints; excessive infrastructure footprint; non-deterministic evaluation; unneeded for a focused industrial catalog.
- *Status:* **REJECTED.**

### Alternative 3: Meta Muse for Conversation & 3D + Controlnautas Stack for Industrial API & Commerce (Chosen)
- *Advantages:* Clear separation of concerns. Muse provides the conversational agent and native 3D artifact rendering; Controlnautas backend provides verified technical facts, deterministic rules, asset delivery, and Medusa-backed transactional commerce.
- *Status:* **ACCEPTED.**

---

## 5. Locked Architecture Decisions

### 5.1 System Boundary & Delegation Matrix

| Responsibility | Authoritative System | Mechanism / Contract |
|---|---|---|
| User Conversation & Dialog Management | **Meta Muse** | Custom Muse Connector calling Controlnautas API |
| 3D Scene Composition & Interactive Presentation | **Meta Muse** | Muse 3D Artifact utilizing Controlnautas GLB models |
| Industrial Technical Catalog & Evidence | **Controlnautas Backend** | Snapshot registry backed by manufacturer datasheets |
| Deterministic Engineering Evaluation | **Controlnautas Backend** | Pure TypeScript rule engine (`meets`/`does_not_meet`/`not_documented`) |
| 3D Asset Storage & Delivery | **Controlnautas Backend** | Static / signed GLB delivery (meters, +Y up, +Z front) |
| Commerce, Pricing & Stock Availability | **Medusa 2** | Real-time USD catalog lookup; no LLM-generated pricing |
| Preliminary Quotes & PDF Generation | **Controlnautas Backend** | Snapshot persistence + Python ReportLab worker with `job_id` |
| Web Catalog, Configs & Administration | **Next.js Storefront / Medusa Admin** | SSR / BFF routes, admin dashboard for technical catalog |

### 5.2 API Architecture and Backward Compatibility
- **Legacy Namespace (`/api/muse/v1`):** Retained and functional for backward compatibility. An adapter translates deterministic tri-state evaluation to legacy booleans (`meets` -> `satisfied=true`, `does_not_meet` -> `false`, `not_documented` -> `false`) while exposing additive diagnostic fields (`status`, `reason_code`).
- **Industrial Namespace (`/api/industrial/v2` / `/api/muse/v2`):** Primary API for all new capabilities (configurations, revisions, system evaluation, GLB asset manifests, multi-item quotes, simulation data).

### 5.3 Currency and Localization
- Canonical currency: **USD** ($). Monetary values are computed using exact integer minor units (cents) with zero floating-point rounding errors.
- Active customer-facing locale & copy: **en-US** (English).

### 5.4 Security & Principal
- Pilot security principal: **guest / demo operator**.
- Multi-tenant isolation enforced via session identifiers and configuration ownership tokens.
- No secrets or private Bearer tokens exposed to public client artifacts.

---

## 6. Consequences & Risk Mitigations

| Consequence / Risk | Severity | Mitigation Strategy |
|---|---|---|
| Muse GLB import capabilities must be validated | High | Execute early GLB delivery capability test in Gate G2 using lightweight synthetic GLB before modeling full catalog. |
| Incompatible controller/sensor pairing requested | High | Strict tri-state rule evaluator returns explicit `does_not_meet` with citeable manufacturer evidence and missing role explanations. |
| Potential currency or pricing discrepancies | High | Medusa 2 is authoritative; dynamic price lookups replace any static prompt values; calculations use integer cents. |
| PDF generation concurrency | Medium | Replace unindexed FIFO worker queue with explicit `job_id` correlation or one-shot subprocess isolation. |
