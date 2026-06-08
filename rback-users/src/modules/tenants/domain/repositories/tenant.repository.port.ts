import { TenantEntity } from '../entities/tenant.entity';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

export interface FindAllTenantsOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: TenantStatus;
}

export interface FindAllTenantsResult {
  data: TenantEntity[];
  total: number;
  page: number;
  limit: number;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<TenantEntity | null>;
  findBySlug(slug: string): Promise<TenantEntity | null>;
  findByEmail(email: string): Promise<TenantEntity | null>;
  findAll(options: FindAllTenantsOptions): Promise<FindAllTenantsResult>;
  save(entity: TenantEntity): Promise<TenantEntity>;
  updateStatus(id: string, status: TenantStatus): Promise<TenantEntity>;
  update(entity: TenantEntity): Promise<TenantEntity>;
}
