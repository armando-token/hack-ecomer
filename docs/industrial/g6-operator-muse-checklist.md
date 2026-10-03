# Gate G6: Human Operator Meta Muse Integration Checklist (Real Pilot Assets)

**Document ID:** `docs/industrial/g6-operator-muse-checklist.md`  
**Gate ID:** `G6`  
**Target Assets:**  
1. `CN-X5PRIME-HE-XP5` (Horner Automation X5 Prime OCS)  
2. `CN-N1200` (NOVUS N1200 Universal Process PID Controller)  
3. `CN-THT02` (TZone THT-02 Environmental Transmitter)  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§15 Activos CAD/GLB y verificación dimensional, §16 Entrega de archivos a Muse y prueba de capacidades, §33 Gate G6)  
**Operational Status:** `AWAITING_HUMAN_OPERATOR_EXECUTION` (Tracked under blocker ID **BLK-06**; server-side pipeline, file generation, Khronos validation, and CAS delivery endpoints are 100% complete and tested locally)  
**Historical Precedent:** `docs/industrial/g2-operator-muse-checklist.md` (Gate G2 Synthetic Asset Pilot)  

---

## 1. Executive Summary & Objective

In **Gate G2**, an automated synthetic asset (`SYN-IND-CTRL-01.glb`) established that the Controlnautas backend can serve valid glTF 2.0 binary assets with content-addressed caching and CORS `*`.

In **Gate G6**, we extend delivery to the **three real pilot products** of the **Industrial Heating Chamber** (`cámara de calentamiento`) process family:
1. **`CN-X5PRIME-HE-XP5`**: Supervisory PLC & 4.3" touchscreen HMI with DIN & panel mount.
2. **`CN-N1200`**: 1/16 DIN precision PID process temperature controller.
3. **`CN-THT02`**: Modbus RTU environmental air temperature and relative humidity transmitter.

Because automated CI/CD and subagent environments cannot log in to external, proprietary Meta Muse workspaces or execute spatial WebGL viewports, the actual spatial import verification must be performed by a human operator possessing an active Meta Muse account.

This checklist provides exact, deterministic prompts, delivery URLs, bounding dimension rubrics, and anchor inspection tables for all three real pilot SKUs.

> [!IMPORTANT]
> **Blocker Status BLK-06:**  
> The absence of an external human operator executing Meta Muse does **not** block internal platform progression from Gate G6 to Gate G7. The server-side asset pipeline, Khronos glTF-Validator audits (0 errors, 0 warnings), database seed scripts, and Medusa delivery endpoints are fully validated. Spatial import into Muse is tracked under operational blocker **BLK-06** (`AWAITING_HUMAN_OPERATOR_EXECUTION`).

---

## 2. Pilot Asset Endpoints & Checksum proofs

Before initiating verification in Meta Muse, ensure the assets are accessible either via public production HTTPS or via a local staging tunnel.

### Asset 1: Horner Automation X5 Prime OCS (`CN-X5PRIME-HE-XP5`)
- **Fidelity Tier:** `dimensional_proxy_verified`
- **File Size:** `27,340 bytes` (26.70 KB)
- **SHA-256:** `47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5`
- **Public CAS Delivery URL (HTTPS):**  
  `https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb`
- **Signed Short-Lived URL (15-Minute TTL):**  
  Obtained via API: `GET /api/industrial/v2/experimental/assets/ast_cn_x5prime_he_xp5_glb_v1/delivery` (returns `download_url` with query parameter `?token=...&expires=...`).

### Asset 2: NOVUS N1200 Process PID Controller (`CN-N1200`)
- **Fidelity Tier:** `dimensional_proxy_verified`
- **File Size:** `31,408 bytes` (30.67 KB)
- **SHA-256:** `73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2`
- **Public CAS Delivery URL (HTTPS):**  
  `https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb`
- **Signed Short-Lived URL (15-Minute TTL):**  
  Obtained via API: `GET /api/industrial/v2/experimental/assets/ast_cn_n1200_glb_v1/delivery`.

### Asset 3: TZone THT-02 Environmental Transmitter (`CN-THT02`)
- **Fidelity Tier:** `dimensional_proxy_verified`
- **File Size:** `15,420 bytes` (15.06 KB)
- **SHA-256:** `7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327`
- **Public CAS Delivery URL (HTTPS):**  
  `https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb`
- **Signed Short-Lived URL (15-Minute TTL):**  
  Obtained via API: `GET /api/industrial/v2/experimental/assets/ast_cn_tht02_glb_v1/delivery`.

---

## 3. Step-by-Step Operator Verification Procedure

### Test Cycle 1: Horner Automation X5 Prime OCS (`CN-X5PRIME-HE-XP5`)

#### Step 1.1: Request Direct Import
In a clean Meta Muse conversation, enter:
```text
Import the industrial 3D model from https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb.
Do not substitute with procedural primitives. Ingest the actual glTF 2.0 binary asset and report its bounding box dimensions, coordinate system, and scene nodes.
```

#### Step 1.2: Verify Bounding Envelope & Scale
Ask Muse:
```text
What are the exact bounding box extents (min X/Y/Z, max X/Y/Z, and dimensions) of the imported X5 Prime model in meters and millimeters?
```
- **Expected Width (X):** `0.120 m` (`120.0 mm`), ranging from `-0.060 m` to `+0.060 m`.
- **Expected Height (Y):** `0.091 m` (`91.0 mm`), ranging from `0.000 m` to `+0.091 m`.
- **Expected Depth (Z):** `0.060 m` (`60.0 mm`), ranging from `-0.045 m` (rear body) to `+0.015 m` (front bezel/screen).
- **Scale Vector:** Must remain exactly `[1.0, 1.0, 1.0]`.

#### Step 1.3: Verify Scene Graph Anchors
Ask Muse:
```text
List all empty transform nodes and anchors in the imported X5 Prime model scene graph, including their exact local translations [x, y, z].
```
Confirm the presence and translation of all 9 nodes:
1. `anchor_power_in`: `[-0.040, 0.003, -0.030]`
2. `anchor_rs485_mj1`: `[-0.015, 0.003, -0.030]`
3. `anchor_ethernet_lan`: `[0.015, 0.003, -0.030]`
4. `anchor_analog_in`: `[0.000, 0.088, -0.030]`
5. `anchor_digital_in`: `[-0.035, 0.088, -0.030]`
6. `anchor_digital_out`: `[0.035, 0.088, -0.030]`
7. `anchor_display_center`: `[0.000, 0.0455, 0.015]`
8. `anchor_mounting_panel`: `[0.000, 0.0455, 0.000]`
9. `anchor_mounting_din`: `[0.000, 0.0455, -0.045]`

---

### Test Cycle 2: NOVUS N1200 Process PID Controller (`CN-N1200`)

#### Step 2.1: Request Direct Import
```text
Import the industrial 3D model from https://data.controlnautas.com/industrial-assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb.
Ingest the binary glTF asset without procedural substitution and report bounding extents and scene hierarchy.
```

#### Step 2.2: Verify Bounding Envelope & Scale
- **Expected Width (X):** `0.048 m` (`48.0 mm`), ranging from `-0.024 m` to `+0.024 m`.
- **Expected Height (Y):** `0.048 m` (`48.0 mm`), ranging from `0.000 m` to `+0.048 m`.
- **Expected Depth (Z):** `0.110 m` (`110.0 mm`), ranging from `-0.100 m` (rear terminals) to `+0.010 m` (front bezel/display).

#### Step 2.3: Verify Scene Graph Anchors
Confirm all 9 nodes:
1. `anchor_power_in`: `[-0.013, 0.040, -0.100]`
2. `anchor_universal_in`: `[0.013, 0.028, -0.100]`
3. `anchor_out1_ctrl`: `[-0.013, 0.024, -0.100]`
4. `anchor_out2_alarm`: `[-0.013, 0.014, -0.100]`
5. `anchor_out3_alarm`: `[-0.013, 0.006, -0.100]`
6. `anchor_out4_analog`: `[0.013, 0.014, -0.100]`
7. `anchor_usb_comm`: `[0.015, 0.007, 0.010]`
8. `anchor_display_center`: `[0.000, 0.028, 0.010]`
9. `anchor_mounting_panel`: `[0.000, 0.024, 0.000]`

---

### Test Cycle 3: TZone THT-02 Environmental Transmitter (`CN-THT02`)

#### Step 3.1: Request Direct Import
```text
Import the industrial 3D model from https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb.
Confirm coordinate orientation and scene hierarchy.
```

#### Step 3.2: Verify Bounding Envelope & Scale
- **Expected Width (X):** `0.110 m` (`110.0 mm`), ranging from `-0.055 m` to `+0.055 m`.
- **Expected Height (Y):** `0.085 m` (`85.0 mm`), ranging from `0.000 m` to `+0.085 m`.
- **Expected Depth (Z):** `0.040 m` (`40.0 mm`), ranging from `-0.020 m` (wall mounting face) to `+0.020 m`.

#### Step 3.3: Verify Scene Graph Anchors
Confirm all 4 nodes:
1. `anchor_sensor_internal`: `[0.000, 0.078, 0.000]`
2. `anchor_power_in`: `[-0.003, 0.000, 0.000]`
3. `anchor_rs485`: `[0.003, 0.000, 0.000]`
4. `anchor_mounting_wall`: `[0.000, 0.0425, -0.020]`

---

## 4. Master Operator Verification Rubric

| Verification Item | Acceptance Criteria | `CN-X5PRIME-HE-XP5` | `CN-N1200` | `CN-THT02` | Pass / Fail |
|---|---|---|---|---|---|
| **Network Download** | HTTP GET 200/206 with `Content-Type: model/gltf-binary` and CORS `*`. | 27,340 B | 31,408 B | 15,420 B | [ ] |
| **Model Ingestion** | Ingested into 3D viewport without unhandled memory or parsing errors. | Valid glTF 2.0 | Valid glTF 2.0 | Valid glTF 2.0 | [ ] |
| **Envelope Dimension X** | Width matches nominal within 0.5 mm tolerance. | 120 mm (0.120 m) | 48 mm (0.048 m) | 110 mm (0.110 m) | [ ] |
| **Envelope Dimension Y** | Height matches nominal within 0.5 mm tolerance. | 91 mm (0.091 m) | 48 mm (0.048 m) | 85 mm (0.085 m) | [ ] |
| **Envelope Dimension Z** | Depth matches nominal within 0.5 mm tolerance. | 60 mm (0.060 m) | 110 mm (0.110 m) | 40 mm (0.040 m) | [ ] |
| **Orientation Normalization** | Front display faces +Z; top faces +Y; right faces +X. | +Y Up, +Z Front | +Y Up, +Z Front | +Y Up, +Z Front | [ ] |
| **Anchor Preservation** | All scene anchors detected with exact translations. | 9/9 Anchors | 9/9 Anchors | 4/4 Anchors | [ ] |
| **PBR Material Fidelity** | Distinct material regions (bezel, screen, LEDs, terminals). | 7 Materials | 8 Materials | 6 Materials | [ ] |
| **Credential Isolation** | No Bearer tokens exposed in public asset URLs or client query parameters. | Verified | Verified | Verified | [ ] |

---

## 5. Reporting Verification Results

Upon completing the verification run in Meta Muse:
1. Update `docs/industrial/muse-capability-report.json` with the observed outcomes.
2. Note whether external GLB ingestion is natively supported (`verified_pass`) or if the 2D thumbnail fallback must be utilized for commercial presentation (`fallback_illustrative_mode`).
3. If Meta Muse encounters client-side parsing failures, log the exact error message and notify the Gate G6 engineering coordinator.
