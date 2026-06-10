import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RefreshTokenRepository } from '../../infrastructure/typeorm/refresh-token.repository';
import { InvalidRefreshTokenError } from '../../domain/errors/invalid-refresh-token.error';

@Injectable()
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepo: RefreshTokenRepository) {}

  async execute(rawRefreshToken: string): Promise<void> {
    // Raw token format: "<recordId>.<randomSecret>"
    const dotIndex = rawRefreshToken.indexOf('.');
    if (dotIndex === -1) throw new InvalidRefreshTokenError();

    const recordId = rawRefreshToken.substring(0, dotIndex);

    const UUID_RE =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(recordId)) throw new InvalidRefreshTokenError();

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
