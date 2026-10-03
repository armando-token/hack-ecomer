# OEM Source Manifest & Dimensional Reconciliation: NOVUS N1200

**Manifest Document:** `docs/industrial/oem-sources/manifests/novus-n1200.md`  
**Author:** TZone & Unitronics OEM Specialist Subagent  
**Date:** 2026-10-03  
**Governing Architecture:** Controlnautas Industrial Technical Catalog & MUSE Spatial 3D Pipeline  
**Pilot Target SKU:** `CN-N1200`  
**Associated Technical Snapshot:** `snp_cn_n1200_v1`  
**Catalog Status:** `real_verified`

---

## 1. Document Cryptographic Ledger & Metadata

| Field | Authoritative OEM User Guide | Existing Catalog Mirror |
|---|---|---|
| **Relative Path** | `docs/datasheets/CN-N1200.pdf` | `docs/datasheets/CN-N1200.pdf` |
| **Public HTTPS URL** | `https://data.controlnautas.com/demo/datasheets/CN-N1200.pdf` | `https://data.controlnautas.com/demo/datasheets/CN-N1200.pdf` |
| **Document Code / Revision** | *N1200 Universal Process Controller User Guide V2.0x Q* | *N1200 Universal Process Controller User Guide V2.0x Q* |
| **Manufacturer** | NOVUS Automation Inc. / NOVUS Produtos Eletrônicos Ltda. | NOVUS Automation |
| **Page Count** | 63 pages | 63 pages |
| **Byte Size** | 1,280,893 bytes | 1,280,893 bytes |
| **SHA-256 Hash** | `53384720600d70cdce641350c30b0b86ad5e44a8b37291dbaef8ee0852f86554` | `53384720600d70cdce641350c30b0b86ad5e44a8b37291dbaef8ee0852f86554` |
| **Full Markdown Companion** | `docs/demo-docs/n1200/N1200_User_Guide.md` (221,330 bytes, SHA-256: `24dc81d9cab862fc197962e785ba561dffb885e0549bd17e4f929e09873be957`) | — |

---

## 2. 1/16 DIN Dimensions, Cutout & Mechanical Mounting

### 2.1 Enclosure Dimensions
From **Section 13 "Specifications"** (Page 30 / 63):
* **Standard Format:** `1/16 DIN` enclosure standard
* **Outer Envelope Dimensions:**
  * **Width:** `48.0 mm` (1.89 in)
  * **Height:** `48.0 mm` (1.89 in)
  * **Depth:** `110.0 mm` (4.33 in) (total front face to rear barrier terminal block)
* **Approximate Weight:** `150 g`
* **Materials & Environmental Ratings:**
  * **Front Panel:** Polycarbonate (UL94 V-2 rating), protected to **IP65** with frontal elastomer gasket.
  * **Body Housing:** Flame-retardant ABS + PC (UL94 V-0 rating), protected to **IP20**.
  * **Operating Temperature:** `5 °C to 50 °C` (`41 °F to 122 °F`).
  * **Relative Humidity:** `80 % max @ 30 °C` (derate 3 % per °C above 30 °C).

### 2.2 Panel Cutout Specifications
From **Section 13 "Specifications"** (Page 30) & **Section 4 "Installation / Connections"** (Page 14):
* **Panel Cutout Opening:** `45.5 mm × 45.5 mm (+0.5 mm / -0.0 mm)`
* **Mounting Method:**
  1. Prepare the square $45.5 \times 45.5\text{ mm}$ cutout in the enclosure door / instrumentation panel.
  2. Release and remove the ratchet mounting clamps from the controller barrel.
  3. Insert the controller through the panel cutout from the front side.
  4. Slide the ratchet mounting clamps from the rear along the side guide ridges until the frontal silicone gasket is firmly compressed against the front face of the panel door.

### 2.3 Terminal Block Specifications
From **Section 4.1 "Installation Recommendations"** (Page 14):
* **Screw Terminals:** Fixed barrier screw terminal strips.
* **Wire Size Capacity:** `0.5 to 1.5 mm²` (`16 to 22 AWG`).
* **Terminal Tightening Torque:** `0.4 N·m` (`3.5 lb·in`).
* **Terminal Lug Style:** Specifically designed for `6.3 mm` fork spade terminals or bare stripped conductors.
* **Chassis Extraction Mechanism:** The internal electronics core assembly can be unlatched and withdrawn forward through the front bezel without disconnecting any rear screw terminations.

---

## 3. Rear Terminal Block Layout & Wiring Matrix

### 3.1 Rear Panel Geometry
From **Section 4.2 "Electrical Connections", Figure 2** (Page 14):
The rear of the N1200 presents 18 numbered terminal screw locations arranged in four distinct groups:
1. **Left Vertical Column:** Terminals `1` through `6` (Power & Relays)
2. **Right Vertical Column:** Terminals `7` through `12` (Outputs & Sensor Inputs)
3. **Top Middle Block:** Terminals `13`, `14`, `15` (Optional Module: Relay 3 SPDT or Digital I/O)
4. **Bottom Middle Block:** Terminals `16`, `17`, `18` (Optional RS-485 Serial Interface)

```
        +-----------------------+
        |  [13]   [14]   [15]   |  <-- Optional 3R Relay or DIO
+-------+                       +-------+
|  [1]  |                       |  [7]  |  <-- I/O5 (-)
|  [2]  |      N 1 2 0 0        |  [8]  |  <-- I/O5 (+)
|  [3]  |                       |  [9]  |  <-- Remote SP (+) / 5V/10V
|  [4]  |    REAR TERMINAL      | [10]  |  <-- Input (-) Common
|  [5]  |        LAYOUT         | [11]  |  <-- Input (+) T/C, mV, Pt100 comp
|  [6]  |                       | [12]  |  <-- Input (+) mA, Pt100 exc
+-------+                       +-------+
        |  [16]   [17]   [18]   |  <-- Optional RS-485 (D1, D0, COM)
        +-----------------------+
```

### 3.2 Terminal Assignment Matrix (Terminals 1 to 18)

| Terminal Pin | Function Label | Signal Type / Rating | Typical Wiring in Heating Chamber |
|---|---|---|---|
| **`1`** | `POWER (L1 / -)` | AC Neutral or DC Negative | Mains 120/230 VAC Neutral (with fuse recommended) |
| **`2`** | `POWER (L2 / +)` | AC Line or DC Positive (`100–240 Vac/dc ±10%`) | Mains 120/230 VAC Phase |
| **`3`** | `I/O2 (NO)` | Control / Alarm Relay 2 Contact (SPST-NO, 1.5 A @ 240 Vac) | High-temperature alarm beacon / interlock loop |
| **`4`** | `I/O2 (COM)` | Control / Alarm Relay 2 Common | High-temperature alarm beacon / interlock loop |
| **`5`** | `I/O1 (NO)` | Control / Alarm Relay 1 Contact (SPST-NO, 1.5 A @ 240 Vac) | Auxiliary process interlock / cooling fan contactor |
| **`6`** | `I/O1 (COM)` | Control / Alarm Relay 1 Common | Auxiliary process interlock / cooling fan contactor |
| **`7`** | `I/O5 (-)` | Multi-function Return / Ground | SSR Control Negative (`-`) or 4–20 mA Retransmission (-) |
| **`8`** | `I/O5 (+)` | Multi-function Control Output: 10 V / 20 mA SSR pulse OR 4–20 mA loop (550 Ω max) OR Dry Contact Digital Input | **Primary SSR Drive Output:** `+10 V` logic pulse directly driving external Solid State Relay |
| **`9`** | `REMOTE SP / +5V / +10V` | Remote Setpoint Input (`+`) or High-level Voltage Input | Remote Setpoint from supervisory PLC (`CN-X5PRIME-HE-XP5` %AQ1). *Note: For 4–20 mA remote SP, wire external 100 Ω precision shunt across 9 & 10.* |
| **`10`** | `INPUT (-)` | **Universal Sensor Input Common Reference (`-`)** | Common negative leg for all analog sensor types: Pt100 return, Thermocouple negative, 4–20 mA negative, Voltage negative |
| **`11`** | `INPUT (+)` | **Universal Sensor Input Positive (`+`)** | Thermocouple positive (`+`), 0–50 mV positive (`+`), or **Pt100 3-wire length compensation leg** |
| **`12`** | `INPUT (mA / Pt100 Exc)` | **Current Input (`+`) & RTD Excitation Source** | **Linear 4–20 mA input (`+`)** (internal 15 Ω shunt) OR **Pt100 3-wire current excitation leg** (0.170 mA) |
| **`13`** | `I/O3` | Optional SPDT Relay NC/NO contact (Option `3R`) OR Digital I/O 3 (Option `DIO`) | Auxiliary alarm / remote control status |
| **`14`** | `I/O4 / I/O3 COM` | Optional SPDT Relay Common (Option `3R`) OR Digital I/O 4 (Option `DIO`) | Auxiliary alarm / remote control status |
| **`15`** | `I/O3 NO / GND` | Optional SPDT Relay contact (Option `3R`) OR Digital Ground (Option `DIO`) | Auxiliary alarm / remote control status |
| **`16`** | `RS485 (D1 / A)` | RS-485 Non-inverting serial communication line | Modbus RTU Slave network (`+`) to PLC master |
| **`17`** | `RS485 (D0 / B)` | RS-485 Inverting serial communication line | Modbus RTU Slave network (`-`) to PLC master |
| **`18`** | `RS485 (C / GND)`| RS-485 Common reference ground / shield | Serial shield reference |

### 3.3 Universal Sensor Input Wiring Modes (Terminals 10, 11, 12)
From **Section 4.2.2 "Input Connections"** (Page 14–15):
* **3-Wire Pt100 RTD:**
  * Terminal `10`: Common return wire (`-`).
  * Terminal `11`: Second wire (`+` compensation).
  * Terminal `12`: Third wire (`+` excitation current source).
  * *Note on 2-wire Pt100:* Short-circuit terminals `11` and `12` with a copper jumper wire.
  * *Note on 4-wire Pt100:* Leave the fourth wire disconnected at the controller.
* **Thermocouple (Types J, K, T, E, N, R, S, B) & 0–50 mV:**
  * Terminal `11`: Positive lead (`+`).
  * Terminal `10`: Negative lead (`-`).
* **Linear 4–20 mA / 0–20 mA:**
  * Terminal `12`: Current input positive (`+`).
  * Terminal `10`: Current input negative (`-`).
* **Linear 0–5 V / 0–10 V:**
  * Terminal `9`: Voltage input positive (`+`).
  * Terminal `10`: Voltage input negative (`-`).

---

## 4. Verification & Reconciliation against G4 Snapshot & G6 Asset

### 4.1 Dimensional Verification Summary

| Parameter | Manufacturer Datasheet Nominal | G4 Catalog Profile (`CN-N1200.md`) | G6 3D Asset Bounding Box | Dimensional Delta | Verdict |
|---|---|---|---|---|---|
| **Width (X)** | `48.0 mm` | `0.048 m` (`48.0 mm`) | `[-0.024, +0.024] m` (`0.048 m`) | **0.0 mm** | ✅ **PERFECT MATCH** |
| **Height (Y)** | `48.0 mm` | `0.048 m` (`48.0 mm`) | `[0.000, +0.048] m` (`0.048 m`) | **0.0 mm** | ✅ **PERFECT MATCH** |
| **Depth (Z)** | `110.0 mm` | `0.110 m` (`110.0 mm`) | `[-0.100, +0.010] m` (`0.110 m`) | **0.0 mm** | ✅ **PERFECT MATCH** |
| **Panel Cutout** | `45.5 × 45.5 mm` | `45.5 × 45.5 mm` | Panel collar plane at $Z = 0.000\text{ m}$ | **0.0 mm** | ✅ **PERFECT MATCH** |
| **Insertion Depth** | `100.0 mm` behind panel | `100.0 mm` behind panel | Barrel extends from $Z = 0$ to $Z = -0.100\text{ m}$ | **0.0 mm** | ✅ **PERFECT MATCH** |
| **Front Bezel Extension**| `10.0 mm` in front of panel | `10.0 mm` in front of panel | Bezel extends from $Z = 0$ to $Z = +0.010\text{ m}$ | **0.0 mm** | ✅ **PERFECT MATCH** |

### 4.2 Terminal Numbering Correction Recorded
* **Previous Catalog Discrepancy:**
  * In `docs/industrial/catalog/CN-N1200.md` (Table 5.1 & Section 5.2) and `CN-N1200.qa.md`, sensor terminals were historically transcribed as `Terminals 11, 12, 13`.
  * As verified conclusively from Section 4.2, Figure 2 of the OEM User Guide, the **universal sensor input is physically located on Terminals `10, 11, 12`** (with terminal `9` serving voltage/remote SP inputs).
  * Terminals `13, 14, 15` are the optional top block (Option 3R SPDT relay or Option DIO).
  * This manifest serves as the authoritative source reconciling this pinout notation.

---

## 5. Summary & Archival Verdict

* **Pilot SKU Binding:** `CN-N1200`
* **Functional Role:** Primary Process PID Controller for Industrial Heating Chamber
* **1/16 DIN Dimensions:** `48 × 48 × 110 mm` (Verified exact match to G4 snapshot and G6 3D model)
* **Panel Cutout:** `45.5 × 45.5 mm (+0.5/-0.0 mm)` with rear ratchet mounting clamps
* **Terminal Layout:** 18 terminal positions verified bit-for-bit against NOVUS blueprint
* **Audit Status:** ✅ `verified_oem`
