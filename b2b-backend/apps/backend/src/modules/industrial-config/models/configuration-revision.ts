import { model } from "@medusajs/framework/utils"

export const IndustrialConfigurationRevision = model.define("industrial_configuration_revision", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  revision: model.number(),
  schema_version: model.text().default("configuration_revision/2.0"),
  graph_json: model.json().nullable(),
  requirements_json: model.json().nullable(),
  focus_json: model.json().nullable(),
  content_sha256: model.text(),
  created_by: model.text().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_config_rev_unique",
      on: ["configuration_id", "revision"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_config_rev_config_id",
      on: ["configuration_id"],
      where: "deleted_at IS NULL",
    },
  ])
