# Controlnautas — Muse Industrial API (Hack AI Commerce)

Private demo for **AI Valley / Hack AI Commerce**: Meta **Muse** talks to engineers; **Controlnautas** remains the source of truth for verified industrial data, dimensional 3D assets, and preliminary USD quotes.

This repository is **`armando-token/hack-ecomer`**. It is **not** a republish of a prior Hack Day pitch deck or cover art.

## What it does

1. **Muse** queries our HTTPS Industrial API (no scraping).
2. We return **versioned technical snapshots** with evidence (page-backed facts).
3. A **deterministic tri-state evaluator** returns `meets` / `does_not_meet` / `not_documented` (no false “compatible”).
4. We serve **glTF 2.0 GLB** models in **meters** (+Y up, +Z forward) with honest fidelity labels.
5. Medusa issues a **preliminary quote + PDF** from live commerce data.

Pilot process: **Industrial Heating Chamber**  
Pilot SKUs: `CN-X5PRIME-HE-XP5` · `CN-N1200` · `CN-THT02`  
Missing roles (SSR / heater) are declared explicitly — never invented as fake SKUs.

## Live endpoints

| Resource | URL |
|---|---|
| Health | https://data.controlnautas.com/healthz |
| OpenAPI (demo v2) | https://data.controlnautas.com/docs/openapi-industrial-v2-demo.yaml |
| Capabilities | https://data.controlnautas.com/api/industrial/v2/capabilities |
| Heating chamber bundle | https://data.controlnautas.com/api/industrial/v2/configurations/heating-chamber/bundle |
| Example GLB (N1200) | https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb |

> Demo P0 keeps **v2 catalog/3D reads open** so judges/Muse can try without a shared token. Quote/PDF (`/api/muse/v1/...`) still uses Bearer auth.

## Stack

Medusa 2 · Next.js · TypeScript · PostgreSQL 16 · Python/ReportLab · Nginx TLS · AWS EC2 · Meta Muse

## Docs (this build)

- `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` — governing plan  
- `docs/gates/SPRINT_DEMO_P0.md` — demo acceptance  
- `docs/industrial/muse-operator-demo-p0.md` — Muse operator checklist  
- Gate reports under `docs/gates/` (G0–G6 + sprint)

## Branch

Default working branch for the live demo snapshot: **`sync/ec2-demo-p0`**.

## License

MIT — see [LICENSE](LICENSE).
