import { z } from "zod";

/**
 * Kind of industrial asset per Megaplan §11.2 & §15
 */
export const AssetKindEnum = z.enum([
  "model_glb",
  "datasheet_pdf",
  "manual_pdf",
  "drawing",
]);
export type AssetKind = z.infer<typeof AssetKindEnum>;

/**
 * Visibility of asset per Megaplan §11.2 & §17.4
 */
export const AssetVisibilityEnum = z.enum([
  "public",
  "authenticated",
  "internal",
]);
export type AssetVisibility = z.infer<typeof AssetVisibilityEnum>;

/**
 * Lifecycle state of asset per Megaplan §11.2
 */
export const AssetStateEnum = z.enum([
  "active",
  "superseded",
  "quarantined",
]);
export type AssetState = z.infer<typeof AssetStateEnum>;

/**
 * Binding relationship kind connecting snapshot to asset
 */
export const BindingKindEnum = z.enum([
  "primary_3d",
  "dimensional_proxy",
  "datasheet",
]);
export type BindingKind = z.infer<typeof BindingKindEnum>;

/**
 * Industrial Asset schema
 * Tracks 3D models (GLB), datasheets, manuals, and technical drawings.
 */
export const IndustrialAssetSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  variant_id: z.string().nullable().optional(),
  snapshot_id: z.string().nullable().optional(),
  kind: AssetKindEnum,
  revision: z.string().min(1, { message: "revision is required" }),
  sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/, { message: "sha256 must be a 64-char lowercase hex string" }),
  bytes: z
    .number()
    .int({ message: "bytes must be an integer" })
    .positive({ message: "bytes must be a positive integer" }),
  mime: z.string().min(1, { message: "mime is required" }),
  storage_key: z.string().min(1, { message: "storage_key is required" }),
  visibility: AssetVisibilityEnum,
  state: AssetStateEnum,
  manifest_json: z.record(z.string(), z.any()).optional(),
});
export type IndustrialAsset = z.infer<typeof IndustrialAssetSchema>;

/**
 * Asset Binding schema
 * Links a technical snapshot to an industrial asset with an explicit binding kind.
 */
export const AssetBindingSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  snapshot_id: z.string().min(1, { message: "snapshot_id is required" }),
  asset_id: z.string().min(1, { message: "asset_id is required" }),
  binding_kind: BindingKindEnum,
});
export type AssetBinding = z.infer<typeof AssetBindingSchema>;
