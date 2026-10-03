import { z } from "zod";
import { PortSchema } from "./port-terminal.schema";

/**
 * State lifecycle for technical snapshots per Megaplan §9.2 & §9.6
 */
export const SnapshotStateEnum = z.enum([
  "draft",
  "reviewed",
  "published",
  "retired",
]);
export type SnapshotState = z.infer<typeof SnapshotStateEnum>;

/**
 * Dimensions in catalog millimeters and 3D bounding envelope in meters [width, height, depth]
 */
export const SnapshotDimensionsSchema = z.object({
  width_mm: z
    .number()
    .finite()
    .positive({ message: "width_mm must be a positive number" }),
  height_mm: z
    .number()
    .finite()
    .positive({ message: "height_mm must be a positive number" }),
  depth_mm: z
    .number()
    .finite()
    .positive({ message: "depth_mm must be a positive number" }),
  envelope_m: z.tuple([
    z.number().finite().positive({ message: "envelope_m width must be positive" }),
    z.number().finite().positive({ message: "envelope_m height must be positive" }),
    z.number().finite().positive({ message: "envelope_m depth must be positive" }),
  ]),
});
export type SnapshotDimensions = z.infer<typeof SnapshotDimensionsSchema>;

/**
 * Validates a 64-character lowercase hex SHA-256 string
 */
export const Sha256HashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, {
    message: "Must be a 64-character lowercase hex SHA-256 hash",
  });

/**
 * Technical Snapshot schema per Megaplan §9.2
 * Immutable technical specification pinned to a variant.
 */
export const TechnicalSnapshotSchema = z.object({
  snapshot_id: z.string().min(1, { message: "snapshot_id is required" }),
  variant_id: z.string().min(1, { message: "variant_id is required" }),
  sku: z.string().min(1, { message: "sku is required" }),
  manufacturer: z.string().optional(),
  manufacturer_part_number: z.string().optional(),
  technical_revision: z.string().min(1, { message: "technical_revision is required" }),
  schema_version: z
    .literal("technical_snapshot/2.0")
    .default("technical_snapshot/2.0"),
  state: SnapshotStateEnum,
  attributes: z.array(z.any()).default([]),
  ports: z.array(PortSchema).default([]),
  dimensions: SnapshotDimensionsSchema.optional(),
  mounting: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  source_ids: z.array(z.string()).default([]),
  content_sha256: Sha256HashSchema,
  published_at: z.string().optional(),
  reviewed_by: z.string().optional(),
  applicability: z.string().optional(),
});
export type TechnicalSnapshot = z.infer<typeof TechnicalSnapshotSchema>;
