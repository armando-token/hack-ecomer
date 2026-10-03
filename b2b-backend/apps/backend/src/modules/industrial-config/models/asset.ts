import { model } from "@medusajs/framework/utils"

export const IndustrialAsset = model.define("industrial_asset", {
  id: model.id().primaryKey(),
  variant_id: model.text().nullable(),
  snapshot_id: model.text().nullable(),
  kind: model.text(), // e.g. "3d_model", "datasheet", "diagram"
  revision: model.number().default(1),
  sha256: model.text(),
  bytes: model.number(),
  mime: model.text(),
  storage_key: model.text(),
  visibility: model.text().default("public"), // "public" | "authenticated" | "internal"
  state: model.text().default("active"), // "active" | "deprecated" | "draft"
  manifest_json: model.json().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_asset_kind_sha256_unique",
      on: ["kind", "sha256"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_asset_sha256",
      on: ["sha256"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_asset_variant_id",
      on: ["variant_id"],
      where: "deleted_at IS NULL",
    },
  ])
