import { model } from "@medusajs/framework/utils"

export const IndustrialQuoteLine = model.define("industrial_quote_line", {
  id: model.id().primaryKey(),
  quote_id: model.text(),
  line_number: model.number(),
  variant_id: model.text(),
  quantity: model.number(),
  snapshot_json: model.json().nullable(),
  subtotal_minor: model.bigNumber().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_quote_line_unique",
      on: ["quote_id", "line_number"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_quote_line_quote_id",
      on: ["quote_id"],
      where: "deleted_at IS NULL",
    },
  ])
