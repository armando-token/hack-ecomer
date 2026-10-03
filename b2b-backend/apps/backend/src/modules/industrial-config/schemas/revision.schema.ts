import { z } from "zod";

/**
 * Configuration Revision entity schema per Megaplan §11.2 & §18.1
 * Append-only immutable version of an engineering solution graph.
 */
export const ConfigurationRevisionSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  configuration_id: z.string().min(1, { message: "configuration_id is required" }),
  revision: z
    .number()
    .int({ message: "revision must be an integer" })
    .min(1, { message: "revision must be an integer >= 1" }),
  schema_version: z.string().min(1, { message: "schema_version is required" }),
  graph_json: z.record(z.string(), z.any()),
  requirements_json: z.record(z.string(), z.any()).optional(),
  focus_json: z.record(z.string(), z.any()).optional(),
  content_sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, {
      message: "content_sha256 must be a 64-character lowercase hex SHA-256 hash",
    }),
  created_by: z.string().optional(),
});
export type ConfigurationRevision = z.infer<typeof ConfigurationRevisionSchema>;
