import { Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY_PORT } from '../di-tokens';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';
import { TenantMapper } from '../mappers/tenant.mapper';
import type { TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';

@Injectable()
export class UpdateTenantStatusUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY_PORT)
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  async execute(tenantId: string, status: TenantStatus) {
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant) throw new TenantNotFoundError(tenantId);

    const updated = await this.tenantRepo.updateStatus(tenantId, status);
    return TenantMapper.toPlainObject(updated);
  }
}
