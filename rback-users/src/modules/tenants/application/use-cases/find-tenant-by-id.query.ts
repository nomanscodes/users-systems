import { Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY_PORT } from '../di-tokens';
import type { TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { TenantMapper } from '../mappers/tenant.mapper';

@Injectable()
export class FindTenantByIdQuery {
  constructor(
    @Inject(TENANT_REPOSITORY_PORT)
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  async execute(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) throw new TenantNotFoundError(id);
    return TenantMapper.toPlainObject(tenant);
  }
}
