import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DesignationsService } from '../../application/services/designations.service';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from '../dto/designation.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';
import { success } from '../../../../common/response/api-response';

@Controller('designations')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Post()
  @RequirePermission('staff', 'write')
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDesignationDto,
    @Res() res: Response,
  ) {
    const data = await this.designationsService.create(user.tenantId, dto);
    return res
      .status(HttpStatus.CREATED)
      .json(success(data, 'Designation created successfully'));
  }

  @Get()
  @RequirePermission('staff', 'read')
  async findAll(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const data = await this.designationsService.findAll(user.tenantId);
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Patch(':id')
  @RequirePermission('staff', 'write')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateDesignationDto,
    @Res() res: Response,
  ) {
    const data = await this.designationsService.update(user.tenantId, id, dto);
    return res
      .status(HttpStatus.OK)
      .json(success(data, 'Designation updated successfully'));
  }

  @Delete(':id')
  @RequirePermission('staff', 'write')
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.designationsService.delete(user.tenantId, id);
    return res
      .status(HttpStatus.OK)
      .json(success(null, 'Designation deleted successfully'));
  }
}
