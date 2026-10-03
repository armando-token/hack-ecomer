import { model } from "@medusajs/framework/utils"

export const IndustrialPresentationReceipt = model.define("industrial_presentation_receipt", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  configuration_id: model.text(),
  revision: model.number(),
  bundle_sha256: model.text(),
  artifact_ref: model.text().nullable(),
  assets_used_json: model.json().nullable(),
  layout_json: model.json().nullable(),
  validation_json: model.json().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_receipt_config_rev",
      on: ["configuration_id", "revision"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_receipt_owner",
      on: ["owner_id"],
      where: "deleted_at IS NULL",
    },
  ])
