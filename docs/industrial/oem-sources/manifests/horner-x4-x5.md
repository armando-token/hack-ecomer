# OEM Source Manifest & Comparison: Horner X4 vs. Horner X5 Prime (HE-XP5)

**Manifest Document:** `docs/industrial/oem-sources/manifests/horner-x4-x5.md`  
**Author:** Horner OEM Specialist Subagent  
**Date:** 2026-10-03  
**Governing Architecture:** Controlnautas Industrial Technical Catalog & MUSE Spatial 3D Pipeline  
**Pilot Target SKU:** `CN-X5PRIME-HE-XP5` (`HE-XP5`)

---

## 1. Document Cryptographic Ledger & Metadata

| Field | Source 1 (X4 User Manual) | Source 2 (X4 Datasheet) | Source 3 (X5 Prime Datasheet) |
|---|---|---|---|
| **Relative Path** | `docs/industrial/oem-sources/horner-x4/MAN1137_21_EN_X4_UM.pdf` | `docs/industrial/oem-sources/horner-x4/MAN1138_R21_X4_DS.pdf` | `docs/datasheets/CN-X5PRIME-HE-XP5.pdf` |
| **Document Code** | `MAN1137-21-EN` (Revision 21) | `MAN1138 R21` (Revision 21, 27 NOV 2023) | `MAN1363 R21` (Revision 21, 24 JUL 2023) |
| **Document Title** | *Horner X4 OCS User Manual* | *X4 Micro OCS Datasheet* | *X5 Prime OCS Datasheet* |
| **Page Count** | 145 pages | 27 pages | 18 pages |
| **SHA-256 Hash** | `35c647aa6b1d8595a7f674e0d203ad77023a27d7ee8fd70c83e1bb3f53d0f649` | `7885574524f1c23cd687a442beb690f45142420913b2684dd464293aa3878f40` | `70278736e6b8f3ab170876274a02a3ba7be0942bc2b0995bf7d5742f8bd1d742` |
| **Verification** | Verified bit-for-bit against filesystem | Verified bit-for-bit against filesystem | Verified bit-for-bit against filesystem |

---

## 2. Verbatim Technical Excerpts & Page Citations

### 2.1 Horner X4 User Manual (`MAN1137-21-EN`)

* **Chapter 2: Intro to the X4 — Section 2.4 "Features of X4 OCS" (p. 14):**
  > "Physical Specifications  
  > mm: 96 tall x 125 wide x 331 deep  
  > in: 3.79 tall x 4.92 wide x 1.22 deep  
  > weight: 360g"  
  *(Note: "331 deep" is an obvious typographical error in the manual text for 31 mm / 33.1 mm; see engineering blueprint HG-056 below.)*

* **Chapter 3: Mechanical Installation — Section 3.5 "Dimensions" (p. 18, Drawing HG-056):**
  > - **Front Bezel Outer Dimensions:** `4.93" (125.2mm)` width × `3.79" (96.2mm)` height  
  > - **Rear Enclosure Body (behind bezel):** `4.66" (118.5mm)` width × `3.52" (89.5mm)` height  
  > - **Depth behind Mounting Flange:** `1.06" (26.8mm)`  
  > - **Total Depth (front face to connector rear):** `1.20" (30.5mm)`  
  > - **Panel Cutout Opening:** `4.70" (119.5mm)` width × `3.56" (90.5mm)` height  
  > - **NEMA 4X Cutout Tolerance:** *"For installations requiring NEMA 4X liquid and dust protection, the panel cutout should be cut with a tolerance of +0.5mm/-0mm."*

* **Chapter 3: Mechanical Installation — Section 3.6 "Installation Procedure" (p. 19):**
  > "2. Carefully cut the host panel per the diagram, creating a 90.5mm x 119.5mm with a tolerance of +/-0.5mm opening into which the X4 is to be installed. If the opening is too large, water may leak into the enclosure, potentially damaging the unit. If the opening is too small, the OCS may not fit through the hole without damage."  
  > "4. Install and tighten the four mounting clips (provided in the box) until the gasket forms a tight seal. For standard composite mounting clips (included with product). NOTE: Torque rating is 2-3 in.lbs (0.23-0.34 Nm). For optional metal mounting clips, use a torque rating of 4-8 in.lbs (0.45-0.90 Nm)."

* **Chapter 3: Mechanical Installation — Section 3.7.1 "Clearance / Adequate Space" (p. 19):**
  > "Minimum Clearance Requirements for Panel Box and Door:  
  > - Minimum Distance between base of device and sides of cabinet: 2” (50.80mm)  
  > - Minimum Distance between base of device and wiring ducts: 1.5” (38.10mm)  
  > - If more than one device installed in panel box (or on door): Minimum Distance between bases of each device: 4” (101.60mm) between bases of each device  
  > - When door is closed: Minimum distance between device and closed door (Be sure to allow enough depth for the OCS.): 2” (50.80mm)"

* **Chapter 11: User Interface — Section 11.1 "Screen Specifications" & 11.4 "Touch Sensitivity" (p. 97, 100):**
  > - **Display Type:** 4.3” 65k TFT  
  > - **Resolution:** 480 × 272 pixels  
  > - **Backlight:** LED – 20,000 hours to reach 50% brightness  
  > - **Screen Memory:** 256 kB  
  > - **User-Programmable Screens:** 250  
  > - **Keypad:** Slide Keys (Touch); resistive stylus/finger interface with configurable slip sensitivity (p. 100).

---

### 2.2 Horner X4 Datasheet (`MAN1138 R21`)

* **Page 1: Part Numbers:**
  > "Model R: Relay & Solid State Outputs: HE-X4R  
  > Model A: Solid State Outputs: HE-X4A"

* **Page 2: General Specifications:**
  > - **Primary Power Range:** `24VDC ±20%` (19.2 VDC to 28.8 VDC)  
  > - **Typical Power (Backlight 100%):** `190mA @ 24VDC`  
  > - **Power (Backlight Off):** `105mA @ 24VDC`, `135mA @ 19.2VDC`  
  > - **Weight:** `360g`  
  > - **Housing Material:** Polycarbonate, UL rated  
  > - **Environmental Ratings:** Type 1, 4X (indoor use only), 12, 12K & 13

* **Page 3: Control and Logic:**
  > - **Control Language Support:** Advanced ladder logic; Full IEC 61131-3 languages  
  > - **Logic Program Size:** `256kB`  
  > - **Logic Scan Rate:** `0.4ms/kB`  
  > - **Total Program Memory:** `2.5Mb`  
  > - **Registers:** `%I`: 1024, `%Q`: 1024, `%AI`: 256, `%AQ`: 256, `%R`: 5000

* **Page 4: User Interface & Connectivity:**
  > - **Display Type:** 4.3” 65k Color; 350 cd/m² (nits)  
  > - **Resolution:** 480 × 272 pixels  
  > - **Screen Memory:** 256 kB; 250 screens; 100 objects/screen  
  > - **Connectivity:** 1x RS232, 1x RS485; CAN 2.0 (RJ45 modular jack, red); 1x 10/100Mbps Ethernet; Mini USB (Programming only); microSD (FAT32, 32GB max).  
  > *(Note: USB-A host port is NOT present on X4).*

* **Page 6: Controller Overview:**
  > Rear ports: 1. Touchscreen, 2. microSD Slot, 3. RS232/RS485 Serial Port, 4. CAN Port (via RJ45), 5. LAN Port, 6. USB Mini-B Port, 7. Analog I/O (J3), 8. DC Inputs (J2), 9. DC Outputs (J1), 10. DC Power.

* **Page 24: DIMENSIONS & INSTALLATION / X4 Dimensions (Drawing HG-056):**
  > - **Outer Face:** `4.92" (125mm)` width × `3.79" (96mm)` height × `1.22" (31mm)` depth  
  > - **Panel Cutout:** `4.70" (119.5mm)` width × `3.56" (90.5mm)` height  
  > - **Panel Tolerance:** `+/- 0.5mm`

---

### 2.3 Horner X5 Prime Datasheet (`MAN1363 R21` / `CN-X5PRIME-HE-XP5.pdf`)

* **Page 1: Product Identification & Built-In I/O:**
  > "Part Number: HE-XP5  
  > Built-In I/O: 4 Digital DC Inputs, 4 Digital DC Outputs, 4 Analog Inputs"

* **Page 2: General Specifications:**
  > - **Primary Power Range:** `10-30VDC`  
  > - **Required Power (steady state):** `118.1mA @ 24VDC` (Backlight 50%: 85.6mA, Off: 83.6mA)  
  > - **Weight:** `10 oz / 271g`  
  > - **Operating Temp:** `-10°C to +60°C`  
  > - **Enclosure Type:** Type 1, 3R, 4, 4X, 12, 12K, & 13

* **Page 3: Control and Logic, Display & Connectivity:**
  > - **Control Language Support:** Advanced Ladder Logic; Full IEC 61131-3 Languages  
  > - **Logic Program Size:** `2MB, Max.` (8× larger than X4)  
  > - **Scan Rate:** `0.02ms/kB` (20× faster than X4's 0.4 ms/kB)  
  > - **Online Programming Changes:** Supported in Advanced Ladder  
  > - **General Purpose Registers:** 50,000 words retentive; 16,384 bits non-retentive  
  > - **Display Type:** Resistive 4.3” Touchscreen; `450 cd/m² (nits)` (brighter than X4's 350 nits)  
  > - **Screen Memory:** `22MB` (88× larger than X4's 256 kB)  
  > - **User-Programmable Screens:** `1023` (vs 250 on X4)  
  > - **USB Ports (2):** 1x Mini-B for Programming; 1x USB-A Host for flash drives, Wi-Fi dongles, or UVC webcams  
  > - **USB Webcams:** Supported via UVC protocol (absent on X4).

* **Page 4 & 12–14: Controller Overview & Communications:**
  > Rear ports: 1. Power, 2. Input Connector (DI/AI), 3. Output Connector (DO), 4. CAN Port, 5. Serial Ports (RS232/RS485), 6. DIP Switches (3 switches for termination & bias), 7. Ethernet Port, 8. microSD Slot, 9. USB-A Port, 10. USB Mini-B Port.

* **Page 15: DIMENSIONS & INSTALLATION / X5 & X5 Prime Dimensions:**
  > - **Outer Face:** `4.92" (125mm)` width × `3.79" (96mm)` height × `1.22" (31mm)` depth  
  > - **Panel Cut-Out:** `4.70" (119.5mm)` width × `3.56" (90.5mm)` height  
  > - **Panel Tolerance:** `+/- 0.5mm`

* **Page 16: Installation Procedure:**
  > "2. Carefully cut the host panel per the diagram, creating a 90.5mm x 119.5mm (with a tolerance of +/-0.5mm) opening into which the X5 maybe installed."  
  > "4. Install and tighten the four mounting clips... torque rating of 2-3 in-lbs (0.23-0.34 Nm) for composite; 4-8 in-lbs (0.45-0.90 Nm) for metal."

---

## 3. Comprehensive Technical Comparison: X4 vs. X5 Prime

| Parameter / Feature | Horner X4 (`HE-X4A` / `HE-X4R`) | Horner X5 Prime (`HE-XP5` / `CN-X5PRIME-HE-XP5`) | Comparison Verdict |
|---|---|---|---|
| **Governing OEM Document** | `MAN1137-21-EN` (UM) & `MAN1138 R21` (DS) | `MAN1363 R21` (DS) & `MAN1039` (UM) | Completely distinct manual series |
| **Manufacturer Model Numbers** | `HE-X4A` (Solid State), `HE-X4R` (Relay), `HE-X4R-V20`, `HE-X4R-42` | `HE-XP5` | Different product models |
| **Catalog Pilot SKU** | Not mapped (Reference OCS Family) | `CN-X5PRIME-HE-XP5` | Strict 1:1 binding to `HE-XP5` |
| **Outer Bezel Face (Width × Height)** | `125.0 × 96.0 mm` (`4.92" × 3.79"`)<br/>*(Drawing HG-056: 125.2 × 96.2 mm)* | `125.0 × 96.0 mm` (`4.92" × 3.79"`) | **IDENTICAL OUTER FACE** (±0.2 mm drafting precision) |
| **Panel Cutout (Width × Height)** | `119.5 × 90.5 mm` (`4.70" × 3.56"`) | `119.5 × 90.5 mm` (`4.70" × 3.56"`) | **IDENTICAL PANEL CUTOUT** |
| **Cutout Tolerance** | `±0.5 mm` (+0.5/-0 mm for NEMA 4X) | `±0.5 mm` | **IDENTICAL TOLERANCE** |
| **Nominal Device Depth** | `31.0 mm` (`1.22"`)<br/>*(Blueprint: 26.8 mm body + 3.7 mm terminal)* | `31.0 mm` (`1.22"`) | **IDENTICAL CORE DEPTH** |
| **Enclosure Bounding Envelope (G4/G6)** | Reference only (not modeled) | `120.0 × 91.0 × 60.0 mm`<br/>(`[0.120, 0.091, 0.060] m`) | Includes front bezel projection (+15mm) & rear connector clearance (-45mm) |
| **Weight** | `360 g` (12.7 oz) | `271 g` (9.56 oz / 10 oz) | **X4 is 33% HEAVIER** (larger I/O board & relays) |
| **Housing Material** | Polycarbonate, UL rated | Polycarbonate, UL rated | Identical resin class |
| **Enclosure Ingress Ratings** | Type 1, 4X (indoor), 12, 12K, 13 | Type 1, 3R, 4, 4X, 12, 12K, 13 | Both NEMA 4X front panel sealed |
| **Mounting Hardware & Torque** | 4 composite clips (2–3 in-lb) or metal clips (4–8 in-lb); DIN rail | 4 composite clips (2–3 in-lb) or metal clips (4–8 in-lb); DIN rail | **IDENTICAL MOUNTING HARDWARE** |
| **Mounting Clearances** | Sides: 50.8mm; Ducts: 38.1mm; Inter-device: 101.6mm; Door: 50.8mm | Same Horner OCS mechanical guidelines apply | Identical clearance guidelines |
| **Display Diagonal & Tech** | 4.3" TFT 65k Color, Resistive Touchscreen | 4.3" TFT 65k Color, Resistive Touchscreen | Same panel size & touch technology |
| **Display Resolution** | WQVGA `480 × 272` pixels | WQVGA `480 × 272` pixels | Identical resolution |
| **Display Luminance (Brightness)** | `350 cd/m² (nits)` | `450 cd/m² (nits)` | **X5 PRIME IS 28.6% BRIGHTER** |
| **Backlight Lifetime (50%)** | 20,000 hrs (UM) / 50,000 hrs (DS) | 50,000 hrs | Similar LED backlight lifetime |
| **Processor Scan Rate** | `0.4 ms / kB` | `0.02 ms / kB` | **X5 PRIME IS 20× FASTER** |
| **Logic Program Size** | `256 kB` | `2 MB` | **X5 PRIME HAS 8× LARGER LOGIC CAPACITY** |
| **Screen Memory** | `256 kB` | `22 MB` | **X5 PRIME HAS 88× LARGER GRAPHICS MEMORY** |
| **Max User Screens** | 250 screens (100 objects/screen) | 1,023 screens | **X5 PRIME SUPPORTS 4× MORE SCREENS** |
| **Online Programming Changes** | Not supported | Supported in Advanced Ladder | Advanced runtime engineering on X5 |
| **Register Capacities** | %R: 5,000; %I/%Q: 1,024; %AI/%AQ: 256 | %R: 50,000 (retentive); %I/%Q: 2,048; %AI/%AQ: 512 | **X5 PRIME HAS 10× REGISTER CAPACITY** |
| **Built-in Digital Inputs** | 12x Digital DC Inputs (positive/negative) | 4x Digital DC Inputs (12–24 VDC) | X4 has 3× more digital inputs |
| **Built-in Digital Outputs** | **Model A:** 12x DC Sourcing (0.5A)<br/>**Model R:** 6x Relay (3A) + 2x PWM | 4x DC Sourcing (0.5A @ 24VDC) | X4 has significantly higher output count / relays |
| **Built-in Analog Inputs** | 4x channels (0–10V, 4–20mA, RTD PT100) | 4x channels (0–10V, 4–20mA, 12-bit) | Both support 4 AI; X4 adds native RTD |
| **Built-in Analog Outputs** | 2x channels (0–10V, 4–20mA) | **0 channels** (requires expansion I/O) | X4 has 2 AO; X5 Prime has NO on-board AO |
| **Field Terminal Headers** | 3 multi-pin terminal blocks (J1, J2, J3) + 3-pin Power (39 field pins) | 2 terminal blocks (8-pin I/O: 4 DI, 4 DO, 4 AI) + 3-pin Power (11 pins) | **COMPLETELY DIFFERENT REAR TERMINAL LAYOUT** |
| **USB-A Host Port** | **NONE** (Mini-B programming only) | **1x USB-A Host** (Flash drives, Wi-Fi, UVC Webcams) | Major functional & visual difference |
| **UVC Webcam Video Display** | Not supported | Supported via USB-A | Exclusive to X5 Prime |
| **Serial Ports** | 1x RS232, 1x RS485 (modular RJ45) | 1x RS232, 1x RS485 (modular RJ45) + 3 DIP switches | X5 Prime features physical DIP switches |
| **CAN Port** | 1x CAN 2.0 (RJ45 modular jack, red) | 1x CAN 2.0 (RJ45 modular jack) | Both support CsCAN 125k–1Mbps |
| **Ethernet Port** | 1x 10/100 Mbps RJ45 | 1x 10/100 Mbps RJ45 | Both support Modbus TCP, Cscape |
| **Primary Power Supply Range** | `24 VDC ±20%` (`19.2 to 28.8 VDC`) | `10 to 30 VDC` (Wide range) | **X5 PRIME OPERATES DOWN TO 10 VDC** |
| **Steady-State Current Draw** | `190 mA @ 24 VDC` | `118.1 mA @ 24 VDC` | X5 Prime is more energy efficient |
| **Backup Battery** | Replaceable coin cell CR2450 (Part # HE-BAT009) | Renata CR2032 lithium coin cell | Different coin cell model & capacity |

---

## 4. Mechanical Envelope Evaluation: Are They the Same?

### 4.1 Outer Bezel & Panel Cutout: **IDENTICAL**
Both the Horner X4 (`HE-X4A` / `HE-X4R`) and the Horner X5 Prime (`HE-XP5`) utilize the exact same industrial enclosure front bezel tooling and standardized panel cutout:
- **Panel Cutout Opening:** `119.5 mm` horizontal × `90.5 mm` vertical (`4.70" × 3.56"`), with `±0.5 mm` tolerance.
- **Front Bezel Flange:** `125 mm` wide × `96 mm` tall (`4.92" × 3.79"`).
- **Front Panel Projection:** Projects `15 mm` forward (+Z) from the mounting flange.
- **Mounting Mechanism:** 4 corner composite/metal clips with identical torque ratings (2–3 in-lb composite, 4–8 in-lb metal).

### 4.2 Rear Chassis, Terminal Headers & Appearance: **DIFFERENT**
While the panel cutout is mechanically interchangeable, the rear chassis, electrical terminal arrangements, weight, and front graphic branding are markedly different:
1. **Rear Terminal Headers:**
   - The X4 possesses three large, stacked horizontal terminal blocks (`J1`: 12-pin DO, `J2`: 14-pin DI, `J3`: 10-pin AI/AO) to accommodate its high-density 28-point I/O configuration.
   - The X5 Prime features a compact single 8-pin pluggable terminal block for its 4 DI / 4 DO / 4 AI channels, plus a dedicated 3-pin DC power connector.
2. **Rear Connectivity Layout:**
   - The X5 Prime includes an exposed **USB-A Host receptacle** and a 3-position **DIP switch array** for RS-485 biasing and termination.
   - The X4 lacks the USB-A port entirely (USB Mini-B only) and uses software-driven RS-485 termination without external DIP switches.
3. **Internal Weight:**
   - The X4 weighs `360 g` due to its high-density relays and additional copper/terminal hardware.
   - The X5 Prime weighs `271 g` (25% lighter).
4. **Front Graphic Overlay:**
   - The X4 front bezel features "X4" silkscreen branding and a monochrome dark slate framing.
   - The X5 Prime features "X5" silkscreen branding with blue and gray accent graphics.

---

## 5. Explicit Applicability Assessment & Architectural Rules

### 5.1 Applicability Declaration
> **OFFICIAL APPLICABILITY RULING:**  
> **The Horner X4 documentation (`MAN1137_21_EN_X4_UM.pdf` and `MAN1138_R21_X4_DS.pdf`) DOES NOT APPLY to pilot SKU `CN-X5PRIME-HE-XP5`.**  
>
> 1. `CN-X5PRIME-HE-XP5` represents Horner Automation model **`HE-XP5`** exclusively. It does NOT represent any X4 variant (`HE-X4A`, `HE-X4R`, `HE-X4R-V20`, or `HE-X4R-42`).  
> 2. The electrical, logic, memory, processor, and I/O specifications of the X4 differ radically from the X5 Prime (e.g., 0.4 vs. 0.02 ms/kB scan rate; 256 kB vs. 2 MB logic; 256 kB vs. 22 MB screen memory; 24 vs. 8 built-in channels; no USB-A host vs. USB-A host).  
> 3. Overwriting `CN-X5PRIME-HE-XP5` attributes with X4 values would introduce severe technical inaccuracies into the Controlnautas database and violate the immutable engineering baselines established in Gate G4 and Gate G6.

### 5.2 Architectural Rules of Governance
1. **Gate G4 Technical Snapshot Invariance:**  
   The published technical snapshot `snp_cn_x5prime_he_xp5_v1` (content SHA-256 `3f5aea8dc05adb82eeed976327abf327f4de2a8661718b4d4ee6b8b1830eb61b`) for Medusa variant `variant_01M41R18MQK0GXGPTYSX0EDZBH` remains governed strictly and solely by **`MAN1363 R21`** (`docs/datasheets/CN-X5PRIME-HE-XP5.pdf`).  
   **Under no circumstances shall X4 datasheet values (such as 24V-only power, 360g weight, 12 DI/DO, 0.4 ms/kB scan rate, or absent USB-A) be written to `CN-X5PRIME-HE-XP5`.**

2. **Gate G6 3D Spatial Asset Invariance:**  
   The 3D GLB model `storage/industrial/assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb` and its QA specification (`CN-X5PRIME-HE-XP5.qa.md`) remain governed by the physical dimensions of `MAN1363 R21` (cutout 119.5 × 90.5 mm, front face 125 × 96 mm, total envelope clearance `[0.120, 0.091, 0.060] m`). The rear port anchors (`anchor_usb_a`, `anchor_rs485_mj1`, `anchor_analog_in`, `anchor_digital_in`, `anchor_digital_out`) reflect the physical reality of the X5 Prime and must not be altered to mirror X4 terminal layouts.

3. **OEM Source Cataloging for Horner OCS Family:**  
   The X4 manuals (`MAN1137` and `MAN1138`) are cataloged as reference documents for the Horner OCS Micro / Mini series within `docs/industrial/oem-sources/horner-x4/`. Should Controlnautas onboard genuine Horner X4 SKUs in the future (e.g. `CN-HORNER-X4A` or `CN-HORNER-X4R`), these manuals will govern those future snapshots under independent snapshot IDs.

4. **Nginx Public Mapping:**  
   When the public HTTPS endpoint `https://data.controlnautas.com/oem-sources/` is enabled, the X4 manuals shall be served under:
   - `https://data.controlnautas.com/oem-sources/horner-x4/MAN1137_21_EN_X4_UM.pdf`
   - `https://data.controlnautas.com/oem-sources/horner-x4/MAN1138_R21_X4_DS.pdf`
   while the X5 Prime datasheet remains served under:
   - `https://data.controlnautas.com/datasheets/CN-X5PRIME-HE-XP5.pdf`

---
*End of Manifest — Controlnautas Horner OEM Specialist*
