import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

export class TenantEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly email: string,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly status: TenantStatus,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isActive(): boolean {
    return this.status === TenantStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.status === TenantStatus.SUSPENDED;
  }
}
