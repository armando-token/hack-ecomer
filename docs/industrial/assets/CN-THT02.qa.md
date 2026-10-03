# 3D Asset Quality Assurance Summary: CN-THT02

**Asset ID:** `ast_cn_tht02_glb_v1`  
**Product Title:** TZone THT-02 Temperature & Relative Humidity Transmitter  
**SKU:** `CN-THT02`  
**Medusa Variant ID:** `variant_01M41R193J5MPJ16MTX9CAWWRM`  
**Technical Snapshot ID:** `snp_cn_tht02_v1`  
**Technical Revision:** `rev_2026_g6`  
**Fidelity Classification:** `dimensional_proxy_verified`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§15, §16, §33 G6)  
**QA Status:** ✅ **PASSED (0 Errors, 0 Warnings)**  

---

## 1. Geometric Specification & Dimensional Verification

The 3D model geometry was synthesized via `scripts/generate-g6-assets.py` using physical dimensions from TZone Digital User's Manual `UM-V1.1`, pages 3 and 9 ("7 Dimensions & 4.1 Installation").

- **Coordinate System:** Right-handed Cartesian (+X Right, +Y Up, +Z Forward).
- **Linear Unit:** Meters (`m`).
- **Mounting Plane (Z = -0.020m):** Rear surface of the wall mounting flange ears. Enclosure body extends forward to `Z = +0.020m`.
- **Enclosure Structure:** Main housing with side wall mounting flanges, perforated top probe cap housing the Sensirion SHT30 sensor, and bottom nylon cable gland for 4-wire flying lead harness.

| Measurement Axis | Datasheet Nominal (mm) | GLB Bounding Box Range (m) | GLB Computed Size (m) | Dimensional Delta (mm) | Status |
|---|---|---|---|---|---|
| **Width (X)** | 110.0 mm | `[-0.055, +0.055]` | `0.110 m` | **0.0 mm** | ✅ PASS |
| **Height (Y)** | 85.0 mm | `[0.000, +0.085]` | `0.085 m` | **0.0 mm** | ✅ PASS |
| **Depth (Z)** | 40.0 mm | `[-0.020, +0.020]` | `0.040 m` | **0.0 mm** | ✅ PASS |

---

## 2. Anchor Mapping & PortSchema Alignment

Every electrical port in the Gate G4 snapshot `snp_cn_tht02_v1` is bound to a discrete named transform node:

| Anchor Identifier | PortSchema ID | Category | Direction | Signal Type & Pinout | Local Translation `[x, y, z]` (m) | Orientation Quaternion `[x, y, z, w]` |
|---|---|---|---|---|---|---|
| `anchor_sensor_internal` | `p_sensor_sht30` | `sensor` | `input` | Internal Sensirion SHT30 IC (`TEMP`, `HUMID`) | `[0.000, 0.078, 0.000]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_power_in` | `p_power_in` | `power` | `input` | 5-24 VDC Power Leads (`V+` Red, `GND` Black) | `[-0.003, 0.000, 0.000]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_rs485` | `p_rs485` | `serial_comm` | `bidirectional` | RS-485 Modbus RTU (`A+` Yellow, `B-` Green) | `[+0.003, 0.000, 0.000]` | `[0.0, 0.0, 0.0, 1.0]` |
| `anchor_mounting_wall` | `p_mounting_wall` | `mechanical` | `none` | Wall / Chamber Back Plane Reference (Z=-0.020) | `[0.000, 0.0425, -0.020]` | `[0.0, 0.0, 0.0, 1.0]` |

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

- **SHA-256 Checksum:** `7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327`
- **Byte Length:** `15,420 bytes` (15.06 KB)
- **Local Storage CAS Path:** `storage/industrial/assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb`
- **Canonical Storage Path:** `storage/industrial/assets/CN-THT02.glb`
- **Docs Mirror Path:** `docs/industrial/assets/CN-THT02.glb`
- **Manifest Path:** `docs/industrial/assets/CN-THT02.manifest.json`
- **Thumbnail Preview:** `docs/industrial/assets/thumbnails/CN-THT02.png`
- **Public Production URL:** `https://data.controlnautas.com/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb`
- **Staging / Local URL:** `http://127.0.0.1:9000/industrial-assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb`

---

## 5. Budget & Performance Metrics

- **Triangle Count:** 156 (Budget: < 5,000, 96.9% headroom)
- **Vertex Count:** 312 (Budget: < 10,000, 96.9% headroom)
- **Materials:** 6 PBR Metallic-Roughness (`Mat_THT02_Enclosure_White`, `Mat_THT02_Front_Badge`, `Mat_Filter_Cap_Sintered`, `Mat_Cable_Gland_Nylon`, `Mat_Cable_Boot_Rubber`, `Mat_Mounting_Ears`)
- **External Textures:** 0 (Procedural standard PBR colors and roughness factors)
- **Overall Verdict:** ✅ **APPROVED FOR PRODUCTION & META MUSE SPATIAL IMPORT**
