import { model } from "@medusajs/framework/utils"

export const IndustrialAuditEvent = model.define("industrial_audit_event", {
  id: model.id().primaryKey(),
  owner_id: model.text().nullable(),
  actor_id: model.text(),
  action: model.text(),
  resource_type: model.text(),
  resource_id: model.text(),
  request_id: model.text().nullable(),
  details_json: model.json().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_audit_resource",
      on: ["resource_type", "resource_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_audit_created",
      on: ["created_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_audit_owner",
      on: ["owner_id"],
      where: "deleted_at IS NULL",
    },
  ])
