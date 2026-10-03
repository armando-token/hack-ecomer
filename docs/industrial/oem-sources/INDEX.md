# OEM source drop (operator upload 2026-10-03)

Absolute root on EC2:
`/home/ec2-user/projects/hack-ecomer/docs/industrial/oem-sources/`

| File | SHA-256 | Likely product | Maps to pilot SKU? |
|---|---|---|---|
| `horner-x4/MAN1137_21_EN_X4_UM.pdf` | `35c647aa6b1d8595a7f674e0d203ad77023a27d7ee8fd70c83e1bb3f53d0f649` | Horner **X4** User Manual | **NOT** CN-X5PRIME-HE-XP5 unless operator confirms X4≡variant; do not overwrite X5 dims blindly |
| `horner-x4/MAN1138_R21_X4_DS.pdf` | `7885574524f1c23cd687a442beb690f45142420913b2684dd464293aa3878f40` | Horner **X4** Datasheet | same caution |
| `tzone-tht02/THT02_users_manual_v1.1.pdf` | `48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c` | TZone THT-02 Temp/RH Sensor | **YES → CN-THT02** (140x16mm cylindrical probe format reconciled) |
| `unitronics-or-misc/U_PumpHouse_Install.pdf` | `192542c508cae7a0fec7ad0fddd89c7a7a75861817b9e85013ed3ad9b1a93059` | King Electrical U-Series Pumphouse Heater | **NO (out_of_scope)** — Freeze protection space heater, not Unitronics PLC |
| `unitronics-or-misc/U_WEB.pdf` | `7a0517e6f5bc7e6427236436b829412e82da38ac7ac935d39250518e39dc4ce9` | King Electrical U-Series Heater Spec Sheet | **NO (out_of_scope)** — Engineering spec for space heater |

Already on host (prior catalog) — also use for dimensions:
- `docs/datasheets/CN-X5PRIME-HE-XP5.pdf`
- `docs/datasheets/CN-N1200.pdf`
- `docs/datasheets/CN-THT02.pdf`

Public HTTPS for Muse (to be enabled by next gate): prefer
`https://data.controlnautas.com/oem-sources/...` after nginx alias.

Manifests & OEM Assessments:
- `manifests/horner-x4-x5.md` (Horner X4 vs X5 Prime formal comparison and applicability assessment)
- `manifests/tzone-tht02.md` (TZone THT-02 probe dimensions, DIP switches, wiring, and G4/G6 envelope reconciliation)
- `manifests/unitronics-misc.md` (Forensic analysis identifying King Electrical U-Series space heater; out_of_scope binding)
- `manifests/novus-n1200.md` (NOVUS N1200 1/16 DIN dimensions, cutout, 18-terminal layout, and G4/G6 verification)
- `manifests/oem-sources-manifest.json` (Machine-readable inventory of OEM source documents)
