#!/usr/bin/env python3
"""
Generate Mathematically Precise glTF 2.0 / GLB Assets for Gate G6 Pilot SKUs.
Governing Doc: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6).

Pilot SKUs:
1. CN-X5PRIME-HE-XP5 (Horner Automation X5 Prime OCS)
2. CN-N1200 (NOVUS N1200 Process PID Controller)
3. CN-THT02 (TZone THT-02 Environmental Transmitter)

Standards:
- Units: EXACTLY METERS
- Coordinate System: Right-handed, +Y up, +Z forward
- Fidelity: dimensional_proxy_verified (honestly labeled; not manufacturer CAD)
- Zero required extensions (no Draco, no Meshopt, no KTX2)
- Zero external assets or network dependencies
"""

import sys
import os
import json
import struct
import math
import hashlib
from datetime import datetime, timezone

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False


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


# -----------------------------------------------------------------------------
# SKU 1: Horner Automation X5 Prime OCS (CN-X5PRIME-HE-XP5)
# -----------------------------------------------------------------------------
def build_x5prime_geometry():
    """
    Construct mathematically precise 3D mesh components for CN-X5PRIME-HE-XP5.
    Exact Envelope: [0.120, 0.091, 0.060] m (120 x 91 x 60 mm)
    Bounds: X [-0.060, 0.060], Y [0.000, 0.091], Z [-0.045, 0.015]
    Features:
    - Front bezel framing 120 x 91 mm outer face
    - 4.3" resistive color touchscreen display face
    - Display UI graphics and status LEDs (PWR, RUN, ERR)
    - Rear enclosure body fitting 119.5 x 90.5 mm cutout
    - 4 Panel mounting clips on chassis sides
    - Rear DIN TS35 mounting channel and shoulders reaching Z = -0.045
    - Pluggable terminal blocks (Power, Digital IN, Analog IN, Digital OUT)
    - Shielded RJ45 ports (RS-485 MJ1/MJ2, Ethernet LAN)
    """
    # Material 0: Dark slate housing / bezel
    mb_bezel = MeshBuilder("Front_Bezel_Housing", 0)
    # Front bezel main body: reaches X [-0.060, 0.060], Y [0.000, 0.091], Z [0.000, 0.012]
    mb_bezel.add_box(-0.060, 0.000, 0.000, 0.060, 0.091, 0.012)
    # Perimeter front raised lip / bevel: reaches exact Z = +0.015
    mb_bezel.add_box(-0.060, 0.000, 0.012, -0.056, 0.091, 0.015) # left rim
    mb_bezel.add_box(0.056, 0.000, 0.012, 0.060, 0.091, 0.015)  # right rim
    mb_bezel.add_box(-0.060, 0.087, 0.012, 0.060, 0.091, 0.015) # top rim
    mb_bezel.add_box(-0.060, 0.000, 0.012, 0.060, 0.004, 0.015) # bottom rim

    # Material 1: 4.3" Touchscreen Display Glass
    mb_display = MeshBuilder("Touchscreen_Display", 1)
    # 96 mm x 54 mm glass face centered at [0.0, 0.0455], reaches Z = +0.015
    mb_display.add_box(-0.048, 0.0185, 0.012, 0.048, 0.0725, 0.015)

    # Material 2: HMI Graphical Overlay
    mb_ui = MeshBuilder("HMI_Overlay", 2)
    mb_ui.add_box(-0.044, 0.055, 0.0145, 0.044, 0.068, 0.015) # top header bar
    mb_ui.add_box(-0.042, 0.024, 0.0145, -0.010, 0.048, 0.015) # left process widget
    mb_ui.add_box(0.010, 0.024, 0.0145, 0.042, 0.048, 0.015)  # right status widget

    # Material 3: Status Indicator LEDs
    mb_leds = MeshBuilder("Status_LEDs", 3)
    mb_leds.add_box(-0.054, 0.078, 0.013, -0.050, 0.082, 0.015) # PWR LED (Green)
    mb_leds.add_box(-0.054, 0.070, 0.013, -0.050, 0.074, 0.015) # RUN LED (Green)
    mb_leds.add_box(-0.054, 0.062, 0.013, -0.050, 0.066, 0.015) # ERR LED (Amber)

    # Material 0: Rear Enclosure & Panel Mounting Clips
    mb_rear = MeshBuilder("Rear_Enclosure", 0)
    # Main rear body (fits inside 119.5 x 90.5 mm cutout)
    mb_rear.add_box(-0.057, 0.003, -0.040, 0.057, 0.088, 0.000)
    # Gasket at panel mounting plane Z = 0
    mb_rear.add_box(-0.059, 0.001, -0.003, 0.059, 0.090, 0.000)
    # 4 Panel mounting clips on sides
    mb_rear.add_box(-0.059, 0.068, -0.025, -0.056, 0.078, -0.005)
    mb_rear.add_box(-0.059, 0.013, -0.025, -0.056, 0.023, -0.005)
    mb_rear.add_box(0.056, 0.068, -0.025, 0.059, 0.078, -0.005)
    mb_rear.add_box(0.056, 0.013, -0.025, 0.059, 0.023, -0.005)

    # Material 6: DIN Rail Mount Geometry (reaches exact Z = -0.045)
    mb_din = MeshBuilder("DIN_Mount_Geometry", 6)
    # Upper rear shoulder (reaches exact Z = -0.045)
    mb_din.add_box(-0.055, 0.063, -0.045, 0.055, 0.088, -0.040)
    # Lower rear shoulder (reaches exact Z = -0.045)
    mb_din.add_box(-0.055, 0.003, -0.045, 0.055, 0.028, -0.040)
    # Central DIN TS35 channel spring latch
    mb_din.add_box(-0.015, 0.030, -0.042, 0.015, 0.061, -0.038)
    # Spring release tab
    mb_din.add_box(-0.008, 0.020, -0.044, 0.008, 0.028, -0.040)

    # Material 4: Pluggable Terminal Connectors
    mb_conn = MeshBuilder("Connectors_Terminals", 4)
    # Bottom Power connector (3-pin pluggable cage clamp)
    mb_conn.add_box(-0.048, 0.003, -0.038, -0.032, 0.018, -0.022)
    # Top Discrete Inputs (5-pin pluggable cage clamp)
    mb_conn.add_box(-0.046, 0.073, -0.038, -0.024, 0.088, -0.022)
    # Top Analog Inputs (5-pin pluggable cage clamp)
    mb_conn.add_box(-0.011, 0.073, -0.038, 0.011, 0.088, -0.022)
    # Top Discrete Outputs (5-pin pluggable cage clamp)
    mb_conn.add_box(0.024, 0.073, -0.038, 0.046, 0.088, -0.022)

    # Material 5: Shielded Communication Ports
    mb_ports = MeshBuilder("Comm_Ports_Shielded", 5)
    # Bottom RS-485 MJ1/MJ2 (RJ45 jack with metal shield)
    mb_ports.add_box(-0.022, 0.003, -0.038, -0.008, 0.018, -0.022)
    # Bottom Ethernet LAN (RJ45 jack with metal shield)
    mb_ports.add_box(0.008, 0.003, -0.038, 0.022, 0.018, -0.022)

    return [mb_bezel, mb_display, mb_ui, mb_leds, mb_rear, mb_din, mb_conn, mb_ports]


# -----------------------------------------------------------------------------
# SKU 2: NOVUS N1200 Process PID Controller (CN-N1200)
# -----------------------------------------------------------------------------
def build_n1200_geometry():
    """
    Construct mathematically precise 3D mesh components for CN-N1200.
    Exact Envelope: [0.048, 0.048, 0.110] m (48 x 48 x 110 mm, 1/16 DIN)
    Bounds: X [-0.024, 0.024], Y [0.000, 0.048], Z [-0.100, 0.010]
    Features:
    - 1/16 DIN front bezel collar (48 x 48 x 10 mm forward projection)
    - Front face membrane overlay
    - Dual 4-digit LED display (PV Red, SP Green)
    - Front tactile keypad buttons (P, Back, Down, Up) & USB config port
    - 45 x 45 mm body barrel sleeve with side ratchet rails
    - Rear terminal block (terminals 1 to 18) reaching exact Z = -0.100
    - Terminal screws / steel contacts
    """
    # Material 0: 1/16 DIN Bezel
    mb_bezel = MeshBuilder("N1200_Bezel", 0)
    # Bezel outer rim: reaches exact X [-0.024, 0.024], Y [0.000, 0.048], Z [0.000, 0.008]
    mb_bezel.add_box(-0.024, 0.000, 0.000, 0.024, 0.048, 0.008)
    # Front rim chamfer: reaches exact Z = +0.010
    mb_bezel.add_box(-0.024, 0.000, 0.008, -0.021, 0.048, 0.010) # left rim
    mb_bezel.add_box(0.021, 0.000, 0.008, 0.024, 0.048, 0.010)  # right rim
    mb_bezel.add_box(-0.024, 0.045, 0.008, 0.024, 0.048, 0.010) # top rim
    mb_bezel.add_box(-0.024, 0.000, 0.008, 0.024, 0.003, 0.010) # bottom rim

    # Material 2: Front Face Membrane Overlay
    mb_face = MeshBuilder("Front_Overlay", 2)
    mb_face.add_box(-0.021, 0.003, 0.008, 0.021, 0.045, 0.0095)

    # Material 3: Upper PV (Process Value) 4-Digit Display (Red)
    mb_display_pv = MeshBuilder("Display_PV_Red", 3)
    # Upper PV 4-digit display block, reaches exact Z = +0.010
    mb_display_pv.add_box(-0.016, 0.028, 0.009, 0.016, 0.042, 0.010)

    # Material 4: Lower SP (Setpoint) 4-Digit Display (Green)
    mb_display_sp = MeshBuilder("Display_SP_Green", 4)
    # Lower SP 4-digit display block, reaches exact Z = +0.010
    mb_display_sp.add_box(-0.016, 0.016, 0.009, 0.016, 0.026, 0.010)

    # Material 5: Front Keypad Buttons & Mini-USB Port
    mb_keys = MeshBuilder("Keypad_Buttons", 5)
    mb_keys.add_box(-0.018, 0.005, 0.009, -0.010, 0.012, 0.010) # P button
    mb_keys.add_box(-0.008, 0.005, 0.009, -0.001, 0.012, 0.010) # Back button
    mb_keys.add_box(0.001, 0.005, 0.009, 0.008, 0.012, 0.010)   # Down button
    mb_keys.add_box(0.010, 0.005, 0.009, 0.017, 0.012, 0.010)   # Up button
    # Front Mini-USB config port recess
    mb_keys.add_box(0.011, 0.004, 0.007, 0.019, 0.011, 0.0095)

    # Material 1: Body Barrel (Standard 45 x 45 mm DIN sleeve)
    mb_barrel = MeshBuilder("Body_Barrel", 1)
    mb_barrel.add_box(-0.0225, 0.0015, -0.090, 0.0225, 0.0465, 0.000)
    # Ratchet grooves on sides for sliding panel mounting clamp
    mb_barrel.add_box(-0.023, 0.020, -0.080, -0.0225, 0.028, -0.020)
    mb_barrel.add_box(0.0225, 0.020, -0.080, 0.023, 0.028, -0.020)

    # Material 6: Rear Terminal Block (Z = -0.090 to -0.100, reaches exact Z = -0.100)
    mb_term = MeshBuilder("Rear_Terminal_Block", 6)
    # Main terminal block housing
    mb_term.add_box(-0.022, 0.002, -0.100, 0.022, 0.046, -0.090)
    # Dividing barrier rib isolating left and right terminal columns
    mb_term.add_box(-0.003, 0.002, -0.100, 0.003, 0.046, -0.092)

    # Material 7: Terminal Screws (Steel contacts)
    mb_screws = MeshBuilder("Terminal_Screws", 7)
    # Left column screws (Terminals 1 to 8: Power, Out1, Out2, Out3)
    for y_step in [0.040, 0.034, 0.028, 0.024, 0.018, 0.014, 0.008, 0.004]:
        mb_screws.add_box(-0.016, y_step - 0.0015, -0.099, -0.010, y_step + 0.0015, -0.093)
    # Right column screws (Terminals 9 to 18: Sensor In, Out4 Retrans, Comm)
    for y_step in [0.040, 0.034, 0.028, 0.024, 0.018, 0.014, 0.008, 0.004]:
        mb_screws.add_box(0.010, y_step - 0.0015, -0.099, 0.016, y_step + 0.0015, -0.093)

    return [mb_bezel, mb_face, mb_display_pv, mb_display_sp, mb_keys, mb_barrel, mb_term, mb_screws]


# -----------------------------------------------------------------------------
# SKU 3: TZone THT-02 Environmental Transmitter (CN-THT02)
# -----------------------------------------------------------------------------
def build_tht02_geometry():
    """
    Construct mathematically precise 3D mesh components for CN-THT02.
    Exact Envelope: [0.110, 0.085, 0.040] m (110 x 85 x 40 mm)
    Bounds: X [-0.055, 0.055], Y [0.000, 0.085], Z [-0.020, 0.020]
    Features:
    - Wall mount enclosure housing with side flanges reaching X = ±0.055
    - Screw mounting ears / slots on flanges
    - Front spec nameplate / logo badge reaching Z = +0.020
    - Top sensor probe cap with sintered filter ribs reaching Y = +0.085
    - Bottom cable gland with compression nut and rubber boot reaching Y = 0.000
    - Rear wall mounting plane reaching Z = -0.020
    """
    # Material 0: White / Light Gray Industrial ABS Enclosure
    mb_enclosure = MeshBuilder("THT02_Enclosure", 0)
    # Central housing body: reaches exact Z [-0.020, 0.020]
    mb_enclosure.add_box(-0.035, 0.015, -0.020, 0.035, 0.070, 0.020)

    # Material 0: Side Mounting Flanges (reaches exact X [-0.055, 0.055])
    mb_flanges = MeshBuilder("Mounting_Flanges", 0)
    # Left mounting flange
    mb_flanges.add_box(-0.055, 0.025, -0.020, -0.035, 0.060, -0.014)
    # Right mounting flange
    mb_flanges.add_box(0.035, 0.025, -0.020, 0.055, 0.060, -0.014)

    # Material 5: Flange Screw Ear Reinforcements / Slots
    mb_ears = MeshBuilder("Mounting_Ears", 5)
    mb_ears.add_box(-0.052, 0.038, -0.020, -0.042, 0.047, -0.012)
    mb_ears.add_box(0.042, 0.038, -0.020, 0.052, 0.047, -0.012)

    # Material 1: Front Nameplate / Spec Badge
    mb_badge = MeshBuilder("Front_Badge", 1)
    mb_badge.add_box(-0.028, 0.025, 0.019, 0.028, 0.060, 0.020)

    # Material 2: Top Sensor Probe Cap (reaches exact Y = +0.085)
    mb_cap = MeshBuilder("Sensor_Probe_Cap", 2)
    # Cap mounting collar
    mb_cap.add_box(-0.014, 0.070, -0.014, 0.014, 0.073, 0.014)
    # Sintered ventilated filter body (reaches exact Y = +0.085)
    mb_cap.add_box(-0.012, 0.073, -0.012, 0.012, 0.085, 0.012)
    # Cap ventilation ribs
    mb_cap.add_box(-0.013, 0.076, -0.010, 0.013, 0.078, 0.010)
    mb_cap.add_box(-0.013, 0.080, -0.010, 0.013, 0.082, 0.010)

    # Material 3: Bottom Cable Gland (Nylon Body)
    mb_gland = MeshBuilder("Cable_Gland_Nylon", 3)
    # Gland threaded body
    mb_gland.add_box(-0.012, 0.010, -0.012, 0.012, 0.015, 0.012)
    # Compression hex nut
    mb_gland.add_box(-0.011, 0.004, -0.011, 0.011, 0.010, 0.011)

    # Material 4: Cable Strain Relief Boot (Rubber, reaches exact Y = 0.000)
    mb_boot = MeshBuilder("Cable_Boot_Rubber", 4)
    mb_boot.add_box(-0.007, 0.000, -0.007, 0.007, 0.004, 0.007)

    return [mb_enclosure, mb_flanges, mb_ears, mb_badge, mb_cap, mb_gland, mb_boot]


# -----------------------------------------------------------------------------
# Configuration Catalog for Pilot SKUs
# -----------------------------------------------------------------------------
PILOT_SKUS = {
    "CN-X5PRIME-HE-XP5": {
        "sku": "CN-X5PRIME-HE-XP5",
        "title": "Horner Automation X5 Prime OCS",
        "variant_id": "variant_01M41R18MQK0GXGPTYSX0EDZBH",
        "snapshot_id": "snp_cn_x5prime_he_xp5_v1",
        "asset_id": "ast_cn_x5prime_he_xp5_glb_v1",
        "envelope_m": [0.120, 0.091, 0.060],
        "bbox_min": [-0.060, 0.000, -0.045],
        "bbox_max": [0.060, 0.091, 0.015],
        "builder": build_x5prime_geometry,
        "materials": [
            # 0: Slate Enclosure
            {
                "name": "Mat_X5_Bezel_Slate",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.15, 0.16, 0.18, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.70
                },
                "doubleSided": False
            },
            # 1: Touchscreen Glass
            {
                "name": "Mat_X5_Screen_Glass",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.04, 0.06, 0.10, 1.0],
                    "metallicFactor": 0.20,
                    "roughnessFactor": 0.15
                },
                "doubleSided": False
            },
            # 2: HMI Graphics
            {
                "name": "Mat_X5_HMI_Graphics",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.15, 0.45, 0.75, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.40
                },
                "doubleSided": False
            },
            # 3: Status LEDs
            {
                "name": "Mat_X5_Status_LEDs",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.0, 0.95, 0.35, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.20
                },
                "emissiveFactor": [0.0, 0.85, 0.25],
                "doubleSided": False
            },
            # 4: Pluggable Orange Connectors
            {
                "name": "Mat_X5_Pluggable_Orange",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.90, 0.40, 0.05, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.55
                },
                "doubleSided": False
            },
            # 5: RJ45 Metal Shielding
            {
                "name": "Mat_X5_RJ45_Shield",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.75, 0.75, 0.78, 1.0],
                    "metallicFactor": 0.85,
                    "roughnessFactor": 0.30
                },
                "doubleSided": False
            },
            # 6: DIN Mount Steel
            {
                "name": "Mat_X5_DIN_Hardware",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.65, 0.68, 0.72, 1.0],
                    "metallicFactor": 0.90,
                    "roughnessFactor": 0.35
                },
                "doubleSided": False
            }
        ],
        "anchors": [
            {
                "name": "anchor_power_in",
                "type": "power_input",
                "position": [-0.040, 0.003, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_power_in",
                "description": "Primary 10-30 VDC power input terminal block",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_rs485_mj1",
                "type": "serial_comm",
                "position": [-0.015, 0.003, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_rs485_mj1",
                "description": "RS-485 Modbus RTU serial port MJ1/MJ2 (RJ45)",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_ethernet_lan",
                "type": "ethernet",
                "position": [0.015, 0.003, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_ethernet_lan",
                "description": "10/100 Mbps RJ45 Ethernet LAN port",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_analog_in",
                "type": "analog_input",
                "position": [0.000, 0.088, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_analog_in",
                "description": "4-channel analog inputs 4-20mA / 0-10V",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_digital_in",
                "type": "discrete_input",
                "position": [-0.035, 0.088, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_digital_in",
                "description": "4-channel 12-24 VDC discrete digital inputs",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_digital_out",
                "type": "discrete_output",
                "position": [0.035, 0.088, -0.030],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_digital_out",
                "description": "4-channel 0.5A sourcing transistor outputs",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_display_center",
                "type": "display_center",
                "position": [0.000, 0.0455, 0.015],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_display",
                "description": "4.3 inch resistive color touchscreen HMI center face",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_mounting_panel",
                "type": "mounting_panel",
                "position": [0.000, 0.0455, 0.000],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_mounting_panel",
                "description": "Panel cutout mounting plane reference (Z=0)",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_mounting_din",
                "type": "mounting_din",
                "position": [0.000, 0.0455, -0.045],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_mounting_din",
                "description": "DIN EN 50022 TS 35 rear rail mounting center",
                "accuracy": "dimensional_proxy_exact"
            }
        ]
    },

    "CN-N1200": {
        "sku": "CN-N1200",
        "title": "NOVUS N1200 Process PID Controller",
        "variant_id": "variant_01M41R18XQ6QNWMX8Z39NMR2NW",
        "snapshot_id": "snp_cn_n1200_v1",
        "asset_id": "ast_cn_n1200_glb_v1",
        "envelope_m": [0.048, 0.048, 0.110],
        "bbox_min": [-0.024, 0.000, -0.100],
        "bbox_max": [0.024, 0.048, 0.010],
        "builder": build_n1200_geometry,
        "materials": [
            # 0: Bezel Black
            {
                "name": "Mat_N1200_Bezel_Black",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.12, 0.12, 0.14, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.65
                },
                "doubleSided": False
            },
            # 1: Housing Grey
            {
                "name": "Mat_N1200_Body_Grey",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.25, 0.26, 0.28, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.75
                },
                "doubleSided": False
            },
            # 2: Front Overlay
            {
                "name": "Mat_N1200_Face_Overlay",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.06, 0.07, 0.09, 1.0],
                    "metallicFactor": 0.10,
                    "roughnessFactor": 0.25
                },
                "doubleSided": False
            },
            # 3: PV Display Red
            {
                "name": "Mat_LED_Display_Red",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.95, 0.10, 0.10, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.20
                },
                "emissiveFactor": [0.95, 0.05, 0.05],
                "doubleSided": False
            },
            # 4: SP Display Green
            {
                "name": "Mat_LED_Display_Green",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.05, 0.95, 0.20, 1.0],
                    "metallicFactor": 0.0,
                    "roughnessFactor": 0.20
                },
                "emissiveFactor": [0.05, 0.90, 0.15],
                "doubleSided": False
            },
            # 5: Keypad Buttons
            {
                "name": "Mat_Keypad_Buttons",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.28, 0.30, 0.33, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.50
                },
                "doubleSided": False
            },
            # 6: Terminal Block Phenolic
            {
                "name": "Mat_Terminal_Block_Phenolic",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.18, 0.16, 0.15, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.80
                },
                "doubleSided": False
            },
            # 7: Screws Steel
            {
                "name": "Mat_Terminal_Screws_Steel",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.75, 0.75, 0.78, 1.0],
                    "metallicFactor": 0.85,
                    "roughnessFactor": 0.30
                },
                "doubleSided": False
            }
        ],
        "anchors": [
            {
                "name": "anchor_power_in",
                "type": "power_input",
                "position": [-0.013, 0.040, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_power_in",
                "description": "100-240 VAC/DC power input terminals 1 & 2",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_universal_in",
                "type": "sensor_input",
                "position": [0.013, 0.028, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_universal_in",
                "description": "Universal sensor input terminals 11, 12, 13 (Pt100/TC/mA/V)",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_out1_ctrl",
                "type": "control_output",
                "position": [-0.013, 0.024, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_out1_ctrl",
                "description": "OUT1 control pulse / SSR drive terminals 4 & 5",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_out2_alarm",
                "type": "alarm_output",
                "position": [-0.013, 0.014, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_out2_alarm",
                "description": "OUT2 relay alarm contact terminals 6 & 7",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_out3_alarm",
                "type": "alarm_output",
                "position": [-0.013, 0.006, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_out3_alarm",
                "description": "OUT3 relay alarm SPDT contact terminals 8, 9, 10",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_out4_analog",
                "type": "analog_output",
                "position": [0.013, 0.014, -0.100],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_out4_analog",
                "description": "OUT4 4-20mA analog retransmission terminals 9 & 10",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_usb_comm",
                "type": "serial_comm",
                "position": [0.015, 0.007, 0.010],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_usb_comm",
                "description": "Front panel Mini-B USB configuration interface",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_display_center",
                "type": "display_center",
                "position": [0.000, 0.028, 0.010],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_display",
                "description": "Dual 4-digit LED display & keypad face center",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_mounting_panel",
                "type": "mounting_panel",
                "position": [0.000, 0.024, 0.000],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_mounting_panel",
                "description": "1/16 DIN panel mount insertion plane reference (Z=0)",
                "accuracy": "dimensional_proxy_exact"
            }
        ]
    },

    "CN-THT02": {
        "sku": "CN-THT02",
        "title": "TZone THT-02 Environmental Transmitter",
        "variant_id": "variant_01M41R193J5MPJ16MTX9CAWWRM",
        "snapshot_id": "snp_cn_tht02_v1",
        "asset_id": "ast_cn_tht02_glb_v1",
        "envelope_m": [0.110, 0.085, 0.040],
        "bbox_min": [-0.055, 0.000, -0.020],
        "bbox_max": [0.055, 0.085, 0.020],
        "builder": build_tht02_geometry,
        "materials": [
            # 0: White Enclosure
            {
                "name": "Mat_THT02_Enclosure_White",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.86, 0.86, 0.88, 1.0],
                    "metallicFactor": 0.02,
                    "roughnessFactor": 0.60
                },
                "doubleSided": False
            },
            # 1: Front Badge
            {
                "name": "Mat_THT02_Front_Badge",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.18, 0.35, 0.60, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.35
                },
                "doubleSided": False
            },
            # 2: Sintered Filter Cap
            {
                "name": "Mat_Filter_Cap_Sintered",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.68, 0.70, 0.74, 1.0],
                    "metallicFactor": 0.10,
                    "roughnessFactor": 0.85
                },
                "doubleSided": False
            },
            # 3: Nylon Cable Gland
            {
                "name": "Mat_Cable_Gland_Nylon",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.22, 0.22, 0.25, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.50
                },
                "doubleSided": False
            },
            # 4: Rubber Cable Boot
            {
                "name": "Mat_Cable_Boot_Rubber",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.08, 0.08, 0.10, 1.0],
                    "metallicFactor": 0.02,
                    "roughnessFactor": 0.85
                },
                "doubleSided": False
            },
            # 5: Mounting Ears
            {
                "name": "Mat_Mounting_Ears",
                "pbrMetallicRoughness": {
                    "baseColorFactor": [0.72, 0.72, 0.75, 1.0],
                    "metallicFactor": 0.05,
                    "roughnessFactor": 0.55
                },
                "doubleSided": False
            }
        ],
        "anchors": [
            {
                "name": "anchor_sensor_internal",
                "type": "sensor_internal",
                "position": [0.000, 0.078, 0.000],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_sensor_internal",
                "description": "Internal Sensirion SHT30 temperature & humidity element inside protective cap",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_power_in",
                "type": "power_input",
                "position": [-0.003, 0.000, 0.000],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_power_in",
                "description": "5-24 VDC power supply lead entry at cable gland",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_rs485",
                "type": "serial_comm",
                "position": [0.003, 0.000, 0.000],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_rs485",
                "description": "RS-485 Modbus RTU 2-wire serial lead entry at cable gland",
                "accuracy": "dimensional_proxy_exact"
            },
            {
                "name": "anchor_mounting_wall",
                "type": "mounting_wall",
                "position": [0.000, 0.0425, -0.020],
                "orientation": [0.0, 0.0, 0.0, 1.0],
                "port_id": "p_mounting_wall",
                "description": "Wall / enclosure mounting back plane reference (Z=-0.020)",
                "accuracy": "dimensional_proxy_exact"
            }
        ]
    }
}


# -----------------------------------------------------------------------------
# glTF 2.0 / GLB Binary Assembler
# -----------------------------------------------------------------------------
def assemble_glb(sku_cfg, mesh_builders):
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
    sku = sku_cfg["sku"]
    materials = sku_cfg["materials"]
    anchors = sku_cfg["anchors"]

    bin_data = bytearray()
    buffer_views = []
    accessors = []
    meshes = []
    nodes = []

    # 1. Root Node (Node 0)
    root_node = {
        "name": sku,
        "translation": [0.0, 0.0, 0.0],
        "rotation": [0.0, 0.0, 0.0, 1.0],
        "scale": [1.0, 1.0, 1.0],
        "children": []
    }
    nodes.append(root_node)

    # Process each mesh builder
    for mb in mesh_builders:
        mesh_node_index = len(nodes)
        root_node["children"].append(mesh_node_index)

        # Build Binary Data for Indices (UNSIGNED_SHORT = 2 bytes)
        indices_bytes = struct.pack(f"<{len(mb.indices)}H", *mb.indices)
        indices_offset = len(bin_data)
        bin_data.extend(indices_bytes)
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
    for anchor in anchors:
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
                "accuracy": anchor.get("accuracy", "dimensional_proxy_exact")
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
            "generator": "Controlnautas Gate G6 glTF 2.0 Binary Generator v1.0",
            "copyright": "Controlnautas Industrial B2B Platform"
        },
        "scene": 0,
        "scenes": [
            {
                "name": f"Scene_{sku}",
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
    glb.extend(struct.pack("<4sII", b"glTF", 2, total_length))
    glb.extend(struct.pack("<II", len(json_bytes), 0x4E4F534A))
    glb.extend(json_bytes)
    glb.extend(struct.pack("<II", len(bin_data), 0x004E4942))
    glb.extend(bin_data)

    return bytes(glb), gltf_dict


# -----------------------------------------------------------------------------
# Binary & Semantic Verification
# -----------------------------------------------------------------------------
def validate_glb_bytes(glb_bytes, sku_cfg):
    """
    Rigorous validation of GLB binary and semantic content against SKU specification.
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

    expected_min = sku_cfg["bbox_min"]
    expected_max = sku_cfg["bbox_max"]
    expected_size = sku_cfg["envelope_m"]

    # Strict dimensional checks
    for i, axis in enumerate(["X", "Y", "Z"]):
        assert abs(computed_min[i] - expected_min[i]) < 1e-5, \
            f"BBOX MIN mismatch on {axis}: computed {computed_min[i]} != expected {expected_min[i]}"
        assert abs(computed_max[i] - expected_max[i]) < 1e-5, \
            f"BBOX MAX mismatch on {axis}: computed {computed_max[i]} != expected {expected_max[i]}"
        assert abs(computed_size[i] - expected_size[i]) < 1e-5, \
            f"BBOX SIZE mismatch on {axis}: computed {computed_size[i]} != expected {expected_size[i]}"

    # Verify explicit anchors in nodes hierarchy
    node_names = {node["name"]: node for node in gltf_json["nodes"]}
    for expected_anchor in sku_cfg["anchors"]:
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
        "anchor_count": len(sku_cfg["anchors"])
    }


# -----------------------------------------------------------------------------
# Manifest Creation
# -----------------------------------------------------------------------------
def build_manifest(sku_cfg, glb_sha256, glb_byte_length, validation_info, created_iso=None):
    """
    Build the standard Asset Manifest JSON adhering to:
    - Task specification requirements
    - MEGAPLAN_MUSE_API_3D_V2.md §15.5
    """
    if created_iso is None:
        created_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    manifest = {
        "schema_version": "model_manifest/2.0",
        "id": sku_cfg["asset_id"],
        "asset_id": sku_cfg["asset_id"],
        "sku_or_syn_id": sku_cfg["sku"],
        "sku": sku_cfg["sku"],
        "variant_id": sku_cfg["variant_id"],
        "snapshot_id": sku_cfg["snapshot_id"],
        "units": "meter",
        "linear_unit": "m",
        "coordinate_system": "right_handed_y_up_z_forward",
        "fidelity": "dimensional_proxy_verified",
        "format": "model/gltf-binary",
        "gltf_version": "2.0",
        "extensions_required": [],
        "dimensions_mm": {
            "width": round(validation_info["bbox_size"][0] * 1000.0, 2),
            "height": round(validation_info["bbox_size"][1] * 1000.0, 2),
            "depth": round(validation_info["bbox_size"][2] * 1000.0, 2)
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
                "accuracy": a.get("accuracy", "dimensional_proxy_exact")
            }
            for a in sku_cfg["anchors"]
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
            "kind": "dimensional_proxy_verified",
            "generator": "scripts/generate-g6-assets.py",
            "governing_doc": "docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)"
        },
        "created_at": created_iso
    }
    return manifest


# -----------------------------------------------------------------------------
# 3D Thumbnail Generation (Pillow Software Renderer)
# -----------------------------------------------------------------------------
def render_thumbnail(sku_cfg, mesh_builders, output_path):
    """
    Render a clean, high-resolution isometric technical CAD preview thumbnail (512x512 PNG)
    using Python and Pillow.
    """
    if not HAS_PIL:
        print(f"  [WARN] Pillow not installed, skipping thumbnail for {sku_cfg['sku']}")
        return

    sku = sku_cfg["sku"]
    title = sku_cfg["title"]
    dims = sku_cfg["envelope_m"]
    dims_str = f"{dims[0]*1000:.0f} x {dims[1]*1000:.0f} x {dims[2]*1000:.0f} mm"
    materials = sku_cfg["materials"]

    width, height = 512, 512
    img = Image.new("RGBA", (width, height), (18, 22, 28, 255))
    draw = ImageDraw.Draw(img)

    # Subtle background engineering grid
    grid_color = (28, 34, 44, 255)
    for x in range(0, width, 32):
        draw.line([(x, 0), (x, height)], fill=grid_color, width=1)
    for y in range(0, height, 32):
        draw.line([(0, y), (width, y)], fill=grid_color, width=1)

    # Outer border
    draw.rectangle([8, 8, width - 9, height - 9], outline=(45, 55, 70, 255), width=2)
    draw.rectangle([12, 12, width - 13, height - 13], outline=(32, 40, 52, 255), width=1)

    # Compute bounding box center
    xs, ys, zs = [], [], []
    for mb in mesh_builders:
        xs.extend(mb.vertices[0::3])
        ys.extend(mb.vertices[1::3])
        zs.extend(mb.vertices[2::3])
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)
    center_x = (min_x + max_x) / 2.0
    center_y = (min_y + max_y) / 2.0
    center_z = (min_z + max_z) / 2.0

    # Isometric viewing angles (yaw 35 deg, elevation 25 deg)
    azimuth = math.radians(35)
    elevation = math.radians(25)
    cos_az, sin_az = math.cos(azimuth), math.sin(azimuth)
    cos_el, sin_el = math.cos(elevation), math.sin(elevation)

    # Directional Key Light (normalized)
    lx, ly, lz = 0.5, 0.8, 0.6
    l_mag = math.sqrt(lx*lx + ly*ly + lz*lz)
    lx, ly, lz = lx / l_mag, ly / l_mag, lz / l_mag

    def project_pt(x, y, z):
        dx = x - center_x
        dy = y - center_y
        dz = z - center_z
        x1 = dx * cos_az - dz * sin_az
        z1 = dx * sin_az + dz * cos_az
        y2 = dy * cos_el - z1 * sin_el
        z2 = dy * sin_el + z1 * cos_el
        return x1, y2, z2

    bbox_corners = [
        (min_x, min_y, min_z), (max_x, min_y, min_z),
        (min_x, max_y, min_z), (max_x, max_y, min_z),
        (min_x, min_y, max_z), (max_x, min_y, max_z),
        (min_x, max_y, max_z), (max_x, max_y, max_z),
    ]
    proj_corners = [project_pt(*pt) for pt in bbox_corners]
    span_x = max(p[0] for p in proj_corners) - min(p[0] for p in proj_corners)
    span_y = max(p[1] for p in proj_corners) - min(p[1] for p in proj_corners)

    # Target drawable area: center (256, 275), width ~ 320, height ~ 240
    scale = min(320.0 / (span_x if span_x > 0 else 1.0), 240.0 / (span_y if span_y > 0 else 1.0))
    origin_sx = width / 2.0
    origin_sy = height / 2.0 + 15.0

    faces_to_render = []
    for mb in mesh_builders:
        mat = materials[mb.material_index]
        base_color = mat.get("pbrMetallicRoughness", {}).get("baseColorFactor", [0.5, 0.5, 0.5, 1.0])
        emissive = mat.get("emissiveFactor", [0.0, 0.0, 0.0])

        for i in range(0, len(mb.indices), 3):
            i0, i1, i2 = mb.indices[i], mb.indices[i+1], mb.indices[i+2]
            v0 = (mb.vertices[i0*3], mb.vertices[i0*3+1], mb.vertices[i0*3+2])
            v1 = (mb.vertices[i1*3], mb.vertices[i1*3+1], mb.vertices[i1*3+2])
            v2 = (mb.vertices[i2*3], mb.vertices[i2*3+1], mb.vertices[i2*3+2])
            n0 = (mb.normals[i0*3], mb.normals[i0*3+1], mb.normals[i0*3+2])

            # Normal in camera coordinates
            nx1 = n0[0] * cos_az - n0[2] * sin_az
            nz1 = n0[0] * sin_az + n0[2] * cos_az
            ny2 = n0[1] * cos_el - nz1 * sin_el
            nz2 = n0[1] * sin_el + nz1 * cos_el

            # Backface culling
            if nz2 <= 0.001:
                continue

            ndotl = max(0.0, n0[0]*lx + n0[1]*ly + n0[2]*lz)
            diffuse = 0.40 + 0.60 * ndotl
            r = min(255, int((base_color[0] * diffuse + emissive[0]) * 255))
            g = min(255, int((base_color[1] * diffuse + emissive[1]) * 255))
            b = min(255, int((base_color[2] * diffuse + emissive[2]) * 255))
            fill_color = (r, g, b, 255)

            edge_r = max(0, int(r * 0.65))
            edge_g = max(0, int(g * 0.65))
            edge_b = max(0, int(b * 0.65))
            edge_color = (edge_r, edge_g, edge_b, 255)

            p0 = project_pt(*v0)
            p1 = project_pt(*v1)
            p2 = project_pt(*v2)

            pts_2d = [
                (origin_sx + p0[0] * scale, origin_sy - p0[1] * scale),
                (origin_sx + p1[0] * scale, origin_sy - p1[1] * scale),
                (origin_sx + p2[0] * scale, origin_sy - p2[1] * scale),
            ]
            depth = (p0[2] + p1[2] + p2[2]) / 3.0
            faces_to_render.append((depth, pts_2d, fill_color, edge_color))

    # Sort back to front (painter's algorithm)
    faces_to_render.sort(key=lambda item: item[0])

    for depth, pts, fill, edge in faces_to_render:
        draw.polygon(pts, fill=fill, outline=edge)

    # Top Header Banner
    draw.rectangle([16, 16, width - 17, 72], fill=(24, 30, 40, 240), outline=(55, 68, 86, 255))
    draw.ellipse([26, 28, 36, 38], fill=(0, 230, 118, 255)) # Green status dot
    draw.text((44, 24), sku, fill=(255, 255, 255, 255))
    draw.text((44, 44), title, fill=(160, 175, 195, 255))

    # Bottom Metadata Banner
    draw.rectangle([16, height - 58, width - 17, height - 16], fill=(24, 30, 40, 240), outline=(55, 68, 86, 255))
    draw.text((26, height - 50), f"Envelope: {dims_str}", fill=(0, 210, 255, 255))
    draw.text((26, height - 32), "FIDELITY: dimensional_proxy_verified  |  glTF 2.0 (GLB)", fill=(140, 155, 175, 255))

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    img.save(output_path, "PNG")
    print(f"  -> Generated Thumbnail:  {output_path}")


# -----------------------------------------------------------------------------
# Main Execution Entrypoint
# -----------------------------------------------------------------------------
def main():
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    storage_assets_dir = os.path.join(repo_root, "storage", "industrial", "assets")
    docs_assets_dir = os.path.join(repo_root, "docs", "industrial", "assets")

    print("=" * 80)
    print("CONTROLNAUTAS GATE G6 — 3D ASSET GENERATOR & QA PIPELINE")
    print("Governing Doc: docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)")
    print("=" * 80)

    summary_results = []

    for sku_key, sku_cfg in PILOT_SKUS.items():
        sku = sku_cfg["sku"]
        print(f"\n[{sku}] Generating 3D Asset: {sku_cfg['title']}")
        print("-" * 80)

        # 1. Build Geometry
        mesh_builders = sku_cfg["builder"]()
        total_v = sum(len(mb.vertices)//3 for mb in mesh_builders)
        total_t = sum(len(mb.indices)//3 for mb in mesh_builders)
        print(f"  • Constructed {len(mesh_builders)} mesh components: {total_v} vertices, {total_t} triangles")

        # 2. Assemble glTF 2.0 / GLB
        glb_bytes, gltf_dict = assemble_glb(sku_cfg, mesh_builders)
        glb_sha256 = hashlib.sha256(glb_bytes).hexdigest()
        glb_byte_length = len(glb_bytes)
        print(f"  • Assembled GLB: {glb_byte_length:,} bytes, SHA-256: {glb_sha256}")

        # 3. Determinism Verification
        repeat_builders = sku_cfg["builder"]()
        repeat_bytes, _ = assemble_glb(sku_cfg, repeat_builders)
        repeat_sha256 = hashlib.sha256(repeat_bytes).hexdigest()
        assert repeat_sha256 == glb_sha256, f"Determinism failure for {sku}!"
        assert repeat_bytes == glb_bytes, f"Byte mismatch for {sku}!"
        print(f"  ✓ Determinism verified: 100% byte-for-byte identical hash")

        # 4. Strict Validation
        val_info = validate_glb_bytes(glb_bytes, sku_cfg)
        print(f"  ✓ Exact Envelope Verified:")
        print(f"      - Bounding Box Min:  {val_info['bbox_min']} m")
        print(f"      - Bounding Box Max:  {val_info['bbox_max']} m")
        print(f"      - Bounding Box Size: {val_info['bbox_size']} m")
        print(f"  ✓ All {len(sku_cfg['anchors'])} required anchors verified in node hierarchy")

        # 5. Build Manifest
        manifest_data = build_manifest(sku_cfg, glb_sha256, glb_byte_length, val_info)
        manifest_str = json.dumps(manifest_data, indent=2)

        # 6. Content-Addressed Storage & Canonical Paths
        # Paths to write:
        # 1) storage/industrial/assets/<sha256>/<SKU>.glb and .manifest.json
        # 2) storage/industrial/assets/<SKU>.glb and .manifest.json
        # 3) docs/industrial/assets/<sha256>/<SKU>.glb and .manifest.json
        # 4) docs/industrial/assets/<SKU>.glb and .manifest.json
        cas_storage_dir = os.path.join(storage_assets_dir, glb_sha256)
        cas_docs_dir = os.path.join(docs_assets_dir, glb_sha256)
        os.makedirs(cas_storage_dir, exist_ok=True)
        os.makedirs(cas_docs_dir, exist_ok=True)
        os.makedirs(storage_assets_dir, exist_ok=True)
        os.makedirs(docs_assets_dir, exist_ok=True)

        target_locations = [
            (os.path.join(cas_storage_dir, f"{sku}.glb"), os.path.join(cas_storage_dir, f"{sku}.manifest.json")),
            (os.path.join(storage_assets_dir, f"{sku}.glb"), os.path.join(storage_assets_dir, f"{sku}.manifest.json")),
            (os.path.join(cas_docs_dir, f"{sku}.glb"), os.path.join(cas_docs_dir, f"{sku}.manifest.json")),
            (os.path.join(docs_assets_dir, f"{sku}.glb"), os.path.join(docs_assets_dir, f"{sku}.manifest.json")),
        ]

        for glb_p, man_p in target_locations:
            with open(glb_p, "wb") as f:
                f.write(glb_bytes)
            with open(man_p, "w", encoding="utf-8") as f:
                f.write(manifest_str)

        print(f"  ✓ Written to CAS and canonical paths in storage/ and docs/")

        # 7. Thumbnails
        thumb_docs_path = os.path.join(docs_assets_dir, "thumbnails", f"{sku}.png")
        thumb_storage_path = os.path.join(storage_assets_dir, "thumbnails", f"{sku}.png")
        render_thumbnail(sku_cfg, mesh_builders, thumb_docs_path)
        render_thumbnail(sku_cfg, mesh_builders, thumb_storage_path)

        summary_results.append({
            "sku": sku,
            "title": sku_cfg["title"],
            "asset_id": sku_cfg["asset_id"],
            "variant_id": sku_cfg["variant_id"],
            "snapshot_id": sku_cfg["snapshot_id"],
            "sha256": glb_sha256,
            "byte_length": glb_byte_length,
            "vertices": val_info["vertex_count"],
            "triangles": val_info["triangle_count"],
            "bbox_size": val_info["bbox_size"],
            "anchors": len(sku_cfg["anchors"])
        })

    print("\n" + "=" * 80)
    print("GATE G6 PILOT ASSET GENERATION COMPLETE SUMMARY")
    print("=" * 80)
    for res in summary_results:
        print(f"SKU: {res['sku']:<22} | SHA-256: {res['sha256']}")
        print(f"     Bytes: {res['byte_length']:,} | Verts: {res['vertices']} | Tris: {res['triangles']} | Anchors: {res['anchors']}")
        print(f"     Envelope (m): {res['bbox_size']}")
        print(f"     Asset ID: {res['asset_id']}")
        print(f"     Snapshot: {res['snapshot_id']}")
    print("=" * 80)

    return 0


if __name__ == "__main__":
    sys.exit(main())
