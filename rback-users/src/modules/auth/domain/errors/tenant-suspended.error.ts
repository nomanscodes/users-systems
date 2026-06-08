import { DomainError } from '../../../tenants/domain/errors/domain-error.base';

export class TenantSuspendedError extends DomainError {
  constructor() {
    super(
      'Your school account has been suspended. Please contact the system administrator.',
      'TENANT_SUSPENDED',
      403,
    );
  }
}
