import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenRepository } from '../../infrastructure/typeorm/refresh-token.repository';
import { UserTypeOrmEntity } from '../../../users/infrastructure/typeorm/user.typeorm.entity';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepo: Repository<UserTypeOrmEntity>,
    private readonly refreshTokenRepo: RefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    rawRefreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // ─── 1. Find all active refresh tokens for potential match ───
    // We scan tokens by comparing hash — no lookup by raw value
    // (raw token is never stored, only bcrypt hash)
    // To find the right token we get all active and compare hashes
    // In production consider token families or storing an ID in the raw token

    // Parse userId from the token structure (uuid.uuid format)
    // We need to find by scanning; for scalability store a lookup key
    // For now: decode a separate "id" payload embedded in token

    // Strategy: store the refresh token record ID in the raw token
    // Format: <recordId>.<secret> — allows O(1) lookup
    const parts = rawRefreshToken.split('.');
    if (parts.length < 2) throw new InvalidRefreshTokenError();

    // The raw token format is: <recordId>.<randomPart1>-<randomPart2>
    // We embedded the record ID as the first UUID segment
    const recordId = parts.slice(0, 5).join('-'); // reconstruct UUID (5 parts with dashes)

    const tokenRecord = await this.refreshTokenRepo.findById(recordId);
    if (!tokenRecord || tokenRecord.isRevoked)
      throw new InvalidRefreshTokenError();
    if (tokenRecord.expiresAt < new Date())
      throw new InvalidRefreshTokenError();

    // ─── 2. Verify hash ───
    const isValid = await bcrypt.compare(
      rawRefreshToken,
      tokenRecord.tokenHash,
    );
    if (!isValid) throw new InvalidRefreshTokenError();

    // ─── 3. Rotate — revoke current token ───
    await this.refreshTokenRepo.revokeById(tokenRecord.id);

    // ─── 4. Load user ───
    const user = await this.userRepo.findOneBy({ id: tokenRecord.userId });
    if (!user) throw new InvalidRefreshTokenError();

    // ─── 5. Issue new Access Token ───
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      userType: user.userType,
      tenantId: user.tenantId ?? null,
      tokenVersion: user.tokenVersion,
    });

    // ─── 6. Issue new Refresh Token ───
    const newRawToken = uuidv4() + '.' + uuidv4();
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    const newTokenHash = await bcrypt.hash(newRawToken, +saltRounds);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepo.create({
      id: uuidv4(),
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: newRawToken };
  }
}
