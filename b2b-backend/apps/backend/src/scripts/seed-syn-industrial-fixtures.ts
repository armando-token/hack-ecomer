import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import * as crypto from "crypto"
import { canonicalContentSha256 } from "../modules/industrial-config/hash"

const SYN_ASSET_ID = "ast_syn_ctrl_01_v1"
const SYN_ASSET_SHA = "4730b336b910dd4edfb2104dbf272ee05000e708e37e9a68c8031b46170045b6"
const TARGET_VARIANT_ID = "variant_01M41R18MQK0GXGPTYSX0EDZBH" // CN-X5PRIME-HE-XP5
const TARGET_SKU = "CN-X5PRIME-HE-XP5"
const SYN_SNAPSHOT_ID = "snp_syn_ctrl_01_v1"
const SYN_BINDING_ID = "asb_syn_ctrl_01_v1"
const SYN_CATALOG_ENTRY_ID = "cat_syn_ctrl_01"

export async function seedSynIndustrialFixtures(customClient?: Client): Promise<{
  snapshotId: string
  assetId: string
  catalogEntryId: string
}> {
  const client =
    customClient ||
    new Client({
      connectionString:
        process.env.DATABASE_URL ||
        "postgresql://postgres:password@localhost:5432/medusa",
    })

  const shouldCloseClient = !customClient
  if (shouldCloseClient) {
    await client.connect()
  }

  try {
    console.log("---------------------------------------------------------------")
    console.log("🚀 Seeding Synthetic Industrial Fixtures (Gate G3)")
    console.log("---------------------------------------------------------------")

    // 1. Verify target variant exists without modifying it (MEGAPLAN §11.1 / §33 G3)
    const variantRes = await client.query(
      "SELECT id, title, sku FROM product_variant WHERE id = $1 OR sku = $2;",
      [TARGET_VARIANT_ID, TARGET_SKU]
    )

    if (variantRes.rows.length === 0) {
      throw new Error(
        `Target variant '${TARGET_VARIANT_ID}' (${TARGET_SKU}) not found in product_variant. Seed cannot reference non-existent core variant.`
      )
    }

    const resolvedVariant = variantRes.rows[0]
    console.log(`✓ Verified target core commerce variant: ${resolvedVariant.sku} (${resolvedVariant.id})`)
    console.log("  [Invariance Note: Core commerce tables remain UNTOUCHED; read-only reference established]")

    // 2. Build snapshot content JSON
    const contentJson = {
      sku: "SYN-IND-CTRL-01",
      title: "Synthetic Industrial Heating Controller",
      model: "SYN-IND-CTRL-01",
      revision: 1,
      variant_id: resolvedVariant.id,
      dimensions_mm: {
        width: 100.0,
        height: 80.0,
        depth: 50.0,
      },
      mounting: {
        type: "din_rail",
        standard: "DIN EN 50022 TS 35",
      },
      ports: [
        {
          port_id: "din_rail_mount",
          label: "DIN Rail Mounting Anchor",
          category: "mechanical",
          direction: "passive",
          anchor_id: "anchor_mounting_din_center",
        },
        {
          port_id: "pwr_in",
          label: "24V DC Power Input",
          category: "power_input",
          direction: "input",
          signal_type: "power_dc",
          anchor_id: "anchor_terminal_power",
          terminals: [
            { terminal_id: "pwr_v_plus", label: "V+" },
            { terminal_id: "pwr_v_minus", label: "V-" },
          ],
        },
        {
          port_id: "sensor_in",
          label: "RTD / TC Sensor Input",
          category: "instrumentation",
          direction: "input",
          signal_type: "rtd_pt100",
          anchor_id: "anchor_terminal_sensor",
        },
        {
          port_id: "ctrl_out",
          label: "SSR Drive Control Output",
          category: "control_output",
          direction: "output",
          signal_type: "ssr_drive",
          anchor_id: "anchor_terminal_output",
        },
      ],
      attributes: [
        {
          property: "supply_voltage",
          value: { kind: "quantity", value: 24, unit: "V", nature: "dc" },
          data_status: "documented",
        },
        {
          property: "control_function",
          value: { kind: "enum", value: "pid_heating" },
          data_status: "documented",
        },
        {
          property: "mounting",
          value: { kind: "enum", value: "din_rail" },
          data_status: "documented",
        },
      ],
      asset_id: SYN_ASSET_ID,
      asset_sha256: SYN_ASSET_SHA,
    }

    const contentSha = canonicalContentSha256(contentJson)

    // 3. Upsert industrial_technical_snapshot
    await client.query("BEGIN")

    const upsertSnapshotSql = `
      INSERT INTO industrial_technical_snapshot (
        id, variant_id, revision, state, schema_version, content_json, content_sha256, reviewed_by, published_at, created_at, updated_at
      ) VALUES ($1, $2, 1, 'published', 'technical_snapshot/2.0', $3, $4, 'system/gate-g3', NOW(), NOW(), NOW())
      ON CONFLICT (variant_id, revision) WHERE deleted_at IS NULL DO UPDATE SET
        content_json = EXCLUDED.content_json,
        content_sha256 = EXCLUDED.content_sha256,
        state = 'published',
        updated_at = NOW();
    `
    await client.query(upsertSnapshotSql, [
      SYN_SNAPSHOT_ID,
      resolvedVariant.id,
      JSON.stringify(contentJson),
      contentSha,
    ])
    console.log(`✓ Upserted industrial_technical_snapshot: ${SYN_SNAPSHOT_ID} (SHA: ${contentSha.slice(0, 16)}...)`)

    // 4. Upsert industrial_asset for G2 GLB model
    const manifestJson = {
      schema_version: "model_manifest/2.0",
      id: SYN_ASSET_ID,
      sku_or_syn_id: "SYN-IND-CTRL-01",
      variant_id: resolvedVariant.id,
      units: "meter",
      dimensions_mm: { width: 100, height: 80, depth: 50 },
      sha256: SYN_ASSET_SHA,
      byte_length: 43276,
    }

    const upsertAssetSql = `
      INSERT INTO industrial_asset (
        id, variant_id, snapshot_id, kind, revision, sha256, bytes, mime, storage_key, visibility, state, manifest_json, created_at, updated_at
      ) VALUES ($1, $2, $3, '3d_model', 1, $4, 43276, 'model/gltf-binary', $5, 'public', 'active', $6, NOW(), NOW())
      ON CONFLICT (kind, sha256) WHERE deleted_at IS NULL DO UPDATE SET
        snapshot_id = EXCLUDED.snapshot_id,
        manifest_json = EXCLUDED.manifest_json,
        updated_at = NOW();
    `
    await client.query(upsertAssetSql, [
      SYN_ASSET_ID,
      resolvedVariant.id,
      SYN_SNAPSHOT_ID,
      SYN_ASSET_SHA,
      `storage/industrial/assets/${SYN_ASSET_SHA}/SYN-IND-CTRL-01.glb`,
      JSON.stringify(manifestJson),
    ])
    console.log(`✓ Upserted industrial_asset: ${SYN_ASSET_ID} (SHA: ${SYN_ASSET_SHA})`)

    // 5. Upsert industrial_asset_binding
    const upsertBindingSql = `
      INSERT INTO industrial_asset_binding (
        id, snapshot_id, asset_id, binding_kind, created_at, updated_at
      ) VALUES ($1, $2, $3, 'primary_3d', NOW(), NOW())
      ON CONFLICT (snapshot_id, asset_id, binding_kind) WHERE deleted_at IS NULL DO UPDATE SET
        updated_at = NOW();
    `
    await client.query(upsertBindingSql, [SYN_BINDING_ID, SYN_SNAPSHOT_ID, SYN_ASSET_ID])
    console.log(`✓ Upserted industrial_asset_binding: ${SYN_BINDING_ID} (Snapshot: ${SYN_SNAPSHOT_ID} -> Asset: ${SYN_ASSET_ID})`)

    // 6. Upsert industrial_catalog_entry with catalog_mode = "synthetic_demo"
    const upsertCatalogSql = `
      INSERT INTO industrial_catalog_entry (
        id, variant_id, active_snapshot_id, enabled, catalog_mode, created_at, updated_at
      ) VALUES ($1, $2, $3, true, 'synthetic_demo', NOW(), NOW())
      ON CONFLICT (variant_id) WHERE deleted_at IS NULL DO UPDATE SET
        active_snapshot_id = EXCLUDED.active_snapshot_id,
        catalog_mode = 'synthetic_demo',
        enabled = true,
        updated_at = NOW();
    `
    await client.query(upsertCatalogSql, [
      SYN_CATALOG_ENTRY_ID,
      resolvedVariant.id,
      SYN_SNAPSHOT_ID,
    ])
    console.log(`✓ Upserted industrial_catalog_entry: ${SYN_CATALOG_ENTRY_ID} (catalog_mode: 'synthetic_demo')`)

    await client.query("COMMIT")

    console.log("---------------------------------------------------------------")
    console.log("🎉 Seed of Synthetic Industrial Fixtures Completed Successfully")
    console.log("---------------------------------------------------------------")

    return {
      snapshotId: SYN_SNAPSHOT_ID,
      assetId: SYN_ASSET_ID,
      catalogEntryId: SYN_CATALOG_ENTRY_ID,
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    throw err
  } finally {
    if (shouldCloseClient) {
      await client.end()
    }
  }
}

export default async function seed({ container }: ExecArgs) {
  return await seedSynIndustrialFixtures()
}

// Allow direct CLI execution: ts-node or node
if (require.main === module) {
  seedSynIndustrialFixtures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err)
      process.exit(1)
    })
}
