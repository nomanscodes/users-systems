import { Inject, Injectable } from '@nestjs/common';
import { TENANT_REPOSITORY_PORT } from '../di-tokens';
import type { TenantRepositoryPort } from '../../domain/repositories/tenant.repository.port';
import { TenantNotFoundError } from '../../domain/errors/tenant-not-found.error';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantMapper } from '../mappers/tenant.mapper';

export interface UpdateTenantCommand {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
}

@Injectable()
export class UpdateTenantUseCase {
  constructor(
    @Inject(TENANT_REPOSITORY_PORT)
    private readonly tenantRepo: TenantRepositoryPort,
  ) {}

  async execute(id: string, command: UpdateTenantCommand) {
    const existing = await this.tenantRepo.findById(id);
    if (!existing) throw new TenantNotFoundError(id);

    const updated = new TenantEntity(
      existing.id,
      command.name ?? existing.name,
      existing.slug, // slug is immutable after creation
      command.email ?? existing.email,
      command.phone !== undefined ? command.phone : existing.phone,
      command.address !== undefined ? command.address : existing.address,
      existing.status,
      existing.createdBy,
      existing.createdAt,
      new Date(),
    );

    const saved = await this.tenantRepo.update(updated);
    return TenantMapper.toPlainObject(saved);
  }
}
