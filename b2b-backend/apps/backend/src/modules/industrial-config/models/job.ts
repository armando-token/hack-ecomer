import { model } from "@medusajs/framework/utils"

export const IndustrialJob = model.define("industrial_job", {
  id: model.id().primaryKey(),
  owner_id: model.text(),
  kind: model.text(), // e.g. "thermal_simulation", "pdf_generation"
  state: model.text().default("pending"), // "pending" | "processing" | "completed" | "failed"
  attempt: model.number().default(0),
  lease_owner: model.text().nullable(),
  lease_expires_at: model.dateTime().nullable(),
  payload_ref: model.text().nullable(),
  error_code: model.text().nullable(),
})
  .indexes([
    {
      name: "IDX_ind_job_state_created",
      on: ["state", "created_at"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_ind_job_owner",
      on: ["owner_id"],
      where: "deleted_at IS NULL",
    },
  ])
