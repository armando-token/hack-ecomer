import { model } from "@medusajs/framework/utils"

export const IndustrialTechnicalSnapshot = model.define("industrial_technical_snapshot", {
  id: model.id().primaryKey(),
  variant_id: model.text(),
  revision: model.number().default(1),
  state: model.text().default("draft"),
  schema_version: model.text().default("technical_snapshot/2.0"),
  content_json: model.json(),
  content_sha256: model.text(),
  reviewed_by: model.text().nullable(),
  published_at: model.dateTime().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_snapshot_variant_revision_unique",
      on: ["variant_id", "revision"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_snapshot_variant_state",
      on: ["variant_id", "state"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_snapshot_content_sha256",
      on: ["content_sha256"],
      where: "deleted_at IS NULL",
    },
  ])
