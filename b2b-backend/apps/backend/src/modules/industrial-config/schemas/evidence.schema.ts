import { z } from "zod";

/**
 * Schema for PDF bounding box coordinates [x1, y1, x2, y2]
 */
export const BoundingBoxSchema = z.array(z.number().finite());
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

/**
 * Evidence reference schema per Megaplan §10.1
 * References verified source documentation with 1-based physical PDF page,
 * section, optional text excerpt, attribute path, applicability, printed label, and bbox.
 */
export const EvidenceRefSchema = z.object({
  source_id: z.string().min(1, { message: "source_id is required" }),
  page: z
    .number()
    .int({ message: "page must be an integer" })
    .min(1, { message: "page must be >= 1 (1-based physical PDF page number)" }),
  section: z.string().optional(),
  excerpt: z.string().optional(),
  attribute_path: z.string().optional(),
  applicability: z.string().optional(),
  printed_page_label: z.string().optional(),
  bbox: BoundingBoxSchema.optional(),
});
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
