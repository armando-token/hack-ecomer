import { model } from "@medusajs/framework/utils"

export const IndustrialCatalogEntry = model.define("industrial_catalog_entry", {
  id: model.id().primaryKey(),
  variant_id: model.text().unique(),
  active_snapshot_id: model.text().nullable(),
  enabled: model.boolean().default(true),
  catalog_mode: model.text().default("production"), // e.g. "synthetic_demo", "production"
})
  .indexes([
    {
      name: "IDX_ind_catalog_variant_unique",
      on: ["variant_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_catalog_mode",
      on: ["catalog_mode"],
      where: "deleted_at IS NULL",
    },
  ])
