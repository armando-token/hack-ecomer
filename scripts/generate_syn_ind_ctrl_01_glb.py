#!/usr/bin/env python3
"""
generate_syn_ind_ctrl_01_glb.py
================================
Generates the Gate G2 Synthetic Industrial Controller 3D asset:
  Asset ID: SYN-IND-CTRL-01
  Filename: SYN-IND-CTRL-01.glb
  Standard: glTF 2.0 Binary (self-contained, PBR Metallic-Roughness)
  Scale: 100mm (0.10m) W x 80mm (0.08m) H x 50mm (0.05m) D
  Coordinate Frame: Right-handed, +Y Up, +Z Front
  Anchors:
    - anchor_mounting_din_center: [0.0, 0.04, 0.0]
    - anchor_terminal_power:      [-0.03, 0.08, 0.02]
    - anchor_terminal_sensor:     [0.03, 0.00, 0.02]
    - anchor_display_center:      [0.0, 0.04, 0.05]
"""

import json
import struct
import hashlib
import os

def pad4(b: bytes, char: bytes = b'\x00') -> bytes:
    rem = len(b) % 4
    return b + (char * ((4 - rem) % 4))

def build_syn_glb(output_paths: list[str]):
    # Enclosure Dimensions in meters: 100mm x 80mm x 50mm
    dx, dy, dz = 0.05, 0.08, 0.05
    min_x, max_x = -dx, dx
    min_y, max_y = 0.0, dy
    min_z, max_z = 0.0, dz

    faces = [
        # Front (+Z): normal [0, 0, 1]
        ([min_x, min_y, max_z,  max_x, min_y, max_z,  max_x, max_y, max_z,  min_x, max_y, max_z], [0, 0, 1]*4),
        # Back (-Z): normal [0, 0, -1]
        ([max_x, min_y, min_z,  min_x, min_y, min_z,  min_x, max_y, min_z,  max_x, max_y, min_z], [0, 0, -1]*4),
        # Top (+Y): normal [0, 1, 0]
        ([min_x, max_y, max_z,  max_x, max_y, max_z,  max_x, max_y, min_z,  min_x, max_y, min_z], [0, 1, 0]*4),
        # Bottom (-Y): normal [0, -1, 0]
        ([min_x, min_y, min_z,  max_x, min_y, min_z,  max_x, min_y, max_z,  min_x, min_y, max_z], [0, -1, 0]*4),
        # Right (+X): normal [1, 0, 0]
        ([max_x, min_y, max_z,  max_x, min_y, min_z,  max_x, max_y, min_z,  max_x, max_y, max_z], [1, 0, 0]*4),
        # Left (-X): normal [-1, 0, 0]
        ([min_x, min_y, min_z,  min_x, min_y, max_z,  min_x, max_y, max_z,  min_x, max_y, min_z], [-1, 0, 0]*4),
    ]

    positions = []
    normals = []
    indices = []

    for i, (f_pos, f_norm) in enumerate(faces):
        base_idx = i * 4
        positions.extend(f_pos)
        normals.extend(f_norm)
        indices.extend([base_idx, base_idx + 1, base_idx + 2, base_idx, base_idx + 2, base_idx + 3])

    pos_bytes = struct.pack(f'{len(positions)}f', *positions)
    norm_bytes = struct.pack(f'{len(normals)}f', *normals)
    idx_bytes = struct.pack(f'{len(indices)}H', *indices)

    idx_bytes_padded = pad4(idx_bytes)
    pos_bytes_padded = pad4(pos_bytes)
    norm_bytes_padded = pad4(norm_bytes)

    buffer_data = idx_bytes_padded + pos_bytes_padded + norm_bytes_padded

    idx_offset = 0
    idx_len = len(idx_bytes)
    pos_offset = len(idx_bytes_padded)
    pos_len = len(pos_bytes)
    norm_offset = pos_offset + len(pos_bytes_padded)
    norm_len = len(norm_bytes)

    gltf = {
        'asset': {
            'version': '2.0',
            'generator': 'Controlnautas SYN-GLB Generator v2.0'
        },
        'scene': 0,
        'scenes': [{
            'name': 'SYN-IND-CTRL-01_Scene',
            'nodes': [0, 1, 2, 3, 4]
        }],
        'nodes': [
            {
                'name': 'SYN-IND-CTRL-01_Body',
                'mesh': 0
            },
            {
                'name': 'anchor_mounting_din_center',
                'translation': [0.0, 0.04, 0.0],
                'extras': {'anchor_id': 'anchor_mounting_din_center', 'kind': 'mounting_din'}
            },
            {
                'name': 'anchor_terminal_power',
                'translation': [-0.03, 0.08, 0.02],
                'extras': {'anchor_id': 'anchor_terminal_power', 'kind': 'terminal_power'}
            },
            {
                'name': 'anchor_terminal_sensor',
                'translation': [0.03, 0.0, 0.02],
                'extras': {'anchor_id': 'anchor_terminal_sensor', 'kind': 'terminal_sensor'}
            },
            {
                'name': 'anchor_display_center',
                'translation': [0.0, 0.04, 0.05],
                'extras': {'anchor_id': 'anchor_display_center', 'kind': 'display_center'}
            }
        ],
        'meshes': [{
            'name': 'SYN-IND-CTRL-01_Mesh',
            'primitives': [{
                'attributes': {
                    'POSITION': 1,
                    'NORMAL': 2
                },
                'indices': 0,
                'material': 0
            }]
        }],
        'materials': [{
            'name': 'IndustrialEnclosurePBR',
            'pbrMetallicRoughness': {
                'baseColorFactor': [0.22, 0.24, 0.26, 1.0],
                'metallicFactor': 0.1,
                'roughnessFactor': 0.6
            }
        }],
        'accessors': [
            {
                'bufferView': 0,
                'byteOffset': 0,
                'componentType': 5123,
                'count': len(indices),
                'type': 'SCALAR',
                'max': [max(indices)],
                'min': [min(indices)]
            },
            {
                'bufferView': 1,
                'byteOffset': 0,
                'componentType': 5126,
                'count': len(positions) // 3,
                'type': 'VEC3',
                'max': [max_x, max_y, max_z],
                'min': [min_x, min_y, min_z]
            },
            {
                'bufferView': 2,
                'byteOffset': 0,
                'componentType': 5126,
                'count': len(normals) // 3,
                'type': 'VEC3',
                'max': [1.0, 1.0, 1.0],
                'min': [-1.0, -1.0, -1.0]
            }
        ],
        'bufferViews': [
            {
                'buffer': 0,
                'byteOffset': idx_offset,
                'byteLength': idx_len,
                'target': 34963
            },
            {
                'buffer': 0,
                'byteOffset': pos_offset,
                'byteLength': pos_len,
                'target': 34962
            },
            {
                'buffer': 0,
                'byteOffset': norm_offset,
                'byteLength': norm_len,
                'target': 34962
            }
        ],
        'buffers': [{
            'byteLength': len(buffer_data)
        }]
    }

    json_bytes = json.dumps(gltf, separators=(',', ':')).encode('utf-8')
    json_padded = pad4(json_bytes, b' ')

    total_length = 12 + (8 + len(json_padded)) + (8 + len(buffer_data))

    header = struct.pack('<4sII', b'glTF', 2, total_length)
    json_chunk_header = struct.pack('<II', len(json_padded), 0x4E4F534A)
    bin_chunk_header = struct.pack('<II', len(buffer_data), 0x004E4942)

    glb_bytes = header + json_chunk_header + json_padded + bin_chunk_header + buffer_data
    sha256 = hashlib.sha256(glb_bytes).hexdigest()

    for out_path in output_paths:
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, 'wb') as f:
            f.write(glb_bytes)
        print(f"Wrote {len(glb_bytes)} bytes to {out_path}")

    print(f"GLB SHA-256: {sha256}")
    return sha256, len(glb_bytes)

if __name__ == "__main__":
    paths = [
        os.path.abspath("docs/industrial/assets/SYN-IND-CTRL-01.glb"),
        os.path.abspath("b2b-backend/storage/industrial-assets/SYN-IND-CTRL-01.glb"),
    ]
    build_syn_glb(paths)
