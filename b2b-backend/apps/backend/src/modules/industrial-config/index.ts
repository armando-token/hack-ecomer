import IndustrialConfigService from "./service"
import { Module } from "@medusajs/framework/utils"

export const INDUSTRIAL_CONFIG_MODULE = "industrialConfig"

export * from "./models"
export * from "./errors"
export * from "./hash"
export * from "./repository"
export * as Schemas from "./schemas"
export * as Evaluator from "./evaluator"

export default Module(INDUSTRIAL_CONFIG_MODULE, {
  service: IndustrialConfigService,
})
