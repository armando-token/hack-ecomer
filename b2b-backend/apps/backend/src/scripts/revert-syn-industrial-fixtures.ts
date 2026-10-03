import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"

const SYN_ASSET_ID = "ast_syn_ctrl_01_v1"
const SYN_SNAPSHOT_ID = "snp_syn_ctrl_01_v1"
const SYN_BINDING_ID = "asb_syn_ctrl_01_v1"
const SYN_CATALOG_ENTRY_ID = "cat_syn_ctrl_01"

export async function revertSynIndustrialFixtures(customClient?: Client): Promise<{
  deletedSnapshots: number
  deletedAssets: number
  deletedBindings: number
  deletedCatalogEntries: number
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
    console.log("🔄 Reverting Synthetic Industrial Fixtures (Gate G3)")
    console.log("---------------------------------------------------------------")

    await client.query("BEGIN")

    // 1. Delete catalog entry
    const catRes = await client.query(
      "DELETE FROM industrial_catalog_entry WHERE id = $1 OR catalog_mode = 'synthetic_demo' RETURNING id;",
      [SYN_CATALOG_ENTRY_ID]
    )
    console.log(`✓ Removed ${catRes.rowCount} industrial_catalog_entry rows`)

    // 2. Delete asset bindings
    const bindRes = await client.query(
      "DELETE FROM industrial_asset_binding WHERE id = $1 OR asset_id = $2 OR snapshot_id = $3 RETURNING id;",
      [SYN_BINDING_ID, SYN_ASSET_ID, SYN_SNAPSHOT_ID]
    )
    console.log(`✓ Removed ${bindRes.rowCount} industrial_asset_binding rows`)

    // 3. Delete technical snapshot
    const snapRes = await client.query(
      "DELETE FROM industrial_technical_snapshot WHERE id = $1 RETURNING id;",
      [SYN_SNAPSHOT_ID]
    )
    console.log(`✓ Removed ${snapRes.rowCount} industrial_technical_snapshot rows`)

    // 4. Delete industrial asset
    const assetRes = await client.query(
      "DELETE FROM industrial_asset WHERE id = $1 RETURNING id;",
      [SYN_ASSET_ID]
    )
    console.log(`✓ Removed ${assetRes.rowCount} industrial_asset rows`)

    await client.query("COMMIT")

    console.log("  [Invariance Note: Core commerce tables remain completely UNTOUCHED]")
    console.log("---------------------------------------------------------------")
    console.log("🎉 Revert of Synthetic Industrial Fixtures Completed Successfully")
    console.log("---------------------------------------------------------------")

    return {
      deletedSnapshots: snapRes.rowCount || 0,
      deletedAssets: assetRes.rowCount || 0,
      deletedBindings: bindRes.rowCount || 0,
      deletedCatalogEntries: catRes.rowCount || 0,
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
  return await revertSynIndustrialFixtures()
}

// Allow direct CLI execution
if (require.main === module) {
  revertSynIndustrialFixtures()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Revert error:", err)
      process.exit(1)
    })
}
