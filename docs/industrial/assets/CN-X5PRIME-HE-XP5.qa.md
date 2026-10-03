# 3D Asset Quality Assurance Summary: CN-X5PRIME-HE-XP5

**Asset ID:** `ast_cn_x5prime_he_xp5_glb_v1`  
**Product Title:** Horner Automation X5 Prime OCS All-in-One Controller  
**SKU:** `CN-X5PRIME-HE-XP5`  
**Medusa Variant ID:** `variant_01M41R18MQK0GXGPTYSX0EDZBH`  
**Technical Snapshot ID:** `snp_cn_x5prime_he_xp5_v1`  
**Technical Revision:** `rev_2026_g6`  
**Fidelity Classification:** `dimensional_proxy_verified`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§15, §16, §33 G6)  
**QA Status:** ✅ **PASSED (0 Errors, 0 Warnings)**  

---

## 1. Geometric Specification & Dimensional Verification

The 3D model geometry was synthesized via `scripts/generate-g6-assets.py` using physical dimensions from Horner Automation User Manual `MAN1363-R21`, page 15 ("Dimensions & Installation").

- **Coordinate System:** Right-handed Cartesian (+X Right, +Y Up, +Z Forward).
- **Linear Unit:** Meters (`m`).
- **Insertion Plane (Z=0):** Front panel cutout plane. Enclosure body extends backward to `Z = -0.045m`; bezel/touchscreen extends forward to `Z = +0.015m`.
- **Panel Cutout Opening:** 119.5 mm × 90.5 mm (tolerance ±0.5 mm).

| Measurement Axis | Datasheet Nominal (mm) | GLB Bounding Box Range (m) | GLB Computed Size (m) | Dimensional Delta (mm) | Status |
|---|---|---|---|---|---|
| **Width (X)** | 120.0 mm | `[-0.060, +0.060]` | `0.120 m` | **0.0 mm** | ✅ PASS |
| **Height (Y)** | 91.0 mm | `[0.000, +0.091]` | `0.091 m` | **0.0 mm** | ✅ PASS |
| **Depth (Z)** | 60.0 mm | `[-0.045, +0.015]` | `0.060 m` | **0.0 mm** | ✅ PASS |

---

## 2. Anchor Mapping & PortSchema Alignment

Every electrical port in the Gate G4 snapshot `snp_cn_x5prime_he_xp5_v1` is bound to a discrete named transform node:

| Anchor Identifier | PortSchema ID | Category | Direction | Signal Type & Pinout | Local Translation `[x, y, z]` (m) | Orientation Quaternion `[x, y, z, w]` |
|---|---|---|---|---|---|---|
| `anchor_power_in` | `p_power_in` | `power` | `input` | 10-30 VDC Primary Power (`V+`, `V-`) | `[-0.040, 0.003, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_rs485_mj1` | `p_rs485_mj1` | `serial_comm` | `bidirectional` | RS-485 Modbus RTU (`TX/RX+`, `TX/RX-`, `GND`) | `[-0.015, 0.003, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_ethernet_lan` | `p_ethernet_lan` | `ethernet` | `bidirectional` | 10/100 Mbps RJ45 Ethernet LAN | `[+0.015, 0.003, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_analog_in` | `p_analog_in` | `analog_input` | `input` | 4-channel 0-10V / 4-20mA (`AI1`–`AI4`, `AGND`) | `[0.000, 0.088, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_digital_in` | `p_digital_in` | `discrete_input` | `input` | 4-channel 12-24 VDC Discrete (`DI1`–`DI4`, `C`) | `[-0.035, 0.088, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_digital_out` | `p_digital_out` | `discrete_output` | `output` | 4-channel 24 VDC Sourcing (`Q1`–`Q4`, `V+`) | `[+0.035, 0.088, -0.030]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_display_center` | `p_display` | `optical` | `output` | 4.3" Resistive Color Touchscreen HMI | `[0.000, 0.0455, +0.015]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_mounting_panel` | `p_mounting_panel` | `mechanical` | `none` | Panel Cutout Reference Plane (Z=0) | `[0.000, 0.0455, 0.000]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_mounting_din` | `p_mounting_din` | `mechanical` | `none` | DIN EN 50022 TS 35 Rear Rail Clip Center | `[0.000, 0.0455, -0.045]` | `[0.0, 0.0, 0.0, 1.0]` |

---

## 3. Khronos glTF-Validator Audit

- **Validation Engine:** `@khronosgroup/gltf-validator` 2.0.143
- **glTF Specification:** glTF 2.0 Binary (`model/gltf-binary`)
- **Required Extensions:** None (`[]`)
- **Errors:** **0**
- **Warnings:** **0**
- **Infos / Hints:** **0**

---

## 4. Storage & Delivery Specifications

- **SHA-256 Checksum:** `47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5`
- **Byte Length:** `27,340 bytes` (26.70 KB)
- **Local Storage CAS Path:** `storage/industrial/assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb`
- **Canonical Storage Path:** `storage/industrial/assets/CN-X5PRIME-HE-XP5.glb`
- **Docs Mirror Path:** `docs/industrial/assets/CN-X5PRIME-HE-XP5.glb`
- **Manifest Path:** `docs/industrial/assets/CN-X5PRIME-HE-XP5.manifest.json`
- **Thumbnail Preview:** `docs/industrial/assets/thumbnails/CN-X5PRIME-HE-XP5.png`
- **Public Production URL:** `https://data.controlnautas.com/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb`
- **Staging / Local URL:** `http://127.0.0.1:9000/industrial-assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb`

---

## 5. Budget & Performance Metrics

- **Triangle Count:** 336 (Budget: < 5,000, 93.3% headroom)
- **Vertex Count:** 672 (Budget: < 10,000, 93.3% headroom)
- **Materials:** 7 PBR Metallic-Roughness (`Mat_X5_Bezel_Slate`, `Mat_X5_Screen_Glass`, `Mat_X5_HMI_Graphics`, `Mat_X5_Status_LEDs`, `Mat_X5_Pluggable_Orange`, `Mat_X5_RJ45_Shield`, `Mat_X5_DIN_Hardware`)
- **External Textures:** 0 (Procedural standard PBR colors and roughness factors)
- **Overall Verdict:** ✅ **APPROVED FOR PRODUCTION & META MUSE SPATIAL IMPORT**
