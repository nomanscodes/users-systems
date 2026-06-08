import { DomainError } from '../../../tenants/domain/errors/domain-error.base';

export class InvalidRefreshTokenError extends DomainError {
  constructor() {
    super(
      'Refresh token is invalid or has expired. Please log in again.',
      'INVALID_REFRESH_TOKEN',
      401,
    );
  }
}
