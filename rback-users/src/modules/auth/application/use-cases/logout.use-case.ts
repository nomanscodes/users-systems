import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from '../../infrastructure/typeorm/refresh-token.repository';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(rawRefreshToken: string): Promise<void> {
    const parts = rawRefreshToken.split('.');
    if (parts.length < 2) throw new InvalidRefreshTokenError();

    const recordId = parts.slice(0, 5).join('-');
    const tokenRecord = await this.refreshTokenRepo.findById(recordId);

    if (!tokenRecord || tokenRecord.isRevoked) return; // idempotent — already logged out

    const isValid = await bcrypt.compare(
      rawRefreshToken,
      tokenRecord.tokenHash,
    );
    if (!isValid) throw new InvalidRefreshTokenError();

    await this.refreshTokenRepo.revokeById(tokenRecord.id);
  }
}
