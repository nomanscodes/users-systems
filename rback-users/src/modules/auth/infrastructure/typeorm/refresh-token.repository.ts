import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { RefreshTokenTypeOrmEntity } from './refresh-token.typeorm.entity';

@Injectable()
export class RefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenTypeOrmEntity)
    private readonly repo: Repository<RefreshTokenTypeOrmEntity>,
  ) {}

  async create(data: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshTokenTypeOrmEntity> {
    const entity = this.repo.create({
      ...data,
      isRevoked: false,
    });
    return this.repo.save(entity);
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<RefreshTokenTypeOrmEntity[]> {
    return this.repo.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async findById(id: string): Promise<RefreshTokenTypeOrmEntity | null> {
    return this.repo.findOneBy({ id });
  }

  async findAllActiveByUserId(
    userId: string,
  ): Promise<RefreshTokenTypeOrmEntity[]> {
    return this.repo.find({
      where: { userId, isRevoked: false },
    });
  }

  async revokeById(id: string): Promise<void> {
    await this.repo.update({ id }, { isRevoked: true });
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repo.update({ userId }, { isRevoked: true });
  }

  /** Cleanup expired tokens — can be called by a scheduled job */
  async deleteExpired(): Promise<void> {
    await this.repo.delete({ expiresAt: LessThan(new Date()) });
  }
}
