import { z } from "zod";

/**
 * Canonical physical and industrial units for v2 API
 * Per Megaplan §8.2:
 * - Geometry & transforms: m (meters)
 * - Catalog dimensions: mm (millimeters)
 * - Temperature: Cel (°C) (differences compatible with K)
 * - Instrumentation current: mA
 * - Power current: A
 * - Voltage: V (nature explicit ac/dc)
 * - Power: W, kW
 * - Relative humidity: %RH
 * - Time: s (seconds), ms (milliseconds)
 * - Frequency: Hz
 * - Resistance: ohm
 * - Pressure: bar, mbar, Pa, kPa
 */
export const CANONICAL_UNITS = [
  "m",
  "mm",
  "Cel",
  "K",
  "mA",
  "A",
  "V",
  "W",
  "kW",
  "%RH",
  "s",
  "ms",
  "Hz",
  "ohm",
  "bar",
  "mbar",
  "Pa",
  "kPa",
] as const;

export const CanonicalUnitEnum = z.enum(CANONICAL_UNITS);
export type CanonicalUnit = z.infer<typeof CanonicalUnitEnum>;

export const VoltageNatureEnum = z.enum(["ac", "dc"]);
export type VoltageNature = z.infer<typeof VoltageNatureEnum>;

/**
 * Quantity schema
 * Finite numeric value, required unit, optional dimension & electrical nature
 * Rejects NaN, Infinity, -Infinity
 */
export const QuantitySchema = z.object({
  value: z
    .number()
    .finite({ message: "Quantity value must be a finite number (rejects NaN, Infinity)" }),
  unit: z.string().min(1, { message: "Unit cannot be empty" }),
  dimension: z.string().optional(),
  nature: VoltageNatureEnum.optional(),
});
export type Quantity = z.infer<typeof QuantitySchema>;

/**
 * Range schema
 * Finite min and max values, required unit, optional dimension & inclusive flags
 * Rejects NaN, Infinity, and inverted ranges (min > max)
 */
export const RangeSchema = z
  .object({
    min: z
      .number()
      .finite({ message: "Range min must be a finite number (rejects NaN, Infinity)" }),
    max: z
      .number()
      .finite({ message: "Range max must be a finite number (rejects NaN, Infinity)" }),
    unit: z.string().min(1, { message: "Unit cannot be empty" }),
    dimension: z.string().optional(),
    inclusive_min: z.boolean().optional().default(true),
    inclusive_max: z.boolean().optional().default(true),
    nature: VoltageNatureEnum.optional(),
  })
  .refine((data) => data.min <= data.max, {
    message: "Inverted range: min must be less than or equal to max",
    path: ["min"],
  });
export type Range = z.infer<typeof RangeSchema>;

/**
 * Discrete value schema
 * Closed enum, integer count, boolean or discrete state value
 */
export const DiscreteSchema = z.object({
  value: z.union([z.string(), z.number().int(), z.boolean()]),
  unit: z.string().optional(),
  dimension: z.string().optional(),
  label: z.string().optional(),
  options: z.array(z.union([z.string(), z.number().int(), z.boolean()])).optional(),
});
export type Discrete = z.infer<typeof DiscreteSchema>;

/**
 * Non-negative dimensional quantity (lengths, widths, heights in geometry)
 */
export const DimensionQuantitySchema = QuantitySchema.refine(
  (data) => data.value >= 0,
  {
    message: "Dimensional quantities must be non-negative",
    path: ["value"],
  }
);
export type DimensionQuantity = z.infer<typeof DimensionQuantitySchema>;

/**
 * Non-negative dimensional range
 */
export const DimensionRangeSchema = RangeSchema.refine(
  (data) => data.min >= 0,
  {
    message: "Dimensional ranges must be non-negative",
    path: ["min"],
  }
);
export type DimensionRange = z.infer<typeof DimensionRangeSchema>;
