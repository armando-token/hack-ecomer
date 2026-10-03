import { model } from "@medusajs/framework/utils"

export const IndustrialConfiguration = model.define("industrial_configuration", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  title: model.text(),
  current_revision: model.number().default(1),
  lifecycle: model.text().default("draft"), // "draft" | "active" | "archived"
  archived_at: model.dateTime().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_config_owner_updated",
      on: ["owner_id", "updated_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_config_owner_lifecycle",
      on: ["owner_id", "lifecycle"],
      where: "deleted_at IS NULL",
    },
  ])
