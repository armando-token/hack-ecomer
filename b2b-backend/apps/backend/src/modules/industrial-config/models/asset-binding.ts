import { model } from "@medusajs/framework/utils"

export const IndustrialAssetBinding = model.define("industrial_asset_binding", {
  id: model.id().primaryKey(),
  snapshot_id: model.text(),
  asset_id: model.text(),
  binding_kind: model.text(), // e.g. "primary_3d", "datasheet", "wiring_diagram"
})
  .indexes([
    {
      name: "IDX_ind_asset_binding_unique",
      on: ["snapshot_id", "asset_id", "binding_kind"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_asset_binding_snapshot",
      on: ["snapshot_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_asset_binding_asset",
      on: ["asset_id"],
      where: "deleted_at IS NULL",
    },
  ])
