import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AcademicsService } from '../../application/services/academics.service';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../../../auth/interface/strategies/jwt.strategy';
import { success } from '../../../../common/response/api-response';

import { CreateBranchDto } from '../dto/create-branch.dto';
import { CreateAcademicSessionDto } from '../dto/create-academic-session.dto';
import { CreateClassDto } from '../dto/create-class.dto';
import {
  CreateGroupDto,
  CreateSectionDto,
} from '../dto/create-group-section.dto';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { CreateSubjectAllocationDto } from '../dto/create-subject-allocation.dto';

@Controller('academics')
@UseGuards(JwtAuthGuard)
export class AcademicsController {
  constructor(private readonly academicsService: AcademicsService) {}

  // --- Branches ---
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

  // --- Sessions ---
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

  // --- Classes ---
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

  // --- Groups & Sections ---
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

  // --- Subjects ---
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

  // --- Batches (Classrooms) ---
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

  // --- Subject Allocations ---
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
}
