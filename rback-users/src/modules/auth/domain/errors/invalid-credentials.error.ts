import { DomainError } from '../../../tenants/domain/errors/domain-error.base';

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('Invalid email or password.', 'INVALID_CREDENTIALS', 401);
  }
}
