import { model } from "@medusajs/framework/utils"

export const IndustrialIdempotency = model.define("industrial_idempotency", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  operation: model.text(), // e.g. "create_configuration", "issue_quote"
  key_hash: model.text(),
  body_hash: model.text(),
  state: model.text().default("pending"), // "pending" | "completed" | "failed"
  resource_id: model.text().nullable(),
  lease_expires_at: model.dateTime().nullable(),
  response_json: model.json().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_idempotency_unique",
      on: ["owner_id", "operation", "key_hash"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_idempotency_lease",
      on: ["state", "lease_expires_at"],
      where: "deleted_at IS NULL",
    },
  ])
