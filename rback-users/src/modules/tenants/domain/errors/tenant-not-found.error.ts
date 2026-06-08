import { DomainError } from './domain-error.base';

export class TenantNotFoundError extends DomainError {
  constructor(id: string) {
    super(`Tenant with id "${id}" not found.`, 'TENANT_NOT_FOUND', 404);
  }
}
