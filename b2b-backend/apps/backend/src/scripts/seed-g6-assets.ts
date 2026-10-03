import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import {
  G6_ASSET_DEFINITIONS,
  G6_BINDING_DEFINITIONS,
} from "../modules/industrial-config/data/g6-catalog-assets"
import { IndustrialAssetSchema, AssetBindingSchema } from "../modules/industrial-config/schemas/asset.schema"

export interface G6SeedResult {
  seededAssets: string[]
  seededBindings: string[]
}

export async function seedG6Assets(customClient?: Client): Promise<G6SeedResult> {
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
    console.log("===============================================================")
    console.log("🚀 Seeding 3D GLB Industrial Assets & Bindings (Gate G6)")
    console.log("   Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)")
    console.log("===============================================================")

    // INVARIANCE RULE CHECK 1:
    // Verify core commerce tables (product_variant) without modifying them.
    for (const asset of G6_ASSET_DEFINITIONS) {
      const variantRes = await client.query(
        "SELECT id, title, sku FROM product_variant WHERE id = $1;",
        [asset.variant_id]
      )

      if (variantRes.rows.length === 0) {
        throw new Error(
          `Target variant '${asset.variant_id}' (${asset.sku}) not found in product_variant. Seed cannot reference non-existent core variant.`
        )
      }

      const resolvedVariant = variantRes.rows[0]
      console.log(
        `✓ [Invariance Verified] Core commerce variant: ${resolvedVariant.sku} (${resolvedVariant.id})`
      )
    }

    // INVARIANCE RULE CHECK 2:
    // Verify referenced snapshots exist in industrial_technical_snapshot.
    for (const asset of G6_ASSET_DEFINITIONS) {
      const snapRes = await client.query(
        "SELECT id, variant_id, state FROM industrial_technical_snapshot WHERE id = $1 AND deleted_at IS NULL;",
        [asset.snapshot_id]
      )

      if (snapRes.rows.length === 0) {
        throw new Error(
          `Referenced snapshot '${asset.snapshot_id}' not found in industrial_technical_snapshot. Cannot bind 3D asset to non-existent snapshot.`
        )
      }

      console.log(`✓ [Snapshot Verified] Technical snapshot: ${asset.snapshot_id}`)
    }
    console.log("  [Invariance Note: Core commerce tables remain UNTOUCHED; read-only verification completed]")

    await client.query("BEGIN")

    const seededAssets: string[] = []
    const seededBindings: string[] = []

    // 1. Seed / Upsert industrial_asset for 3D GLB models
    console.log("\n📦 Upserting industrial_asset 3D GLB records...")
    const upsertAssetSql = `
      INSERT INTO industrial_asset (
        id, variant_id, snapshot_id, kind, revision, sha256, bytes, mime, storage_key, visibility, state, manifest_json, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      ON CONFLICT (kind, sha256) WHERE deleted_at IS NULL DO UPDATE SET
        id = EXCLUDED.id,
        variant_id = EXCLUDED.variant_id,
        snapshot_id = EXCLUDED.snapshot_id,
        revision = EXCLUDED.revision,
        bytes = EXCLUDED.bytes,
        mime = EXCLUDED.mime,
        storage_key = EXCLUDED.storage_key,
        visibility = EXCLUDED.visibility,
        state = EXCLUDED.state,
        manifest_json = EXCLUDED.manifest_json,
        updated_at = NOW();
    `

    for (const asset of G6_ASSET_DEFINITIONS) {
      // Validate schema strictly before persisting
      const validatedAsset = IndustrialAssetSchema.parse(asset)

      await client.query(upsertAssetSql, [
        validatedAsset.id,
        validatedAsset.variant_id,
        validatedAsset.snapshot_id,
        validatedAsset.kind,
        validatedAsset.revision,
        validatedAsset.sha256,
        validatedAsset.bytes,
        validatedAsset.mime,
        validatedAsset.storage_key,
        validatedAsset.visibility,
        validatedAsset.state,
        JSON.stringify(validatedAsset.manifest_json || {}),
      ])

      seededAssets.push(validatedAsset.id)
      console.log(
        `✓ Upserted 3D asset: ${validatedAsset.id} | SKU: ${asset.sku} (${validatedAsset.bytes} bytes, SHA: ${validatedAsset.sha256.slice(0, 16)}...)`
      )
    }

    // 2. Seed / Upsert industrial_asset_binding
    console.log("\n🔗 Upserting industrial_asset_binding records...")
    const upsertBindingSql = `
      INSERT INTO industrial_asset_binding (
        id, snapshot_id, asset_id, binding_kind, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (snapshot_id, asset_id, binding_kind) WHERE deleted_at IS NULL DO UPDATE SET
        id = EXCLUDED.id,
        updated_at = NOW();
    `

    for (const binding of G6_BINDING_DEFINITIONS) {
      // Validate schema strictly before persisting
      const validatedBinding = AssetBindingSchema.parse(binding)

      await client.query(upsertBindingSql, [
        validatedBinding.id,
        validatedBinding.snapshot_id,
        validatedBinding.asset_id,
        validatedBinding.binding_kind,
      ])

      seededBindings.push(validatedBinding.id)
      console.log(
        `✓ Upserted binding: ${validatedBinding.id} (Snapshot: ${validatedBinding.snapshot_id} -> Asset: ${validatedBinding.asset_id} [${validatedBinding.binding_kind}])`
      )
    }

    await client.query("COMMIT")

    console.log("\n===============================================================")
    console.log("🎉 Gate G6 Industrial 3D Assets Seeded Successfully")
    console.log(`   Assets Seeded:   ${seededAssets.length}`)
    console.log(`   Bindings Seeded: ${seededBindings.length}`)
    console.log("===============================================================")

    return {
      seededAssets,
      seededBindings,
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
  return await seedG6Assets()
}

// Allow direct CLI execution
if (require.main === module) {
  seedG6Assets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed G6 assets error:", err)
      process.exit(1)
    })
}
