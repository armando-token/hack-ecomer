import { model } from "@medusajs/framework/utils"

export const IndustrialQuote = model.define("industrial_quote", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  config_id: model.text().nullable(),
  config_revision: model.number().nullable(),
  state: model.text().default("draft"), // "draft" | "issued" | "accepted" | "expired"
  currency: model.text().default("USD"),
  scale: model.number().default(2),
  total_minor: model.bigNumber().nullable(),
  snapshot_json: model.json().nullable(),
  expires_at: model.dateTime().nullable(),
  idempotency_id: model.text().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_quote_owner_created",
      on: ["owner_id", "created_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_quote_idempotency",
      on: ["idempotency_id"],
      where: "deleted_at IS NULL",
    },
  ])
