# Gate G2: Human Operator Meta Muse Integration Checklist

**Gate ID:** `G2`  
**Target Asset:** `SYN-IND-CTRL-01.glb`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§16 Entrega de archivos a Muse y prueba de capacidades, §33 Gate G2)  
**Status:** `AWAITING_HUMAN_OPERATOR_EXECUTION` (Subagent verification completed locally; requires external Muse account execution)

---

## 1. Executive Summary & Objective

The objective of **Gate G2** is to verify whether Meta Muse can download, ingest, and render an authoritative, external glTF 2.0 binary (`.glb`) asset without reconstructing, hallucinating, or replacing the model with procedural primitives.

Because the automated subagent environment cannot authenticate into external proprietary Meta Muse client workspaces, this test must be executed by a human operator with active Muse credentials. This checklist provides unambiguous instructions, exact copy-paste prompts, verification rubrics, and the response capture format.

---

## 2. Pre-Requisites & Asset Endpoints

Before initiating the test in Meta Muse, verify the following prerequisites:

1. **Active Meta Muse Session:** Log in to your Meta Muse workspace with valid account credentials.
2. **Asset Integrity Proof (Local Source):**
   - **Local Path:** `docs/industrial/assets/SYN-IND-CTRL-01.glb`
   - **Local Storage Path:** `b2b-backend/storage/industrial-assets/SYN-IND-CTRL-01.glb`
   - **File Size:** `2,296 bytes`
   - **File Magic:** `glTF` (glTF 2.0 binary)
   - **SHA-256 Checksum:** `ae51669a603c28ef8d031bf7b0d11e847c35593e8e4f3b47e3b5a89f8dbbb438`
3. **Delivery URLs:**
   - **Production Target (Public HTTPS):**  
     `https://data.controlnautas.com/industrial-assets/ae51669a603c28ef8d031bf7b0d11e847c35593e8e4f3b47e3b5a89f8dbbb438/SYN-IND-CTRL-01.glb`  
     *(Note: Production host DNS/TLS certificate provisioning is currently in progress).*
   - **Staging / Local Tunnel (HTTP):**  
     `http://127.0.0.1:9000/industrial-assets/ae51669a603c28ef8d031bf7b0d11e847c35593e8e4f3b47e3b5a89f8dbbb438/SYN-IND-CTRL-01.glb`  
     *(If running from a browser or VM outside localhost, use your public tunnel/ngrok or EC2 public DNS forwarding port 9000).*

---

## 3. Step-by-Step Operator Instructions

### Step 1: Open Meta Muse Session
Open your Meta Muse chat or 3D tool workspace. Start a fresh conversation to avoid prompt bleeding from earlier sessions.

### Step 2: Request Direct Model Import
Issue the following primary prompt to Meta Muse to download and ingest the synthetic controller:

```text
Import the 3D model from https://data.controlnautas.com/industrial-assets/ae51669a603c28ef8d031bf7b0d11e847c35593e8e4f3b47e3b5a89f8dbbb438/SYN-IND-CTRL-01.glb (or staging endpoint http://127.0.0.1:9000/industrial-assets/ae51669a603c28ef8d031bf7b0d11e847c35593e8e4f3b47e3b5a89f8dbbb438/SYN-IND-CTRL-01.glb).
Do not substitute or regenerate this model using procedural shapes or code. Load the actual glTF 2.0 binary asset from the URL and confirm its dimensions, coordinate orientation, and scene hierarchy.
```

### Step 3: Inspect Scale & Bounding Dimensions
Confirm that the model geometry adheres strictly to industrial metric units (meters) and nominal enclosure dimensions:

- **Prompt to Muse:**
  ```text
  What are the exact bounding box dimensions (width X, height Y, depth Z) of the imported controller model in meters and millimeters? Please contrast it against a standard 100mm reference ruler.
  ```

- **Expected Nominal Scale:**
  | Dimension | Metric (Meters) | Metric (Millimeters) | Coordinate Axis |
  |---|---|---|---|
  | **Width** | `0.10 m` | `100 mm` | Along X-axis (`-0.05m` to `+0.05m`) |
  | **Height** | `0.08 m` | `80 mm` | Along Y-axis (`0.00m` to `+0.08m`) |
  | **Depth** | `0.05 m` | `50 mm` | Along Z-axis (`0.00m` to `+0.05m`) |

- **Expected Coordinate Frame:**
  - **Handedness:** Right-handed coordinate system.
  - **Vertical (+Y):** Points upward.
  - **Forward (+Z):** Points frontward (facing the user / front operator display).
  - **Origin / Rear Mount (Z = 0):** Back face where the DIN rail mount sits.

### Step 4: Verify Scene Graph & Attachment Anchors
The model contains 4 discrete named transform nodes for mounting and physical wiring. Verify that Muse detects these nodes in the glTF hierarchy:

- **Prompt to Muse:**
  ```text
  List all named nodes, empty transforms, or attachment anchors present in the scene graph of the imported model. Check specifically for the presence of:
  1. anchor_mounting_din_center
  2. anchor_terminal_power
  3. anchor_terminal_sensor
  4. anchor_display_center
  Report their exact local translation vectors [x, y, z].
  ```

- **Expected Anchor Coordinates Table:**
  | Anchor Identifier | Expected Translation `[x, y, z]` (m) | Semantic Function |
  |---|---|---|
  | `anchor_mounting_din_center` | `[0.0, 0.04, 0.0]` | Center of DIN rail mounting bracket on rear face |
  | `anchor_terminal_power` | `[-0.03, 0.08, 0.02]` | High-voltage supply input terminals (top edge) |
  | `anchor_terminal_sensor` | `[0.03, 0.00, 0.02]` | Low-voltage analog RTD/sensor input terminals (bottom edge) |
  | `anchor_display_center` | `[0.0, 0.04, 0.05]` | Center point of the front digital operator display |

### Step 5: Verify Identity & Anti-Hallucination
Check that Meta Muse actually imported the binary asset rather than synthesising a generic block:

1. **Mesh Name:** Node 0 should be named `SYN-IND-CTRL-01_Body` referencing mesh `SYN-IND-CTRL-01_Mesh`.
2. **Material Name:** Material must match `IndustrialEnclosurePBR` (metallic: 0.1, roughness: 0.6).
3. **Vertex / Primitive Count:** Exactly 12 triangles (24 vertices with split normals for sharp cube corners).
4. **Credential Isolation Check:** Inspect the client runtime / network inspector. Verify that no `Authorization: Bearer` token is passed in query parameters, client HTML embeds, or script tags. Binary asset delivery is public and content-addressed (`/industrial-assets/{sha256}/...`).

---

## 4. Operator Verification Rubric

| Verification Item | Acceptance Criteria | Pass / Fail |
|---|---|---|
| **Network Fetch** | Muse successfully downloads the `.glb` file via HTTP GET with 200/206 status and `Content-Type: model/gltf-binary`. | [ ] |
| **Model Import** | Muse imports the binary glTF without throwing unhandled parsing or memory errors. | [ ] |
| **Dimensional Scale** | Envelope measures exactly `100mm × 80mm × 50mm` (`0.10m × 0.08m × 0.05m`). Scale is `[1, 1, 1]`. | [ ] |
| **Coordinate Orientation** | Coordinate system is +Y Up, +Z Forward. Front display faces +Z. | [ ] |
| **Anchor Preservation** | All 4 anchors (`anchor_mounting_din_center`, `anchor_terminal_power`, `anchor_terminal_sensor`, `anchor_display_center`) are detected at exact coordinates. | [ ] |
| **Identity Preservation** | Scene graph preserves node names (`SYN-IND-CTRL-01_Body`, `IndustrialEnclosurePBR`). No synthetic hallucination. | [ ] |
| **Security & Privacy** | Public asset URL requires zero credentials. Bearer tokens remain strictly isolated to the M2M conector. | [ ] |

---

## 5. How to Report Results Back to the Engineering Team

Upon completing the verification in Meta Muse, record the observed outcomes and update `docs/industrial/muse-capability-report.json`:

```json
{
  "gate": "G2",
  "operator": "<OPERATOR_NAME_OR_HANDLE>",
  "timestamp": "YYYY-MM-DDTHH:MM:SSZ",
  "muse_import_status": "verified_pass",
  "scale_observation": {
    "status": "verified_exact",
    "observed_dimensions_mm": {
      "width": 100,
      "height": 80,
      "depth": 50
    },
    "coordinate_system": "right_handed_y_up_z_forward"
  },
  "anchors_detected": [
    "anchor_mounting_din_center",
    "anchor_terminal_power",
    "anchor_terminal_sensor",
    "anchor_display_center"
  ],
  "runtime_environment": "meta_muse_client_v2",
  "notes": "Model imported cleanly; bounding box matches 100x80x50mm; all 4 anchors positioned accurately."
}
```

Notify the team or subagent coordinating Gate G2 with the updated status. If Meta Muse is unable to import the external binary GLB or substitutes procedural primitives, report `muse_import_status: "unsupported_external_import"` to trigger the approved fallback pathway (documentary 2D representation / illustrative labeling without claiming dimensional accuracy, as governed by MEGAPLAN §16.5).

---

## 6. Gate G6 Real Pilot Assets Extension

Following Gate G2 synthetic asset verification, Gate G6 has produced authoritative 3D GLB assets for the **3 real pilot SKUs** (`CN-X5PRIME-HE-XP5`, `CN-N1200`, and `CN-THT02`).

For complete instructions, direct download URLs, and verification rubrics for the real pilot assets, consult:
- **`docs/industrial/g6-operator-muse-checklist.md`**: Human Operator Meta Muse Integration Checklist for Real Pilot Assets.
- **`docs/industrial/g6-asset-qa-report.md`**: Comprehensive Gate G6 3D Asset Engineering QA Audit Report.

