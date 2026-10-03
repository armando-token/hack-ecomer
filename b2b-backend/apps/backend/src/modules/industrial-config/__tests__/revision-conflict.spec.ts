import { IndustrialConfigRepository, getDatabasePool } from "../repository"
import { RevisionConflictError } from "../errors"
import { Pool } from "pg"

describe("Revision Conflict & CAS Integration Tests (Gate G3)", () => {
  let pool: Pool
  let repo: IndustrialConfigRepository

  beforeAll(async () => {
    pool = getDatabasePool()
    repo = new IndustrialConfigRepository(pool)
  })

  afterAll(async () => {
    await pool.query("DELETE FROM industrial_configuration_revision WHERE configuration_id IN (SELECT id FROM industrial_configuration WHERE owner_id LIKE 'tenant-cas%');")
    await pool.query("DELETE FROM industrial_configuration WHERE owner_id LIKE 'tenant-cas%';")
    await pool.end()
  })

  it("starts with revision 1 on configuration creation", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-cas-1",
      title: "Chamber Thermal Loop Initial",
      graph_json: { nodes: ["sensor_pt100"] },
    })

    expect(config.current_revision).toBe(1)

    // Verify initial revision in database
    const revRes = await pool.query(
      "SELECT revision, configuration_id, content_sha256 FROM industrial_configuration_revision WHERE configuration_id = $1;",
      [config.id]
    )
    expect(revRes.rows.length).toBe(1)
    expect(revRes.rows[0].revision).toBe(1)
    expect(revRes.rows[0].content_sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it("tests CAS / If-Match: updating revision with expected revision 1 succeeds and creates revision 2", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-cas-1",
      title: "Chamber Thermal Loop V1",
      graph_json: { nodes: ["sensor_pt100"] },
    })

    const updateRes = await repo.updateConfigurationWithRevision({
      configurationId: config.id,
      ownerId: "tenant-cas-1",
      expectedRevision: 1,
      graph_json: { nodes: ["sensor_pt100", "ctrl_novus_n1200"] },
      requirements_json: { setpoint_c: 120 },
      created_by: "operator-1",
    })

    expect(updateRes.configuration.current_revision).toBe(2)
    expect(updateRes.newRevision.revision).toBe(2)
    expect(updateRes.newRevision.configuration_id).toBe(config.id)
    expect(updateRes.newRevision.created_by).toBe("operator-1")

    // Verify config state in DB
    const configDb = await repo.getConfiguration(config.id, "tenant-cas-1")
    expect(configDb.current_revision).toBe(2)

    // Verify both revisions exist in append-only history
    const allRevs = await pool.query(
      "SELECT revision FROM industrial_configuration_revision WHERE configuration_id = $1 ORDER BY revision ASC;",
      [config.id]
    )
    expect(allRevs.rows.map((r) => r.revision)).toEqual([1, 2])
  })

  it("attempting to update revision 1 again when current is 2 MUST fail with REVISION_CONFLICT (HTTP 412)", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-cas-1",
      title: "Chamber Thermal Loop Stale Test",
      graph_json: { nodes: ["sensor_pt100"] },
    })

    // Advance to revision 2
    await repo.updateConfigurationWithRevision({
      configurationId: config.id,
      ownerId: "tenant-cas-1",
      expectedRevision: 1,
      graph_json: { nodes: ["sensor_pt100", "novus_n1200"] },
    })

    // Client B with stale If-Match / expectedRevision 1 attempts to update
    await expect(
      repo.updateConfigurationWithRevision({
        configurationId: config.id,
        ownerId: "tenant-cas-1",
        expectedRevision: 1, // Stale! Current is 2
        graph_json: { nodes: ["sensor_pt100", "horner_x5"] },
      })
    ).rejects.toThrow(RevisionConflictError)

    try {
      await repo.updateConfigurationWithRevision({
        configurationId: config.id,
        ownerId: "tenant-cas-1",
        expectedRevision: 1,
        graph_json: { nodes: ["sensor_pt100", "horner_x5"] },
      })
      fail("Should have failed with RevisionConflictError")
    } catch (err: any) {
      expect(err).toBeInstanceOf(RevisionConflictError)
      expect(err.statusCode).toBe(412)
      expect(err.code).toBe("REVISION_CONFLICT")
      expect(err.message).toContain("expected revision 1 but current revision is 2")
    }

    // Verify current_revision remains 2 and no revision 3 was created
    const configDb = await repo.getConfiguration(config.id, "tenant-cas-1")
    expect(configDb.current_revision).toBe(2)

    const revs = await pool.query(
      "SELECT revision FROM industrial_configuration_revision WHERE configuration_id = $1;",
      [config.id]
    )
    expect(revs.rows.length).toBe(2)
  })

  it("succeeds when client provides up-to-date expected revision 2 and increments to 3", async () => {
    const config = await repo.createConfiguration({
      owner_id: "tenant-cas-1",
      title: "Chamber Thermal Loop Multi-Step",
    })

    // 1 -> 2
    await repo.updateConfigurationWithRevision({
      configurationId: config.id,
      ownerId: "tenant-cas-1",
      expectedRevision: 1,
      graph_json: { step: 1 },
    })

    // 2 -> 3
    const updateTo3 = await repo.updateConfigurationWithRevision({
      configurationId: config.id,
      ownerId: "tenant-cas-1",
      expectedRevision: 2,
      graph_json: { step: 2 },
    })

    expect(updateTo3.configuration.current_revision).toBe(3)
    expect(updateTo3.newRevision.revision).toBe(3)
  })
})
