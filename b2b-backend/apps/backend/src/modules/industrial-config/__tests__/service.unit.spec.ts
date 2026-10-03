import IndustrialConfigService from "../service"

describe("IndustrialConfigService domain methods", () => {
  let service: IndustrialConfigService

  beforeEach(() => {
    service = new IndustrialConfigService({} as any)
  })

  describe("createRevisionWithCas", () => {
    it("throws NOT_FOUND if configuration does not exist", async () => {
      ;(service as any).retrieveIndustrialConfiguration = jest
        .fn()
        .mockResolvedValue(null)

      await expect(
        service.createRevisionWithCas("cfg_nonexistent", 1, {
          schema_version: "2.0",
          graph_json: {},
          content_sha256: "a".repeat(64),
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })

    it("throws REVISION_CONFLICT if current_revision !== expectedRevision", async () => {
      ;(service as any).retrieveIndustrialConfiguration = jest
        .fn()
        .mockResolvedValue({
          id: "cfg_123",
          current_revision: 2,
        })

      await expect(
        service.createRevisionWithCas("cfg_123", 1, {
          schema_version: "2.0",
          graph_json: {},
          content_sha256: "a".repeat(64),
        })
      ).rejects.toMatchObject({
        code: "REVISION_CONFLICT",
      })
    })

    it("successfully creates revision and bumps current_revision on match", async () => {
      ;(service as any).retrieveIndustrialConfiguration = jest
        .fn()
        .mockResolvedValue({
          id: "cfg_123",
          current_revision: 2,
        })
      ;(service as any).createIndustrialConfigurationRevisions = jest
        .fn()
        .mockImplementation((data) =>
          Promise.resolve({
            id: "rev_new",
            ...data,
          })
        )
      ;(service as any).updateIndustrialConfigurations = jest
        .fn()
        .mockResolvedValue({
          id: "cfg_123",
          current_revision: 3,
        })

      const revision = await service.createRevisionWithCas("cfg_123", 2, {
        schema_version: "2.0",
        graph_json: { nodes: [] },
        content_sha256: "a".repeat(64),
      })

      expect(revision.revision).toBe(3)
      expect(revision.configuration_id).toBe("cfg_123")
      expect(
        (service as any).updateIndustrialConfigurations
      ).toHaveBeenCalledWith({
        id: "cfg_123",
        current_revision: 3,
      })
    })
  })

  describe("getByIdWithOwner", () => {
    it("returns record when owner matches", async () => {
      ;(service as any).retrieveIndustrialConfiguration = jest
        .fn()
        .mockResolvedValue({
          id: "cfg_123",
          owner_id: "user_alice",
          title: "Alice Config",
        })

      const result = await service.getByIdWithOwner(
        "IndustrialConfiguration",
        "cfg_123",
        "user_alice"
      )

      expect(result.id).toBe("cfg_123")
      expect(result.owner_id).toBe("user_alice")
    })

    it("throws NOT_FOUND when owner does not match (ownership isolation)", async () => {
      ;(service as any).retrieveIndustrialConfiguration = jest
        .fn()
        .mockResolvedValue({
          id: "cfg_123",
          owner_id: "user_bob",
          title: "Bob Config",
        })

      await expect(
        service.getByIdWithOwner("configuration", "cfg_123", "user_alice")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })

    it("throws NOT_FOUND when record does not exist", async () => {
      ;(service as any).retrieveIndustrialQuote = jest
        .fn()
        .mockResolvedValue(null)

      await expect(
        service.getByIdWithOwner("quote", "quote_nonexistent", "user_alice")
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      })
    })
  })

  describe("executeIdempotent", () => {
    it("executes handler and persists completed state on new key", async () => {
      ;(service as any).listIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([])
      ;(service as any).createIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([{ id: "idem_1" }])
      ;(service as any).updateIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue({})

      const handler = jest.fn().mockResolvedValue({ id: "res_123" })

      const result = await service.executeIdempotent(
        "user_alice",
        "create_quote",
        "key_abc_1",
        { amount: 100 },
        handler
      )

      expect(handler).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ id: "res_123" })
      expect(
        (service as any).updateIndustrialIdempotencies
      ).toHaveBeenCalledWith({
        id: "idem_1",
        state: "completed",
        resource_id: "res_123",
      })
    })

    it("replays existing result if state is completed", async () => {
      const crypto = require("crypto")
      const bodyHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ amount: 100 }))
        .digest("hex")

      ;(service as any).listIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([
          {
            id: "idem_1",
            body_hash: bodyHash,
            state: "completed",
            resource_id: "res_existing",
          },
        ])

      const handler = jest.fn()

      const result = await service.executeIdempotent(
        "user_alice",
        "create_quote",
        "key_abc_1",
        { amount: 100 },
        handler
      )

      expect(handler).not.toHaveBeenCalled()
      expect(result.replayed).toBe(true)
      expect(result.resource_id).toBe("res_existing")
    })

    it("throws IDEMPOTENCY_CONFLICT when key matches but payload differs", async () => {
      ;(service as any).listIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([
          {
            id: "idem_1",
            body_hash: "different_hash",
            state: "completed",
            resource_id: "res_existing",
          },
        ])

      const handler = jest.fn()

      await expect(
        service.executeIdempotent(
          "user_alice",
          "create_quote",
          "key_abc_1",
          { amount: 200 },
          handler
        )
      ).rejects.toMatchObject({
        code: "IDEMPOTENCY_CONFLICT",
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it("throws CONCURRENT_REQUEST when active lease is in progress", async () => {
      const crypto = require("crypto")
      const bodyHash = crypto
        .createHash("sha256")
        .update(JSON.stringify({ amount: 100 }))
        .digest("hex")

      const futureLease = new Date(Date.now() + 30000)

      ;(service as any).listIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([
          {
            id: "idem_1",
            body_hash: bodyHash,
            state: "in_progress",
            lease_expires_at: futureLease,
          },
        ])

      const handler = jest.fn()

      await expect(
        service.executeIdempotent(
          "user_alice",
          "create_quote",
          "key_abc_1",
          { amount: 100 },
          handler
        )
      ).rejects.toMatchObject({
        code: "CONCURRENT_REQUEST",
      })

      expect(handler).not.toHaveBeenCalled()
    })

    it("records failed state when handler throws", async () => {
      ;(service as any).listIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([])
      ;(service as any).createIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue([{ id: "idem_fail" }])
      ;(service as any).updateIndustrialIdempotencies = jest
        .fn()
        .mockResolvedValue({})

      const handler = jest.fn().mockRejectedValue(new Error("Database error"))

      await expect(
        service.executeIdempotent(
          "user_alice",
          "create_quote",
          "key_fail",
          { amount: 100 },
          handler
        )
      ).rejects.toThrow("Database error")

      expect(
        (service as any).updateIndustrialIdempotencies
      ).toHaveBeenCalledWith({
        id: "idem_fail",
        state: "failed",
      })
    })
  })
})
