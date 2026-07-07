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
import { StaffService } from '../../application/services/staff.service';
import {
  InviteStaffDto,
  AssignTeacherDto,
  UpdateStaffProfileDto,
  AssignStaffRoleDto,
} from '../dto/staff-request.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';
import { success } from '../../../../common/response/api-response';

@Controller('staff')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('invite')
  @RequirePermission('staff', 'write')
  async inviteStaff(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteStaffDto,
    @Res() res: Response,
  ) {
    const data = await this.staffService.inviteStaff(
      user.tenantId,
      user.sub,
      dto,
    );
    return res
      .status(HttpStatus.CREATED)
      .json(success(data, 'Staff invited successfully'));
  }

  @Get()
  @RequirePermission('staff', 'read')
  async findAll(@CurrentUser() user: JwtPayload, @Res() res: Response) {
    const data = await this.staffService.findAll(user.tenantId);
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Get(':id')
  @RequirePermission('staff', 'read')
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const data = await this.staffService.findOne(user.tenantId, id);
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Patch(':id')
  @RequirePermission('staff', 'write')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffProfileDto,
    @Res() res: Response,
  ) {
    const data = await this.staffService.update(user.tenantId, id, dto);
    return res
      .status(HttpStatus.OK)
      .json(success(data, 'Staff profile updated successfully'));
  }

  @Post(':id/assignments')
  @RequirePermission('staff', 'write')
  async assignTeacher(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Body() dto: AssignTeacherDto,
    @Res() res: Response,
  ) {
    const data = await this.staffService.assignTeacher(
      user.tenantId,
      staffId,
      dto,
    );
    return res
      .status(HttpStatus.CREATED)
      .json(success(data, 'Teacher assigned successfully'));
  }

  @Get('batches/:batchId/teachers')
  @RequirePermission('staff', 'read')
  async getTeachersByBatch(
    @CurrentUser() user: JwtPayload,
    @Param('batchId') batchId: string,
    @Res() res: Response,
  ) {
    const data = await this.staffService.getTeachersByBatch(
      user.tenantId,
      batchId,
    );
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Delete(':id')
  @RequirePermission('staff', 'write')
  async deactivate(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.staffService.deactivate(user.tenantId, id);
    return res
      .status(HttpStatus.OK)
      .json(success(null, 'Staff member deactivated successfully'));
  }

  // ─── Staff → Roles ─────────────────────────────────────────────────────────

  @Get(':id/roles')
  @RequirePermission('staff', 'read')
  async getStaffRoles(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Res() res: Response,
  ) {
    const data = await this.staffService.getStaffRoles(
      user.tenantId,
      staffId,
    );
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Post(':id/roles')
  @RequirePermission('staff', 'write')
  async assignStaffRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Body() dto: AssignStaffRoleDto,
    @Res() res: Response,
  ) {
    const data = await this.staffService.assignStaffRole(
      user.tenantId,
      staffId,
      dto,
    );
    return res
      .status(HttpStatus.CREATED)
      .json(success(data, 'Role(s) assigned successfully'));
  }

  @Delete(':id/roles/:roleId')
  @RequirePermission('staff', 'write')
  async removeStaffRole(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Param('roleId') roleId: string,
    @Res() res: Response,
  ) {
    await this.staffService.removeStaffRole(user.tenantId, staffId, roleId);
    return res
      .status(HttpStatus.OK)
      .json(success(null, 'Role removed successfully'));
  }

  @Get(':id/assignments')
  @RequirePermission('staff', 'read')
  async getAssignments(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Res() res: Response,
  ) {
    const data = await this.staffService.getAssignments(user.tenantId, staffId);
    return res.status(HttpStatus.OK).json(success(data));
  }

  @Delete(':id/assignments/:assignmentId')
  @RequirePermission('staff', 'write')
  async removeAssignment(
    @CurrentUser() user: JwtPayload,
    @Param('id') staffId: string,
    @Param('assignmentId') assignmentId: string,
    @Res() res: Response,
  ) {
    await this.staffService.removeAssignment(
      user.tenantId,
      staffId,
      assignmentId,
    );
    return res
      .status(HttpStatus.OK)
      .json(success(null, 'Assignment removed successfully'));
  }
}
