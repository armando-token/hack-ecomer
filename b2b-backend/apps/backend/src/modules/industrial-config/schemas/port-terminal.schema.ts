import { z } from "zod";

/**
 * Closed categories for industrial electrical and physical ports per Megaplan §8.1 & §9.2
 */
export const PortCategoryEnum = z.enum([
  "power",
  "discrete_input",
  "discrete_output",
  "analog_input",
  "analog_output",
  "serial_comm",
  "ethernet",
  "sensor",
]);
export type PortCategory = z.infer<typeof PortCategoryEnum>;

/**
 * Directionality of signal/power for an industrial port
 */
export const PortDirectionEnum = z.enum([
  "input",
  "output",
  "bidirectional",
]);
export type PortDirection = z.infer<typeof PortDirectionEnum>;

/**
 * Individual terminal/pin within an industrial port block
 */
export const TerminalSchema = z.object({
  label: z.string().min(1, { message: "terminal label is required" }),
  function: z.string().optional(),
});
export type Terminal = z.infer<typeof TerminalSchema>;

/**
 * Industrial Port schema
 * Identifies physical/electrical interface with terminals for topological connections
 */
export const PortSchema = z.object({
  port_id: z.string().min(1, { message: "port_id is required" }),
  label: z.string().min(1, { message: "port label is required" }),
  category: PortCategoryEnum,
  direction: PortDirectionEnum,
  signal_type: z.string().optional(),
  terminals: z.array(TerminalSchema).default([]),
});
export type Port = z.infer<typeof PortSchema>;
