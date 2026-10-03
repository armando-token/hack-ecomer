#!/usr/bin/env python3
"""
Generate Mathematically Precise glTF 2.0 / GLB Asset for SYN-IND-CTRL-01.
Governing Doc: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G2).

Device: Synthetic Industrial Heating Controller (SYN-IND-CTRL-01)
Units: EXACTLY METERS (100 mm x 80 mm x 50 mm -> [0.10, 0.08, 0.05] m).
Coordinate System: Right-handed, +Y UP, +Z FORWARD.
Zero External Dependencies: Pure Python 3 standard library (struct, json, hashlib, os, sys).
Zero glTF extensions required (NO Draco, NO Meshopt, NO KTX2) for 100% universal compatibility.
"""

import sys
import os
import json
import struct
import hashlib
from datetime import datetime, timezone

# -----------------------------------------------------------------------------
# Geometric Constants and Specifications
# -----------------------------------------------------------------------------
DEVICE_ID = "SYN-IND-CTRL-01"
MANIFEST_ASSET_ID = "ast_syn_ctrl_01_v1"
VARIANT_ID = "variant_SYN_CTRL_01"

# Bounding box limits in meters
BBOX_MIN = [-0.050, 0.000, -0.025]
BBOX_MAX = [0.050, 0.080, 0.025]
BBOX_SIZE = [0.100, 0.080, 0.050]

# Explicit Anchor specifications (exact meter translations)
ANCHORS = [
    {
        "name": "anchor_mounting_din_center",
        "type": "mounting_din",
        "position": [0.0, 0.04, -0.025],
        "orientation": [0.0, 0.0, 0.0, 1.0],
        "description": "DIN EN 50022 TS 35 rail mounting center",
        "port_id": "din_rail_mount"
    },
    {
        "name": "anchor_terminal_power",
        "type": "terminal_power",
        "position": [-0.03, 0.08, 0.0],
        "orientation": [0.0, 0.0, 0.0, 1.0],
        "description": "24V DC power supply input terminal block",
        "port_id": "pwr_in"
    },
    {
        "name": "anchor_terminal_sensor",
        "type": "terminal_sensor",
        "position": [0.03, 0.0, 0.0],
        "orientation": [0.0, 0.0, 0.0, 1.0],
        "description": "PT100 RTD sensor input terminal block",
        "port_id": "sensor_in"
    },
    {
        "name": "anchor_display_center",
        "type": "display_center",
        "position": [0.0, 0.04, 0.025],
        "orientation": [0.0, 0.0, 0.0, 1.0],
        "description": "Front optical display & HMI center face",
        "port_id": "hmi_display"
    }
]


# -----------------------------------------------------------------------------
# Mesh Geometry Construction Helpers
# -----------------------------------------------------------------------------
class MeshBuilder:
    """Helper to construct 3D geometric boxes and features with normals and indices."""

    def __init__(self, name, material_index):
        self.name = name
        self.material_index = material_index
        self.vertices = []  # Flat list of floats [x, y, z, ...]
        self.normals = []   # Flat list of floats [nx, ny, nz, ...]
        self.indices = []   # Flat list of uint16 indices
        self.vertex_count = 0

    def add_box(self, x0, y0, z0, x1, y1, z1):
        """
        Add an axis-aligned box between (x0, y0, z0) and (x1, y1, z1).
        All faces are triangulated with CCW outward winding and proper normals.
        """
        min_x, max_x = min(x0, x1), max(x0, x1)
        min_y, max_y = min(y0, y1), max(y0, y1)
        min_z, max_z = min(z0, z1), max(z0, z1)

        # 6 faces: (normal, [v0, v1, v2, v3]) in CCW order looking from outside
        faces = [
            # +Z (Front)
            ((0.0, 0.0, 1.0), [
                (min_x, min_y, max_z),
                (max_x, min_y, max_z),
                (max_x, max_y, max_z),
                (min_x, max_y, max_z),
            ]),
            # -Z (Back)
            ((0.0, 0.0, -1.0), [
                (max_x, min_y, min_z),
                (min_x, min_y, min_z),
                (min_x, max_y, min_z),
                (max_x, max_y, min_z),
            ]),
            # +X (Right)
            ((1.0, 0.0, 0.0), [
                (max_x, min_y, max_z),
                (max_x, min_y, min_z),
                (max_x, max_y, min_z),
                (max_x, max_y, max_z),
            ]),
            # -X (Left)
            ((-1.0, 0.0, 0.0), [
                (min_x, min_y, min_z),
                (min_x, min_y, max_z),
                (min_x, max_y, max_z),
                (min_x, max_y, min_z),
            ]),
            # +Y (Top)
            ((0.0, 1.0, 0.0), [
                (min_x, max_y, max_z),
                (max_x, max_y, max_z),
                (max_x, max_y, min_z),
                (min_x, max_y, min_z),
            ]),
            # -Y (Bottom)
            ((0.0, -1.0, 0.0), [
                (min_x, min_y, min_z),
                (max_x, min_y, min_z),
                (max_x, min_y, max_z),
                (min_x, min_y, max_z),
            ]),
        ]

        for (nx, ny, nz), quad in faces:
            base_idx = self.vertex_count
            for vx, vy, vz in quad:
                self.vertices.extend([round(vx, 6), round(vy, 6), round(vz, 6)])
                self.normals.extend([nx, ny, nz])
                self.vertex_count += 1

            # 2 triangles per quad: (0, 1, 2) and (0, 2, 3)
            self.indices.extend([
                base_idx + 0, base_idx + 1, base_idx + 2,
                base_idx + 0, base_idx + 2, base_idx + 3
            ])


def build_synthetic_controller_geometry():
    """
    Construct all 3D mesh components for SYN-IND-CTRL-01.
    Returns list of MeshBuilder objects.
    """
    # -------------------------------------------------------------------------
    # 1. Main Enclosure Body (Dark Gray Anthracite PBR)
    # Material Index 0
    # -------------------------------------------------------------------------
    mb_body = MeshBuilder("Enclosure_Body", material_index=0)

    # Central core housing
    mb_body.add_box(-0.048, 0.010, -0.016, 0.048, 0.070, 0.022)

    # Left outer casing wall (reaches exact X = -0.050)
    mb_body.add_box(-0.050, 0.005, -0.022, -0.048, 0.075, 0.022)

    # Right outer casing wall (reaches exact X = +0.050)
    mb_body.add_box(0.048, 0.005, -0.022, 0.050, 0.075, 0.022)

    # Left side ventilation / cooling ribs (3 horizontal ribs)
    mb_body.add_box(-0.050, 0.025, -0.015, -0.048, 0.029, 0.015)
    mb_body.add_box(-0.050, 0.038, -0.015, -0.048, 0.042, 0.015)
    mb_body.add_box(-0.050, 0.051, -0.015, -0.048, 0.055, 0.015)

    # Right side ventilation / cooling ribs (3 horizontal ribs)
    mb_body.add_box(0.048, 0.025, -0.015, 0.050, 0.029, 0.015)
    mb_body.add_box(0.048, 0.038, -0.015, 0.050, 0.042, 0.015)
    mb_body.add_box(0.048, 0.051, -0.015, 0.050, 0.055, 0.015)

    # Rear Upper Shoulder (above 35mm DIN rail channel, reaches exact Z = -0.025)
    mb_body.add_box(-0.050, 0.0575, -0.025, 0.050, 0.078, -0.016)

    # Rear Lower Shoulder (below 35mm DIN rail channel, reaches exact Z = -0.025)
    mb_body.add_box(-0.050, 0.002, -0.025, 0.050, 0.0225, -0.016)

    # DIN rail channel upper locking flange (standard TS 35 profile ledge)
    mb_body.add_box(-0.048, 0.055, -0.022, 0.048, 0.0575, -0.016)

    # Front panel bezel border framing the face
    mb_body.add_box(-0.046, 0.012, 0.022, 0.046, 0.068, 0.024)

    # Display bezel surround (framing the recessed display window)
    mb_body.add_box(-0.036, 0.054, 0.023, 0.036, 0.058, 0.0248)  # top bezel
    mb_body.add_box(-0.036, 0.022, 0.023, 0.036, 0.026, 0.0248)  # bottom bezel
    mb_body.add_box(-0.036, 0.026, 0.023, -0.032, 0.054, 0.0248) # left bezel
    mb_body.add_box(0.032, 0.026, 0.023, 0.036, 0.054, 0.0248)  # right bezel

    # -------------------------------------------------------------------------
    # 2. Top Terminal Block (Power - Signal Orange PBR)
    # Material Index 1
    # -------------------------------------------------------------------------
    mb_top_term = MeshBuilder("Terminal_Block_Top", material_index=1)

    # Primary Power Terminal Block (Left side, around anchor [-0.03, 0.08, 0.0])
    # Lower tier step
    mb_top_term.add_box(-0.046, 0.068, -0.016, -0.014, 0.075, 0.016)
    # Upper stepped ridge (reaches exact Y max = +0.080)
    mb_top_term.add_box(-0.044, 0.075, -0.012, -0.016, 0.080, 0.012)

    # 3 Terminal barrier dividers (isolating 3 wire poles: L, N, PE)
    mb_top_term.add_box(-0.045, 0.072, -0.014, -0.043, 0.080, 0.014) # Left barrier
    mb_top_term.add_box(-0.035, 0.072, -0.014, -0.033, 0.080, 0.014) # Mid-left barrier
    mb_top_term.add_box(-0.025, 0.072, -0.014, -0.023, 0.080, 0.014) # Mid-right barrier
    mb_top_term.add_box(-0.015, 0.072, -0.014, -0.013, 0.080, 0.014) # Right barrier

    # Secondary Auxiliary Top Terminal Block (Right side)
    mb_top_term.add_box(0.014, 0.068, -0.016, 0.046, 0.075, 0.016)
    mb_top_term.add_box(0.016, 0.075, -0.012, 0.044, 0.080, 0.012)
    mb_top_term.add_box(0.013, 0.072, -0.014, 0.015, 0.080, 0.014)
    mb_top_term.add_box(0.023, 0.072, -0.014, 0.025, 0.080, 0.014)
    mb_top_term.add_box(0.033, 0.072, -0.014, 0.035, 0.080, 0.014)
    mb_top_term.add_box(0.043, 0.072, -0.014, 0.045, 0.080, 0.014)

    # -------------------------------------------------------------------------
    # 3. Bottom Terminal Block (Sensor - Signal Green PBR)
    # Material Index 2
    # -------------------------------------------------------------------------
    mb_bot_term = MeshBuilder("Terminal_Block_Bottom", material_index=2)

    # Primary Sensor Terminal Block (Right side, around anchor [0.03, 0.0, 0.0])
    # Upper tier step
    mb_bot_term.add_box(0.014, 0.005, -0.016, 0.046, 0.012, 0.016)
    # Lower stepped ridge (reaches exact Y min = 0.000)
    mb_bot_term.add_box(0.016, 0.000, -0.012, 0.044, 0.005, 0.012)

    # 3 Terminal barrier dividers (isolating 3 RTD sensor poles: A, B, b)
    mb_bot_term.add_box(0.013, 0.000, -0.014, 0.015, 0.008, 0.014)
    mb_bot_term.add_box(0.023, 0.000, -0.014, 0.025, 0.008, 0.014)
    mb_bot_term.add_box(0.033, 0.000, -0.014, 0.035, 0.008, 0.014)
    mb_bot_term.add_box(0.043, 0.000, -0.014, 0.045, 0.008, 0.014)

    # Secondary Auxiliary Bottom Terminal Block (Left side)
    mb_bot_term.add_box(-0.046, 0.005, -0.016, -0.014, 0.012, 0.016)
    mb_bot_term.add_box(-0.044, 0.000, -0.012, -0.016, 0.005, 0.012)
    mb_bot_term.add_box(-0.045, 0.000, -0.014, -0.043, 0.008, 0.014)
    mb_bot_term.add_box(-0.035, 0.000, -0.014, -0.033, 0.008, 0.014)
    mb_bot_term.add_box(-0.025, 0.000, -0.014, -0.023, 0.008, 0.014)
    mb_bot_term.add_box(-0.015, 0.000, -0.014, -0.013, 0.008, 0.014)

    # -------------------------------------------------------------------------
    # 4. Front Panel Display Face (Glossy Black/Deep Blue PBR)
    # Material Index 3
    # -------------------------------------------------------------------------
    mb_display = MeshBuilder("Display_Panel", material_index=3)

    # Main LCD display screen face (reaches exact Z max = +0.025)
    # Centered at X = 0.0, Y = 0.040, Z = +0.025 (matching anchor [0.0, 0.04, 0.025])
    mb_display.add_box(-0.032, 0.026, 0.0235, 0.032, 0.054, 0.025)

    # -------------------------------------------------------------------------
    # 5. DIN Rail Metal Hardware (Galvanized Steel PBR)
    # Material Index 4
    # -------------------------------------------------------------------------
    mb_hardware = MeshBuilder("DIN_Hardware", material_index=4)

    # Central metallic DIN rail spring latch in channel
    mb_hardware.add_box(-0.012, 0.028, -0.019, 0.012, 0.052, -0.016)
    # Screwdriver release pull-tab
    mb_hardware.add_box(-0.008, 0.015, -0.022, 0.008, 0.024, -0.018)

    # Screws inside top power terminals (3 screw heads)
    mb_hardware.add_box(-0.040, 0.076, -0.004, -0.036, 0.079, 0.004)
    mb_hardware.add_box(-0.032, 0.076, -0.004, -0.028, 0.079, 0.004)
    mb_hardware.add_box(-0.024, 0.076, -0.004, -0.020, 0.079, 0.004)

    # Screws inside bottom sensor terminals (3 screw heads)
    mb_hardware.add_box(0.020, 0.001, -0.004, 0.024, 0.004, 0.004)
    mb_hardware.add_box(0.028, 0.001, -0.004, 0.032, 0.004, 0.004)
    mb_hardware.add_box(0.036, 0.001, -0.004, 0.040, 0.004, 0.004)

    # -------------------------------------------------------------------------
    # 6. Status LEDs & Tactile Buttons (Active LED Green / Emissive PBR)
    # Material Index 5
    # -------------------------------------------------------------------------
    mb_ui = MeshBuilder("UI_Controls", material_index=5)

    # 4 Status Indicator LEDs on left bezel
    mb_ui.add_box(-0.041, 0.058, 0.0238, -0.037, 0.062, 0.025)  # RUN LED
    mb_ui.add_box(-0.041, 0.050, 0.0238, -0.037, 0.054, 0.025)  # OUT LED
    mb_ui.add_box(-0.041, 0.042, 0.0238, -0.037, 0.046, 0.025)  # ALM LED
    mb_ui.add_box(-0.041, 0.034, 0.0238, -0.037, 0.038, 0.025)  # COMM LED

    # 3 Front Tactile Membrane Buttons below display
    mb_ui.add_box(-0.024, 0.015, 0.0236, -0.012, 0.022, 0.025)  # SET button
    mb_ui.add_box(-0.006, 0.015, 0.0236, 0.006, 0.022, 0.025)   # UP button
    mb_ui.add_box(0.012, 0.015, 0.0236, 0.024, 0.022, 0.025)    # DOWN button

    return [mb_body, mb_top_term, mb_bot_term, mb_display, mb_hardware, mb_ui]


# -----------------------------------------------------------------------------
# glTF 2.0 / GLB Binary Assembler
# -----------------------------------------------------------------------------
def assemble_glb(mesh_builders):
    """
    Assemble the complete glTF 2.0 binary (GLB) from mesh builders and anchors.
    Ensures 100% specification compliance with:
    - Magic 0x46546C67 (glTF)
    - Version 2
    - JSON Chunk (padded with spaces 0x20 to 4-byte alignment)
    - BIN Chunk (padded with nulls 0x00 to 4-byte alignment)
    - Strict bufferView and accessor alignments
    - Accurate min/max on POSITION accessors
    - Explicit named anchor nodes
    """
    # Define Materials
    materials = [
        # Material 0: Enclosure Anthracite
        {
            "name": "Mat_Anthracite_Enclosure",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.16, 0.17, 0.19, 1.0],
                "metallicFactor": 0.05,
                "roughnessFactor": 0.80
            },
            "doubleSided": False
        },
        # Material 1: Terminal Power Orange
        {
            "name": "Mat_Signal_Orange_Power",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.92, 0.35, 0.04, 1.0],
                "metallicFactor": 0.05,
                "roughnessFactor": 0.55
            },
            "doubleSided": False
        },
        # Material 2: Terminal Sensor Green
        {
            "name": "Mat_Signal_Green_Sensor",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.15, 0.55, 0.22, 1.0],
                "metallicFactor": 0.05,
                "roughnessFactor": 0.55
            },
            "doubleSided": False
        },
        # Material 3: Display Face Blue-Black
        {
            "name": "Mat_Display_Face_BlueBlack",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.03, 0.07, 0.15, 1.0],
                "metallicFactor": 0.20,
                "roughnessFactor": 0.12
            },
            "doubleSided": False
        },
        # Material 4: DIN Hardware Steel
        {
            "name": "Mat_DIN_Hardware_Steel",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.75, 0.75, 0.78, 1.0],
                "metallicFactor": 0.85,
                "roughnessFactor": 0.30
            },
            "doubleSided": False
        },
        # Material 5: Status LEDs / UI Accents
        {
            "name": "Mat_Status_LED_Green",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.0, 0.95, 0.40, 1.0],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.20
            },
            "emissiveFactor": [0.0, 0.90, 0.35],
            "doubleSided": False
        }
    ]

    bin_data = bytearray()
    buffer_views = []
    accessors = []
    meshes = []
    nodes = []

    # 1. Root Node (Node 0)
    root_node = {
        "name": DEVICE_ID,
        "translation": [0.0, 0.0, 0.0],
        "rotation": [0.0, 0.0, 0.0, 1.0],
        "scale": [1.0, 1.0, 1.0],
        "children": []
    }
    nodes.append(root_node)

    # Process each mesh builder
    for mb_idx, mb in enumerate(mesh_builders):
        mesh_node_index = len(nodes)
        root_node["children"].append(mesh_node_index)

        # Build Binary Data for Indices (UNSIGNED_SHORT = 2 bytes)
        indices_bytes = struct.pack(f"<{len(mb.indices)}H", *mb.indices)
        indices_offset = len(bin_data)
        bin_data.extend(indices_bytes)
        # Pad bufferView to 4-byte boundary
        pad_indices = (4 - (len(indices_bytes) % 4)) % 4
        if pad_indices:
            bin_data.extend(b"\x00" * pad_indices)

        bv_indices_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": indices_offset,
            "byteLength": len(indices_bytes),
            "target": 34963  # ELEMENT_ARRAY_BUFFER
        })

        acc_indices_idx = len(accessors)
        accessors.append({
            "bufferView": bv_indices_idx,
            "byteOffset": 0,
            "componentType": 5123,  # UNSIGNED_SHORT
            "count": len(mb.indices),
            "type": "SCALAR"
        })

        # Build Binary Data for Positions (FLOAT = 4 bytes x 3)
        pos_bytes = struct.pack(f"<{len(mb.vertices)}f", *mb.vertices)
        pos_offset = len(bin_data)
        bin_data.extend(pos_bytes)
        # pos_bytes is already multiple of 4 (len(vertices) is 3*N, 3*4*N = 12*N)

        # Compute accurate min / max for position accessor
        xs = mb.vertices[0::3]
        ys = mb.vertices[1::3]
        zs = mb.vertices[2::3]
        min_pos = [round(min(xs), 6), round(min(ys), 6), round(min(zs), 6)]
        max_pos = [round(max(xs), 6), round(max(ys), 6), round(max(zs), 6)]

        bv_pos_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": pos_offset,
            "byteLength": len(pos_bytes),
            "target": 34962  # ARRAY_BUFFER
        })

        acc_pos_idx = len(accessors)
        accessors.append({
            "bufferView": bv_pos_idx,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(mb.vertices) // 3,
            "type": "VEC3",
            "min": min_pos,
            "max": max_pos
        })

        # Build Binary Data for Normals (FLOAT = 4 bytes x 3)
        norm_bytes = struct.pack(f"<{len(mb.normals)}f", *mb.normals)
        norm_offset = len(bin_data)
        bin_data.extend(norm_bytes)

        bv_norm_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": norm_offset,
            "byteLength": len(norm_bytes),
            "target": 34962  # ARRAY_BUFFER
        })

        acc_norm_idx = len(accessors)
        accessors.append({
            "bufferView": bv_norm_idx,
            "byteOffset": 0,
            "componentType": 5126,  # FLOAT
            "count": len(mb.normals) // 3,
            "type": "VEC3"
        })

        # Create Mesh definition
        mesh_index = len(meshes)
        meshes.append({
            "name": mb.name,
            "primitives": [
                {
                    "attributes": {
                        "POSITION": acc_pos_idx,
                        "NORMAL": acc_norm_idx
                    },
                    "indices": acc_indices_idx,
                    "material": mb.material_index,
                    "mode": 4  # TRIANGLES
                }
            ]
        })

        # Add Mesh Node
        nodes.append({
            "name": mb.name,
            "mesh": mesh_index
        })

    # Add Explicit Anchor Nodes (empty nodes with exact translations)
    for anchor in ANCHORS:
        anchor_node_index = len(nodes)
        root_node["children"].append(anchor_node_index)

        nodes.append({
            "name": anchor["name"],
            "translation": anchor["position"],
            "rotation": anchor["orientation"],
            "scale": [1.0, 1.0, 1.0],
            "extras": {
                "kind": anchor["type"],
                "port_id": anchor["port_id"],
                "description": anchor["description"],
                "accuracy": "synthetic_exact"
            }
        })

    # Pad total binary buffer to 4-byte boundary
    total_bin_pad = (4 - (len(bin_data) % 4)) % 4
    if total_bin_pad:
        bin_data.extend(b"\x00" * total_bin_pad)

    # Assemble glTF JSON structure
    gltf_dict = {
        "asset": {
            "version": "2.0",
            "generator": "SYN-IND Pure GLB Generator v2.0 - Gate G2",
            "copyright": "Autonomous Systems Synthetic Fixture"
        },
        "scene": 0,
        "scenes": [
            {
                "name": "DefaultScene",
                "nodes": [0]
            }
        ],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [
            {
                "byteLength": len(bin_data)
            }
        ]
    }

    # Encode JSON to UTF-8
    json_bytes = json.dumps(gltf_dict, separators=(',', ':'), sort_keys=True).encode("utf-8")
    json_pad = (4 - (len(json_bytes) % 4)) % 4
    if json_pad:
        json_bytes += b" " * json_pad  # glTF spec requires spaces (0x20) for JSON chunk padding

    # Assemble binary GLB
    # Header: magic(4) + version(4) + length(4) = 12 bytes
    # Chunk 0 (JSON): length(4) + type(4) + data
    # Chunk 1 (BIN): length(4) + type(4) + data
    total_length = 12 + 8 + len(json_bytes) + 8 + len(bin_data)

    glb = bytearray()
    # 1. Header
    glb.extend(struct.pack("<4sII", b"glTF", 2, total_length))
    # 2. Chunk 0 (JSON: 0x4E4F534A)
    glb.extend(struct.pack("<II", len(json_bytes), 0x4E4F534A))
    glb.extend(json_bytes)
    # 3. Chunk 1 (BIN: 0x004E4942)
    glb.extend(struct.pack("<II", len(bin_data), 0x004E4942))
    glb.extend(bin_data)

    return bytes(glb), gltf_dict


# -----------------------------------------------------------------------------
# Binary & Semantic Verification
# -----------------------------------------------------------------------------
def validate_glb_bytes(glb_bytes):
    """
    Rigorous validation of GLB binary and semantic content.
    Returns dict of validated properties or raises AssertionError.
    """
    assert len(glb_bytes) >= 20, "File too small to be a valid GLB"

    # Header
    magic, version, length = struct.unpack_from("<4sII", glb_bytes, 0)
    assert magic == b"glTF", f"Invalid magic: {magic}"
    assert version == 2, f"Unsupported glTF version: {version}"
    assert length == len(glb_bytes), f"Header length {length} != file size {len(glb_bytes)}"

    # Chunk 0: JSON
    c0_len, c0_type = struct.unpack_from("<II", glb_bytes, 12)
    assert c0_type == 0x4E4F534A, f"Chunk 0 must be JSON (0x4E4F534A), got {hex(c0_type)}"
    c0_end = 12 + 8 + c0_len
    json_bytes = glb_bytes[20:c0_end]
    gltf_json = json.loads(json_bytes.decode("utf-8"))

    # Chunk 1: BIN
    c1_len, c1_type = struct.unpack_from("<II", glb_bytes, c0_end)
    assert c1_type == 0x004E4942, f"Chunk 1 must be BIN (0x004E4942), got {hex(c1_type)}"
    bin_bytes = glb_bytes[c0_end + 8 : c0_end + 8 + c1_len]

    # Semantic glTF verification
    assert gltf_json["asset"]["version"] == "2.0", "glTF asset version must be 2.0"
    assert "extensionsRequired" not in gltf_json or len(gltf_json["extensionsRequired"]) == 0, \
        "extensionsRequired must be empty"

    # Verify Bounding Box from actual BIN float data across all POSITION accessors
    global_min = [float("inf"), float("inf"), float("inf")]
    global_max = [float("-inf"), float("-inf"), float("-inf")]
    total_triangles = 0
    total_vertices = 0

    accessors = gltf_json["accessors"]
    buffer_views = gltf_json["bufferViews"]

    for mesh in gltf_json.get("meshes", []):
        for prim in mesh["primitives"]:
            pos_acc_idx = prim["attributes"]["POSITION"]
            pos_acc = accessors[pos_acc_idx]
            bv = buffer_views[pos_acc["bufferView"]]

            byte_offset = bv.get("byteOffset", 0) + pos_acc.get("byteOffset", 0)
            count = pos_acc["count"]
            total_vertices += count

            # Read all vec3 floats from BIN
            unpack_fmt = f"<{count * 3}f"
            pos_floats = struct.unpack_from(unpack_fmt, bin_bytes, byte_offset)

            for i in range(count):
                x = pos_floats[i * 3 + 0]
                y = pos_floats[i * 3 + 1]
                z = pos_floats[i * 3 + 2]

                global_min[0] = min(global_min[0], x)
                global_min[1] = min(global_min[1], y)
                global_min[2] = min(global_min[2], z)

                global_max[0] = max(global_max[0], x)
                global_max[1] = max(global_max[1], y)
                global_max[2] = max(global_max[2], z)

            ind_acc_idx = prim["indices"]
            ind_acc = accessors[ind_acc_idx]
            total_triangles += ind_acc["count"] // 3

    # Round bounding box
    computed_min = [round(v, 6) for v in global_min]
    computed_max = [round(v, 6) for v in global_max]
    computed_size = [round(computed_max[i] - computed_min[i], 6) for i in range(3)]

    # Strict dimensional checks
    for i, axis in enumerate(["X", "Y", "Z"]):
        assert abs(computed_min[i] - BBOX_MIN[i]) < 1e-5, \
            f"BBOX MIN mismatch on {axis}: computed {computed_min[i]} != expected {BBOX_MIN[i]}"
        assert abs(computed_max[i] - BBOX_MAX[i]) < 1e-5, \
            f"BBOX MAX mismatch on {axis}: computed {computed_max[i]} != expected {BBOX_MAX[i]}"
        assert abs(computed_size[i] - BBOX_SIZE[i]) < 1e-5, \
            f"BBOX SIZE mismatch on {axis}: computed {computed_size[i]} != expected {BBOX_SIZE[i]}"

    # Verify explicit anchors in nodes hierarchy
    node_names = {node["name"]: node for node in gltf_json["nodes"]}
    for expected_anchor in ANCHORS:
        name = expected_anchor["name"]
        assert name in node_names, f"Missing required anchor node: {name}"
        node = node_names[name]
        pos = node.get("translation", [0.0, 0.0, 0.0])
        for i in range(3):
            assert abs(pos[i] - expected_anchor["position"][i]) < 1e-5, \
                f"Anchor {name} position[{i}] mismatch: {pos[i]} != {expected_anchor['position'][i]}"

    return {
        "byte_length": length,
        "json_chunk_length": c0_len,
        "bin_chunk_length": c1_len,
        "bbox_min": computed_min,
        "bbox_max": computed_max,
        "bbox_size": computed_size,
        "triangle_count": total_triangles,
        "vertex_count": total_vertices,
        "mesh_count": len(gltf_json["meshes"]),
        "material_count": len(gltf_json["materials"]),
        "node_count": len(gltf_json["nodes"]),
        "anchor_count": len(ANCHORS)
    }


# -----------------------------------------------------------------------------
# Manifest Creation
# -----------------------------------------------------------------------------
def build_manifest(glb_sha256, glb_byte_length, validation_info, created_iso=None):
    """
    Build the standard Asset Manifest JSON adhering to:
    - Task specification requirements
    - MEGAPLAN_MUSE_API_3D_V2.md §15.5
    """
    if created_iso is None:
        created_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    manifest = {
        "schema_version": "model_manifest/2.0",
        "id": MANIFEST_ASSET_ID,
        "sku_or_syn_id": DEVICE_ID,
        "variant_id": VARIANT_ID,
        "units": "meter",
        "linear_unit": "m",
        "coordinate_system": "right_handed_y_up_z_forward",
        "fidelity": "synthetic_dimensional_proxy",
        "format": "model/gltf-binary",
        "gltf_version": "2.0",
        "extensions_required": [],
        "dimensions_mm": {
            "width": round(BBOX_SIZE[0] * 1000.0, 2),
            "height": round(BBOX_SIZE[1] * 1000.0, 2),
            "depth": round(BBOX_SIZE[2] * 1000.0, 2)
        },
        "bbox": {
            "min": validation_info["bbox_min"],
            "max": validation_info["bbox_max"],
            "size": validation_info["bbox_size"]
        },
        "body_bbox_m": {
            "min": validation_info["bbox_min"],
            "max": validation_info["bbox_max"]
        },
        "geometry_bbox_m": {
            "min": validation_info["bbox_min"],
            "max": validation_info["bbox_max"]
        },
        "anchors": [
            {
                "name": a["name"],
                "type": a["type"],
                "position": a["position"],
                "orientation": a["orientation"],
                "port_id": a["port_id"],
                "description": a["description"],
                "accuracy": "synthetic_exact"
            }
            for a in ANCHORS
        ],
        "qa": {
            "validator_errors": 0,
            "dimensional_error_mm": {"x": 0.0, "y": 0.0, "z": 0.0},
            "max_anchor_error_mm": 0.0,
            "triangle_count": validation_info["triangle_count"],
            "vertex_count": validation_info["vertex_count"]
        },
        "delivery": {
            "mime_type": "model/gltf-binary",
            "byte_length": glb_byte_length,
            "sha256": glb_sha256
        },
        "sha256": glb_sha256,
        "byte_length": glb_byte_length,
        "provenance": {
            "kind": "synthetic_fixture",
            "generator": "scripts/generate-syn-glb.py",
            "governing_doc": "docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G2)"
        },
        "created_at": created_iso
    }
    return manifest


# -----------------------------------------------------------------------------
# Main Execution Entrypoint
# -----------------------------------------------------------------------------
def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    default_storage_dir = os.path.join(repo_root, "storage", "industrial", "assets")

    print("=" * 76)
    print("SYNTHETIC 3D ASSET GENERATOR (SYN-IND-CTRL-01) — GATE G2")
    print("Governing Doc: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G2)")
    print("=" * 76)

    # 1. Generate 3D Geometry
    print("\n[1/5] Building mathematical geometry and PBR materials...")
    mesh_builders = build_synthetic_controller_geometry()
    for mb in mesh_builders:
        print(f"  • Mesh '{mb.name}': {len(mb.vertices)//3} vertices, {len(mb.indices)//3} triangles (Material #{mb.material_index})")

    # 2. Assemble glTF 2.0 / GLB Binary
    print("\n[2/5] Assembling pure glTF 2.0 / GLB binary container...")
    glb_bytes, gltf_json = assemble_glb(mesh_builders)

    # Compute SHA-256 and byte length
    glb_sha256 = hashlib.sha256(glb_bytes).hexdigest()
    glb_byte_length = len(glb_bytes)
    print(f"  -> Generated GLB size: {glb_byte_length:,} bytes")
    print(f"  -> GLB SHA-256:        {glb_sha256}")

    # 3. Repeatability Test (Deterministic Verification)
    print("\n[3/5] Testing deterministic repeatability...")
    repeat_mesh_builders = build_synthetic_controller_geometry()
    repeat_glb_bytes, _ = assemble_glb(repeat_mesh_builders)
    repeat_sha256 = hashlib.sha256(repeat_glb_bytes).hexdigest()
    assert repeat_sha256 == glb_sha256, "Determinism failed: secondary generation hash mismatch!"
    assert repeat_glb_bytes == glb_bytes, "Determinism failed: secondary generation byte mismatch!"
    print(f"  ✓ Pass: Identical hash on second generation ({repeat_sha256[:16]}...)")

    # 4. Binary Integrity and Dimensional QA Validation
    print("\n[4/5] Validating binary integrity and geometric envelope...")
    val_info = validate_glb_bytes(glb_bytes)
    print(f"  ✓ glTF Magic:          b'glTF' (0x46546C67)")
    print(f"  ✓ glTF Version:        2.0 (pure standard binary)")
    print(f"  ✓ JSON Chunk:          {val_info['json_chunk_length']:,} bytes")
    print(f"  ✓ BIN Chunk:           {val_info['bin_chunk_length']:,} bytes")
    print(f"  ✓ Total Vertices:      {val_info['vertex_count']}")
    print(f"  ✓ Total Triangles:     {val_info['triangle_count']}")
    print(f"  ✓ Bounding Box Min:    {val_info['bbox_min']} m")
    print(f"  ✓ Bounding Box Max:    {val_info['bbox_max']} m")
    print(f"  ✓ Bounding Box Size:   {val_info['bbox_size']} m")
    print(f"  ✓ Dimensions:          Width {val_info['bbox_size'][0]*1000:.1f}mm, Height {val_info['bbox_size'][1]*1000:.1f}mm, Depth {val_info['bbox_size'][2]*1000:.1f}mm")
    print(f"  ✓ Required Anchors (4/4 verified):")
    for a in ANCHORS:
        print(f"      - {a['name']:<28} position={a['position']}")

    # 5. Content-Addressed Storage & Manifest Creation
    print("\n[5/5] Writing to Content-Addressed Storage and canonical locations...")
    cas_dir = os.path.join(default_storage_dir, glb_sha256)
    os.makedirs(cas_dir, exist_ok=True)
    os.makedirs(default_storage_dir, exist_ok=True)

    cas_glb_path = os.path.join(cas_dir, f"{DEVICE_ID}.glb")
    cas_manifest_path = os.path.join(cas_dir, f"{DEVICE_ID}.manifest.json")
    canonical_glb_path = os.path.join(default_storage_dir, f"{DEVICE_ID}.glb")
    canonical_manifest_path = os.path.join(default_storage_dir, f"{DEVICE_ID}.manifest.json")

    # Write GLB to CAS path
    with open(cas_glb_path, "wb") as f:
        f.write(glb_bytes)
    print(f"  -> Written CAS GLB:      {cas_glb_path}")

    # Write canonical GLB
    with open(canonical_glb_path, "wb") as f:
        f.write(glb_bytes)
    print(f"  -> Written Canonical GLB:{canonical_glb_path}")

    # Build and write Manifests
    manifest_data = build_manifest(glb_sha256, glb_byte_length, val_info)
    manifest_json_str = json.dumps(manifest_data, indent=2)

    with open(cas_manifest_path, "w", encoding="utf-8") as f:
        f.write(manifest_json_str)
    print(f"  -> Written CAS Manifest: {cas_manifest_path}")

    with open(canonical_manifest_path, "w", encoding="utf-8") as f:
        f.write(manifest_json_str)
    print(f"  -> Written Canonical:    {canonical_manifest_path}")

    print("\n" + "=" * 76)
    print("GATE G2 ASSET VERIFICATION SUCCESSFUL")
    print(f"  Asset ID:      {MANIFEST_ASSET_ID}")
    print(f"  SKU / Syn ID:  {DEVICE_ID}")
    print(f"  SHA-256:       {glb_sha256}")
    print(f"  Byte Length:   {glb_byte_length} bytes")
    print(f"  CAS Path:      storage/industrial/assets/{glb_sha256}/{DEVICE_ID}.glb")
    print("=" * 76)

    return 0


if __name__ == "__main__":
    sys.exit(main())
