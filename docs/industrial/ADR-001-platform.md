# ADR-001: Platform Architecture, Agent Runtime, and Authority Distribution

**Status:** Accepted (Normative — Locked Architecture)  
**Date:** 2026-10-03  
**Deciders:** Builder AI, Controlnautas Engineering Team  
**Governing Document:** `docs/industrial/PLAN_MAESTRO.md` (§1.2, §5.2, §5.5 ADR-001)  

---

## 1. Context and Problem Statement

The previous iteration of the Controlnautas project explored an experimental conversational assistant using Meta Muse on WhatsApp. While suitable for basic chat, it lacked:
1. Native support for complex, multi-step application-executed custom tools.
2. A durable workspace for code and asset generation.
3. The ability to embed interactive 3D engineering models directly into the web application.

The project requires an architecture for conversational industrial engineering that can intake complex automation requirements, query verified technical catalog facts, deterministically evaluate engineering constraints, produce interactive 3D scene presentations, and issue commercial preliminary quotes.

---

## 2. Decision Drivers

- **Commerce Integrity:** Pricing, physical inventory, and quote generation must remain under strict ACID transactional authority; LLMs must never invent prices or stock.
- **Deterministic Engineering:** Technical feasibility checks (voltage, protocols, signal types) must be executed by pure deterministic code, not LLM token prediction.
- **Visual Autonomy:** Interactive 3D models must render inside Controlnautas' web application under strict Content Security Policies without depending on external proprietary viewers.
- **Security & Data Isolation:** Multiple concurrent users must not share agent workspaces, file storage, or conversational contexts.
- **Hackathon Delivery:** P0 vertical must be demonstrable within the time budget without unnecessary operational complexity.

---

## 3. Considered Alternatives

### Alternative 1: Continue with Meta Muse / WhatsApp Integration
- *Drawbacks:* Closed messaging environment; cannot render WebGL/Three.js scenes; impossible to provide an integrated B2B CAD/solution workspace; proprietary API constraints.
- *Status:* **Rejected.**

### Alternative 2: Direct Anthropic API (Custom Agent Orchestrator from Scratch)
- *Drawbacks:* Disregards the platform mandate to utilize ZooWork Managed Agents; requires building durable state machines, workspace file sandboxes, and agent lifecycle infrastructure from scratch.
- *Status:* **Rejected.**

### Alternative 3: Relying on ZooWork Internal Viewer for 3D Presentations
- *Drawbacks:* ZooWork internal viewer capabilities for WebGL, custom glTF loaders, and Three.js canvas manipulations are unverified and uncontrollable; risks runtime failures outside our network perimeter.
- *Status:* **Rejected.**

---

## 4. Locked Decisions

### 4.1 Conversational Runtime: ZooWork Managed Agents with Explicit Claude
- The conversational agent will run on **ZooWork Managed Agents**.
- The model family is explicitly pinned to **Anthropic Claude** (verified from the ZooWork account model catalog in G2). Automatic model routing or silent provider fallbacks are strictly prohibited.
- Communication with ZooWork is strictly server-to-server via the official ZooWork SDK/REST API. Client web browsers never receive ZooWork API keys or contact ZooWork endpoints directly.

### 4.2 Artifact Delegation: Published on Controlnautas Web Origin
- Claude in ZooWork outputs two paired files into its local workspace:
  1. `scene.plan.json`: Formal scene layout specification (product placements, transforms, cables, anchor points).
  2. `index.html`: Interactive Three.js presentation script.
- The Controlnautas backend retrieves these files via the ZooWork Files API, validates `scene.plan.json` against the active configuration bundle, and writes them to local persistent storage (`/storage/presentations/...`).
- Presentations are served to the user on our domain inside an isolated, sandboxed iframe (`sandbox="allow-scripts"` with no network permissions).

### 4.3 Commerce Authority: Medusa 2 as Single Source of Truth
- **Medusa 2** remains the sole authority for product models, variant identifiers, USD prices, physical stock availability, and preliminary quote persistence.
- Agent prompts and custom tools receive live commercial data from Medusa; the agent is prohibited from generating quotes without querying the backend.

### 4.4 Currency and Localization
- All customer-facing copy, technical documentation, and user interfaces will be in **English**.
- The canonical currency for all commercial offers and quotes is **USD** ($).

### 4.5 Security Principal: Guest / Demo Operator
- For the pilot, sessions operate under an isolated **guest / demo operator** principal.
- Each session receives a unique, ephemeral session identifier and agent binding. Cross-session data leakage is prohibited.

### 4.6 API Namespaces & Backward Compatibility
- New industrial engineering and conversational endpoints will reside under `/api/industrial/v2`.
- Existing endpoints under `/api/muse/v1` will remain intact to preserve backward compatibility.

---

## 5. Consequences & Risk Mitigations

| Consequence / Risk | Severity | Mitigation Strategy |
|---|---|---|
| Latency in ZooWork turn execution and file export | Medium | Stream intermediate turn progress to the web client via Server-Sent Events (SSE). |
| Unsafe JavaScript in Claude-generated HTML | High | Enforce strict iframe sandbox (`sandbox="allow-scripts"`, no `allow-same-origin`) and strict CSP preventing outbound network connections. |
| Potential floating-point errors in quote totals | High | Implement exact 2-decimal minor-unit calculations in v2 commercial modules, replacing legacy float operations. |
| ZooWork API quota or service unavailability | High | Provide clear technical diagnostic logging and deterministic fallback states in the backend orchestrator. |
