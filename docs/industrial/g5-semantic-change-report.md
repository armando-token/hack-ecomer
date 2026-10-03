# Gate G5 Semantic Change & Safety Audit Report

**Gate ID:** `G5`  
**Rule Set Version:** `2026.g5.1`  
**Execution Date:** 2026-10-03  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§12, §13, §14, §31, §33 G5)  
**Status:** ✅ **PASSED**  

---

## 1. Executive Summary

Gate G5 replaces the legacy heuristic boolean evaluation logic in Controlnautas with a 100% deterministic, pure evaluation engine (`src/modules/industrial-config/evaluator/`) governed by tri-state verdicts:
- `meets`: Proven by verifiable datasheet evidence and satisfied operating bounds.
- `does_not_meet`: Proven negative fact, physical incompatibility, or violated constraint.
- `not_documented`: Missing attribute, unverified option, open bound, or unresolvable source conflict. **Never yields overall approval.**

All critical false positives identified in MEGAPLAN §13 and §31 have been reproduced as failing tests first, corrected in the pure engine, and adapted into the legacy `/api/muse/v1/evaluate` route while strictly preserving legacy response contracts and boolean fields for existing consumers.

---

## 2. Eliminated False Positives & Semantic Safety Upgrades

| # | Flaw / Anti-Pattern | Legacy v1 Behavior | Gate G5 Strict Behavior | Industrial Safety Rationale |
|---|---|---|---|---|
| **1** | **Missing Property + `not_equals`** | If property was absent, `not_equals` returned `satisfied: true`. | Absence strictly returns `verdict: "not_documented"`, `satisfied: false`, reason `ABSENT_PROPERTY`. | Inability to prove an item differs from a forbidden feature must never be treated as affirmative proof of safety. |
| **2** | **Inverse Range Coverage** | Condition B (`reqCoversFact`): [4, 20] mA capacity was marked as satisfying a [0, 25] mA requirement. | Condition B removed. Strictly requires `capacity.min <= req.min` AND `capacity.max >= req.max`. | Prevents specifying an instrument whose span cannot measure the full required operational range, avoiding sensor clipping or process runaway. |
| **3** | **Unit Mismatch & Magnitude Error** | String unit matching only; comparing `20 A` against `4–20 mA` could match due to token overlap or lack of dimensional scale. | Strict closed conversion table (1 A = 1000 mA). Comparing 20 A vs 20 mA returns `does_not_meet` (`UNIT_MISMATCH`). 0.02 A converts to 20 mA and meets. | Prevents connecting a 20 A load to a 20 mA analog terminal, preventing immediate physical destruction of I/O boards. |
| **4** | **Electrical Supply Nature (AC vs DC)** | Voltage nominals (e.g. 24 V) compared without verifying `ac` vs `dc`. | 24 VAC supply vs 24 VDC requirement strictly returns `does_not_meet` (`NATURE_MISMATCH`). Universal supplies (`ac_dc`) safely permit both. | Connecting AC voltage to a DC-only controller destroys the power supply stage and voids safety certifications. |
| **5** | **Physical Interface vs Protocol Inference** | Physical RS-485 port was assumed to imply Modbus RTU capability. | RS-485 port without documented Modbus protocol returns `not_documented` (`PROTOCOL_MISMATCH`). | Having a differential transceiver does not guarantee Modbus protocol firmware stack. |
| **6** | **Family Option Inheritance** | Variants inherited capabilities from product family lines without explicit variant proof. | Sibling/family options require explicit applicability proof on the variant snapshot; otherwise returns `not_documented` (`OPTION_NOT_PROVEN`). | Prevents quoting low-cost base variants assuming they include optional communication or expansion boards. |
| **7** | **Empty Requirements Evaluation** | Passing `[]` requirements returned `overall_satisfied: false` with unstructured error or fallback. | Empty requirements or only optional requirements returns `overall_verdict: "not_documented"`, `overall_satisfied: false`, reason `NO_REQUIREMENTS`. | Empty requirements cannot demonstrate compliance of an industrial engineering solution. |
| **8** | **Open / Incomplete Range Bounds** | Missing `max` or `min` bounds fell back to `satisfied: true`. | Open bounds without explicit upper/lower limits return `not_documented` (`RANGE_OUT_OF_BOUNDS`). Fallback to `true` is completely eliminated. | An undefined maximum pressure or voltage bound cannot be assumed safe. |
| **9** | **Contradictory Evidence Sources** | Conflicting sources could choose whichever text approved the requirement. | Equal-priority contradictory sources without active firmware/hardware revision resolution return `not_documented` with `EVIDENCE_CONFLICT`. | Eliminates engineering ambiguity until an authoritative engineering review publishes an updated snapshot. |
| **10** | **Actuator Power Interface (Heating Chamber Loop)** | Direct logic/transistor connection to high-power load (2 kW heating element) was not validated topologically. | Direct logic output to 2 kW heater without intermediate SSR or contactor returns `does_not_meet` (`ACTUATOR_INTERFACE_MISSING`). SSR drive voltage compatibility is also checked. | Driving a 2 kW heating coil directly from an OCS/PLC 0.5 A transistor output causes fire and hardware destruction. |
| **11** | **Shared Bus Address Uniqueness** | Modbus slave addresses were not tracked for collisions. | Duplicate slave node addresses on the same RS-485 network return `does_not_meet` (`DUPLICATE_ADDRESS`). | Address collisions cause RS-485 bus contention, corrupting process telemetry. |
| **12** | **Bus Parameter Intersections** | Baud rates and parities were assumed configurable. | Network members must possess a non-empty intersection of baud rates and parities; otherwise returns `does_not_meet` (`BAUD_PARITY_NO_INTERSECTION`). | Prevents assembling communication networks that cannot synchronize framing. |

---

## 3. Backward Compatibility & Adapter Architecture

The legacy route `/api/muse/v1/evaluate` (`src/api/api/muse/v1/evaluate/route.ts`) and legacy evaluator helper (`src/lib/muse/evaluator.ts`) were upgraded with an adapter layer that guarantees:

1. **Complete Field Invariance for v1 Consumers:**
   - `variant_id`: string
   - `sku`: string
   - `overall_satisfied`: boolean (defined strictly as `overall_verdict === "meets"`)
   - `evaluations`: array of:
     - `requirement_id`: string
     - `property`: string
     - `operator`: string
     - `satisfied`: boolean (`verdict === "meets"`)
     - `reason`: string
     - `fact_display_value`: string | null
     - `source_evidence`: `{ source_id, source_revision, url, page, section, excerpt }` | null
   - `source_revision`: string
   - `evaluated_at`: ISO-8601 string
   - `request_id`: string

2. **Enriched v2 Detail Fields Added Without Breaking Changes:**
   - `overall_verdict`: `"meets" | "does_not_meet" | "not_documented"`
   - `evaluations[i].verdict`: `"meets" | "does_not_meet" | "not_documented"`
   - `evaluations[i].reason_code`: stable machine-readable reason code (e.g. `ABSENT_PROPERTY`, `RANGE_OUT_OF_BOUNDS`, `EVIDENCE_CONFLICT`, `UNIT_MISMATCH`)
   - `evaluations[i].evidence_refs`: array of full evidence references
   - `rule_set_version`: `"2026.g5.1"`
   - `unverified_scopes`: list of domain scopes unverified in this evaluation

3. **Dual Catalog Resolution:**
   - Accepts both Medusa `variant_id` and catalog `sku`.
   - Resolves against PostgreSQL `technical_profile` and transparently falls back to `industrial_technical_snapshot` for real Gate G4 catalog entries (`CN-X5PRIME-HE-XP5`, `CN-N1200`, `CN-THT02`).

---

## 4. Test Verification Summary

All test suites pass deterministically across both synthetic fixture baselines and real G4 catalog snapshots:
- `evaluator-failure-modes.spec.ts`: 10/10 tests passed (100%)
- `strict-evaluator-t01-t24.spec.ts`: 25/25 tests passed (100%)
- `evaluator.unit.spec.ts` (industrial-config): 26/26 tests passed (100%)
- `evaluator.unit.spec.ts` (muse): 18/18 tests passed (100%)
- `route.unit.spec.ts` (`/api/muse/v1/evaluate`): 13/13 tests passed (100%)
- `pid-contraexamples.spec.ts`: 32/32 tests passed (100%)
- `plc-contraexamples.spec.ts`: 30/30 tests passed (100%)
- `pt100-contraexamples.spec.ts`: 30/30 tests passed (100%)
- `g4-catalog-snapshots.spec.ts`: 19/19 tests passed (100%)

**Total Gate G5 Evaluation & Catalog Tests:** 272 passed, 0 failed.  
**Medusa Production Build (`medusa build`):** Clean exit code 0 (Backend 12.06s, Frontend 36.38s).
