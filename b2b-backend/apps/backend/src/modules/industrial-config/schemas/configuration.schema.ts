import { z } from "zod";

/**
 * Lifecycle states of an engineering configuration per Megaplan §8.3 & §18.2
 */
export const ConfigurationLifecycleEnum = z.enum([
  "draft",
  "evaluated",
  "ready",
  "archived",
]);
export type ConfigurationLifecycle = z.infer<typeof ConfigurationLifecycleEnum>;

/**
 * Industrial Configuration entity schema
 */
export const ConfigurationSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  owner_id: z.string().min(1, { message: "owner_id is required" }),
  title: z.string().optional(),
  current_revision: z
    .number()
    .int({ message: "current_revision must be an integer" })
    .min(1, { message: "current_revision must be >= 1" }),
  lifecycle: ConfigurationLifecycleEnum,
  created_at: z.string().optional(),
  archived_at: z.string().nullable().optional(),
});
export type Configuration = z.infer<typeof ConfigurationSchema>;

/**
 * Equipment instance placed within a configuration revision per Megaplan §18.1
 */
export const InstanceSchema = z.object({
  instance_id: z.string().min(1, { message: "instance_id is required" }),
  variant_id: z.string().min(1, { message: "variant_id is required" }),
  snapshot_id: z.string().min(1, { message: "snapshot_id is required" }),
  model_asset_id: z.string().nullable().optional(),
  user_label: z.string().optional(),
});
export type Instance = z.infer<typeof InstanceSchema>;

/**
 * Physical/logical connection between instance ports
 */
export const ConnectionSchema = z.object({
  connection_id: z.string().min(1, { message: "connection_id is required" }),
  from_instance_id: z.string().min(1, { message: "from_instance_id is required" }),
  from_port_id: z.string().min(1, { message: "from_port_id is required" }),
  to_instance_id: z.string().min(1, { message: "to_instance_id is required" }),
  to_port_id: z.string().min(1, { message: "to_port_id is required" }),
});
export type Connection = z.infer<typeof ConnectionSchema>;

/**
 * Dimensional fidelity status of contextual process objects
 */
export const ProcessObjectDimensionalStatusEnum = z.enum([
  "dimensionally_verified",
  "illustrative",
  "not_documented",
  "user_provided",
]);
export type ProcessObjectDimensionalStatus = z.infer<
  typeof ProcessObjectDimensionalStatusEnum
>;

/**
 * Contextual process object (e.g. thermal tank, conveyor) not priced in BOM
 */
export const ProcessObjectSchema = z.object({
  id: z.string().min(1, { message: "id is required" }),
  family: z.string().min(1, { message: "family is required" }),
  label: z.string().optional(),
  dimensional_status: ProcessObjectDimensionalStatusEnum.optional(),
  parameters: z.record(z.string(), z.any()).optional(),
});
export type ProcessObject = z.infer<typeof ProcessObjectSchema>;

/**
 * Member node of an industrial communications network
 */
export const NetworkMemberSchema = z.object({
  instance_id: z.string().min(1, { message: "instance_id is required" }),
  port_id: z.string().optional(),
  address: z.union([z.string(), z.number()]).optional(),
  role: z.string().optional(),
});
export type NetworkMember = z.infer<typeof NetworkMemberSchema>;

/**
 * Industrial communications network (e.g. Modbus RS-485, Profinet, Ethernet/IP)
 */
export const NetworkSchema = z.object({
  network_id: z.string().min(1, { message: "network_id is required" }),
  protocol: z.string().min(1, { message: "protocol is required" }),
  members: z.array(NetworkMemberSchema).default([]),
  parameters: z.record(z.string(), z.any()).optional(),
});
export type Network = z.infer<typeof NetworkSchema>;

/**
 * Provenance kind for an engineering variable
 */
export const VariableSourceKindEnum = z.enum([
  "port",
  "process",
  "user_input",
  "simulated",
  "computed",
]);
export type VariableSourceKind = z.infer<typeof VariableSourceKindEnum>;

/**
 * Named engineering variable per Megaplan §18.1.1
 */
export const VariableSchema = z.object({
  variable_id: z.string().min(1, { message: "variable_id is required" }),
  label: z.string().min(1, { message: "label is required" }),
  unit: z.string().min(1, { message: "unit is required" }),
  dimension: z.string().optional(),
  source_kind: VariableSourceKindEnum,
  source_reference: z.union([z.string(), z.record(z.string(), z.any())]),
});
export type Variable = z.infer<typeof VariableSchema>;

/**
 * Closed-loop control definition linking PV, controller, and actuator
 */
export const ControlLoopSchema = z.object({
  loop_id: z.string().min(1, { message: "loop_id is required" }),
  name: z.string().optional(),
  pv_variable_id: z.string().min(1, { message: "pv_variable_id is required" }),
  sp_variable_id: z.string().optional(),
  mv_variable_id: z.string().optional(),
  controller_instance_id: z.string().min(1, { message: "controller_instance_id is required" }),
  actuator_instance_id: z.string().optional(),
  process_object_id: z.string().optional(),
  control_algorithm: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional(),
});
export type ControlLoop = z.infer<typeof ControlLoopSchema>;
