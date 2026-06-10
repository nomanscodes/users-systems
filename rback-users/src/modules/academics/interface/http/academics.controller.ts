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
import { CreateBatchDto } from '../dto/create-batch.dto';
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
@UseGuards(JwtAuthGuard, TenantScopeGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  // ─────────────────────────────────────────────────────────────────────
  // BRANCHES
  // ─────────────────────────────────────────────────────────────────────

  @Post('branches')
  async createBranch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBranchDto,
  ) {
    const data = await this.academicsService.createBranch(user.tenantId, dto);
    return success(data, 'Branch created successfully.');
  }

  @Get('branches')
  async getBranches(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBranches(user.tenantId);
    return success(data);
  }

  @Get('branches/:id')
  async getBranchById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getBranchById(id, user.tenantId);
    return success(data);
  }

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

  @Delete('branches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBranch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteBranch(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────────────────────────────

  @Post('sessions')
  async createSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAcademicSessionDto,
  ) {
    const data = await this.academicsService.createSession(user.tenantId, dto);
    return success(data, 'Session created successfully.');
  }

  @Get('sessions')
  async getSessions(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSessions(user.tenantId);
    return success(data);
  }

  @Get('sessions/:id')
  async getSessionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSessionById(id, user.tenantId);
    return success(data);
  }

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

  @Post('classes')
  async createClass(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateClassDto,
  ) {
    const data = await this.academicsService.createClass(user.tenantId, dto);
    return success(data, 'Class created successfully.');
  }

  @Get('classes')
  async getClasses(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getClasses(user.tenantId);
    return success(data);
  }

  @Get('classes/:id')
  async getClassById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getClassById(id, user.tenantId);
    return success(data);
  }

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

  @Delete('classes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClass(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteClass(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // GROUPS
  // ─────────────────────────────────────────────────────────────────────

  @Post('groups')
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGroupDto,
  ) {
    const data = await this.academicsService.createGroup(user.tenantId, dto);
    return success(data, 'Group created successfully.');
  }

  @Get('groups')
  async getGroups(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getGroups(user.tenantId);
    return success(data);
  }

  @Get('groups/:id')
  async getGroupById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getGroupById(id, user.tenantId);
    return success(data);
  }

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

  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteGroup(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteGroup(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SECTIONS
  // ─────────────────────────────────────────────────────────────────────

  @Post('sections')
  async createSection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSectionDto,
  ) {
    const data = await this.academicsService.createSection(user.tenantId, dto);
    return success(data, 'Section created successfully.');
  }

  @Get('sections')
  async getSections(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSections(user.tenantId);
    return success(data);
  }

  @Get('sections/:id')
  async getSectionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSectionById(id, user.tenantId);
    return success(data);
  }

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

  @Post('subjects')
  async createSubject(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateSubjectDto,
  ) {
    const data = await this.academicsService.createSubject(user.tenantId, dto);
    return success(data, 'Subject created successfully.');
  }

  @Get('subjects')
  async getSubjects(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSubjects(user.tenantId);
    return success(data);
  }

  @Get('subjects/:id')
  async getSubjectById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.academicsService.getSubjectById(id, user.tenantId);
    return success(data);
  }

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

  @Post('batches')
  async createBatch(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBatchDto,
  ) {
    const data = await this.academicsService.createBatch(user.tenantId, dto);
    return success(data, 'Batch created successfully.');
  }

  @Get('batches')
  async getBatches(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBatches(user.tenantId);
    return success(data);
  }

  @Get('batches/:id')
  async getBatchById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getBatchById(id, user.tenantId);
    return success(data);
  }

  @Delete('batches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBatch(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.academicsService.deleteBatch(id, user.tenantId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // SUBJECT ALLOCATIONS
  // ─────────────────────────────────────────────────────────────────────

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

  @Get('subject-allocations')
  async getSubjectAllocations(@CurrentUser() user: JwtPayload) {
    const data = await this.academicsService.getSubjectAllocations(
      user.tenantId,
    );
    return success(data);
  }

  @Delete('subject-allocations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSubjectAllocation(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.academicsService.deleteSubjectAllocation(id, user.tenantId);
  }
}
