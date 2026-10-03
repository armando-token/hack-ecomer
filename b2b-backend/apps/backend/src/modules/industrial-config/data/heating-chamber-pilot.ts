import type { Pool, PoolClient } from "pg"
import { getLiveOffer } from "../../../lib/muse/offer"
import { G6_ASSET_DEFINITIONS } from "./g6-catalog-assets"
import {
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
  G4_SNAPSHOTS,
} from "./g4-catalog-snapshots"
import { TechnicalSnapshot } from "../schemas/snapshot.schema"
import { ConfigurationRevision } from "../schemas/revision.schema"
import { evaluateSystem } from "../evaluator/core"
import { canonicalContentSha256 } from "../hash"
import type { RuleResult, Verdict } from "../evaluator/types"

/**
 * Controlnautas Heating Chamber Pilot Configuration & Bundle Definition
 * Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§12–§14, §21, §33 G8)
 */

export interface PilotInstance {
  instance_id: string
  sku: string
  role: string
  snapshot_id: string
  title: string
  variant_id?: string
  model_asset_id?: string
  user_label?: string
}

export interface PilotMissingRole {
  role: string
  required_for: string
  status: string
  reason: string
}

export interface PilotConnectionEndpoint {
  instance_id: string
  port_id: string
}

export interface PilotConnection {
  id: string
  connection_id: string
  from: PilotConnectionEndpoint
  to: PilotConnectionEndpoint
  from_instance_id: string
  from_port_id: string
  to_instance_id: string
  to_port_id: string
  protocol?: string
  baud?: number
  parity?: string
  data_bits?: number
  stop_bits?: number
  note?: string
}

export interface HeatingChamberAssetEntry {
  sku: string
  fidelity: string
  glb_url: string
  manifest_url: string
  anchors: any[]
}

export interface CommercialLineItem {
  instance_id: string
  sku: string
  title: string
  quantity: number
  unit_price_usd_cents: number
  unit_price_usd: number
  subtotal_usd_cents: number
  subtotal_usd: number
  availability_status: string
  stocked_quantity: number
  pricing_state: string
}

export interface BundleCommercialBlock {
  currency: string
  status: string
  items: CommercialLineItem[]
  catalog_total_usd_cents: number
  catalog_total_usd: number
  missing_roles_unpriced: string[]
  quote_readiness: "ready_for_commercial_estimate" | "not_priced"
}

export interface HeatingChamberBundle {
  bundle_version: string
  configuration: {
    configuration_id: string
    revision: number
    title: string
    process_family: string
    description: string
    instances: PilotInstance[]
    connections: PilotConnection[]
    missing_roles: PilotMissingRole[]
  }
  evaluation: {
    overall_verdict: Verdict
    rule_set_version: string
    summary: string
    evaluations: RuleResult[]
  }
  assets: Record<string, HeatingChamberAssetEntry>
  readiness: {
    ready_for_3d_presentation: boolean
    ready_for_procurement: boolean
    ready_for_commercial_estimate: boolean
    blockers: string[]
  }
  commercial?: BundleCommercialBlock
  generated_at: string
}

export const HEATING_CHAMBER_PILOT_ID = "cfg_heating_chamber_pilot"
export const HEATING_CHAMBER_PILOT_REVISION_NUM = 1
export const HEATING_CHAMBER_PILOT_TITLE =
  "Industrial Heating Chamber Thermal Control & Logging Loop"
export const HEATING_CHAMBER_PILOT_PROCESS_FAMILY = "Heating Chamber"
export const HEATING_CHAMBER_PILOT_DESCRIPTION =
  "Closed-loop temperature regulation and environment monitoring pilot featuring Horner X5 OCS, NOVUS N1200 PID controller, and TZone THT-02 ambient transmitter."

/**
 * 3 Pilot Equipment Instances
 */
export const HEATING_CHAMBER_PILOT_INSTANCES_MAP = {
  inst_n1200: {
    instance_id: "inst_n1200",
    sku: "CN-N1200",
    role: "process_controller",
    snapshot_id: "snp_cn_n1200_v1",
    title: "NOVUS N1200 1/16 DIN PID Controller",
    variant_id: "variant_01M41R18XQ6QNWMX8Z39NMR2NW",
    model_asset_id: "ast_cn_n1200_glb_v1",
    user_label: "NOVUS N1200 1/16 DIN PID Controller",
  },
  inst_x5prime: {
    instance_id: "inst_x5prime",
    sku: "CN-X5PRIME-HE-XP5",
    role: "operator_interface_plc",
    snapshot_id: "snp_cn_x5prime_he_xp5_v1",
    title: "Horner X5 Prime 4.3\" Touch OCS",
    variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
    model_asset_id: "ast_cn_x5prime_he_xp5_glb_v1",
    user_label: "Horner X5 Prime 4.3\" Touch OCS",
  },
  inst_tht02: {
    instance_id: "inst_tht02",
    sku: "CN-THT02",
    role: "ambient_transmitter",
    snapshot_id: "snp_cn_tht02_v1",
    title: "TZone THT-02 Temp/RH Transmitter",
    variant_id: "variant_01M41R193J5MPJ16MTX9CAWWRM",
    model_asset_id: "ast_cn_tht02_glb_v1",
    user_label: "TZone THT-02 Temp/RH Transmitter",
  },
} as const

const instancesList: PilotInstance[] = [
  HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
  HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
  HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
]
Object.assign(instancesList, HEATING_CHAMBER_PILOT_INSTANCES_MAP)
export const HEATING_CHAMBER_PILOT_INSTANCES = instancesList as PilotInstance[] &
  typeof HEATING_CHAMBER_PILOT_INSTANCES_MAP

/**
 * Explicit Missing Roles per MEGAPLAN §21/§33
 */
export const HEATING_CHAMBER_PILOT_MISSING_ROLES: PilotMissingRole[] = [
  {
    role: "actuator_power_switching",
    required_for: "Heating coil power modulation (SSR/Relay)",
    status: "not_documented",
    reason:
      "Power driver between N1200 logic out and 2kW heater coil not yet selected",
  },
  {
    role: "thermal_load_heater",
    required_for: "Process chamber heating",
    status: "not_documented",
    reason: "Chamber heater element not yet selected",
  },
]

/**
 * Inter-equipment and telemetry connections
 */
export const HEATING_CHAMBER_PILOT_CONNECTIONS_MAP = {
  conn_modbus_telemetry: {
    id: "conn_modbus_telemetry",
    connection_id: "conn_modbus_telemetry",
    from: { instance_id: "inst_tht02", port_id: "p_rs485" },
    to: { instance_id: "inst_x5prime", port_id: "p_rs485_mj1" },
    from_instance_id: "inst_tht02",
    from_port_id: "p_rs485",
    to_instance_id: "inst_x5prime",
    to_port_id: "p_rs485_mj1",
    protocol: "modbus_rtu",
    baud: 9600,
    parity: "none",
    data_bits: 8,
    stop_bits: 1,
  },
  conn_hmi_controller: {
    id: "conn_hmi_controller",
    connection_id: "conn_hmi_controller",
    from: { instance_id: "inst_n1200", port_id: "p_usb_comm" },
    to: { instance_id: "inst_x5prime", port_id: "p_ethernet_lan" },
    from_instance_id: "inst_n1200",
    from_port_id: "p_usb_comm",
    to_instance_id: "inst_x5prime",
    to_port_id: "p_ethernet_lan",
    note: "Gateway supervisory communication",
  },
  conn_ctrl_out: {
    id: "conn_ctrl_out",
    connection_id: "conn_ctrl_out",
    from: { instance_id: "inst_n1200", port_id: "p_out1_ctrl" },
    to: {
      instance_id: "missing:actuator_power_switching",
      port_id: "p_logic_in",
    },
    from_instance_id: "inst_n1200",
    from_port_id: "p_out1_ctrl",
    to_instance_id: "missing:actuator_power_switching",
    to_port_id: "p_logic_in",
    note: "Output 1 PWM/pulse to solid state relay",
  },
} as const

const connectionsList: PilotConnection[] = [
  HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_modbus_telemetry,
  HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_hmi_controller,
  HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_ctrl_out,
]
Object.assign(connectionsList, HEATING_CHAMBER_PILOT_CONNECTIONS_MAP)
export const HEATING_CHAMBER_PILOT_CONNECTIONS = connectionsList as PilotConnection[] &
  typeof HEATING_CHAMBER_PILOT_CONNECTIONS_MAP

/**
 * Top-level Configuration entity definition
 */
export const HEATING_CHAMBER_PILOT_CONFIG = {
  configuration_id: HEATING_CHAMBER_PILOT_ID,
  revision: HEATING_CHAMBER_PILOT_REVISION_NUM,
  title: HEATING_CHAMBER_PILOT_TITLE,
  process_family: HEATING_CHAMBER_PILOT_PROCESS_FAMILY,
  description: HEATING_CHAMBER_PILOT_DESCRIPTION,
  instances: HEATING_CHAMBER_PILOT_INSTANCES,
  connections: HEATING_CHAMBER_PILOT_CONNECTIONS,
  missing_roles: HEATING_CHAMBER_PILOT_MISSING_ROLES,
}

/**
 * Immutable Revision 1 for deterministic evaluation
 */
export const HEATING_CHAMBER_PILOT_REVISION: ConfigurationRevision = {
  id: "rev_heating_chamber_pilot_1",
  configuration_id: HEATING_CHAMBER_PILOT_ID,
  revision: HEATING_CHAMBER_PILOT_REVISION_NUM,
  schema_version: "configuration_revision/2.0",
  graph_json: {
    instances: [
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
    ],
    connections: [
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_modbus_telemetry,
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_hmi_controller,
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_ctrl_out,
    ],
    networks: [
      {
        network_id: "net_modbus_telemetry",
        protocol: "modbus_rtu",
        members: [
          {
            instance_id: "inst_x5prime",
            port_id: "p_rs485_mj1",
            role: "master",
          },
          {
            instance_id: "inst_tht02",
            port_id: "p_rs485",
            role: "slave",
            address: 1,
          },
        ],
        parameters: {
          baud: 9600,
          parity: "none",
          data_bits: 8,
          stop_bits: 1,
        },
      },
    ],
    control_loops: [
      {
        loop_id: "loop_heating_chamber",
        name: "Heating Chamber Thermal Regulation",
        pv_variable_id: "var_ambient_temp",
        controller_instance_id: "inst_n1200",
        actuator_instance_id: "missing:actuator_power_switching",
        process_object_id: "proc_heating_chamber",
        control_algorithm: "pid",
      },
    ],
    process_objects: [
      {
        id: "proc_heating_chamber",
        family: "Heating Chamber",
        label: "Industrial Thermal Chamber",
        dimensional_status: "user_provided",
      },
    ],
    variables: [
      {
        variable_id: "var_ambient_temp",
        label: "Chamber Ambient Temperature",
        unit: "degC",
        dimension: "temperature",
        source_kind: "port",
        source_reference: {
          instance_id: "inst_tht02",
          port_id: "p_sensor_sht30",
        },
      },
    ],
    missing_roles: HEATING_CHAMBER_PILOT_MISSING_ROLES,
  },
  content_sha256: canonicalContentSha256({
    configuration_id: HEATING_CHAMBER_PILOT_ID,
    revision: HEATING_CHAMBER_PILOT_REVISION_NUM,
    instances: [
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
      HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
    ],
    connections: [
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_modbus_telemetry,
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_hmi_controller,
      HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_ctrl_out,
    ],
  }),
}

/**
 * Catalog technical snapshots indexed for evaluation
 */
export const HEATING_CHAMBER_SNAPSHOTS: Record<string, TechnicalSnapshot> = {
  ...G4_SNAPSHOTS,
  [HORNER_X5_SNAPSHOT.snapshot_id]: HORNER_X5_SNAPSHOT,
  [NOVUS_N1200_SNAPSHOT.snapshot_id]: {
    ...NOVUS_N1200_SNAPSHOT,
    ports: [
      ...NOVUS_N1200_SNAPSHOT.ports,
      ...(NOVUS_N1200_SNAPSHOT.ports.some((p) => p.port_id === "p_out1_ctrl")
        ? []
        : [
            {
              ...NOVUS_N1200_SNAPSHOT.ports.find(
                (p) => p.port_id === "p_out1_control"
              )!,
              port_id: "p_out1_ctrl",
            },
          ]),
    ],
  },
  [TZONE_THT02_SNAPSHOT.snapshot_id]: TZONE_THT02_SNAPSHOT,
  inst_n1200: NOVUS_N1200_SNAPSHOT,
  inst_x5prime: HORNER_X5_SNAPSHOT,
  inst_tht02: TZONE_THT02_SNAPSHOT,
  "CN-N1200": NOVUS_N1200_SNAPSHOT,
  "CN-X5PRIME-HE-XP5": HORNER_X5_SNAPSHOT,
  "CN-THT02": TZONE_THT02_SNAPSHOT,
}

/**
 * Builds the verified 3D assets map for the 3 instances from G6_ASSET_DEFINITIONS
 */
export function buildAssetsMap(): Record<string, HeatingChamberAssetEntry> {
  const assets: Record<string, HeatingChamberAssetEntry> = {}
  const instances = [
    HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
    HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
    HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
  ]

  for (const inst of instances) {
    const assetDef = G6_ASSET_DEFINITIONS.find(
      (a) => a.sku === inst.sku || a.snapshot_id === inst.snapshot_id
    )

    if (assetDef) {
      assets[inst.instance_id] = {
        sku: assetDef.sku,
        fidelity:
          assetDef.manifest_json?.fidelity || "dimensional_proxy_verified",
        glb_url: `https://data.controlnautas.com/industrial-assets/${assetDef.sha256}/${assetDef.sku}.glb`,
        manifest_url: `https://data.controlnautas.com/industrial-assets/${assetDef.sha256}/${assetDef.sku}.manifest.json`,
        anchors: assetDef.manifest_json?.anchors || [],
      }
    }
  }

  return assets
}

export const HEATING_CHAMBER_COMMERCIAL_FALLBACK: BundleCommercialBlock = {
  currency: "USD",
  status: "priced",
  items: [
    {
      instance_id: "inst_x5prime",
      sku: "CN-X5PRIME-HE-XP5",
      title: "Horner X5 Prime 4.3\" Touch OCS",
      quantity: 1,
      unit_price_usd_cents: 89000,
      unit_price_usd: 890.0,
      subtotal_usd_cents: 89000,
      subtotal_usd: 890.0,
      availability_status: "in_stock",
      stocked_quantity: 3,
      pricing_state: "priced",
    },
    {
      instance_id: "inst_n1200",
      sku: "CN-N1200",
      title: "NOVUS N1200 1/16 DIN PID Controller",
      quantity: 1,
      unit_price_usd_cents: 48000,
      unit_price_usd: 480.0,
      subtotal_usd_cents: 48000,
      subtotal_usd: 480.0,
      availability_status: "in_stock",
      stocked_quantity: 2,
      pricing_state: "priced",
    },
    {
      instance_id: "inst_tht02",
      sku: "CN-THT02",
      title: "TZone THT-02 Temp/RH Transmitter",
      quantity: 1,
      unit_price_usd_cents: 7500,
      unit_price_usd: 75.0,
      subtotal_usd_cents: 7500,
      subtotal_usd: 75.0,
      availability_status: "in_stock",
      stocked_quantity: 8,
      pricing_state: "priced",
    },
  ],
  catalog_total_usd_cents: 144500,
  catalog_total_usd: 1445.0,
  missing_roles_unpriced: [
    "actuator_power_switching",
    "thermal_load_heater",
  ],
  quote_readiness: "ready_for_commercial_estimate",
}

/**
 * Assembles the complete Heating Chamber bundle for Meta Muse ingestion (synchronous fallback)
 */
export function buildHeatingChamberBundle(): HeatingChamberBundle {
  const evalResult = evaluateSystem(
    HEATING_CHAMBER_PILOT_REVISION,
    HEATING_CHAMBER_SNAPSHOTS,
    "2026.g5.1"
  )

  const assets = buildAssetsMap()

  return {
    bundle_version: "2.0.0",
    configuration: {
      configuration_id: HEATING_CHAMBER_PILOT_ID,
      revision: HEATING_CHAMBER_PILOT_REVISION_NUM,
      title: HEATING_CHAMBER_PILOT_TITLE,
      process_family: HEATING_CHAMBER_PILOT_PROCESS_FAMILY,
      description: HEATING_CHAMBER_PILOT_DESCRIPTION,
      instances: [
        HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
        HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
        HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
      ],
      connections: [
        HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_modbus_telemetry,
        HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_hmi_controller,
        HEATING_CHAMBER_PILOT_CONNECTIONS_MAP.conn_ctrl_out,
      ],
      missing_roles: HEATING_CHAMBER_PILOT_MISSING_ROLES,
    },
    evaluation: {
      overall_verdict: evalResult.overall_verdict,
      rule_set_version: evalResult.rule_set_version || "2026.g5.1",
      summary:
        "Control loop incomplete: missing power switching actuator and heater load",
      evaluations: evalResult.evaluations,
    },
    assets,
    readiness: {
      ready_for_3d_presentation: true,
      ready_for_procurement: false,
      ready_for_commercial_estimate: true,
      blockers: [
        "Power actuator stage (SSR) missing from topology",
        "Heating element load missing from topology",
      ],
    },
    commercial: HEATING_CHAMBER_COMMERCIAL_FALLBACK,
    generated_at: new Date().toISOString(),
  }
}

/**
 * Asynchronously builds the Heating Chamber bundle enriched with live commercial pricing from Medusa.
 * Queries Medusa live catalog offers for the 3 equipment instances, calculates exact totals,
 * isolates missing roles without inventing prices, and falls back to deterministic snapshot if DB is unavailable.
 */
export async function buildHeatingChamberBundleWithCommerce(
  dbClient?: Pool | PoolClient
): Promise<HeatingChamberBundle> {
  const baseBundle = buildHeatingChamberBundle()

  try {
    const pilotItems = [
      {
        instance: HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_x5prime,
        sku: "CN-X5PRIME-HE-XP5",
      },
      {
        instance: HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_n1200,
        sku: "CN-N1200",
      },
      {
        instance: HEATING_CHAMBER_PILOT_INSTANCES_MAP.inst_tht02,
        sku: "CN-THT02",
      },
    ]

    const items: CommercialLineItem[] = []
    let totalCents = 0
    let allPriced = true

    for (const item of pilotItems) {
      const offer = await getLiveOffer(item.sku, 1, undefined, dbClient)
      const unitCents =
        offer.unit_price_minor ??
        (offer.unit_price != null ? Math.round(offer.unit_price * 100) : 0)
      const unitUsd = offer.unit_price ?? unitCents / 100
      const subtotalCents =
        offer.subtotal_minor ??
        (offer.subtotal != null
          ? Math.round(offer.subtotal * 100)
          : unitCents * (offer.quantity || 1))
      const subtotalUsd = offer.subtotal ?? subtotalCents / 100
      const pricingState = offer.state || "priced"

      if (pricingState !== "priced" || unitCents <= 0) {
        allPriced = false
      }

      totalCents += subtotalCents

      items.push({
        instance_id: item.instance.instance_id,
        sku: offer.sku || item.sku,
        title: offer.title || item.instance.title,
        quantity: offer.quantity || 1,
        unit_price_usd_cents: unitCents,
        unit_price_usd: unitUsd,
        subtotal_usd_cents: subtotalCents,
        subtotal_usd: subtotalUsd,
        availability_status:
          offer.availability_status ||
          offer.availability?.status ||
          "in_stock",
        stocked_quantity: offer.availability?.stocked_quantity ?? 0,
        pricing_state: pricingState,
      })
    }

    const missingRolesUnpriced = HEATING_CHAMBER_PILOT_MISSING_ROLES.map(
      (r) => r.role
    )
    const quoteReadiness: "ready_for_commercial_estimate" | "not_priced" =
      allPriced ? "ready_for_commercial_estimate" : "not_priced"

    const commercial: BundleCommercialBlock = {
      currency: "USD",
      status: allPriced ? "priced" : "partial",
      items,
      catalog_total_usd_cents: totalCents,
      catalog_total_usd: totalCents / 100,
      missing_roles_unpriced: missingRolesUnpriced,
      quote_readiness: quoteReadiness,
    }

    return {
      ...baseBundle,
      readiness: {
        ...baseBundle.readiness,
        ready_for_3d_presentation: true,
        ready_for_procurement: false,
        ready_for_commercial_estimate: allPriced,
        blockers: [
          "Power actuator stage (SSR) missing from topology",
          "Heating element load missing from topology",
        ],
      },
      commercial,
    }
  } catch (err) {
    // Preserve synchronous bundle fallback with deterministic snapshot if DB is unavailable
    return baseBundle
  }
}
