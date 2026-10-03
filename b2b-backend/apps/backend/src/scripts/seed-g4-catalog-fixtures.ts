import { ExecArgs } from "@medusajs/framework/types"
import { Client } from "pg"
import { seedG4RealCatalog } from "./seed-g4-real-catalog"

export async function seedG4CatalogFixtures(customClient?: Client) {
  return await seedG4RealCatalog(customClient)
}

export default async function seed({ container }: ExecArgs) {
  return await seedG4RealCatalog()
}

if (require.main === module) {
  seedG4RealCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed error:", err)
      process.exit(1)
    })
}

