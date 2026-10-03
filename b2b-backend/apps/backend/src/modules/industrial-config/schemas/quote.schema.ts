import { z } from "zod";

/**
 * Commercial state of an industrial multi-line quote per Megaplan §23.9
 */
export const QuoteStateEnum = z.enum([
  "draft",
  "priced",
  "manual_review",
  "expired",
]);
export type QuoteState = z.infer<typeof QuoteStateEnum>;

/**
 * Individual line item within an industrial quote per Megaplan §11.2 & §23.2
 */
export const IndustrialQuoteLineSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  quote_id: z.string().min(1, { message: "quote_id is required" }),
  line_number: z
    .number()
    .int({ message: "line_number must be an integer" })
    .min(1, { message: "line_number must be >= 1" }),
  variant_id: z.string().min(1, { message: "variant_id is required" }),
  quantity: z
    .number()
    .int({ message: "quantity must be an integer" })
    .min(1, { message: "quantity must be >= 1" })
    .max(1000, { message: "quantity exceeds maximum limit of 1000 items per line" }),
  snapshot_json: z.record(z.string(), z.any()),
  subtotal_minor: z
    .string()
    .regex(/^-?\d+$/, { message: "subtotal_minor must be an integer minor string" })
    .nullable()
    .optional(),
});
export type IndustrialQuoteLine = z.infer<typeof IndustrialQuoteLineSchema>;

/**
 * Industrial Quote entity schema per Megaplan §11.2 & §23.1-23.9
 * Immutable commercial snapshot pinned to configurations or explicit lines.
 */
export const IndustrialQuoteSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  owner_id: z.string().min(1, { message: "owner_id is required" }),
  config_id: z.string().nullable().optional(),
  config_revision: z
    .number()
    .int({ message: "config_revision must be an integer" })
    .min(1, { message: "config_revision must be >= 1" })
    .nullable()
    .optional(),
  state: QuoteStateEnum,
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, { message: "currency must be a 3-letter uppercase code" }),
  scale: z
    .number()
    .int({ message: "scale must be an integer" })
    .min(0, { message: "scale must be >= 0" })
    .default(2),
  total_minor: z
    .string()
    .regex(/^-?\d+$/, { message: "total_minor must be an integer minor string" })
    .nullable()
    .optional(),
  snapshot_json: z.record(z.string(), z.any()),
  expires_at: z.string().optional(),
  idempotency_id: z.string().nullable().optional(),
});
export type IndustrialQuote = z.infer<typeof IndustrialQuoteSchema>;
