import { DomainError } from './domain-error.base';

export class TenantSlugAlreadyExistsError extends DomainError {
  constructor(slug: string) {
    super(
      `Tenant with slug "${slug}" already exists.`,
      'TENANT_SLUG_EXISTS',
      409,
    );
  }
}
