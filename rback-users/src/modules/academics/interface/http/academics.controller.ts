import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AcademicsService } from '../../application/services/academics.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { TenantScopeGuard } from '../../../../common/guards/tenant-scope.guard';
import { PermissionGuard } from '../../../../common/guards/permission.guard';
import { RequirePermission } from '../../../../common/decorators/require-permission.decorator';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { success } from '../../../../common/response/api-response';

import { CreateBranchDto, UpdateBranchDto } from '../dto/create-branch.dto';
import {
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
} from '../dto/create-academic-session.dto';
import { CreateClassDto, UpdateClassDto } from '../dto/create-class.dto';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreateSectionDto,
  UpdateSectionDto,
} from '../dto/create-group-section.dto';
import { CreateSubjectDto, UpdateSubjectDto } from '../dto/create-subject.dto';
import { CreateBatchDto, ResolveBatchDto } from '../dto/create-batch.dto';
import { CreateSubjectAllocationDto } from '../dto/create-subject-allocation.dto';

/**
 * All /academics/* endpoints require:
 *   1. JwtAuthGuard   — valid JWT in Authorization header
 *   2. TenantScopeGuard — user must belong to a tenant (tenantId !== null)
 *                         This blocks SUPER_ADMIN from calling these routes.
 *
 * tenantId is ALWAYS extracted from the JWT (never from the request body).
 */
@Controller('academics')
@UseGuards(JwtAuthGuard, TenantScopeGuard, PermissionGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  // ─────────────────────────────────────────────────────────────────────
  // BRANCHES
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('branches')
  async createBranch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBranchDto,
  ) {
    const data = await this.academicsService.createBranch(user.tenantId, dto);
    return success(data, 'Branch created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('branches')
  async getBranches(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBranches(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('branches/:id')
  async getBranchById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getBranchById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('branches/:id')
  async updateBranch(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateBranchDto,
  ) {
    const data = await this.academicsService.updateBranch(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Branch updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('branches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBranch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteBranch(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('sessions')
  async createSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAcademicSessionDto,
  ) {
    const data = await this.academicsService.createSession(user.tenantId, dto);
    return success(data, 'Session created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSessions(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('sessions/:id')
  async getSessionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSessionById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('sessions/:id')
  async updateSession(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAcademicSessionDto,
  ) {
    const data = await this.academicsService.updateSession(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Session updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.academicsService.deleteSession(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CLASSES
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('classes')
  async createClass(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateClassDto,
  ) {
    const data = await this.academicsService.createClass(user.tenantId, dto);
    return success(data, 'Class created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('classes')
  async getClasses(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getClasses(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('classes/:id')
  async getClassById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getClassById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('classes/:id')
  async updateClass(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateClassDto,
  ) {
    const data = await this.academicsService.updateClass(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Class updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('classes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClass(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteClass(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GROUPS
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('groups')
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGroupDto,
  ) {
    const data = await this.academicsService.createGroup(user.tenantId, dto);
    return success(data, 'Group created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('groups')
  async getGroups(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getGroups(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('groups/:id')
  async getGroupById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getGroupById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('groups/:id')
  async updateGroup(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGroupDto,
  ) {
    const data = await this.academicsService.updateGroup(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Group updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteGroup(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTIONS
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('sections')
  async createSection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSectionDto,
  ) {
    const data = await this.academicsService.createSection(user.tenantId, dto);
    return success(data, 'Section created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('sections')
  async getSections(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSections(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('sections/:id')
  async getSectionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSectionById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('sections/:id')
  async updateSection(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSectionDto,
  ) {
    const data = await this.academicsService.updateSection(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Section updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('sections/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSection(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.academicsService.deleteSection(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SUBJECTS
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('subjects')
  async createSubject(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubjectDto,
  ) {
    const data = await this.academicsService.createSubject(user.tenantId, dto);
    return success(data, 'Subject created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('subjects')
  async getSubjects(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSubjects(user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('subjects/:id')
  async getSubjectById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSubjectById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Patch('subjects/:id')
  async updateSubject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSubjectDto,
  ) {
    const data = await this.academicsService.updateSubject(
      id,
      user.tenantId,
      dto,
    );
    return success(data, 'Subject updated successfully.');
  }

  @RequirePermission('academics', 'write')
  @Delete('subjects/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubject(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.academicsService.deleteSubject(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // BATCHES (Classrooms)
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('batches')
  async createBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBatchDto,
  ) {
    const data = await this.academicsService.createBatch(user.tenantId, dto);
    return success(data, 'Batch created successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('batches')
  async getBatches(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBatches(user.tenantId);
    return success(data);
  }

  /**
   * POST /academics/batches/resolve
   *
   * Translates human-readable cascade dropdown selections into a single
   * batch_id. The frontend calls this automatically when the coordinator
   * finishes selecting Branch + Session + Class + Group? + Section?.
   *
   * IMPORTANT: This route MUST be declared before GET /batches/:id
   * so that NestJS does not treat the literal string 'resolve' as an :id.
   */
  @RequirePermission('academics', 'write')
  @Post('batches/resolve')
  async resolveBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ResolveBatchDto,
  ) {
    const data = await this.academicsService.resolveBatch(user.tenantId, dto);
    return success(data);
  }

  @RequirePermission('academics', 'read')
  @Get('batches/:id')
  async getBatchById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBatchById(id, user.tenantId);
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Delete('batches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteBatch(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SUBJECT ALLOCATIONS
  // ─────────────────────────────────────────────────────────────────────

  @RequirePermission('academics', 'write')
  @Post('subject-allocations')
  async createSubjectAllocation(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubjectAllocationDto,
  ) {
    const data = await this.academicsService.createSubjectAllocation(
      user.tenantId,
      dto,
    );
    return success(data, 'Subject allocated successfully.');
  }

  @RequirePermission('academics', 'read')
  @Get('subject-allocations')
  async getSubjectAllocations(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSubjectAllocations(
      user.tenantId,
    );
    return success(data);
  }

  @RequirePermission('academics', 'write')
  @Delete('subject-allocations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubjectAllocation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.academicsService.deleteSubjectAllocation(id, user.tenantId);
  }
}
