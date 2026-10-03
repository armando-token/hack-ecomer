import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import { revertG4RealCatalog } from "./revert-g4-real-catalog"

export async function revertG4CatalogFixtures(customClient?: Client) {
  return await revertG4RealCatalog(customClient)
}

export default async function revert({ container }: ExecArgs) {
  return await revertG4RealCatalog()
}

if (require.main === module) {
  revertG4RealCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Revert error:", err)
      process.exit(1)
    })
}

