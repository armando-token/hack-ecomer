import { TechnicalSnapshot, TechnicalSnapshotSchema } from "../schemas/snapshot.schema"
import { canonicalContentSha256 } from "../hash"

export interface G4SnapshotDefinition {
  snapshot: TechnicalSnapshot
  catalogEntryId: string
  catalogMode: "production" | "real" | "synthetic_demo" | "active_reviewed"
}

function buildCanonicalSnapshot(data: Omit<TechnicalSnapshot, "content_sha256">): TechnicalSnapshot {
  const hash = canonicalContentSha256(data)
  const complete = {
    ...data,
    content_sha256: hash,
  }
  return TechnicalSnapshotSchema.parse(complete)
}

/**
 * 1. Horner Automation X5 Prime OCS (HE-XP5)
 * Official Datasheet: MAN1363 R21 (SRC-HE-XP5-DS-MAN1363-R21)
 * Dimensions: 120mm x 91mm x 60mm -> [0.120, 0.091, 0.060] m
 */
export const HORNER_X5_SNAPSHOT: TechnicalSnapshot = buildCanonicalSnapshot({
  snapshot_id: "snp_cn_x5prime_he_xp5_v1",
  variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
  sku: "CN-X5PRIME-HE-XP5",
  manufacturer: "Horner Automation",
  manufacturer_part_number: "HE-XP5",
  technical_revision: "rev_2026_g4",
  schema_version: "technical_snapshot/2.0",
  state: "published",
  published_at: "2026-10-03T21:30:00Z",
  reviewed_by: "engineer_review",
  applicability: "standard_hardware",
  source_ids: ["SRC-HE-XP5-DS-MAN1363-R21"],
  dimensions: {
    width_mm: 120.0,
    height_mm: 91.0,
    depth_mm: 60.0,
    envelope_m: [0.120, 0.091, 0.060],
  },
  mounting: ["panel_mount", "din_rail_clip"],
  capabilities: [
    "plc_logic_controller",
    "hmi_color_touchscreen",
    "modbus_rtu_master",
    "modbus_rtu_slave",
    "modbus_tcp_client_server",
    "data_alarm_logging_microsd",
  ],
  ports: [
    {
      port_id: "p_power_in",
      label: "Primary DC Power Input (10-30 VDC)",
      category: "power",
      direction: "input",
      signal_type: "power_dc",
      terminals: [
        { label: "V+", function: "DC Positive Input (10-30 VDC)" },
        { label: "V-", function: "DC Ground / Common Return" },
      ],
    },
    {
      port_id: "p_rs485_mj1",
      label: "RS-485 Serial Communication Port (MJ1 / MJ2)",
      category: "serial_comm",
      direction: "bidirectional",
      signal_type: "rs485",
      terminals: [
        { label: "TX/RX+", function: "RS-485 Data+ (A)" },
        { label: "TX/RX-", function: "RS-485 Data- (B)" },
        { label: "GND", function: "Signal Ground" },
      ],
    },
    {
      port_id: "p_ethernet_lan",
      label: "Ethernet 10/100 LAN Port",
      category: "ethernet",
      direction: "bidirectional",
      signal_type: "ethernet_10_100",
      terminals: [
        { label: "RJ45", function: "10/100 Mbps RJ45 Connector" },
      ],
    },
    {
      port_id: "p_analog_in",
      label: "Built-in Analog Inputs (Channels 1-4)",
      category: "analog_input",
      direction: "input",
      signal_type: "analog_0_10v_4_20ma",
      terminals: [
        { label: "AI1", function: "Analog Input 1 (0-10V / 4-20mA)" },
        { label: "AI2", function: "Analog Input 2 (0-10V / 4-20mA)" },
        { label: "AI3", function: "Analog Input 3 (0-10V / 4-20mA)" },
        { label: "AI4", function: "Analog Input 4 (0-10V / 4-20mA)" },
        { label: "AGND", function: "Analog Common Ground" },
      ],
    },
    {
      port_id: "p_digital_in",
      label: "Built-in Digital DC Inputs (Channels 1-4)",
      category: "discrete_input",
      direction: "input",
      signal_type: "digital_dc_12_24v",
      terminals: [
        { label: "DI1", function: "Digital Input 1 (12-24 VDC)" },
        { label: "DI2", function: "Digital Input 2 (12-24 VDC)" },
        { label: "DI3", function: "Digital Input 3 (12-24 VDC)" },
        { label: "DI4", function: "Digital Input 4 (12-24 VDC)" },
        { label: "C", function: "Digital Input Common" },
      ],
    },
    {
      port_id: "p_digital_out",
      label: "Built-in Digital DC Outputs (Channels 1-4)",
      category: "discrete_output",
      direction: "output",
      signal_type: "transistor_sourcing_0_5a",
      terminals: [
        { label: "Q1", function: "Digital Sourcing Output 1 (0.5A @ 24VDC)" },
        { label: "Q2", function: "Digital Sourcing Output 2 (0.5A @ 24VDC)" },
        { label: "Q3", function: "Digital Sourcing Output 3 (0.5A @ 24VDC)" },
        { label: "Q4", function: "Digital Sourcing Output 4 (0.5A @ 24VDC)" },
        { label: "V+", function: "Output Power Supply Source" },
      ],
    },
  ],
  attributes: [
    {
      attribute_id: "attr_x5_supply_voltage",
      property: "supply_voltage",
      scope: "equipment",
      value: { kind: "range", min: 10, max: 30, unit: "V", nature: "dc" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 1,
          section: "Power Wiring / Primary Power Range",
          excerpt: "Primary Power Range 10 VDC to 30 VDC",
        },
      ],
    },
    {
      attribute_id: "attr_x5_supply_nature",
      property: "supply_nature",
      scope: "equipment",
      value: { kind: "enum", value: "dc" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 1,
          section: "General Specifications",
          excerpt: "Primary Power: 10-30 VDC",
        },
      ],
    },
    {
      attribute_id: "attr_x5_input_signals",
      property: "input_signals",
      scope: "equipment",
      value: { kind: "enum_set", value: ["digital_dc", "analog_0_10v", "analog_4_20ma"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 6,
          section: "Digital DC Inputs & Analog Inputs",
          excerpt: "4 Digital DC Inputs, 4 Analog Inputs configurable",
        },
      ],
    },
    {
      attribute_id: "attr_x5_sensor_compat",
      property: "sensor_compatibility",
      scope: "equipment",
      value: { kind: "enum_set", value: ["analog_transmitter_4_20ma", "analog_transmitter_0_10v", "modbus_rtu_sensor"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 7,
          section: "Analog Inputs Specifications",
          excerpt: "0-10 VDC, 4-20 mA via external shunt / configuration",
        },
      ],
    },
    {
      attribute_id: "attr_x5_output_capacities",
      property: "output_capacities",
      scope: "equipment",
      value: { kind: "text", value: "4x Digital Sourcing 0.5A @ 24VDC; 0 dedicated analog outputs" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 8,
          section: "Digital DC Outputs",
          excerpt: "0.5A per channel at 24VDC sourcing",
        },
      ],
    },
    {
      attribute_id: "attr_x5_comm_protocols",
      property: "communication_protocols",
      scope: "equipment",
      value: { kind: "enum_set", value: ["modbus_rtu_master", "modbus_rtu_slave", "modbus_tcp", "cscan"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 12,
          section: "Serial Communications",
          excerpt: "RS-485 Modbus RTU master/slave, CsCAN, Ethernet",
        },
      ],
    },
    {
      attribute_id: "attr_x5_comm_roles",
      property: "communication_roles",
      scope: "equipment",
      value: { kind: "enum_set", value: ["master", "slave", "client", "server"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 12,
          section: "Serial Communications",
          excerpt: "Selectable Master / Slave mode",
        },
      ],
    },
    {
      attribute_id: "attr_x5_baud_rates",
      property: "baud_rates",
      scope: "port",
      value: { kind: "enum_set", value: ["9600", "19200", "38400", "57600", "115200"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 12,
          section: "Serial Communications",
          excerpt: "Baud rate configurable up to 115200 bps",
        },
      ],
    },
    {
      attribute_id: "attr_x5_mounting_style",
      property: "mounting_style",
      scope: "equipment",
      value: { kind: "enum", value: "panel_mount" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 15,
          section: "Dimensions and Installation",
          excerpt: "Panel cut-out 119mm x 90mm with clip mounting",
        },
      ],
    },
    {
      attribute_id: "attr_x5_physical_dims",
      property: "physical_dimensions",
      scope: "equipment",
      value: { kind: "text", value: "120 mm (W) x 91 mm (H) x 60 mm (D)" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-HE-XP5-DS-MAN1363-R21",
          page: 15,
          section: "Dimensions and Installation",
          excerpt: "X5 & X5 Prime Dimensions 120 x 91 x 60 mm",
        },
      ],
    },
  ],
})

/**
 * 2. NOVUS Automation N1200 Universal Process Controller
 * Official User Guide: N1200 UG V2.0xQ (SRC-N1200-UG-V2)
 * Dimensions: 48mm x 48mm x 110mm -> [0.048, 0.048, 0.110] m
 */
export const NOVUS_N1200_SNAPSHOT: TechnicalSnapshot = buildCanonicalSnapshot({
  snapshot_id: "snp_cn_n1200_v1",
  variant_id: "variant_01M41R18XQ6QNWMX8Z39NMR2NW",
  sku: "CN-N1200",
  manufacturer: "NOVUS Automation",
  manufacturer_part_number: "N1200",
  technical_revision: "rev_2026_g4",
  schema_version: "technical_snapshot/2.0",
  state: "published",
  published_at: "2026-10-03T21:30:00Z",
  reviewed_by: "engineer_review",
  applicability: "standard_universal_model",
  source_ids: ["SRC-N1200-UG-V2"],
  dimensions: {
    width_mm: 48.0,
    height_mm: 48.0,
    depth_mm: 110.0,
    envelope_m: [0.048, 0.048, 0.110],
  },
  mounting: ["1/16_din_panel_mount"],
  capabilities: [
    "pid_temperature_controller",
    "self_tuning_adaptive_pid",
    "universal_sensor_input",
    "ssr_drive_pulse_output",
    "relay_control_output",
    "analog_retransmission_4_20ma",
    "modbus_rtu_usb_serial",
  ],
  ports: [
    {
      port_id: "p_power_in",
      label: "Universal Mains Power Input (100-240 VAC/DC)",
      category: "power",
      direction: "input",
      signal_type: "power_ac_dc",
      terminals: [
        { label: "1", function: "Power Line / Positive (100-240 VAC/DC)" },
        { label: "2", function: "Power Neutral / Negative" },
      ],
    },
    {
      port_id: "p_universal_sensor_in",
      label: "Universal Process Sensor Input (Pt100 / TC / 4-20mA / 0-50mV)",
      category: "sensor",
      direction: "input",
      signal_type: "universal_sensor",
      terminals: [
        { label: "11", function: "Input Signal (+) / TC+ / Pt100 wire 1 / mA+" },
        { label: "12", function: "Input Signal (-) / TC- / Pt100 wire 2 / mA-" },
        { label: "13", function: "Pt100 Compensation wire 3" },
      ],
    },
    {
      port_id: "p_out1_control",
      label: "Output 1 (SSR Pulse Drive or SPST Relay)",
      category: "discrete_output",
      direction: "output",
      signal_type: "ssr_drive_or_relay",
      terminals: [
        { label: "4", function: "OUT1 Positive / Relay Terminal 1" },
        { label: "5", function: "OUT1 Negative / Relay Terminal 2" },
      ],
    },
    {
      port_id: "p_out2_alarm",
      label: "Output 2 (SPST Relay 1.5A / 250VAC)",
      category: "discrete_output",
      direction: "output",
      signal_type: "relay_contact_1_5a",
      terminals: [
        { label: "6", function: "OUT2 Relay Contact A" },
        { label: "7", function: "OUT2 Relay Contact B" },
      ],
    },
    {
      port_id: "p_out3_alarm",
      label: "Output 3 (SPDT Relay 3A / 250VAC)",
      category: "discrete_output",
      direction: "output",
      signal_type: "relay_contact_3a",
      terminals: [
        { label: "8", function: "OUT3 Common" },
        { label: "9", function: "OUT3 NO (Normally Open)" },
        { label: "10", function: "OUT3 NC (Normally Closed)" },
      ],
    },
    {
      port_id: "p_analog_out_retrans",
      label: "Analog Output / Retransmission (0-20mA / 4-20mA)",
      category: "analog_output",
      direction: "output",
      signal_type: "current_4_20ma",
      terminals: [
        { label: "9", function: "Analog Output (+)" },
        { label: "10", function: "Analog Output (-)" },
      ],
    },
    {
      port_id: "p_usb_comm",
      label: "USB Mini-B Serial Configuration Interface (Modbus RTU)",
      category: "serial_comm",
      direction: "bidirectional",
      signal_type: "usb_modbus_rtu",
      terminals: [
        { label: "USB_D+", function: "USB Data Plus" },
        { label: "USB_D-", function: "USB Data Minus" },
        { label: "USB_GND", function: "USB Ground" },
      ],
    },
  ],
  attributes: [
    {
      attribute_id: "attr_n1200_supply_voltage",
      property: "supply_voltage",
      scope: "equipment",
      value: { kind: "range", min: 100, max: 240, unit: "V", nature: "ac" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.2.1 Power Supply Connections",
          excerpt: "Supply: 100 to 240 Vac/dc (± 10 %), 50/60 Hz",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_supply_nature",
      property: "supply_nature",
      scope: "equipment",
      value: { kind: "enum", value: "ac" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.2.1 Power Supply Connections",
          excerpt: "Universal power supply 100-240 Vac/dc",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_input_signals",
      property: "input_signals",
      scope: "equipment",
      value: { kind: "enum_set", value: ["rtd_pt100", "thermocouple_j_k_t", "voltage_0_50mv", "current_4_20ma", "voltage_0_10v"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.2.2 Input Connections",
          excerpt: "Thermocouple (T/C), RTD (Pt100 3-wire), 4-20 mA and 0-50 mV",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_sensor_compat",
      property: "sensor_compatibility",
      scope: "equipment",
      value: { kind: "enum_set", value: ["pt100_3_wire", "thermocouple_k", "thermocouple_j", "current_4_20ma"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.2.2 Input Connections",
          excerpt: "Pt100 wiring for 3 conductors; Thermocouples J, K, T",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_output_capacities",
      property: "output_capacities",
      scope: "equipment",
      value: { kind: "text", value: "SSR drive 5V / 50mA; Relay SPST 1.5A/250VAC; Relay SPDT 3A/250VAC; Analog 4-20mA (550 ohm max)" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 15,
          section: "4.2.5 Alarms and Outputs Connections",
          excerpt: "Relay, 4-20 mA and logic pulse outputs for SSR",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_comm_protocols",
      property: "communication_protocols",
      scope: "equipment",
      value: { kind: "enum_set", value: ["modbus_rtu"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 12,
          section: "3.13 USB Interface",
          excerpt: "USB serial recognized as Modbus RTU COM port",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_comm_roles",
      property: "communication_roles",
      scope: "equipment",
      value: { kind: "enum", value: "slave" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 12,
          section: "3.13 USB Interface",
          excerpt: "Modbus RTU slave for configuration and monitoring",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_baud_rates",
      property: "baud_rates",
      scope: "port",
      value: { kind: "enum_set", value: ["9600", "19200", "38400", "57600", "115200"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 12,
          section: "3.13 USB Interface",
          excerpt: "Configurable baud rates up to 115200 bps",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_mounting_style",
      property: "mounting_style",
      scope: "equipment",
      value: { kind: "enum", value: "panel_mount" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.1 Installation Recommendations",
          excerpt: "1/16 DIN panel mount (45.5 x 45.5 mm cutout)",
        },
      ],
    },
    {
      attribute_id: "attr_n1200_physical_dims",
      property: "physical_dimensions",
      scope: "equipment",
      value: { kind: "text", value: "48 mm (W) x 48 mm (H) x 110 mm (D)" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-N1200-UG-V2",
          page: 14,
          section: "4.1 Installation Recommendations",
          excerpt: "Dimensions 48 x 48 x 110 mm",
        },
      ],
    },
  ],
})

/**
 * 3. TZ / TZone Digital THT-02 Environmental Transmitter
 * Official User Manual: THT-02 User's Manual V1.1 (SRC-THT02-UM-V1.1)
 * Dimensions: 110mm x 85mm x 40mm -> [0.110, 0.085, 0.040] m
 */
export const TZONE_THT02_SNAPSHOT: TechnicalSnapshot = buildCanonicalSnapshot({
  snapshot_id: "snp_cn_tht02_v1",
  variant_id: "variant_01M41R193J5MPJ16MTX9CAWWRM",
  sku: "CN-THT02",
  manufacturer: "TZ / Tzone",
  manufacturer_part_number: "THT-02",
  technical_revision: "rev_2026_g4",
  schema_version: "technical_snapshot/2.0",
  state: "published",
  published_at: "2026-10-03T21:30:00Z",
  reviewed_by: "engineer_review",
  applicability: "standard_environmental_transmitter",
  source_ids: ["SRC-THT02-UM-V1.1"],
  dimensions: {
    width_mm: 110.0,
    height_mm: 85.0,
    depth_mm: 40.0,
    envelope_m: [0.110, 0.085, 0.040],
  },
  mounting: ["wall_mount", "chamber_mount"],
  capabilities: [
    "temperature_sensing_sht30",
    "relative_humidity_sensing_sht30",
    "rs485_modbus_rtu_slave",
    "dip_switch_addressing",
  ],
  ports: [
    {
      port_id: "p_power_in",
      label: "DC Power Supply Input (5-24 VDC)",
      category: "power",
      direction: "input",
      signal_type: "power_dc",
      terminals: [
        { label: "V+", function: "Power supply positive (DC 5-24V, Red lead)" },
        { label: "GND", function: "Public ground / DC negative (Black lead)" },
      ],
    },
    {
      port_id: "p_rs485",
      label: "RS-485 Modbus RTU Interface",
      category: "serial_comm",
      direction: "bidirectional",
      signal_type: "rs485",
      terminals: [
        { label: "A+", function: "RS-485 interface A+ (Yellow lead)" },
        { label: "B-", function: "RS-485 interface B- (Green lead)" },
      ],
    },
    {
      port_id: "p_sensor_sht30",
      label: "Internal SHT30 Sensing Probe",
      category: "sensor",
      direction: "input",
      signal_type: "integrated_environmental",
      terminals: [
        { label: "TEMP", function: "Internal temperature sensor (-40 to 125 °C)" },
        { label: "HUMID", function: "Internal relative humidity sensor (5 to 95 %RH)" },
      ],
    },
  ],
  attributes: [
    {
      attribute_id: "attr_tht02_supply_voltage",
      property: "supply_voltage",
      scope: "equipment",
      value: { kind: "range", min: 5, max: 24, unit: "V", nature: "dc" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 3,
          section: "4.1 Power supply",
          excerpt: "Supply voltage DC 5～24V, Current 5mA",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_supply_nature",
      property: "supply_nature",
      scope: "equipment",
      value: { kind: "enum", value: "dc" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 3,
          section: "4.1 Power supply",
          excerpt: "Supply voltage DC 5～24V",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_input_signals",
      property: "input_signals",
      scope: "equipment",
      value: { kind: "enum_set", value: ["ambient_temperature", "relative_humidity"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 2,
          section: "1 Overview",
          excerpt: "The THT-02 sensitive element uses SHT30",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_sensor_compat",
      property: "sensor_compatibility",
      scope: "equipment",
      value: { kind: "enum_set", value: ["integrated_sht30"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 3,
          section: "4.4 Temperature parameter",
          excerpt: "Sensing element SHT30; Measuring range -40～125℃",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_output_capacities",
      property: "output_capacities",
      scope: "equipment",
      value: { kind: "text", value: "0 analog outputs; telemetry transmitted via RS-485 Modbus RTU holding registers" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 2,
          section: "1 Overview",
          excerpt: "RS-485 communication interface compatible with standard Modbus-RTU",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_comm_protocols",
      property: "communication_protocols",
      scope: "equipment",
      value: { kind: "enum_set", value: ["modbus_rtu"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 2,
          section: "1 Overview",
          excerpt: "Standard Modbus-RTU protocol",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_comm_roles",
      property: "communication_roles",
      scope: "equipment",
      value: { kind: "enum", value: "slave" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 2,
          section: "1 Overview",
          excerpt: "Can be connected to Modbus network as slave",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_baud_rates",
      property: "baud_rates",
      scope: "port",
      value: { kind: "enum_set", value: ["4800", "9600", "19200"] },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 3,
          section: "4.2 RS-485 interface",
          excerpt: "Transmission rate optional 4800bps / 9600bps / 19200bps",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_mounting_style",
      property: "mounting_style",
      scope: "equipment",
      value: { kind: "enum", value: "wall_mount" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 2,
          section: "3 Application areas",
          excerpt: "HVAC, building automation, storage and chamber monitoring",
        },
      ],
    },
    {
      attribute_id: "attr_tht02_physical_dims",
      property: "physical_dimensions",
      scope: "equipment",
      value: { kind: "text", value: "110 mm (W) x 85 mm (H) x 40 mm (D)" },
      data_status: "documented",
      evidence_refs: [
        {
          source_id: "SRC-THT02-UM-V1.1",
          page: 4,
          section: "4.8 Physical Specifications",
          excerpt: "Chamber enclosure dimensions 110 x 85 x 40 mm approx",
        },
      ],
    },
  ],
})

export interface G4AssetDefinition {
  id: string
  variant_id: string
  snapshot_id: string
  kind: "datasheet_pdf"
  revision: number
  sha256: string
  bytes: number
  mime: string
  storage_key: string
  visibility: "public"
  state: "active"
  manifest_json: Record<string, any>
}

export interface G4BindingDefinition {
  id: string
  snapshot_id: string
  asset_id: string
  binding_kind: "datasheet"
}

export const G4_SNAPSHOTS: Record<string, TechnicalSnapshot> = {
  "CN-X5PRIME-HE-XP5": HORNER_X5_SNAPSHOT,
  "CN-N1200": NOVUS_N1200_SNAPSHOT,
  "CN-THT02": TZONE_THT02_SNAPSHOT,
}

export const G4_DEFINITIONS: G4SnapshotDefinition[] = [
  {
    snapshot: HORNER_X5_SNAPSHOT,
    catalogEntryId: "cat_cn_x5prime_he_xp5",
    catalogMode: "active_reviewed",
  },
  {
    snapshot: NOVUS_N1200_SNAPSHOT,
    catalogEntryId: "cat_cn_n1200",
    catalogMode: "active_reviewed",
  },
  {
    snapshot: TZONE_THT02_SNAPSHOT,
    catalogEntryId: "cat_cn_tht02",
    catalogMode: "active_reviewed",
  },
]

export const G4_ASSET_DEFINITIONS: G4AssetDefinition[] = [
  {
    id: "ast_cn_x5prime_he_xp5_ds_v1",
    variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
    snapshot_id: "snp_cn_x5prime_he_xp5_v1",
    kind: "datasheet_pdf",
    revision: 1,
    sha256: "70278736e6b8f3ab170876274a02a3ba7be0942bc2b0995bf7d5742f8bd1d742",
    bytes: 2220450,
    mime: "application/pdf",
    storage_key: "datasheets/CN-X5PRIME-HE-XP5.pdf",
    visibility: "public",
    state: "active",
    manifest_json: {
      schema_version: "asset_manifest/2.0",
      sku: "CN-X5PRIME-HE-XP5",
      file_name: "CN-X5PRIME-HE-XP5.pdf",
      document_title: "X5 Prime OCS Datasheet MAN1363 R21",
      pages: 18,
      manufacturer: "Horner Automation",
      source_id: "SRC-HE-XP5-DS-MAN1363-R21",
    },
  },
  {
    id: "ast_cn_n1200_ds_v1",
    variant_id: "variant_01M41R18XQ6QNWMX8Z39NMR2NW",
    snapshot_id: "snp_cn_n1200_v1",
    kind: "datasheet_pdf",
    revision: 1,
    sha256: "53384720600d70cdce641350c30b0b86ad5e44a8b37291dbaef8ee0852f86554",
    bytes: 1280893,
    mime: "application/pdf",
    storage_key: "datasheets/CN-N1200.pdf",
    visibility: "public",
    state: "active",
    manifest_json: {
      schema_version: "asset_manifest/2.0",
      sku: "CN-N1200",
      file_name: "CN-N1200.pdf",
      document_title: "NOVUS N1200 Controller User Guide V2.0x Q",
      pages: 63,
      manufacturer: "NOVUS Automation",
      source_id: "SRC-N1200-UG-V2",
    },
  },
  {
    id: "ast_cn_tht02_ds_v1",
    variant_id: "variant_01M41R193J5MPJ16MTX9CAWWRM",
    snapshot_id: "snp_cn_tht02_v1",
    kind: "datasheet_pdf",
    revision: 1,
    sha256: "48718e71596413492f2a871e520c1567e6fe1e8abe05b89822a0f21e091e6a7c",
    bytes: 671763,
    mime: "application/pdf",
    storage_key: "datasheets/CN-THT02.pdf",
    visibility: "public",
    state: "active",
    manifest_json: {
      schema_version: "asset_manifest/2.0",
      sku: "CN-THT02",
      file_name: "CN-THT02.pdf",
      document_title: "TZ THT-02 Temperature and Humidity Sensor User's Manual V1.1",
      pages: 9,
      manufacturer: "TZone Digital",
      source_id: "SRC-THT02-UM-V1.1",
    },
  },
]

export const G4_BINDING_DEFINITIONS: G4BindingDefinition[] = [
  {
    id: "asb_cn_x5prime_he_xp5_ds_v1",
    snapshot_id: "snp_cn_x5prime_he_xp5_v1",
    asset_id: "ast_cn_x5prime_he_xp5_ds_v1",
    binding_kind: "datasheet",
  },
  {
    id: "asb_cn_n1200_ds_v1",
    snapshot_id: "snp_cn_n1200_v1",
    asset_id: "ast_cn_n1200_ds_v1",
    binding_kind: "datasheet",
  },
  {
    id: "asb_cn_tht02_ds_v1",
    snapshot_id: "snp_cn_tht02_v1",
    asset_id: "ast_cn_tht02_ds_v1",
    binding_kind: "datasheet",
  },
]

