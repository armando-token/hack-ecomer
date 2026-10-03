export class NotFoundError extends Error {
  public readonly status = 404
  public readonly statusCode = 404
  public readonly code = "NOT_FOUND"

  constructor(message = "Resource not found") {
    super(message)
    this.name = "NotFoundError"
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class RevisionConflictError extends Error {
  public readonly status = 412
  public readonly statusCode = 412
  public readonly code = "REVISION_CONFLICT"

  constructor(
    message = "Revision conflict: resource modified or expected revision does not match current state"
  ) {
    super(message)
    this.name = "RevisionConflictError"
    Object.setPrototypeOf(this, RevisionConflictError.prototype)
  }
}

export class IdempotencyConflictError extends Error {
  public readonly status = 409
  public readonly statusCode = 409
  public readonly code = "IDEMPOTENCY_CONFLICT"

  constructor(
    message = "Idempotency conflict: key was previously used with a different request payload"
  ) {
    super(message)
    this.name = "IdempotencyConflictError"
    Object.setPrototypeOf(this, IdempotencyConflictError.prototype)
  }
}

export class UniqueConstraintViolationError extends Error {
  public readonly status = 409
  public readonly statusCode = 409
  public readonly code = "UNIQUE_VIOLATION"

  constructor(message = "Unique constraint violation") {
    super(message)
    this.name = "UniqueConstraintViolationError"
    Object.setPrototypeOf(this, UniqueConstraintViolationError.prototype)
  }
}
