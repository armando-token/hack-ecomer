import * as fs from "fs"
import * as path from "path"
import { IndustrialAssetSchema, AssetBindingSchema } from "../schemas/asset.schema"

export interface G6AssetDefinition {
  id: string
  variant_id: string
  snapshot_id: string
  sku: string
  kind: "model_glb"
  revision: string
  sha256: string
  bytes: number
  mime: string
  storage_key: string
  visibility: "public"
  state: "active"
  manifest_json: Record<string, any>
}

export interface G6BindingDefinition {
  id: string
  snapshot_id: string
  asset_id: string
  binding_kind: "dimensional_proxy"
}

function resolveAssetStoragePath(relativePath: string): string {
  const candidates = [
    path.resolve(process.cwd(), relativePath),
    path.resolve(process.cwd(), "../../", relativePath),
    path.resolve(process.cwd(), "../../../", relativePath),
    path.resolve(__dirname, "../../../../../../../", relativePath),
    path.resolve(__dirname, "../../../../../../", relativePath),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  // Fallback to first candidate
  return candidates[0]
}

function loadManifest(sku: string): Record<string, any> {
  const manifestRelPath = `storage/industrial/assets/${sku}.manifest.json`
  const manifestFullPath = resolveAssetStoragePath(manifestRelPath)
  if (fs.existsSync(manifestFullPath)) {
    try {
      return JSON.parse(fs.readFileSync(manifestFullPath, "utf-8"))
    } catch {
      // fallback
    }
  }
  return {
    schema_version: "model_manifest/2.0",
    sku,
    fidelity: "dimensional_proxy_verified",
  }
}

export const G6_ASSET_DEFINITIONS: G6AssetDefinition[] = [
  {
    id: "ast_cn_x5prime_he_xp5_glb_v1",
    variant_id: "variant_01M41R18MQK0GXGPTYSX0EDZBH",
    snapshot_id: "snp_cn_x5prime_he_xp5_v1",
    sku: "CN-X5PRIME-HE-XP5",
    kind: "model_glb",
    revision: "rev_2026_g6",
    sha256: "47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5",
    bytes: 27340,
    mime: "model/gltf-binary",
    storage_key: "storage/industrial/assets/47fac408170c283fb336fa07a45714dcf5eeed1a0cbaa1ffc464dffdcef559a5/CN-X5PRIME-HE-XP5.glb",
    visibility: "public",
    state: "active",
    manifest_json: loadManifest("CN-X5PRIME-HE-XP5"),
  },
  {
    id: "ast_cn_n1200_glb_v1",
    variant_id: "variant_01M41R18XQ6QNWMX8Z39NMR2NW",
    snapshot_id: "snp_cn_n1200_v1",
    sku: "CN-N1200",
    kind: "model_glb",
    revision: "rev_2026_g6",
    sha256: "73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2",
    bytes: 31408,
    mime: "model/gltf-binary",
    storage_key: "storage/industrial/assets/73e2bfc0f7d02c8f0e69c95f95a019492215b46b70daeb7fd474c478b545fcf2/CN-N1200.glb",
    visibility: "public",
    state: "active",
    manifest_json: loadManifest("CN-N1200"),
  },
  {
    id: "ast_cn_tht02_glb_v1",
    variant_id: "variant_01M41R193J5MPJ16MTX9CAWWRM",
    snapshot_id: "snp_cn_tht02_v1",
    sku: "CN-THT02",
    kind: "model_glb",
    revision: "rev_2026_g6",
    sha256: "7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327",
    bytes: 15420,
    mime: "model/gltf-binary",
    storage_key: "storage/industrial/assets/7e5d88e48e051933807cb70fc184aa5c167c59ded25a5cf27f17b5046293d327/CN-THT02.glb",
    visibility: "public",
    state: "active",
    manifest_json: loadManifest("CN-THT02"),
  },
]

export const G6_BINDING_DEFINITIONS: G6BindingDefinition[] = [
  {
    id: "asb_cn_x5prime_he_xp5_glb_v1",
    snapshot_id: "snp_cn_x5prime_he_xp5_v1",
    asset_id: "ast_cn_x5prime_he_xp5_glb_v1",
    binding_kind: "dimensional_proxy",
  },
  {
    id: "asb_cn_n1200_glb_v1",
    snapshot_id: "snp_cn_n1200_v1",
    asset_id: "ast_cn_n1200_glb_v1",
    binding_kind: "dimensional_proxy",
  },
  {
    id: "asb_cn_tht02_glb_v1",
    snapshot_id: "snp_cn_tht02_v1",
    asset_id: "ast_cn_tht02_glb_v1",
    binding_kind: "dimensional_proxy",
  },
]

// Validate all definitions on load
for (const asset of G6_ASSET_DEFINITIONS) {
  IndustrialAssetSchema.parse(asset)
}
for (const binding of G6_BINDING_DEFINITIONS) {
  AssetBindingSchema.parse(binding)
}
