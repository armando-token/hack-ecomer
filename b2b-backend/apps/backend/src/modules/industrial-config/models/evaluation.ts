import { model } from "@medusajs/framework/utils"

export const IndustrialEvaluation = model.define("industrial_evaluation", {
  id: model.id().primaryKey(),
  configuration_id: model.text().nullable(),
  config_revision: model.number().nullable(),
  input_sha256: model.text(),
  snapshot_set_json: model.json().nullable(),
  rules_version: model.text(),
  result_json: model.json(),
})
  .indexes([
    {
      name: "IDX_ind_eval_config_rev",
      on: ["configuration_id", "config_revision"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_eval_input_rules",
      on: ["input_sha256", "rules_version"],
      where: "deleted_at IS NULL",
    },
  ])
