import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantTypeOrmEntity } from './tenant.typeorm.entity';
import { TenantTypeOrmMapper } from './tenant.typeorm.mapper';
import {
  TenantRepositoryPort,
  FindAllTenantsOptions,
  FindAllTenantsResult,
} from '../../domain/repositories/tenant.repository.port';
import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

@Injectable()
export class TenantTypeOrmRepository implements TenantRepositoryPort {
  constructor(
    @InjectRepository(TenantTypeOrmEntity)
    private readonly ormRepo: Repository<TenantTypeOrmEntity>,
  ) {}

  async findById(id: string): Promise<TenantEntity | null> {
    const orm = await this.ormRepo.findOneBy({ id });
    return orm ? TenantTypeOrmMapper.toDomain(orm) : null;
  }

  async findBySlug(slug: string): Promise<TenantEntity | null> {
    const orm = await this.ormRepo.findOneBy({ slug });
    return orm ? TenantTypeOrmMapper.toDomain(orm) : null;
  }

  async findByEmail(email: string): Promise<TenantEntity | null> {
    const orm = await this.ormRepo.findOneBy({ email });
    return orm ? TenantTypeOrmMapper.toDomain(orm) : null;
  }

  async findAll(options: FindAllTenantsOptions): Promise<FindAllTenantsResult> {
    const { page = 1, limit = 20, search, status } = options;
    const query = this.ormRepo.createQueryBuilder('t');

    if (status) {
      query.andWhere('t.status = :status', { status });
    }

    if (search) {
      query.andWhere(
        '(t.name LIKE :search OR t.email LIKE :search OR t.slug LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }

    const [rows, total] = await query
      .orderBy('t.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rows.map((row) => TenantTypeOrmMapper.toDomain(row)),
      total,
      page,
      limit,
    };
  }

  async save(entity: TenantEntity): Promise<TenantEntity> {
    const data = TenantTypeOrmMapper.toPersistence(entity);
    const created = this.ormRepo.create(data);
    const saved = await this.ormRepo.save(created);
    return TenantTypeOrmMapper.toDomain(saved);
  }

  async update(entity: TenantEntity): Promise<TenantEntity> {
    const data = TenantTypeOrmMapper.toPersistence(entity);
    await this.ormRepo.save({ id: entity.id, ...data });
    const refreshed = await this.ormRepo.findOneByOrFail({ id: entity.id });
    return TenantTypeOrmMapper.toDomain(refreshed);
  }

  async updateStatus(id: string, status: TenantStatus): Promise<TenantEntity> {
    await this.ormRepo.update({ id }, { status, updatedAt: new Date() });
    const refreshed = await this.ormRepo.findOneByOrFail({ id });
    return TenantTypeOrmMapper.toDomain(refreshed);
  }
}
