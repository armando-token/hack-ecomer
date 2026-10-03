import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import {
  G6_ASSET_DEFINITIONS,
  G6_BINDING_DEFINITIONS,
} from "../modules/industrial-config/data/g6-catalog-assets"

export interface G6RevertResult {
  deletedBindings: number
  deletedAssets: number
}

export async function revertG6Assets(customClient?: Client): Promise<G6RevertResult> {
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
    console.log("🔄 Reverting 3D GLB Industrial Assets & Bindings (Gate G6)")
    console.log("   Governing Doc: MEGAPLAN_MUSE_API_3D_V2.md (§15, §16, §33 G6)")
    console.log("===============================================================")

    await client.query("BEGIN")

    const bindingIds = G6_BINDING_DEFINITIONS.map((b) => b.id)
    const assetIds = G6_ASSET_DEFINITIONS.map((a) => a.id)
    const assetSha256s = G6_ASSET_DEFINITIONS.map((a) => a.sha256)

    // 1. Delete industrial_asset_binding
    const bindRes = await client.query(
      `DELETE FROM industrial_asset_binding
       WHERE id = ANY($1)
          OR asset_id = ANY($2)
       RETURNING id;`,
      [bindingIds, assetIds]
    )
    console.log(`✓ Removed ${bindRes.rowCount} industrial_asset_binding rows`)

    // 2. Delete industrial_asset
    const assetRes = await client.query(
      `DELETE FROM industrial_asset
       WHERE id = ANY($1)
          OR sha256 = ANY($2)
       RETURNING id;`,
      [assetIds, assetSha256s]
    )
    console.log(`✓ Removed ${assetRes.rowCount} industrial_asset rows`)

    await client.query("COMMIT")

    console.log("  [Invariance Note: Core commerce tables and snapshots remain completely UNTOUCHED]")
    console.log("\n===============================================================")
    console.log("🎉 Gate G6 Industrial 3D Assets Reverted Successfully")
    console.log(`   Bindings Removed: ${bindRes.rowCount}`)
    console.log(`   Assets Removed:   ${assetRes.rowCount}`)
    console.log("===============================================================")

    return {
      deletedBindings: bindRes.rowCount || 0,
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
  return await revertG6Assets()
}

// Allow direct CLI execution
if (require.main === module) {
  revertG6Assets()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Revert G6 assets error:", err)
      process.exit(1)
    })
}
