import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { MeUseCase } from '../../application/use-cases/me.use-case';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthDomainErrorFilter } from '../filters/auth-error.filter';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../strategies/jwt.strategy';
import { success } from '../../../../common/response/api-response';

@Controller('auth')
@UseFilters(AuthDomainErrorFilter)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly meUseCase: MeUseCase,
  ) {}

  /**
   * POST /auth/login
   * Public — login with email + password
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const data = await this.loginUseCase.execute(dto);
    return res.status(HttpStatus.OK).json(success(data, 'Login successful.'));
  }

  /**
   * POST /auth/refresh
   * Public — swap a valid refresh token for a fresh access + refresh token pair
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto, @Res() res: Response) {
    const data = await this.refreshTokenUseCase.execute(dto.refreshToken);
    return res
      .status(HttpStatus.OK)
      .json(success(data, 'Tokens refreshed successfully.'));
  }

  /**
   * POST /auth/logout
   * JWT required — revokes the current refresh token
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Body() dto: RefreshTokenDto, @Res() res: Response) {
    await this.logoutUseCase.execute(dto.refreshToken);
    return res
      .status(HttpStatus.OK)
      .json(success(null, 'Logged out successfully.'));
  }

  /**
   * GET /auth/me
   * JWT required — returns the current user's profile
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const data = await this.meUseCase.execute(user.sub);
    return res.status(HttpStatus.OK).json(success(data));
  }
}
