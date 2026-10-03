import { IndustrialConfigRepository, getDatabasePool } from "../repository"
import { NotFoundError } from "../errors"
import { Pool } from "pg"

describe("Ownership Isolation Integration Tests (Gate G3)", () => {
  let pool: Pool
  let repo: IndustrialConfigRepository

  beforeAll(async () => {
    pool = getDatabasePool()
    repo = new IndustrialConfigRepository(pool)
  })

  afterAll(async () => {
    // Clean up test configurations
    await pool.query("DELETE FROM industrial_configuration_revision WHERE configuration_id IN (SELECT id FROM industrial_configuration WHERE owner_id LIKE 'tenant-%');")
    await pool.query("DELETE FROM industrial_configuration WHERE owner_id LIKE 'tenant-%';")
    await pool.end()
  })

  it("creates configuration with owner_id = 'tenant-alice' and allows Alice to query it", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-alice",
      title: "Alice Heating Loop System",
      lifecycle: "active",
      graph_json: { nodes: [{ id: "ctrl-1", type: "controller" }] },
    })

    expect(config).toBeDefined()
    expect(config.id).toMatch(/^cfg_/)
    expect(config.owner_id).toBe("tenant-alice")
    expect(config.title).toBe("Alice Heating Loop System")
    expect(config.current_revision).toBe(1)

    // Alice queries her own configuration
    const aliceView = await repo.getConfiguration(config.id, "tenant-alice")
    expect(aliceView).toBeDefined()
    expect(aliceView.id).toBe(config.id)
    expect(aliceView.owner_id).toBe("tenant-alice")
  })

  it("queries configuration with owner_id = 'tenant-bob' -> MUST return 404 / NOT_FOUND (never reveal resource existence to foreign tenant)", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-alice",
      title: "Confidential Industrial Recipe",
      lifecycle: "active",
    })

    // Bob attempts to query Alice's configuration
    await expect(repo.getConfiguration(config.id, "tenant-bob")).rejects.toThrow(NotFoundError)

    try {
      await repo.getConfiguration(config.id, "tenant-bob")
      fail("Expected getConfiguration to throw NotFoundError")
    } catch (err: any) {
      expect(err).toBeInstanceOf(NotFoundError)
      expect(err.statusCode).toBe(404)
      expect(err.code).toBe("NOT_FOUND")
      // Crucial: Error message must not reveal that the configuration exists or who owns it
      expect(err.message).toContain("not found")
      expect(err.message).not.toContain("tenant-alice")
    }
  })

  it("produces identical 404 / NOT_FOUND error for foreign tenant as for non-existent resource", async () => {
    const aliceConfig = await repo.createConfiguration({
      owner_id: "tenant-alice",
      title: "Alice Secret Pipeline",
    })

    let foreignTenantError: any
    let nonExistentError: any

    try {
      await repo.getConfiguration(aliceConfig.id, "tenant-bob")
    } catch (err) {
      foreignTenantError = err
    }

    try {
      await repo.getConfiguration("cfg_does_not_exist_9999", "tenant-bob")
    } catch (err) {
      nonExistentError = err
    }

    expect(foreignTenantError).toBeDefined()
    expect(nonExistentError).toBeDefined()
    expect(foreignTenantError.statusCode).toBe(404)
    expect(nonExistentError.statusCode).toBe(404)
    expect(foreignTenantError.code).toBe("NOT_FOUND")
    expect(nonExistentError.code).toBe("NOT_FOUND")
    expect(foreignTenantError.message).toBe(nonExistentError.message.replace("cfg_does_not_exist_9999", aliceConfig.id))
  })

  it("prevents foreign tenant from discovering configs via list query", async () => {
    await repo.createConfiguration({
      owner_id: "tenant-alice",
      title: "Alice Public Loop",
    })
    await repo.createConfiguration({
      owner_id: "tenant-bob",
      title: "Bob Only Loop",
    })

    const bobList = await repo.listConfigurations("tenant-bob")
    expect(bobList.length).toBeGreaterThanOrEqual(1)
    for (const item of bobList) {
      expect(item.owner_id).toBe("tenant-bob")
      expect(item.owner_id).not.toBe("tenant-alice")
    }

    const charlieList = await repo.listConfigurations("tenant-charlie")
    expect(charlieList).toEqual([])
  })

  it("prevents foreign tenant from updating configuration with revision", async () => {
    const aliceConfig = await repo.createConfiguration({
      owner_id: "tenant-alice",
      title: "Alice Target Loop",
    })

    await expect(
      repo.updateConfigurationWithRevision({
        configurationId: aliceConfig.id,
        ownerId: "tenant-bob",
        expectedRevision: 1,
        graph_json: { tampered: true },
      })
    ).rejects.toThrow(NotFoundError)
  })
})
