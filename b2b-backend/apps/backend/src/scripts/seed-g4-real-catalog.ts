import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import {
  G4_DEFINITIONS,
  G4_ASSET_DEFINITIONS,
  G4_BINDING_DEFINITIONS,
} from "../modules/industrial-config/data/g4-catalog-snapshots"
import { TechnicalSnapshotSchema } from "../modules/industrial-config/schemas/snapshot.schema"

export interface SeedResult {
  seededSnapshots: string[]
  seededAssets: string[]
  seededBindings: string[]
  seededCatalogEntries: string[]
}

export async function seedG4RealCatalog(customClient?: Client): Promise<SeedResult> {
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
    console.log("🚀 Seeding Real Industrial Catalog Fixtures (Gate G4)")
    console.log("   Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§9, §10, §11, §33 G4)")
    console.log("===============================================================")

    // INVARIANCE RULE CHECK:
    // Verify core commerce tables (product_variant) without modifying them.
    for (const def of G4_DEFINITIONS) {
      const { snapshot } = def
      const variantRes = await client.query(
        "SELECT id, title, sku FROM product_variant WHERE id = $1 AND sku = $2;",
        [snapshot.variant_id, snapshot.sku]
      )

      if (variantRes.rows.length === 0) {
        throw new Error(
          `Target variant '${snapshot.variant_id}' (${snapshot.sku}) not found in product_variant. Seed cannot reference non-existent core variant.`
        )
      }

      const resolvedVariant = variantRes.rows[0]
      console.log(`✓ [Invariance Verified] Core commerce variant: ${resolvedVariant.sku} (${resolvedVariant.id})`)
    }
    console.log("  [Invariance Note: Core commerce tables remain UNTOUCHED; read-only verification completed]")

    await client.query("BEGIN")

    const seededSnapshots: string[] = []
    const seededAssets: string[] = []
    const seededBindings: string[] = []
    const seededCatalogEntries: string[] = []

    // 1. Seed / Upsert industrial_technical_snapshot
    console.log("\n📦 Upserting industrial_technical_snapshot records...")
    const upsertSnapshotSql = `
      INSERT INTO industrial_technical_snapshot (
        id, variant_id, revision, state, schema_version, content_json, content_sha256, reviewed_by, published_at, created_at, updated_at
      ) VALUES ($1, $2, 1, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      ON CONFLICT (variant_id, revision) WHERE deleted_at IS NULL DO UPDATE SET
        id = EXCLUDED.id,
        content_json = EXCLUDED.content_json,
        content_sha256 = EXCLUDED.content_sha256,
        state = EXCLUDED.state,
        schema_version = EXCLUDED.schema_version,
        reviewed_by = EXCLUDED.reviewed_by,
        published_at = EXCLUDED.published_at,
        updated_at = NOW();
    `

    for (const def of G4_DEFINITIONS) {
      const { snapshot } = def

      // Validate Zod schema compliance before persisting
      const validatedSnapshot = TechnicalSnapshotSchema.parse(snapshot)

      await client.query(upsertSnapshotSql, [
        validatedSnapshot.snapshot_id,
        validatedSnapshot.variant_id,
        validatedSnapshot.state,
        validatedSnapshot.schema_version,
        JSON.stringify(validatedSnapshot),
        validatedSnapshot.content_sha256,
        validatedSnapshot.reviewed_by || "engineer_review",
        validatedSnapshot.published_at || new Date().toISOString(),
      ])

      seededSnapshots.push(validatedSnapshot.snapshot_id)
      console.log(
        `✓ Upserted snapshot: ${validatedSnapshot.snapshot_id} | SKU: ${validatedSnapshot.sku} (SHA: ${validatedSnapshot.content_sha256.slice(0, 16)}...)`
      )
    }

    // 2. Seed / Upsert industrial_asset for official datasheet PDFs
    console.log("\n📄 Upserting industrial_asset datasheet records...")
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

    for (const asset of G4_ASSET_DEFINITIONS) {
      await client.query(upsertAssetSql, [
        asset.id,
        asset.variant_id,
        asset.snapshot_id,
        asset.kind,
        asset.revision,
        asset.sha256,
        asset.bytes,
        asset.mime,
        asset.storage_key,
        asset.visibility,
        asset.state,
        JSON.stringify(asset.manifest_json),
      ])

      seededAssets.push(asset.id)
      console.log(
        `✓ Upserted asset: ${asset.id} | ${asset.storage_key} (${asset.bytes} bytes, SHA: ${asset.sha256.slice(0, 16)}...)`
      )
    }

    // 3. Seed / Upsert industrial_asset_binding
    console.log("\n🔗 Upserting industrial_asset_binding records...")
    const upsertBindingSql = `
      INSERT INTO industrial_asset_binding (
        id, snapshot_id, asset_id, binding_kind, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())
      ON CONFLICT (snapshot_id, asset_id, binding_kind) WHERE deleted_at IS NULL DO UPDATE SET
        id = EXCLUDED.id,
        updated_at = NOW();
    `

    for (const binding of G4_BINDING_DEFINITIONS) {
      await client.query(upsertBindingSql, [
        binding.id,
        binding.snapshot_id,
        binding.asset_id,
        binding.binding_kind,
      ])

      seededBindings.push(binding.id)
      console.log(
        `✓ Upserted binding: ${binding.id} (Snapshot: ${binding.snapshot_id} -> Asset: ${binding.asset_id} [${binding.binding_kind}])`
      )
    }

    // 4. Seed / Upsert industrial_catalog_entry
    console.log("\n📑 Upserting industrial_catalog_entry records...")
    const upsertCatalogSql = `
      INSERT INTO industrial_catalog_entry (
        id, variant_id, active_snapshot_id, enabled, catalog_mode, created_at, updated_at
      ) VALUES ($1, $2, $3, true, $4, NOW(), NOW())
      ON CONFLICT (variant_id) WHERE deleted_at IS NULL DO UPDATE SET
        id = EXCLUDED.id,
        active_snapshot_id = EXCLUDED.active_snapshot_id,
        catalog_mode = EXCLUDED.catalog_mode,
        enabled = true,
        updated_at = NOW();
    `

    for (const def of G4_DEFINITIONS) {
      const { snapshot, catalogEntryId, catalogMode } = def

      await client.query(upsertCatalogSql, [
        catalogEntryId,
        snapshot.variant_id,
        snapshot.snapshot_id,
        catalogMode,
      ])

      seededCatalogEntries.push(catalogEntryId)
      console.log(
        `✓ Upserted catalog entry: ${catalogEntryId} (variant: ${snapshot.variant_id} -> snapshot: ${snapshot.snapshot_id} [mode: '${catalogMode}'])`
      )
    }

    await client.query("COMMIT")

    console.log("\n===============================================================")
    console.log("🎉 Gate G4 Real Industrial Catalog Seeded Successfully")
    console.log(`   Snapshots Seeded:       ${seededSnapshots.length}`)
    console.log(`   Assets Seeded:          ${seededAssets.length}`)
    console.log(`   Bindings Seeded:        ${seededBindings.length}`)
    console.log(`   Catalog Entries Seeded: ${seededCatalogEntries.length}`)
    console.log("===============================================================")

    return {
      seededSnapshots,
      seededAssets,
      seededBindings,
      seededCatalogEntries,
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
  return await seedG4RealCatalog()
}

// Allow direct CLI execution
if (require.main === module) {
  seedG4RealCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed G4 real catalog error:", err)
      process.exit(1)
    })
}
