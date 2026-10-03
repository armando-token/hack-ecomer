# Gate REAL_OEM_SYNC: Real OEM Documentation Audit, HTTPS Publishing & Catalog Protection Report

**Gate Identifier:** `REAL_OEM_SYNC`  
**Execution Date:** 2026-10-03  
**Working Directory:** `/home/ec2-user/projects/hack-ecomer`  
**Status:** ✅ **PASSED**  
**Governing Documents:**  
- `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§9 Catálogo y fuentes, §10 Evidencias y snapshots, §15 Activos CAD/GLB, §16 Entrega de archivos, §20 Conector Muse, §33 Fases G0–G14)  
- `docs/industrial/sources.json` (authoritative provenance registry)  
- `docs/industrial/catalog/manifest.json` (authoritative pilot catalog manifest)  
**Public Edge Domain:** `https://data.controlnautas.com` (Let's Encrypt TLS 1.3 on Port 443)  

---

## 1. Executive Summary & Gate Mandate

Gate **REAL_OEM_SYNC** validates and publishes the authoritative OEM (Original Equipment Manufacturer) documentation drop on the public edge reverse proxy (`https://data.controlnautas.com`), establishes the provenance ledger for newly supplied manufacturer documents (SRC-28 through SRC-32), and cements strict behavioral rules for Meta Muse operators to prevent hallucinated components or unauthorized model substitutions.

### Key Objectives Achieved:
1. **Public HTTPS Delivery via Nginx:** Exposed `/demo/datasheets/` and `/oem-sources/` with TLS 1.3, wildcard CORS (`Access-Control-Allow-Origin *`), public caching (`Cache-Control "public, max-age=86400"`), and directory browsing disabled (`autoindex off`). All 8 target PDFs tested and confirmed returning HTTP 200 with `Content-Type: application/pdf`.
2. **Authoritative Provenance Audit:** Evaluated 5 operator-dropped OEM documents in `docs/industrial/oem-sources/`, computing SHA-256 digests, page counts, and catalog bindings. Registered `SRC-28` to `SRC-32` in `docs/industrial/sources.json`.
3. **Machine-Readable Audit Manifest:** Created `docs/industrial/oem-sources/manifests/oem-sources-manifest.json` documenting the audit findings, Nginx edge delivery coordinates, and catalog protection bindings.
4. **Strict Catalog Protection & Muse Operator Checklists:** Updated `docs/industrial/muse-operator-demo-p0.md` and `docs/industrial/g6-operator-muse-checklist.md` with explicit behavioral mandates prohibiting GLB substitution, maintaining generic missing roles (SSR, heater), and guiding visual inspection via public HTTPS PDF links.

---

## 2. OEM Documentation Audit & Classification

The operator uploaded 5 manufacturer PDF documents to `/home/ec2-user/projects/hack-ecomer/docs/industrial/oem-sources/`. Each document was analyzed for cryptographic hash, exact byte size, page count, and applicability to the **Industrial Heating Chamber** pilot process family:

| Source ID | Relative Path | Size (Bytes) | Pages | SHA-256 Digest | Review Status | Pilot SKU Binding | Audit Findings & Technical Disposition |
|---|---|---|---|---|---|---|---|
| **SRC-28** | `horner-x4/MAN1137_21_EN_X4_UM.pdf` | 7,214,725 | 145 | `35c647aa6b1d8595a7f674e0d203ad77023a27d7ee8fd70c83e1bb3f53d0f649` | `reference_oem_non_pilot` | *None* | **Horner X4 OCS User Manual (MAN1137-21-EN).** 3.5" screen, 1/4 DIN format (96x96 mm, cutout 92x92 mm). Distinct from pilot SKU `CN-X5PRIME-HE-XP5` (4.3" widescreen, 125x96 mm, cutout 119.5x90.5 mm). Must **NOT** replace or overwrite X5 Prime catalog data or 3D models. |
| **SRC-29** | `horner-x4/MAN1138_R21_X4_DS.pdf` | 6,497,363 | 27 | `7885574524f1c23cd687a442beb690f45142420913b2684dd464293aa3878f40` | `reference_oem_non_pilot` | *None* | **Horner X4 OCS Datasheet (MAN1138 R21).** Contains specifications and terminal pinouts for Horner X4. Non-pilot reference documentation; does not mutate pilot catalog. |
| **SRC-30** | `tzone-tht02/THT02_users_manual_v1.1.pdf` | 671,763 | 9 | `48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c` | `verified_oem` | `CN-THT02` | **TZone THT-02 User Manual V1.1.** Identical byte-for-byte and SHA-256 to host datasheet `CN-THT02.pdf`. Authoritative OEM ground truth for Modbus RTU register mapping, power supply ratings (5-24 VDC), and RS-485 wiring. |
| **SRC-31** | `unitronics-or-misc/U_PumpHouse_Install.pdf` | 799,195 | 4 | `192542c508cae7a0fec7ad0fddd89c7a7a75861817b9e85013ed3ad9b1a93059` | `out_of_scope_unbound` | *None* | **King Electric U-Series Pumphouse Heater Installation Guide.** Forensically identified as King Electrical Mfg. Company (Seattle, WA). Radiant space heater with bimetal thermostat. Unrelated to heating chamber pilot process loop; classified as out-of-scope unbound. |
| **SRC-32** | `unitronics-or-misc/U_WEB.pdf` | 731,152 | 1 | `7a0517e6f5bc7e6427236436b829412e82da38ac7ac935d39250518e39dc4ce9` | `out_of_scope_unbound` | *None* | **King Electric U-Series Specifications Sheet (Drawing 4-08-244).** King Electrical Mfg. Company specifications leaflet for pumphouse space heaters. Unrelated to heating chamber pilot loop; classified as out-of-scope unbound. |

---

## 3. Public HTTPS Edge Delivery via Nginx

### 3.1 Configuration in `/etc/nginx/conf.d/controlnautas.conf`
Two dedicated location blocks were inserted into the public HTTPS server block (`data.controlnautas.com` on port 443):

```nginx
    location /oem-sources/ {
        alias /home/ec2-user/projects/hack-ecomer/docs/industrial/oem-sources/;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=86400";
        autoindex off;
    }

    location /demo/datasheets/ {
        alias /home/ec2-user/projects/hack-ecomer/docs/datasheets/;
        add_header Access-Control-Allow-Origin *;
        add_header Cache-Control "public, max-age=86400";
        autoindex off;
    }
```

### 3.2 Linux Traversal Permissions & Configuration Validation
- Executed `chmod 755 /home/ec2-user` ensuring Nginx worker processes have path traversal permissions to serve static documents.
- Validated configuration syntax: `sudo nginx -t` (Syntax OK, Test Successful).
- Gracefully reloaded Nginx: `sudo systemctl reload nginx`.

### 3.3 Live Public HTTPS Verification Results
Every public URL was tested from the command line over the live internet:

| Requested Endpoint URL | HTTP Status | Content-Type | CORS Header | Cache-Control | Size (Bytes) | Verification |
|---|---|---|---|---|---|---|
| `https://data.controlnautas.com/demo/datasheets/CN-N1200.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 1,280,893 | ✅ PASSED |
| `https://data.controlnautas.com/demo/datasheets/CN-X5PRIME-HE-XP5.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 2,220,450 | ✅ PASSED |
| `https://data.controlnautas.com/demo/datasheets/CN-THT02.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 671,763 | ✅ PASSED |
| `https://data.controlnautas.com/oem-sources/horner-x4/MAN1137_21_EN_X4_UM.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 7,214,725 | ✅ PASSED |
| `https://data.controlnautas.com/oem-sources/horner-x4/MAN1138_R21_X4_DS.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 6,497,363 | ✅ PASSED |
| `https://data.controlnautas.com/oem-sources/tzone-tht02/THT02_users_manual_v1.1.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 671,763 | ✅ PASSED |
| `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_PumpHouse_Install.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 799,195 | ✅ PASSED |
| `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_WEB.pdf` | **200 OK** | `application/pdf` | `*` | `public, max-age=86400` | 731,152 | ✅ PASSED |

---

## 4. Strict Catalog Protection & Operator Behavioral Doctrine

To protect against generative AI hallucinations, unintended CAD/GLB substitutions, or fabricated equipment entries, the following behavioral doctrine has been formally encoded into `docs/industrial/muse-operator-demo-p0.md` and `docs/industrial/g6-operator-muse-checklist.md`:

```
1. Muse MUST load ONLY catalog GLBs for pilot SKUs: CN-X5PRIME-HE-XP5, CN-N1200, CN-THT02.
2. SSR and heater heating elements MUST remain unlabeled generic missing_roles; never invent unverified equipment.
3. Muse SHOULD open OEM PDFs over HTTPS (https://data.controlnautas.com/demo/datasheets/... and /oem-sources/...) to inspect physical appearance, terminal block layouts, and bezel details. Muse MUST NEVER invent alternate controllers/sensors that replace catalog GLBs.
```

### Rationale:
- **Preventing Controller Substitution:** The Horner X4 manuals (`MAN1137`/`MAN1138`) describe a 3.5-inch controller with different physical dimensions (96x96x57.5mm) and terminal layouts than the pilot's 4.3-inch Horner X5 Prime OCS (125x96x31mm). Muse operators must use the OEM PDF solely for visual inspection and reference, while preserving the verified `CN-X5PRIME-HE-XP5` GLB asset and catalog snapshot.
- **Zero Fabricated SKUs for Incomplete Roles:** In the heating chamber circuit, power switching (SSR) and heating elements remain missing roles per Gate G4/G5 design. Muse must never invent speculative SKUs or CAD models for these unverified roles; they must remain generic placeholders that trigger appropriate Gate G5 safety rejections.

---

## 5. Artifacts Produced & Updated

1. **Nginx Reverse Proxy Configuration:**
   - `/etc/nginx/conf.d/controlnautas.conf` (updated with `/oem-sources/` and `/demo/datasheets/` locations).
2. **Sources Provenance Registry:**
   - `docs/industrial/sources.json` (updated `generated_at` to `2026-10-03T22:42:00Z`, registered `SRC-28` through `SRC-32`).
3. **Machine-Readable OEM Sources Manifest:**
   - `docs/industrial/oem-sources/manifests/oem-sources-manifest.json` (audit catalog, delivery endpoints, SHA-256 hashes, protection rules).
4. **Human Operator Runbooks & Checklists:**
   - `docs/industrial/muse-operator-demo-p0.md` (added Section 2.2 OEM PDF directory, Section 2.3 behavioral rules, updated sign-off rubric).
   - `docs/industrial/g6-operator-muse-checklist.md` (added Section 2.4 OEM PDF directory, Section 2.5 behavioral rules, updated verification rubric).
5. **Gate Acceptance Report:**
   - `docs/gates/REAL_OEM_SYNC.md` (this report).
6. **Implementation Ledger:**
   - `docs/industrial/IMPLEMENTATION_STATE.md` (recorded REAL_OEM_SYNC gate completion).

---

## 6. Gate Verdict

Gate **REAL_OEM_SYNC** is formally **PASSED**. All OEM technical documents are accessible over public edge HTTPS, the provenance registry is cryptographically locked, and operator guardrails are fully deployed.
