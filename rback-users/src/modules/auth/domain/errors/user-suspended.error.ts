import { DomainError } from '../../../tenants/domain/errors/domain-error.base';

export class UserSuspendedError extends DomainError {
  constructor() {
    super(
      'Your account has been suspended. Please contact support.',
      'USER_SUSPENDED',
      403,
    );
  }
}
