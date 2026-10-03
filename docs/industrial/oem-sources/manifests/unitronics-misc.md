# OEM Source Manifest & Analysis: Unitronics / Miscellaneous Drop

**Manifest Document:** `docs/industrial/oem-sources/manifests/unitronics-misc.md`  
**Author:** TZone & Unitronics OEM Specialist Subagent  
**Date:** 2026-10-03  
**Governing Architecture:** Controlnautas Industrial Technical Catalog & MUSE Spatial 3D Pipeline  
**Catalog Binding Status:** `out_of_scope` (Unbound non-pilot equipment; **NO FAKE SKUs CREATED**)

---

## 1. Document Cryptographic Ledger & File Discovery

During the operator OEM documentation drop, two files were deposited in `docs/industrial/oem-sources/unitronics-or-misc/`:

| Property | Source Document 1 (`U_PumpHouse_Install.pdf`) | Source Document 2 (`U_WEB.pdf`) |
|---|---|---|
| **Filesystem Path** | `docs/industrial/oem-sources/unitronics-or-misc/U_PumpHouse_Install.pdf` | `docs/industrial/oem-sources/unitronics-or-misc/U_WEB.pdf` |
| **Public HTTPS URL** | `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_PumpHouse_Install.pdf` | `https://data.controlnautas.com/oem-sources/unitronics-or-misc/U_WEB.pdf` |
| **Document Title (PDF Metadata)** | `U_PumpHouse_WEB` | `U_WEB` |
| **Document Code / Part ID** | Item `#66661`, Drawing `4-08-244`, `Rev. 2.27.18` | Engineering Specifications Sheet |
| **Authoring Software** | Adobe Illustrator 28.3 (Windows), Adobe PDF Library 17.0 | Adobe Illustrator 29.8 (Windows), Adobe PDF Library 17.0 |
| **Creation Date** | 2024-04-08 11:26:45 -07:00 | 2026-02-16 12:17:45 -07:00 |
| **Modification Date** | 2026-02-16 12:23:11 -08:00 | 2026-02-16 12:17:56 -08:00 |
| **Page Count** | 4 pages | 1 page |
| **Byte Size** | 799,195 bytes | 731,152 bytes |
| **SHA-256 Hash** | `192542c508cae7a0fec7ad0fddd89c7a7a75861817b9e85013ed3ad9b1a93059` | `7a0517e6f5bc7e6427236436b829412e82da38ac7ac935d39250518e39dc4ce9` |

---

## 2. Forensic Manufacturer & Hardware Identification

### 2.1 The "Unitronics" Misclassification De-Anonymized
Initial directory naming suggested these documents might represent Israeli PLC manufacturer **Unitronics** (e.g. UniStream, Vision, Samba series controllers). 

Forensic textual and blueprint extraction conclusively reveals that **neither document contains any relation to Unitronics or industrial automation PLCs**. The `"U_"` prefix in the filename refers strictly to the **"U Series" product line** of commercial/industrial freeze-protection radiant heaters:

* **True Manufacturer:** **King Electrical Mfg. Company**  
  * Headquarters: 9131 10th Ave S, Seattle, WA 98108, USA  
  * Phone: (206) 762-0400 | Web: `www.king-electric.com`
* **Product Line:** **Pumphouse Heater U Series** (Radiant & Convection Freeze Protection Space Heater)
* **Standard Specification Excerpt (`U_WEB.pdf` p. 1):**
  > *"Contractor shall supply and install U Pump House series radiant heaters manufactured by King Electrical Mfg. Company. Heaters shall be of the wattage and voltage as indicated on the plans."*

### 2.2 Model Numbers & Technical Matrix

The U Series pumphouse heaters are available in standard 120 V and triple-rated 240 V / 208 V / 120 V variants:

| Model Number | UPC Code | Nominal Voltage (VAC) | Nominal Power (Watts) | Operational Current (Amps) | Shipping Weight | Enclosure Option |
|---|---|---|---|---|---|---|
| **`U1250`** | `12605` | 120 V (1-phase) | 500 W | 4.17 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U1275`** | `12606` | 120 V (1-phase) | 750 W | 6.25 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U12100`** | `12609` | 120 V (1-phase) | 1000 W | 8.33 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U2425`** | `12612` | 240 / 208 / 120 V* | 250 / 187 / 62 W | 1.04 / 0.90 / 0.52 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U2450`** | `12615` | 240 / 208 / 120 V* | 500 / 375 / 125 W | 2.08 / 1.80 / 1.04 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U2475`** | `12618` | 240 / 208 / 120 V* | 750 / 563 / 187 W | 3.13 / 2.71 / 1.56 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |
| **`U24100`** | `12621` | 240 / 208 / 120 V* | 1000 / 750 / 250 W | 4.17 / 3.61 / 2.08 A | 4.0 lbs (1.81 kg) | Gray Enamel / 304 SS (`-SS`) |

*\*Triple-rated 240V heaters draw 13% less current and 25% less wattage when operated at 208V, and draw 50% less current and 75% less wattage when operated at 120V.*

### 2.3 Physical Construction & Dimensions (Drawing `4-08-244`)
From the engineering blueprint in `U_WEB.pdf`:
* **Overall Dimensions (with mounting brackets):**
  * Width: `17" (431.8 mm)` (Body width: `16 1/4" / 412.8 mm`)
  * Height: `6 1/4" (158.8 mm)` (Body height: `5 5/8" / 142.9 mm`)
  * Depth: `3 1/8" (79.4 mm)` (Junction box depth: `3 1/2" / 88.9 mm`)
* **Mounting Holes:**
  * 4 slotted mounting holes of diameter `3/16" (4.76 mm)`, spaced `16 1/4" (412.8 mm)` horizontally by `5 1/16" (128.6 mm)` vertically.
* **Electrical Conduit Entry:**
  * `7/8" (22.2 mm)` knockout on junction box for 1/2" trade conduit connection.
* **Materials of Construction:**
  * Enclosure: 20-gauge electrogalvanized steel with baked enamel finish (standard gray) or optional 20-gauge 304 stainless steel (`-SS` suffix) for corrosive environments.
  * Fasteners: Solid mechanical rivets (no spot welds, eliminating heat-affected corrosion zones).
  * Heating Element: Corrosion-resistant **Incoloy 840 superalloy** tubular element protected by a heavy-gauge steel perimeter guard.
  * Internal Thermostat: Integrated snap-action mechanical thermostat with freeze-protection dial: `40 °F to 90 °F` (`4.4 °C to 32.2 °C`).
  * Safety Thermal Cutout: Full-length capillary tube along the element providing over-temperature protection with automatic reset.
  * Certifications: ETLus listed for damp locations; meets ASSE-1060 requirements for freeze-protection equipment enclosures.

### 2.4 Installation Clearances & Operating Rules (`U_PumpHouse_Install.pdf`)
* **Mounting Positions:**
  * Horizontal orientation: Approved for full rated wattage (up to 1,000 W).
  * Vertical orientation: Permitted ONLY up to 500 W (`U1250`, `U2425`, `U2450`).
  * **CRITICAL SAFETY RESTRICTION:** Unit **CANNOT be installed vertically with the thermostat located at the top**.
* **Electrical Termination:**
  * Field wiring connects directly to factory pigtails inside the side junction box.

---

## 3. Scope Evaluation Against Pilot Heating Chamber Architecture

### 3.1 Mapping Analysis Against Controlnautas Pilot SKUs

| Pilot Role | Required Architecture & Signal | King Electric U-Series Pumphouse Heater | Mapping Result |
|---|---|---|---|
| **Supervisory Controller / HMI** | PLC/HMI with RS-485 Modbus Master (`CN-X5PRIME-HE-XP5`) | None. Device is an electro-mechanical resistance space heater without CPU, logic, or comms. | **INCOMPATIBLE** |
| **Primary Process PID Controller** | 1/16 DIN Closed-loop PID controller with sensor input (`CN-N1200`) | None. Device is a space heater with an autonomous mechanical bimetallic thermostat. | **INCOMPATIBLE** |
| **Chamber Temp / Humidity Sensor** | RS-485 Modbus RTU environmental digital probe (`CN-THT02`) | None. Device contains no digital sensors or telemetry interfaces. | **INCOMPATIBLE** |
| **Heating Chamber Process Heater** | Modulated heating element driven via SSR/contactor by PID controller | Device has an internal un-bypassed thermostat and is packaged for ambient room freeze protection, not process air heating. | **DOES NOT MEET** |

### 3.2 Catalog Integrity Policy Enforcement
Under MEGAPLAN §9.3, §10.1, and the Controlnautas Determinism Doctrine:
1. **No Fake SKUs:** The system strictly prohibits synthesizing placeholder or speculative SKUs for uncataloged OEM documentation drops.
2. **Missing Roles Doctrine:** In the Heating Chamber pilot, power actuators (`power_switching_interface` / SSR) and heating elements (`heating_element`) remain explicitly classified as `unlabeled generic missing_roles` until formal operator procurement.
3. **Verdict:** `U_PumpHouse_Install.pdf` and `U_WEB.pdf` are categorized as **`out_of_scope`**. They are recorded in the manifest repository for operator documentation completeness, but **NO catalog technical profile, Medusa product, or 3D GLB model shall be generated**.

---

## 4. Archival Summary

* **Manufacturer:** King Electrical Mfg. Company (Seattle, WA)
* **Equipment Classification:** Commercial Electric Space / Freeze-Protection Heater
* **Audit Status:** `out_of_scope_unbound`
* **Pilot SKU Binding:** `null`
* **Edge Nginx Alias:** Preserved under `https://data.controlnautas.com/oem-sources/unitronics-or-misc/` for provenance verification.
