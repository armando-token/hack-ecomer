# Supersession Matrix: ZooWork Architecture to Meta Muse Architecture

**Document ID:** `docs/industrial/supersession-matrix.md`  
**Date:** 2026-10-03  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md`  
**Superseded Document:** `docs/industrial/PLAN_MAESTRO.md`  

---

## 1. Overview

On 2026-10-03, the project leadership established `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` as the mandatory governing document. The previous ZooWork path has been abandoned due to lack of ZooWork environment access and strategic consolidation around Meta Muse.

The table below tracks key architectural decisions from the superseded ZooWork plan (`PLAN_MAESTRO.md`) to their authoritative replacements under the Muse plan (`MEGAPLAN_MUSE_API_3D_V2.md`).

---

## 2. Supersession Mapping Matrix

| Architecture Domain | Superseded Decision (`PLAN_MAESTRO.md`) | Authoritative Replacement (`MEGAPLAN_MUSE_API_3D_V2.md`) | Rationale / Notes |
|---|---|---|---|
| **Governing Master Plan** | `docs/industrial/PLAN_MAESTRO.md` (SHA: `cc380cc...`) | `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (SHA: `eba0fd5...`) | Locks Muse conversation & 3D, Medusa 2 commerce, and Gates G0–G14. |
| **Conversational Runtime** | ZooWork Managed Agents with pinned Anthropic Claude. | **Meta Muse** (via official custom connector). | No secondary chatbot platform; Muse handles conversation and reasoning. |
| **3D Scene Presentation** | Self-hosted Web iframe running Claude-generated `index.html` + Three.js script. | **Meta Muse 3D Artifact** consuming static/signed GLB models from Controlnautas backend. | Eliminates custom web 3D scene builder; leverages native Muse artifact capabilities. |
| **Tool Execution & Integration** | Custom ZooWork tool dispatcher executing 14 backend tools via ZooWork REST API. | **Industrial API v2** (`/api/industrial/v2` / `/api/muse/v2`) called by Muse connector. | Clean HTTP API boundaries; no proprietary agent SDK required on backend. |
| **User Interface** | Bespoke conversational `/solution` UI in Next.js with Server-Sent Events (SSE). | Conversation in **Meta Muse**; Next.js storefront provides catalog, configuration review, and quote PDF downloads. | Eliminates duplicate conversational UI on web storefront. |
| **Gate G2 Scope** | Verification of ZooWork account credentials and Claude prompt roundtrip. | **Early GLB Delivery Capability Test** with Muse (using lightweight synthetic GLB). | Verifies external file ingestion and dimensional handling before modeling full catalog. |
| **Commerce Authority** | Medusa 2 backend (USD canonical). | **Medusa 2 backend** (USD canonical, exact integer minor units/cents). | Unchanged; Medusa remains sole transactional authority for prices and quotes. |
| **Technical Catalog & Rules** | Deterministic tri-state evaluator + manufacturer datasheets. | **Deterministic tri-state evaluator** (`meets`, `does_not_meet`, `not_documented`) + manufacturer datasheets. | Preserved and reinforced; no RAG or vector database. |
| **Quote & PDF Worker** | Python ReportLab worker (FIFO queue). | Python ReportLab worker with explicit **`job_id` correlation** to prevent FIFO race conditions. | Refined to eliminate concurrency bugs (§4.3 Discrepancy 12). |
| **Pilot Process Family** | Not firmly chosen in G0. | **Industrial Heating Chamber** (`cámara de calentamiento`) per §2.3. | Explicitly selected based on repo documentation and sensor/controller roles. |
| **Process Simulation** | Postponed to P2 (no simulation in P0). | **Optional First-Order Thermal Model** (§22.2) in pure TypeScript on request. | Lightweight analytical model without heavy numerical solvers or GPU engines. |
| **Blocker BLK-05** | BLK-05: Missing ZooWork account credentials. | **CLEARED / SUPERSEDED**. Muse credentials reserved for human testing in Gate G2. | ZooWork credential block is no longer an active obstacle. |
