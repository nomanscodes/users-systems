import { Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY_PORT } from '../di-tokens';
import type {
  TenantRepositoryPort,
  FindAllTenantsOptions,
} from '../../domain/repositories/tenant.repository.port';
import { TenantMapper } from '../mappers/tenant.mapper';

@Injectable()
export class FindAllTenantsQuery {
  constructor(
    @Inject(TENANT_REPOSITORY_PORT)
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  async execute(options: FindAllTenantsOptions) {
    const { data, total, page, limit } = await this.tenantRepo.findAll(options);
    return {
      data: data.map((tenant) => TenantMapper.toPlainObject(tenant)),
      total,
      page,
      limit,
    };
  }
}
