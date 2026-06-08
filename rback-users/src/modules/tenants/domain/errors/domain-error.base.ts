/**
 * DomainError — Abstract Base Class
 *
 * All domain errors extend this.
 * The `statusCode` field is used by DomainErrorFilter to produce the
 * correct HTTP response without leaking domain logic into the interface layer.
 */
export abstract class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
