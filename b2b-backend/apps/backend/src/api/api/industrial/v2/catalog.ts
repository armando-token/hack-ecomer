import {
  G4_DEFINITIONS,
  HORNER_X5_SNAPSHOT,
  NOVUS_N1200_SNAPSHOT,
  TZONE_THT02_SNAPSHOT,
  type G4SnapshotDefinition,
} from "../../../../modules/industrial-config/data/g4-catalog-snapshots"
import {
  G6_ASSET_DEFINITIONS,
  type G6AssetDefinition,
} from "../../../../modules/industrial-config/data/g6-catalog-assets"
import type { TechnicalSnapshot } from "../../../../modules/industrial-config/schemas/snapshot.schema"

export interface ProductCatalogMeta {
  title: string
  role: string
  handle: string
  technical_summary: string
  product_url: string
}

export interface ProductSearchResultItem {
  sku: string
  title: string
  manufacturer: string
  role: string
  snapshot_id: string
  technical_summary: string
  envelope_m: [number, number, number]
  ports_count: number
  has_model3d: boolean
  model3d_url: string | null
  fidelity: string
  product_url: string
}

export interface SearchFilterParams {
  q?: string
  sku?: string
  manufacturer?: string
  role?: string
  signal_type?: string
  protocol?: string
  mounting_type?: string
  has_model3d?: string | boolean
  limit?: number
  cursor?: string
}

const BASE_ASSET_URL = "https://data.controlnautas.com/industrial-assets"
const BASE_STOREFRONT_URL = "https://data.controlnautas.com"

const PRODUCT_METADATA: Record<string, ProductCatalogMeta> = {
  "CN-X5PRIME-HE-XP5": {
    title: "X5 Prime OCS All-in-One Controller (HE-XP5)",
    role: "controller",
    handle: "cn-x5prime-he-xp5",
    technical_summary: "Horner Automation OCS, built-in I/O, 10–30 VDC primary power",
    product_url: `${BASE_STOREFRONT_URL}/us/products/cn-x5prime-he-xp5`,
  },
  "CN-N1200": {
    title: "NOVUS N1200 Universal Process & Temperature Controller",
    role: "controller",
    handle: "cn-n1200",
    technical_summary: "Universal process PID controller, fast sampling, universal input and analog/relay outputs",
    product_url: `${BASE_STOREFRONT_URL}/us/products/cn-n1200`,
  },
  "CN-THT02": {
    title: "TZ THT-02 Temperature and Humidity Sensor (RS-485 Modbus RTU)",
    role: "sensor",
    handle: "cn-tht02",
    technical_summary: "SHT30 sensing, RS-485 Modbus RTU, DC 5–24 V supply",
    product_url: `${BASE_STOREFRONT_URL}/us/products/cn-tht02`,
  },
}

export function getProductMeta(sku: string): ProductCatalogMeta {
  if (PRODUCT_METADATA[sku]) {
    return PRODUCT_METADATA[sku]
  }
  const handle = sku.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  return {
    title: sku,
    role: "equipment",
    handle,
    technical_summary: `Industrial component ${sku}`,
    product_url: `${BASE_STOREFRONT_URL}/us/products/${handle}`,
  }
}

export function getAssetDefinition(skuOrId: string): G6AssetDefinition | undefined {
  const norm = skuOrId.toLowerCase().trim()
  return G6_ASSET_DEFINITIONS.find(
    (a) =>
      a.sku.toLowerCase() === norm ||
      a.id.toLowerCase() === norm ||
      a.variant_id.toLowerCase() === norm ||
      a.snapshot_id.toLowerCase() === norm
  )
}

export function getSnapshotDefinition(idOrSku: string): TechnicalSnapshot | undefined {
  const norm = idOrSku.toLowerCase().trim()
  const def = G4_DEFINITIONS.find(
    (d) =>
      d.snapshot.sku.toLowerCase() === norm ||
      d.snapshot.snapshot_id.toLowerCase() === norm ||
      d.snapshot.variant_id.toLowerCase() === norm ||
      (d.snapshot.manufacturer_part_number &&
        d.snapshot.manufacturer_part_number.toLowerCase() === norm)
  )
  return def?.snapshot
}

export function getAllSnapshots(): TechnicalSnapshot[] {
  return G4_DEFINITIONS.map((d) => d.snapshot)
}

export function buildSearchResultItem(snapshot: TechnicalSnapshot): ProductSearchResultItem {
  const meta = getProductMeta(snapshot.sku)
  const asset = getAssetDefinition(snapshot.sku)
  const hasModel3d = !!asset
  const model3dUrl = asset
    ? `${BASE_ASSET_URL}/${asset.sha256}/${asset.sku}.glb`
    : null

  const envelope: [number, number, number] = snapshot.dimensions?.envelope_m
    ? [
        snapshot.dimensions.envelope_m[0],
        snapshot.dimensions.envelope_m[1],
        snapshot.dimensions.envelope_m[2],
      ]
    : [0, 0, 0]

  return {
    sku: snapshot.sku,
    title: meta.title,
    manufacturer: snapshot.manufacturer || "Unknown",
    role: meta.role,
    snapshot_id: snapshot.snapshot_id,
    technical_summary: meta.technical_summary,
    envelope_m: envelope,
    ports_count: snapshot.ports ? snapshot.ports.length : 0,
    has_model3d: hasModel3d,
    model3d_url: model3dUrl,
    fidelity: asset?.manifest_json?.fidelity || "dimensional_proxy_verified",
    product_url: meta.product_url,
  }
}

export function searchCatalog(params: SearchFilterParams): {
  products: ProductSearchResultItem[]
  count: number
  total: number
  cursor: string | null
} {
  const allSnapshots = getAllSnapshots()

  const filtered = allSnapshots.filter((snapshot) => {
    const meta = getProductMeta(snapshot.sku)
    const asset = getAssetDefinition(snapshot.sku)

    // 1. Text query q
    if (params.q && params.q.trim() !== "") {
      const qNorm = params.q.trim().toLowerCase()
      const inSku = snapshot.sku.toLowerCase().includes(qNorm)
      const inTitle = meta.title.toLowerCase().includes(qNorm)
      const inMfr = (snapshot.manufacturer || "").toLowerCase().includes(qNorm)
      const inSummary = meta.technical_summary.toLowerCase().includes(qNorm)
      const inRole = meta.role.toLowerCase().includes(qNorm)
      const inMpn = (snapshot.manufacturer_part_number || "")
        .toLowerCase()
        .includes(qNorm)
      const inPorts = (snapshot.ports || []).some(
        (p) =>
          p.label.toLowerCase().includes(qNorm) ||
          p.port_id.toLowerCase().includes(qNorm) ||
          (p.signal_type || "").toLowerCase().includes(qNorm) ||
          p.category.toLowerCase().includes(qNorm)
      )
      if (!inSku && !inTitle && !inMfr && !inSummary && !inRole && !inMpn && !inPorts) {
        return false
      }
    }

    // 2. Filter sku
    if (params.sku && params.sku.trim() !== "") {
      const skuNorm = params.sku.trim().toLowerCase()
      if (!snapshot.sku.toLowerCase().includes(skuNorm)) {
        return false
      }
    }

    // 3. Filter manufacturer
    if (params.manufacturer && params.manufacturer.trim() !== "") {
      const mfrNorm = params.manufacturer.trim().toLowerCase()
      if (!(snapshot.manufacturer || "").toLowerCase().includes(mfrNorm)) {
        return false
      }
    }

    // 4. Filter role
    if (params.role && params.role.trim() !== "") {
      const roleNorm = params.role.trim().toLowerCase()
      const matchesMetaRole =
        meta.role.toLowerCase() === roleNorm ||
        meta.role.toLowerCase().includes(roleNorm)
      const commRolesAttr = snapshot.attributes.find(
        (a: any) => a.property === "communication_roles"
      )
      const commRoles = commRolesAttr?.value?.value || []
      const matchesCommRoles =
        Array.isArray(commRoles) &&
        commRoles.some((r: string) => String(r).toLowerCase() === roleNorm)

      if (!matchesMetaRole && !matchesCommRoles) {
        return false
      }
    }

    // 5. Filter signal_type
    if (params.signal_type && params.signal_type.trim() !== "") {
      const sigNorm = params.signal_type.trim().toLowerCase()
      const matchesPortSignal = (snapshot.ports || []).some((p) =>
        (p.signal_type || "").toLowerCase().includes(sigNorm)
      )
      const matchesAttrSignal = snapshot.attributes.some((a: any) =>
        JSON.stringify(a.value || "").toLowerCase().includes(sigNorm)
      )
      if (!matchesPortSignal && !matchesAttrSignal) {
        return false
      }
    }

    // 6. Filter protocol
    if (params.protocol && params.protocol.trim() !== "") {
      const protoNorm = params.protocol.trim().toLowerCase()
      const matchesCaps = (snapshot.capabilities || []).some((c) =>
        c.toLowerCase().includes(protoNorm)
      )
      const matchesAttrs = snapshot.attributes.some((a: any) =>
        JSON.stringify(a.value || "").toLowerCase().includes(protoNorm)
      )
      const matchesPorts = (snapshot.ports || []).some((p) =>
        p.label.toLowerCase().includes(protoNorm) ||
        (p.signal_type || "").toLowerCase().includes(protoNorm)
      )
      if (!matchesCaps && !matchesAttrs && !matchesPorts) {
        return false
      }
    }

    // 7. Filter mounting_type
    if (params.mounting_type && params.mounting_type.trim() !== "") {
      const mountNorm = params.mounting_type.trim().toLowerCase()
      const matchesMount = (snapshot.mounting || []).some((m) =>
        m.toLowerCase().includes(mountNorm)
      )
      if (!matchesMount) {
        return false
      }
    }

    // 8. Filter has_model3d
    if (params.has_model3d !== undefined && params.has_model3d !== null && params.has_model3d !== "") {
      const reqHasModel =
        typeof params.has_model3d === "boolean"
          ? params.has_model3d
          : String(params.has_model3d).toLowerCase() === "true" ||
            String(params.has_model3d) === "1"
      const has3d = !!asset
      if (has3d !== reqHasModel) {
        return false
      }
    }

    return true
  })

  // Pagination cursor & limit
  const limit = params.limit !== undefined && params.limit > 0 ? params.limit : 10
  let offset = 0
  if (params.cursor) {
    const parsedOffset = Number(params.cursor)
    if (!isNaN(parsedOffset) && parsedOffset >= 0) {
      offset = parsedOffset
    }
  }

  const paginated = filtered.slice(offset, offset + limit)
  const nextOffset = offset + limit < filtered.length ? String(offset + limit) : null

  return {
    products: paginated.map(buildSearchResultItem),
    count: paginated.length,
    total: filtered.length,
    cursor: nextOffset,
  }
}
