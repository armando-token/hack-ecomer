# Technical Profile: TZone THT-02 Temperature & Humidity Transmitter

**Document ID:** `docs/industrial/catalog/CN-THT02.md`  
**Schema Version:** `technical_profile/2.0`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§9, §10, §12, §33 G4)  
**Process Family Context:** Industrial Heating Chamber (`cámara de calentamiento`) — Environmental Air Temperature & Relative Humidity Transmitter  
**Review Status:** `reviewed_published`  
**Technical Revision:** `UM-V1.1-rev1`  

---

## 1. Product Identity

| Field | Value |
|---|---|
| **SKU** | `CN-THT02` |
| **Brand / Manufacturer** | TZone Digital (Shenzhen Tzone Digital Technology Co., Ltd.) |
| **Model Name** | THT-02 Temperature and Humidity Sensor / Transmitter |
| **Manufacturer Part Number (MPN)** | `THT-02` |
| **Medusa Product ID** | `prod_01M41R191T79EJVV5TNEN6TAWD` |
| **Medusa Variant ID** | `variant_01M41R193J5MPJ16MTX9CAWWRM` |
| **Technical Snapshot ID** | `snp_cn_tht02_v1` |
| **Source Document ID** | `SRC-09` / `SRC-THT02-UM-V1.1` |
| **Catalog Mode** | `real_verified` |

---

## 2. Technical Summary & Functional Role

The **TZone THT-02** is a digital ambient temperature and relative humidity transmitter housed in a cylindrical probe enclosure with a protective perforated sensor cap. It utilizes an internal Sensirion SHT30 CMOSens integrated circuit combining a capacitive relative humidity sensor element and a band-gap temperature sensor. The transmitter communicates via an RS-485 serial bus speaking the standard Modbus RTU slave protocol.

In the **Industrial Heating Chamber** pilot process architecture, the THT-02 fulfills the **Environmental Chamber Air Monitoring** role:
- Installed inside the heating chamber / drying enclosure to monitor air temperature (-40 to 125 °C) and humidity (5 to 95 %RH).
- Connects directly to the supervisory PLC / HMI (`CN-X5PRIME-HE-XP5`) over 2-wire RS-485 (`port_mj2_rs485`), which acts as Modbus RTU Master.
- Allows hardware setting of slave bus addresses (1 to 255) via an integrated 8-position binary DIP switch, eliminating the requirement for pre-programming configuration software.

---

## 3. Power Supply Ratings

| Parameter | Specification | EvidenceRef |
|---|---|---|
| **Supply Voltage Range** | DC 5 V to 24 V | `{"source_id": "SRC-09", "page": 3, "section": "4.1 Power supply", "excerpt": "Supply voltage: DC 5～24V"}` |
| **Operating Current** | 5 mA typical | `{"source_id": "SRC-09", "page": 3, "section": "4.1 Power supply", "excerpt": "Current: 5mA"}` |
| **Power Leads** | **Red Lead:** `V+` (Positive DC supply terminal)<br/>**Black Lead:** `GND` (Common ground / negative DC supply terminal) | `{"source_id": "SRC-09", "page": 4, "section": "4.7 Lead description", "excerpt": "Red: V+ Power supply positive... Black: GND Public ground"}` |
| **Grounding Requirement** | Connect common ground to RS-485 converter ground to eliminate common-mode voltage; shielding layer can be used as ground wire | `{"source_id": "SRC-09", "page": 4, "section": "4.8 Schematic diagram of connection with PC", "excerpt": "Suggest to connect the common ground of each sensor together, and then connect it to the ground wire"}` |

---

## 4. Physical Dimensions, Bounding Box & Mounting

| Parameter | Specification | EvidenceRef |
|---|---|---|
| **Body Envelope Dimensions** | **Diameter:** 16.0 mm (0.63")<br/>**Length:** 140.0 mm (5.51") (cylindrical probe format) | `{"source_id": "SRC-09", "page": 9, "section": "7 Dimensions (unit: mm)", "excerpt": "140MM length x 16MM diameter"}` |
| **3D Bounding Envelope (Meters)** | `[0.016, 0.016, 0.140]` m (Width, Height, Depth / Diameter, Diameter, Length) | Canonical conversion from nominal manufacturer dimensions (16 mm dia × 140 mm len) |
| **Panel Cutout Opening** | **None** (Not a panel-mount instrument) | Device is a cylindrical probe for air ducts, wall clips, or chamber suspension |
| **Mounting Style** | Probe clamp, wall mounting bracket, duct gland fitting, or suspended hanging probe | `{"source_id": "SRC-09", "page": 2, "section": "1 Overview", "excerpt": "used for accurate temperature and humidity relative measurement in HVAC, communication equipment rooms, warehouse buildings"}` |
| **Protective Housing** | ABS body with ventilated / perforated plastic filter cap over SHT30 element | Visual and physical inspection of verified product hardware |
| **Cable Lead Format** | 4-conductor flying lead cable (Red, Black, Yellow, Green) | `{"source_id": "SRC-09", "page": 4, "section": "4.7 Lead description", "excerpt": "Green: B-, Yellow: A+, Black: GND, Red: V+"}` |

---

## 5. Ports, Terminal Interfaces & Pin Functions

### 5.1 Port Summary

| Port ID | Port Label | Category | Direction | Signal Type / Protocol | Interface Type | EvidenceRef |
|---|---|---|---|---|---|---|
| `port_pwr_in` | DC Power Supply Input | `power` | `input` | `power_dc` (5–24 VDC, 5 mA) | 2 flying leads (Red: V+, Black: GND) | UM p. 3, 4 |
| `port_rs485` | RS-485 Modbus RTU Bus | `serial_comm` | `bidirectional` | RS-485 Modbus RTU Slave (4.8k–19.2k bps) | 2 flying leads (Yellow: A+, Green: B-) | UM p. 3, 4, 6 |
| `port_sensor_element` | Integrated Environmental Sensing | `sensor` | `input` | Internal Sensirion SHT30 CMOSens IC | Internal sensor element behind filter cap | UM p. 2, 3 |

### 5.2 Detailed Wiring & Protocol Pinout

#### Flying Lead Interface (`port_pwr_in` & `port_rs485`)
- **Red Wire (`V+`):** Positive DC power supply (+5 VDC to +24 VDC).
- **Black Wire (`GND`):** Power supply common ground (0 V).
- **Yellow Wire (`A+`):** RS-485 non-inverting communication line (Data +).
- **Green Wire (`B-`):** RS-485 inverting communication line (Data -).

#### RS-485 Modbus RTU Communication Specifications
- **Transmission Rates:** 4800 bps, 9600 bps, or 19200 bps (default factory configuration: **9600 bps**).
- **Data Frame Format:** 1 Start bit, 8 Data bits, No Parity bit (0), 1 Stop bit (`9600, 8, N, 1`).
- **Maximum Transmission Distance:** Up to 1,200 meters over twisted-pair shielded cable.
- **Maximum Theoretical Bus Nodes:** 32 standard transceivers on a single bus segment without repeaters.
- **Address Configuration:** 8-position DIP switch located inside enclosure:
  - Bit 1: 128
  - Bit 2: 64
  - Bit 3: 32
  - Bit 4: 16
  - Bit 5: 8
  - Bit 6: 4
  - Bit 7: 2
  - Bit 8: 1
  - Sum of ON switches equals slave address (1 to 255). Default factory address: `1`.
- **Supported Modbus Functions:**
  - Function `03` (`0x03`): Read Holding Registers.
  - Function `06` (`0x06`): Preset Single Register (Baud rate configuration).
- **Register Map (Read Holding Registers 0x03):**
  - **Register 0 (`0x0000`):** Temperature. Value = raw integer / 10 (0.1 °C resolution, MSB first, two's complement). `0x7FFF` indicates abnormal sensor error.
  - **Register 1 (`0x0001`):** Relative Humidity. Value = raw integer / 10 (0.1 %RH resolution). `0x7FFF` indicates abnormal sensor error.
  - **Register 4 (`0x0004`):** Address code (read-only from DIP switch).
  - **Register 5 (`0x0005`):** Baud rate (read/write: `0x12C0` = 4800, `0x2580` = 9600, `0x4B00` = 19200).

---

## 6. Supported Sensor Ranges & Accuracy

| Parameter | Measurement Range | Accuracy | Resolution | EvidenceRef |
|---|---|---|---|---|
| **Air Temperature** | -40 °C to +125 °C (-40 °F to +257 °F) | ±0.3 °C (0 °C to 60 °C)<br/>±0.5 °C (remaining range) | 0.1 °C | `{"source_id": "SRC-09", "page": 3, "section": "4.4 Temperature parameter", "excerpt": "Measuring range: -40～125℃, Accuracy: ±0.3℃(0~60℃); ±0.5°C for other range"}` |
| **Relative Humidity** | 5 % to 95 % RH | ±2 % RH (10 % to 90 % RH)<br/>±5 % RH (remaining range) | 0.1 % RH | `{"source_id": "SRC-09", "page": 3, "section": "4.5 Humidity parameters", "excerpt": "Working range: 5～95%RH, Accuracy: ±2%(10%~90%RH); ±5% for other range"}` |
| **Humidity Hysteresis** | < ±0.8 % RH | — | — | `{"source_id": "SRC-09", "page": 3, "section": "4.5 Humidity parameters", "excerpt": "Hysteresis: < ±0.8%RH"}` |
| **Humidity Response Time** | ~8 seconds in flowing air (from 33 %RH to 75 %RH) | — | — | `{"source_id": "SRC-09", "page": 3, "section": "4.5 Humidity parameters", "excerpt": "Response time: About 8s"}` |
| **Long-Term Drift** | < ±0.25 % RH / year (under clean environment) | — | — | `{"source_id": "SRC-09", "page": 3, "section": "4.5 Humidity parameters", "excerpt": "Long-term stability: <±0.25%RH/year"}` |
| **Operating Ambient Environment** | -40 °C to +85 °C (-40 °F to +185 °F), 5 % to 95 % RH (non-condensing) | — | — | `{"source_id": "SRC-09", "page": 4, "section": "4.6 Environmental conditions", "excerpt": "working environment: -40～85℃/ 5～95%RH(Non-condensing）"}` |
| **Storage Ambient Environment** | -40 °C to +85 °C (-40 °F to +185 °F), 5 % to 95 % RH (non-condensing) | — | — | `{"source_id": "SRC-09", "page": 4, "section": "4.6 Environmental conditions", "excerpt": "Storage environment: -40～85℃/ 5～95%RH(Non-condensing）"}` |

---

## 7. Explicit Missing Capabilities & Non-Documented Aspects

Per MEGAPLAN §9.3, §10.1, §13.4 and the Controlnautas determinism rules:

1. **NOT a 4–20 mA Current Loop Transmitter:**
   - The THT-02 has **ZERO analog current outputs**.
   - Attempting to connect `CN-THT02` to an analog 4–20 mA controller input (such as N1200 terminals 12–13 or X5 analog inputs %AI1–%AI4 configured for 4–20 mA) is fundamentally invalid and is evaluated as `does_not_meet` (`INCOMPATIBLE_SIGNAL_TYPE`).

2. **NOT a Pt100 RTD Resistance Sensor:**
   - The internal sensing chip is a digital Sensirion SHT30 CMOS integrated circuit.
   - It is **NOT a 2-wire, 3-wire, or 4-wire Pt100 platinum RTD element**. It cannot connect to RTD bridge or resistance measurement circuits.

3. **NOT Submersible in Liquids:**
   - The probe features a ventilated cap to allow air vapor diffusion to the SHT30 element.
   - **Immersion into water, oil, thermal transfer fluids, or wet slurries will instantly flood and ruin the sensor**.
   - It is strictly an ambient air / gas environmental transmitter.

4. **Transmitter Housing Temperature Limit (85 °C Max):**
   - While the internal SHT30 IC has a sensing capability up to 125 °C, the **working environment rating of the probe body, cable, and internal electronics is -40 °C to +85 °C**.
   - Operating the transmitter above 85 °C risks melting the plastic housing, degrading the adhesive seals, and damaging the RS-485 transceiver.
   - For heating chambers operating between 85 °C and 125 °C, the probe body must be positioned in a cooler sampling duct, or a high-temperature RTD probe must be utilized instead.

5. **NO Onboard Display or Keypad:**
   - The sensor has no visual screen or local indicators. Measured values can only be read digitally via RS-485 Modbus RTU polling.

---

## 8. Source Document Citations & Verifiable Checksums

| Resource | Path / Identifier | Format | SHA-256 Checksum |
|---|---|---|---|
| **Authoritative Manufacturer PDF** | `docs/datasheets/CN-THT02.pdf` | Binary PDF (9 pages, 671,763 bytes) | `48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c` |
| **User Manual Full Markdown** | `docs/demo-docs/tht02/THT02_User_Manual.md` | Markdown (15,565 bytes) | `084f9aa3ed2f5131389aef78f6697752123ada76bcd8f8f6242d9886d810e79c` |
| **Compact Spec** | `docs/demo-specs/CN-THT02.md` | Markdown (1,757 bytes) | `b45ba28ec5a7da07c4df6664bb38fddbad6c5c43e612955ac9064e0a4d957b20` |
