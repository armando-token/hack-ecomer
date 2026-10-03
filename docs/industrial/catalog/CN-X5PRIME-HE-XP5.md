# Technical Profile: Horner OCS X5 Prime (HE-XP5)

**Document ID:** `docs/industrial/catalog/CN-X5PRIME-HE-XP5.md`  
**Schema Version:** `technical_profile/2.0`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§9, §10, §12, §33 G4)  
**Process Family Context:** Industrial Heating Chamber (`cámara de calentamiento`) — Supervisory PLC & Operator HMI  
**Review Status:** `reviewed_published`  
**Technical Revision:** `MAN1363-R21-rev1`  

---

## 1. Product Identity

| Field | Value |
|---|---|
| **SKU** | `CN-X5PRIME-HE-XP5` |
| **Brand / Manufacturer** | Horner Automation |
| **Model Name** | X5 Prime OCS (Operator Control Station) |
| **Manufacturer Part Number (MPN)** | `HE-XP5` |
| **Medusa Product ID** | `prod_01M41R18HHV1C37JKN503W2ASP` |
| **Medusa Variant ID** | `variant_01M41R18MQK0GXGPTYSX0EDZBH` |
| **Technical Snapshot ID** | `snp_cn_x5prime_he_xp5_v1` |
| **Source Document ID** | `SRC-07` / `SRC-HE-XP5-DS-MAN1363-R21` |
| **Catalog Mode** | `real_verified` |

---

## 2. Technical Summary & Functional Role

The **Horner OCS X5 Prime (`HE-XP5`)** is an all-in-one industrial automation controller integrating an IEC 61131-3 logic execution engine, a 4.3" resistive color touchscreen operator interface (450 nits, 480×272 WQVGA, 65K colors), and onboard digital and analog I/O in a compact 1/8 DIN panel-mount form factor.

In the **Industrial Heating Chamber** pilot process architecture, the X5 Prime fulfills the **Supervisory PLC & Operator HMI** role:
- Serves as the primary operator control panel for recipe selection, temperature setpoint entry, and status visualization.
- Acts as **RS-485 Modbus RTU Master** over port `MJ2`, continuously polling the `CN-THT02` temperature and relative humidity transmitter in the chamber interior.
- Logs process chamber conditions (temperature, humidity, cycle runtimes) to internal FAT32 removable media (microSD card) and USB flash storage.
- Connects to supervisory industrial Ethernet networks via 10/100 Mbps RJ45 (Modbus TCP/IP, WebMI).

---

## 3. Power Supply Ratings

| Parameter | Specification | EvidenceRef |
|---|---|---|
| **Primary Power Voltage Range** | 10 VDC to 30 VDC | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Primary Pwr. Range: 10-30VDC"}` |
| **Steady State Current** | 118.1 mA @ 24 VDC (~2.83 W) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Required Pwr. (steady state): 118.1mA @ 24VDC"}` |
| **Power with Backlight @ 50%** | 85.6 mA @ 24 VDC (~2.05 W) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Required Pwr with Backlight @ 50%: 85.6mA @ 24VDC"}` |
| **Power with Backlight OFF** | 83.6 mA @ 24 VDC (~2.01 W) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Backlight OFF: 83.6mA @ 24VDC"}` |
| **Inrush Current** | 20 A for < 1 ms @ 24 VDC switched | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Required Pwr. (inrush): 20A for < 1 ms at 24VC DC Switched"}` |
| **Power Supply Class Requirement** | Class 2 power supply required | `{"source_id": "SRC-07", "page": 5, "section": "Power Wiring", "excerpt": "A Class 2 power supply must be used."}` |
| **Power Terminal Block** | 3-position pluggable screw clamp (Pin 1: Frame Ground, Pin 2: DC-, Pin 3: DC+) | `{"source_id": "SRC-07", "page": 5, "section": "Power Wiring", "excerpt": "PIN 1: Ground (Frame Ground), PIN 2: DC- (Input Power Supply Ground), PIN 3: DC+ (Input Power Supply Voltage)"}` |
| **Wire Gauge & Torque** | 12–24 AWG (2.5–0.2 mm²), strip length 7 mm (0.28"); torque 4.5–7 in-lbs (0.50–0.78 N·m) | `{"source_id": "SRC-07", "page": 5, "section": "DC Input/Frame", "excerpt": "Solid/Stranded Wire: 12-24 awg (2.5-0.2mm), Strip length: 0.28” (7mm), Torque: 4.5 – 7 in-lbs (0.50 – 0.78 N-m)"}` |

---

## 4. Physical Dimensions, Bounding Box & Mounting

| Parameter | Specification | EvidenceRef |
|---|---|---|
| **Body Envelope Dimensions** | **Width:** 125.0 mm (4.92")<br/>**Height:** 96.0 mm (3.79")<br/>**Depth:** 31.0 mm (1.22") | `{"source_id": "SRC-07", "page": 15, "section": "Dimensions & Installation", "excerpt": "X5 & X5 Prime Dimensions: 4.92” (125mm) x 3.79” (96mm) x 1.22” (31mm)"}` |
| **3D Bounding Envelope (Meters)** | `[0.125, 0.096, 0.031]` m (Width, Height, Depth) | Canonical conversion from nominal manufacturer dimensions (125 × 96 × 31 mm) |
| **Panel Cutout Opening** | 119.5 mm × 90.5 mm (4.70" × 3.56")<br/>**Tolerance:** ±0.5 mm | `{"source_id": "SRC-07", "page": 15, "section": "Panel Cut-Out", "excerpt": "Panel Cut-Out: 4.70” (119.5mm) x 3.56” (90.5mm), Panel Tolerance +/- 0.5mm"}` |
| **Mounting Style** | Flush panel mounting via 4 mounting clips and perimeter watertight sealing gasket | `{"source_id": "SRC-07", "page": 16, "section": "Installation Procedure", "excerpt": "The X5 utilizes a clip installation method to ensure a robust and watertight seal to the enclosure... Install and tighten the four mounting clips"}` |
| **Enclosure Protection Ratings** | Type 1, 3R, 4, 4X, 12, 12K, and 13 (front panel washdown and corrosion resistant) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Enclosure Type: Type 1, 3R, 4, 4X, 12, 12K, & 13"}` |
| **Weight** | 271 g (10 oz) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Weight: 10 oz / 271 g"}` |
| **Panel Layout Clearances** | Side clearance: 50.8 mm (2"); wiring duct: 38.1 mm (1.5"); adjacent device: 101.6 mm (4") | `{"source_id": "SRC-07", "page": 16, "section": "Factors Affecting Panel Layout Design and Clearances", "excerpt": "Minimum Distance between base of device and sides of cabinet: 2” (50.80mm)"}` |

---

## 5. Ports, Terminal Interfaces & Pin Functions

### 5.1 Port Summary

| Port ID | Port Label | Category | Direction | Signal Type / Protocol | Connector Type | EvidenceRef |
|---|---|---|---|---|---|---|
| `port_pwr_in` | Primary Power Input | `power` | `input` | `power_dc` (10–30 VDC) | 3-pin cage clamp terminal strip | MAN1363 R21 p. 5 |
| `port_di` | Discrete DC Inputs | `discrete_input` | `input` | `digital_dc` (0–24 VDC) | 3.5 mm pluggable cage clamp | MAN1363 R21 p. 6 |
| `port_ai` | Analog Inputs | `analog_input` | `input` | `current_4_20mA`, `voltage_0_10V` | 3.5 mm pluggable cage clamp | MAN1363 R21 p. 7 |
| `port_do` | Discrete DC Outputs | `discrete_output` | `output` | `digital_dc` (10–30 VDC sourcing) | 3.5 mm pluggable cage clamp | MAN1363 R21 p. 8 |
| `port_mj1_rs232` | Serial Port MJ1 | `serial_comm` | `bidirectional` | RS-232 with HW handshake | Modular 8P8C (RJ45) | MAN1363 R21 p. 12 |
| `port_mj2_rs485` | Serial Port MJ2 | `serial_comm` | `bidirectional` | RS-485 Modbus RTU Master/Slave | Modular 8P8C (RJ45, shared jack) | MAN1363 R21 p. 12 |
| `port_can` | CAN Network Port | `serial_comm` | `bidirectional` | CsCAN (125 kbps – 1 Mbps) | Modular 8P8C (RJ45) | MAN1363 R21 p. 13 |
| `port_lan` | Ethernet Port | `ethernet` | `bidirectional` | 10/100BASE-TX (Modbus TCP/IP) | Modular 8P8C (RJ45) | MAN1363 R21 p. 14 |
| `port_usb_mini_b` | Programming USB | `serial_comm` | `bidirectional` | USB 2.0 Mini-B (Virtual COM) | USB Mini-B Receptacle | MAN1363 R21 p. 14 |
| `port_usb_a` | Host Storage USB | `serial_comm` | `bidirectional` | USB 2.0 Type-A Host | USB Type-A Receptacle | MAN1363 R21 p. 14 |
| `port_microsd` | Removable Media | `storage` | `bidirectional` | FAT32 microSD / SDHC / SDXC | Push-push microSD socket | MAN1363 R21 p. 14 |

### 5.2 Detailed Terminal & Pin Pinouts

#### Primary Power Terminal Block (`port_pwr_in`)
- **Pin 1:** Frame Ground (`Ground`) — connect directly to enclosure earth ground.
- **Pin 2:** DC Power Supply Ground (`DC-`) — internally tied to I/O V- and CAN V-.
- **Pin 3:** DC Power Supply Positive (`DC+`) — accepts +10 to +30 VDC.

#### Discrete DC Inputs (`port_di`)
- 4 Channels (%I1, %I2, %I3, %I4) with 1 common terminal.
- Sinking or sourcing configurable (Positive Logic or Negative Logic in Cscape hardware setup).
- Nominal: 0 to 24 VDC; Absolute Maximum: 30 VDC. Input impedance: 10 kΩ.
- Logic levels: Min ON = 8 VDC (0.8 mA); Max OFF = 3 VDC (0.3 mA).
- Response time: 2 ms minimum (updated once per logic scan).
- High Speed Counter (HSC): 4 hardware counter channels supported up to 500 kHz.
- Isolation: None (internally referenced to logic ground).

#### Analog Inputs (`port_ai`)
- 4 Single-ended Channels (%AI1, %AI2, %AI3, %AI4).
- Selectable input modes: `4-20mA`, `0-20mA DC`, `0-10VDC`.
- Input impedance: 50 Ω for current modes; 500 kΩ for 0–10 V mode.
- Conversion resolution: 12-bit nominal (scaled to 0–32,000 raw counts in software).
- Absolute maximum input voltage: -0.5 to 12 VDC.
- Max error @ 25 °C: 1.5 % of full scale.
- Update speed: All channels sampled once per OCS scan.
- Isolation: None.

#### Discrete DC Outputs (`port_do`)
- 4 Channels (%Q1, %Q2, %Q3, %Q4) with 1 common terminal (`Vext`).
- Output type: Half-bridge current sourcing (positive logic).
- Output supply voltage range: 10 VDC to 30 VDC.
- Maximum current per point: 0.5 A; Maximum total module current: 2.0 A.
- Voltage drop at rated load: 0.25 VDC maximum.
- Protection: Short circuit and overvoltage protection.
- Pulse Width Modulation (PWM): %Q1 and %Q2 can be configured as PWM or Stepper pulse outputs up to 500 kHz.

#### Serial Communications Modular Jack (`port_mj1_rs232` & `port_mj2_rs485`)
Single 8P8C modular connector providing two independent serial channels:
- **Pin 1:** `RX+ / TX+` (MJ2 RS-485 Data High, in/out)
- **Pin 2:** `RX- / TX-` (MJ2 RS-485 Data Low, in/out)
- **Pin 3:** `CTS` (MJ1 RS-232 Clear to Send, in)
- **Pin 4:** `RTS` (MJ1 RS-232 Request to Send, out)
- **Pin 5:** `+5V @ 60mA` (Auxiliary power output for external converters/sensors)
- **Pin 6:** `0V Ground` (Signal ground common for RS-232 and RS-485)
- **Pin 7:** `RXD` (MJ1 RS-232 Receive Data, in)
- **Pin 8:** `TXD` (MJ1 RS-232 Transmit Data, out)
- **DIP Switch 1:** Turn ON for built-in 120 Ω RS-485 line termination.

#### CAN Network Modular Jack (`port_can`)
- **Pin 1:** `CAN Data High`
- **Pin 2:** `CAN Data Low`
- **Pins 3, 6, 7:** `Ground`
- **Pins 4, 5, 8:** No Connection
- **DIP Switch 2:** Turn ON for built-in 120 Ω CAN line termination.

---

## 6. Supported Sensor Ranges & Operating Ambient Ratings

| Variable / Parameter | Operational Limits | EvidenceRef |
|---|---|---|
| **Operating Ambient Temperature** | -10 °C to +60 °C (14 °F to 140 °F) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Operating Temp.: -10˚C to +60˚C"}` |
| **Storage Ambient Temperature** | -30 °C to +70 °C (-22 °F to 158 °F) | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Storage Temp.: -30˚C to +70˚C"}` |
| **Ambient Relative Humidity** | 5 % to 95 % RH, non-condensing | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Relative Humidity: 5-95% non-condensing"}` |
| **Operating Altitude** | Up to 2,000 meters above sea level | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Altitude: Up to 2000m"}` |
| **Pollution Degree Rating** | Evaluated for Pollution Degree 2 rating | `{"source_id": "SRC-07", "page": 2, "section": "General Specifications", "excerpt": "Rated Pollution Degree: Evaluated for Pollution Degree 2 Rating"}` |
| **Real Time Clock (RTC)** | Accuracy: ±20 ppm max at 25 °C (±1 min/month); Renata CR2032 lithium backup battery | `{"source_id": "SRC-07", "page": 1, "section": "Backup Battery", "excerpt": "The XL6 Prime uses a Renata CR2032 lithium battery to run the Real Time Clock"}` |

---

## 7. Explicit Missing Capabilities & Non-Documented Aspects

Per MEGAPLAN §9.3, §10.1, §13.4 and the Controlnautas determinism rules:

1. **NO Built-in Dedicated Analog Outputs (%AQ):**
   - The built-in I/O summary explicitly lists only 4 digital inputs, 4 digital outputs, and 4 analog inputs.
   - Dedicated 4–20 mA or 0–10 V analog control outputs are NOT present on the standard onboard I/O block.
   - Any analog command to external variable frequency drives or SCR power regulators requires CAN bus expansion I/O (such as Horner SmartStix or SmartRail).

2. **NO Direct Pt100 RTD or Thermocouple Sensor Inputs:**
   - The 4 built-in analog inputs accept standard process signals: `0-20mA`, `4-20mA`, and `0-10VDC`.
   - The device **cannot accept raw millivolt thermocouple signals or resistance elements (Pt100 RTD 3-wire)** directly without an external DIN rail temperature transmitter or converter.

3. **Outputs CANNOT Switch AC Mains or High Current Heating Loads:**
   - The built-in digital outputs are 24 VDC half-bridge solid-state transistors rated for a maximum of 0.5 A per point (2.0 A total).
   - They **cannot directly switch 110/220 VAC electric resistance heating elements**.
   - An intermediate switching actuator interface (such as a 24 VDC logic-input Solid State Relay or contactor) is mandatory for thermal heating loops.

4. **CANNOT Run Directly from AC Mains Power:**
   - The controller accepts 10 to 30 VDC. Connecting 110/220 VAC mains to pins 1–3 will cause immediate catastrophic destruction of the instrument.
   - A dedicated 24 VDC instrument power supply is mandatory.

5. **Analog Inputs Lack Galvanic Isolation:**
   - Onboard analog inputs share a common ground with internal logic and CAN/serial supplies.
   - If an unisolated 4–20 mA sensor loop is subjected to ground loops or high common-mode voltages (>12 V), the input tranzorb protection diodes may fail. An external signal isolator or PTC protection resistor is recommended when wiring unisolated field transducers.

---

## 8. Source Document Citations & Verifiable Checksums

| Resource | Path / Identifier | Format | SHA-256 Checksum |
|---|---|---|---|
| **Authoritative Manufacturer PDF** | `docs/datasheets/CN-X5PRIME-HE-XP5.pdf` | Binary PDF (18 pages, 2,220,450 bytes) | `70278736e6b8f3ab170876274a02a3ba7be0942bc2b0995bf7d5742f8bd1d742` |
| **Datasheet Full Markdown** | `docs/demo-docs/x5prime/X5_Prime_Datasheet.md` | Markdown (29,788 bytes) | `688c2d7bc88fef42da0e555306221717c7d32804e1d0bd07b6bcd291d77007d9` |
| **Quick Reference Guide** | `docs/demo-docs/x5prime/X5_Prime_Quick_Reference.md` | Markdown (47,992 bytes) | `0178e9e778139c2dd8f587881d5c495b1bb6659512b314966cc11a85d463c14f` |
| **User Manual (MAN1039)** | `docs/demo-docs/x5prime/X5_Prime_User_Manual.md` | Markdown (349,279 bytes) | `8b7b4a72702343d9ffd88871a6c2f398eafe49e89b127c207c239bfc7f0e9d2a` |
| **Compact Spec** | `docs/demo-specs/CN-X5PRIME-HE-XP5.md` | Markdown (2,024 bytes) | `a3bf7d3e663c6d8c7f94daad32063a765b8a43d7f392ed2e198d13889cea1e10` |
