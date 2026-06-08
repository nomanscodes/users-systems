import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../../../common/guards/super-admin.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { RegisterTenantUseCase } from '../../application/use-cases/register-tenant.use-case';
import { FindAllTenantsQuery } from '../../application/use-cases/find-all-tenants.query';
import { FindTenantByIdQuery } from '../../application/use-cases/find-tenant-by-id.query';
import { UpdateTenantStatusUseCase } from '../../application/use-cases/update-tenant-status.use-case';
import { UpdateTenantUseCase } from '../../application/use-cases/update-tenant.use-case';
import {
  SelfRegisterTenantDto,
  CreateTenantByAdminDto,
} from '../dto/tenant-request.dto';
import {
  UpdateTenantStatusDto,
  UpdateTenantDto,
} from '../dto/tenant-update.dto';
import { DomainErrorFilter } from '../filters/domain-error.filter';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';
import { success, paginated } from '../../../../common/response/api-response';

@Controller('tenants')
@UseFilters(DomainErrorFilter)
export class TenantController {
  constructor(
    private readonly registerTenantUseCase: RegisterTenantUseCase,
    private readonly findAllTenantsQuery: FindAllTenantsQuery,
    private readonly findTenantByIdQuery: FindTenantByIdQuery,
    private readonly updateTenantStatusUseCase: UpdateTenantStatusUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // PUBLIC — No auth required
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /tenants/register
   * School self-registers. Always creates with TRIAL status.
   * No auth required — this is the public onboarding endpoint.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async selfRegister(@Body() dto: SelfRegisterTenantDto, @Res() res: Response) {
    const data = await this.registerTenantUseCase.execute(dto, null, undefined);
    return res
      .status(HttpStatus.CREATED)
      .json(
        success(
          data,
          'School registered successfully. Your account is in TRIAL status. Please contact support to activate.',
        ),
      );
  }

  // ─────────────────────────────────────────────────────────────
  // SUPER ADMIN ONLY — JWT + SuperAdmin guard enforced
  // ─────────────────────────────────────────────────────────────

  /**
   * POST /tenants
   * Super Admin manually creates a tenant. Can set initial status.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async createByAdmin(
    @Body() dto: CreateTenantByAdminDto,
    @CurrentUser() admin: JwtPayload,
    @Res() res: Response,
  ) {
    const data = await this.registerTenantUseCase.execute(
      dto,
      admin.sub,
      dto.status,
    );
    return res
      .status(HttpStatus.CREATED)
      .json(success(data, 'Tenant created successfully.'));
  }

  /**
   * GET /tenants
   * List all tenants with optional filters. Super Admin only.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async findAll(
    @Res() res: Response,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
  ) {
    const result = await this.findAllTenantsQuery.execute({
      page: +page,
      limit: +limit,
      search,
      status,
    });
    return res
      .status(HttpStatus.OK)
      .json(paginated(result.data, result.total, result.page, result.limit));
  }

  /**
   * GET /tenants/:id
   * Get a single tenant by ID. Super Admin only.
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const data = await this.findTenantByIdQuery.execute(id);
    return res.status(HttpStatus.OK).json(success(data));
  }

  /**
   * PATCH /tenants/:id
   * Update tenant details (name, email, phone, address). Slug is immutable.
   * Super Admin only.
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Res() res: Response,
  ) {
    const data = await this.updateTenantUseCase.execute(id, dto);
    return res
      .status(HttpStatus.OK)
      .json(success(data, 'Tenant updated successfully.'));
  }

  /**
   * PATCH /tenants/:id/status
   * Change tenant lifecycle status. Super Admin only.
   */
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTenantStatusDto,
    @Res() res: Response,
  ) {
    const data = await this.updateTenantStatusUseCase.execute(id, dto.status);
    return res
      .status(HttpStatus.OK)
      .json(success(data, 'Tenant status updated successfully.'));
  }
}
