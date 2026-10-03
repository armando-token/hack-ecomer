import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import {
  G4_DEFINITIONS,
  G4_ASSET_DEFINITIONS,
  G4_BINDING_DEFINITIONS,
} from "../modules/industrial-config/data/g4-catalog-snapshots"

export interface RevertResult {
  deletedCatalogEntries: number
  deletedBindings: number
  deletedSnapshots: number
  deletedAssets: number
}

export async function revertG4RealCatalog(customClient?: Client): Promise<RevertResult> {
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
    console.log("🔄 Reverting Real Industrial Catalog Fixtures (Gate G4)")
    console.log("   Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§9, §10, §11, §33 G4)")
    console.log("===============================================================")

    await client.query("BEGIN")

    const snapshotIds = [
      ...G4_DEFINITIONS.map((d) => d.snapshot.snapshot_id),
      "snp_real_x5prime_he_xp5_v1",
      "snp_real_n1200_v1",
      "snp_real_tht02_v1",
    ]
    const variantIds = G4_DEFINITIONS.map((d) => d.snapshot.variant_id)
    const catalogEntryIds = [
      ...G4_DEFINITIONS.map((d) => d.catalogEntryId),
      "cat_real_x5prime_01",
      "cat_real_n1200_01",
      "cat_real_tht02_01",
    ]
    const assetIds = G4_ASSET_DEFINITIONS.map((a) => a.id)
    const assetSha256s = G4_ASSET_DEFINITIONS.map((a) => a.sha256)
    const bindingIds = G4_BINDING_DEFINITIONS.map((b) => b.id)

    // 1. Delete industrial_catalog_entry
    const catRes = await client.query(
      `DELETE FROM industrial_catalog_entry
       WHERE id = ANY($1)
          OR active_snapshot_id = ANY($2)
          OR (catalog_mode = 'active_reviewed' AND variant_id = ANY($3))
       RETURNING id;`,
      [catalogEntryIds, snapshotIds, variantIds]
    )
    console.log(`✓ Removed ${catRes.rowCount} industrial_catalog_entry rows`)

    // 2. Delete industrial_asset_binding
    const bindRes = await client.query(
      `DELETE FROM industrial_asset_binding
       WHERE id = ANY($1)
          OR snapshot_id = ANY($2)
          OR asset_id = ANY($3)
       RETURNING id;`,
      [bindingIds, snapshotIds, assetIds]
    )
    console.log(`✓ Removed ${bindRes.rowCount} industrial_asset_binding rows`)

    // 3. Delete industrial_technical_snapshot
    const snapRes = await client.query(
      `DELETE FROM industrial_technical_snapshot
       WHERE id = ANY($1)
          OR variant_id = ANY($2)
       RETURNING id;`,
      [snapshotIds, variantIds]
    )
    console.log(`✓ Removed ${snapRes.rowCount} industrial_technical_snapshot rows`)

    // 4. Delete industrial_asset
    const assetRes = await client.query(
      `DELETE FROM industrial_asset
       WHERE id = ANY($1)
          OR sha256 = ANY($2)
          OR snapshot_id = ANY($3)
       RETURNING id;`,
      [assetIds, assetSha256s, snapshotIds]
    )
    console.log(`✓ Removed ${assetRes.rowCount} industrial_asset rows`)

    await client.query("COMMIT")

    console.log("  [Invariance Note: Core commerce tables remain completely UNTOUCHED]")
    console.log("===============================================================")
    console.log("🎉 Revert of Gate G4 Real Industrial Catalog Completed Successfully")
    console.log(`   Catalog Entries Removed: ${catRes.rowCount || 0}`)
    console.log(`   Bindings Removed:        ${bindRes.rowCount || 0}`)
    console.log(`   Snapshots Removed:       ${snapRes.rowCount || 0}`)
    console.log(`   Assets Removed:          ${assetRes.rowCount || 0}`)
    console.log("===============================================================")

    return {
      deletedCatalogEntries: catRes.rowCount || 0,
      deletedBindings: bindRes.rowCount || 0,
      deletedSnapshots: snapRes.rowCount || 0,
      deletedAssets: assetRes.rowCount || 0,
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

export default async function revert({ container }: ExecArgs) {
  return await revertG4RealCatalog()
}

// Allow direct CLI execution
if (require.main === module) {
  revertG4RealCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Revert G4 real catalog error:", err)
      process.exit(1)
    })
}
