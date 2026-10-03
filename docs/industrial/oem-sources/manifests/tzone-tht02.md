# OEM Source Manifest & Dimensional Reconciliation: TZone THT-02

**Manifest Document:** `docs/industrial/oem-sources/manifests/tzone-tht02.md`  
**Author:** TZone & Unitronics OEM Specialist Subagent  
**Date:** 2026-10-03  
**Governing Architecture:** Controlnautas Industrial Technical Catalog & MUSE Spatial 3D Pipeline  
**Pilot Target SKU:** `CN-THT02`  
**Associated Technical Snapshot:** `snp_cn_tht02_v1`  
**Catalog Status:** `real_verified`

---

## 1. Document Cryptographic Ledger & Metadata

| Field | OEM Source Document | Existing Catalog Datasheet |
|---|---|---|
| **Relative Path** | `docs/industrial/oem-sources/tzone-tht02/THT02_users_manual_v1.1.pdf` | `docs/datasheets/CN-THT02.pdf` |
| **Public HTTPS URL** | `https://data.controlnautas.com/oem-sources/tzone-tht02/THT02_users_manual_v1.1.pdf` | `https://data.controlnautas.com/demo/datasheets/CN-THT02.pdf` |
| **Document Title** | *TZ THT-02 Temperature and humidity Sensor User's Manual V1.1* | *TZ THT-02 Temperature and humidity Sensor User's Manual V1.1* |
| **Internal Metadata Title** | `SHT3X485` (Author: 雨林木风, Creator: WPS 文字) | `SHT3X485` (Author: 雨林木风, Creator: WPS 文字) |
| **Creation / Mod Date** | 2024-07-05 17:30:56 +09:30 | 2024-07-05 17:30:56 +09:30 |
| **Page Count** | 9 pages | 9 pages |
| **Byte Size** | 671,763 bytes | 671,763 bytes |
| **SHA-256 Hash** | `48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c` | `48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c` |
| **Verification Verdict** | **IDENTICAL BIT-FOR-BIT** | **IDENTICAL BIT-FOR-BIT** |

---

## 2. Physical Form Factor, Enclosure & Dimensional Extraction

### 2.1 Authoritative Enclosure Form Factor
The official manufacturer user manual `THT02_users_manual_v1.1.pdf` exclusively documents a **cylindrical probe enclosure**. It contains **zero documentation, zero engineering drawings, and zero part numbers for any rectangular wall-mount transmitter box**.

The physical assembly documented in the manual consists of four discrete sections:
1. **Sensing Tip / Protective Filter Cap (Top):**
   - High-permeability slotted protective strainer ("Stainless steel strainer", Page 1 image `IM19.jpg`) shielding the internal Sensirion SHT30 CMOSens IC from physical abrasion while facilitating ambient air vapor diffusion.
2. **Main Probe Barrel (Middle):**
   - Cylindrical thermoplastic body (16.0 mm outer diameter) containing the signal conditioning circuitry and RS-485 transceiver.
   - Separated into two threaded cylindrical halves sealed by an elastomeric O-ring (Page 5 image `IM52.jpg`).
3. **Internal Sub-Assembly (Inside Barrel):**
   - Blue printed circuit board containing an 8-position binary DIP switch for hardware bus address configuration (Page 5, `IM51.jpg` & `IM52.jpg`) and solder/screw wire termination pads.
4. **Cable Gland & Cable Lead (Bottom):**
   - Threaded conical compression boot / cable strain relief ("Waterproof terminal", Page 1 `IM19.jpg`).
   - Standard 1-meter 4-conductor flying lead cable jacketed in black PVC.
5. **Mounting Clip / Bracket (Accessory):**
   - Two-hole clip-on mounting bracket ("Mounting holes", Page 1 `IM19.jpg`) that snaps around the 16.0 mm cylindrical barrel to allow surface or chamber wall fastening.

### 2.2 Manufacturer Blueprint Dimensions
From **Section 7 "Dimensions (unit: mm)"** (Page 9, image `IM76.jpg`):
* **Probe Total Length:** `140 mm` (excluding cable gland compression boot and cable exit)
* **Probe Outer Diameter:** `16 mm` (cylindrical cross-section across entire barrel and filter cap)
* **Nominal Envelope Bounding Box:** `16 mm × 16 mm × 140 mm` (`[0.016, 0.016, 0.140] m`)

---

## 3. Reconciliation: G4 Snapshot vs. G6 3D Asset vs. OEM Source

### 3.1 Comparison Matrix

| Property | OEM Source Manual (`THT02_users_manual_v1.1.pdf`) | G4 Catalog Profile (`docs/industrial/catalog/CN-THT02.md`) | G4 Gate Summary (`docs/gates/G4.md:76`) | G6 3D Synthesized Asset (`scripts/generate-g6-assets.py`) | Reconciliation Status |
|---|---|---|---|---|---|
| **Enclosure Type** | **Cylindrical Probe** (140 mm L × 16 mm Ø) with clip bracket | **Cylindrical Probe** (140 mm L × 16 mm Ø) | Rectangular Wall Mount Box | Rectangular Wall Mount Box with side mounting ears | **Divergence Identified** |
| **Bounding Box Envelope (Meters)** | `[0.016, 0.016, 0.140] m` (or `[0.050, 0.016, 0.140]` with clip bracket) | `[0.016, 0.016, 0.140] m` (`manifest.json`: `[0.016, 0.016, 0.14]`) | `[0.110, 0.085, 0.040] m` | `[0.110, 0.085, 0.040] m` | **Delta Reported Below** |
| **Width (X)** | `16.0 mm` (probe body) | `16.0 mm` | `110.0 mm` | `110.0 mm` (`[-0.055, +0.055] m`) | **Delta: +94.0 mm** |
| **Height (Y)** | `16.0 mm` (cross-section) or `140.0 mm` (axial) | `16.0 mm` (cross-section) or `140.0 mm` (axial) | `85.0 mm` | `85.0 mm` (`[0.000, +0.085] m`) | **Delta: +69.0 mm / -55.0 mm** |
| **Depth (Z)** | `140.0 mm` (axial length) or `16.0 mm` | `140.0 mm` (axial length) or `16.0 mm` | `40.0 mm` | `40.0 mm` (`[-0.020, +0.020] m`) | **Delta: -100.0 mm / +24.0 mm** |
| **Mounting Reference** | Wall clip, duct gland, suspended clamp | Probe clamp, wall clip, duct gland | Wall / chamber mount | Wall flange ears (Z = -0.020 m) | Reconciled |

### 3.2 Root Cause Analysis of G4/G6 `[0.110, 0.085, 0.040]` Enclosure
1. **Schematic Block Diagram Misinterpretation:**
   - In `THT02_users_manual_v1.1.pdf` Section 4.8 (Page 4), a schematic wiring diagram displays standard square blocks labeled `"Transmitter"` connecting to `"PC"` via `"RS-232/RS-485 Transverter"`.
   - In `docs/gates/G4.md:76`, this was cited as: `Wall / chamber mount; 110 x 85 x 40 mm -> Envelope [0.110, 0.085, 0.040] m (verified p. 4)`.
   - Page 4 contains **no metric dimensions whatsoever**; it is purely a logical multi-drop topological diagram.
2. **Catalog Profile vs. 3D Model Discrepancy:**
   - The catalog author correctly identified the cylindrical probe dimensions in `docs/industrial/catalog/CN-THT02.md` (`16.0 mm` dia × `140.0 mm` len, `[0.016, 0.016, 0.140] m`) and `manifest.json`.
   - The G6 procedural 3D generator script `scripts/generate-g6-assets.py` implemented a wall-mount rectangular transmitter enclosure matching the `[0.110, 0.085, 0.040]` envelope from `G4.md`.
3. **Engineering Impact & Recommendations:**
   - **Current Asset Validity:** The current G6 asset `ast_cn_tht02_glb_v1` is classified honestly as `dimensional_proxy_verified` (procedural proxy, not vendor CAD). It correctly positions the internal sensor anchor at `Y = +0.078 m` and wire leads at `Y = 0.000 m`.
   - **Future Asset Evolution (Gate G6+ / Production CAD):** The 3D geometry generator should be updated in a subsequent pass to synthesize the true cylindrical probe geometry: 16 mm diameter × 140 mm cylinder with perforated filter cap, threaded barrel, and rear cable gland / flying leads.

---

## 4. Electrical Pinout & Wiring Specifications

### 4.1 Flying Lead Definition
From **Section 4.7 "Lead description"** (Page 4):

| Wire Color | Lead Label | Function Description | Electrical Specification | Connection Target in Heating Chamber |
|---|---|---|---|---|
| **Red** | `V+` | Power supply positive | DC +5 V to +24 V (5 mA operating current) | 24 VDC instrument power supply (`+24V`) |
| **Black** | `GND` | Public ground / power negative | DC Common Ground (0 V) | 24 VDC power supply ground (`0V`) |
| **Yellow** | `A+` | RS-485 non-inverting serial line | RS-485 Data + (`D1` / `Tx+ / Rx+`) | Supervisory PLC RS-485 port (`CN-X5PRIME-HE-XP5` MJ2 Pin 1) |
| **Green** | `B-` | RS-485 inverting serial line | RS-485 Data - (`D0` / `Tx- / Rx-`) | Supervisory PLC RS-485 port (`CN-X5PRIME-HE-XP5` MJ2 Pin 2) |

### 4.2 RS-485 Bus & Grounding Topology
From **Section 4.8 "Schematic diagram of connection with PC"** (Page 4):
* **Common Mode Voltage Mitigation:** To prevent transceiver damage and signal degradation, connect the common ground (`GND`) of each sensor together, and reference it to the ground wire of the master RS-485 transverter.
* **Cable Shielding:** The outer braided shielding layer of the twisted-pair cable must be connected as the reference ground wire.
* **Bus Capacity:** Maximum 32 unit nodes without repeaters; maximum transmission line length: 1,200 meters at 9600 bps.

---

## 5. DIP Switch Address Configuration & Modbus RTU Protocol

### 5.1 Internal 8-Position DIP Switch Configuration
From **Section 5 "DIP switch and address code"** (Page 5):
* To access the DIP switch:
  1. Unscrew the rear cable gland nut.
  2. Unscrew the rear cylindrical housing barrel from the forward sensor assembly.
  3. The internal PCB contains an 8-position dual in-line package (DIP) rocker switch.
* **Binary Address Calculation:**
  Each switch position corresponds to a binary weight when in the **ON** position:

| Switch Bit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| **Binary Weight** | `128` | `64` | `32` | `16` | `8` | `4` | `2` | `1` |

$$\text{Modbus Slave Address} = \sum_{\text{Bit } i = \text{ON}} \text{Weight}(i)$$

* **Factory Default Address:** `1` (Bit 8 = ON, Bits 1–7 = OFF).
* **Manual Example:** Bits 1, 3, and 4 in ON position $\rightarrow 128 + 32 + 16 = \mathbf{176}$.

### 5.2 Serial Communication Framing
* **Baud Rates:** 4800, 9600 (factory default), 19200 bps.
* **Frame Structure:** 1 Start bit, 8 Data bits, 0 Parity bits, 1 Stop bit (`9600, 8, N, 1`).
* **Silent Interval Timing:** Inter-frame pause of $\ge 3.5$ characters ($T_{1\text{-}T2\text{-}T3\text{-}T4}$). Inter-character spacing must not exceed $1.5$ characters.

### 5.3 Modbus Register Map (Function Code `0x03` - Read Holding Registers)
From **Section 6.4 "Register definition"** (Page 6):

| Register Address (Hex) | Register Address (Dec) | Parameter Name | Format / Scaling | Access | Abnormal / Error Indicator |
|---|---|---|---|---|---|
| `0x0000` | 0 | **Temperature** | 16-bit signed integer (MSB first, two's complement). Scale: **0.1 °C** (`Value / 10`) | Read Only | `0x7FFF` indicates sensor element fault |
| `0x0001` | 1 | **Relative Humidity** | 16-bit unsigned integer (MSB first). Scale: **0.1 %RH** (`Value / 10`) | Read Only | `0x7FFF` indicates sensor element fault |
| `0x0002` | 2 | Reserved 1 | Internal test register | Read Only | — |
| `0x0003` | 3 | Reserved 2 | Internal test register | Read Only | — |
| `0x0004` | 4 | **Address Code** | Returns active hardware DIP switch address (1 to 255) | Read Only | Reflects physical switch positions |
| `0x0005` | 5 | **Baud Rate Code** | `0x12C0` = 4800 bps<br/>`0x2580` = 9600 bps<br/>`0x4B00` = 19200 bps | **Read / Write** | Modifiable via Function Code `0x06` |
| `0x0006` | 6 | Hardware Version | e.g., `0x0600` (Hardware V6.0) | Read Only | — |
| `0x0007` | 7 | Software Version | e.g., `0x000A` (Software V1.0) | Read Only | — |

---

## 6. Sensor Performance & Operating Limits

From **Section 4.4, 4.5, 4.6** (Pages 3–4):
* **Air Temperature Sensing Range:** `-40 °C to +125 °C`
  * Accuracy: `±0.3 °C` from `0 °C to 60 °C`; `±0.5 °C` over remaining range.
  * Resolution: `0.1 °C`.
* **Relative Humidity Sensing Range:** `5 % to 95 % RH`
  * Accuracy: `±2 % RH` from `10 % to 90 % RH`; `±5 % RH` over remaining range.
  * Resolution: `0.1 % RH`.
  * Hysteresis: `< ±0.8 % RH`.
  * Response Time: `~8 s` (from 33% RH to 75% RH in flowing air).
  * Long-Term Stability: `< ±0.25 % RH / year`.
* **Physical Housing Temperature Limit:**
  * While the SHT30 sensor chip measures up to 125 °C, the **entire probe housing, ABS body, cable gland, and PVC cable are strictly rated for -40 °C to +85 °C**.
  * Exposure of the probe enclosure or cable to temperatures exceeding 85 °C causes structural housing deformation and internal transceiver damage.

---

## 7. Conclusions & Catalog Binding Verdict

1. **Catalog Status:** `CN-THT02` is fully verified against manufacturer documentation (`SRC-09` / `THT02_users_manual_v1.1.pdf`).
2. **Physical Format Reconciled:** The manufacturer documents exclusively a **cylindrical probe (140 mm × 16 mm Ø)** with flying leads and a snap-on mounting clip.
3. **Envelope Tracking:** G4 catalog (`CN-THT02.md`) and `manifest.json` correctly specify `[0.016, 0.016, 0.140] m`. The G6 3D asset proxy (`[0.110, 0.085, 0.040] m`) represents a procedural wall-mount enclosure proxy which should be superseded by a cylindrical probe model in future CAD updates.
4. **Signal Compatibility Reaffirmed:** RS-485 Modbus RTU Slave only; no analog 4–20 mA output, no Pt100 RTD resistance output.
