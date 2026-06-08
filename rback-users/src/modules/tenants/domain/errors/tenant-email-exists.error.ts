import { DomainError } from './domain-error.base';

export class TenantEmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(
      `Tenant with email "${email}" already exists.`,
      'TENANT_EMAIL_EXISTS',
      409,
    );
  }
}
