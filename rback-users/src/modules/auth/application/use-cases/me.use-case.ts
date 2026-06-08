import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';
import { InvalidCredentialsError } from '../../domain/errors/invalid-credentials.error';

@Injectable()
export class MeUseCase {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
  ) {}

  async execute(
    userId: string,
  ): Promise<Omit<UserTypeOrmEntity, 'passwordHash'>> {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new InvalidCredentialsError();

    // Strip sensitive fields before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
