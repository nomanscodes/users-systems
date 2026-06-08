import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BranchTypeOrmEntity } from '../../infrastructure/typeorm/entities/branch.typeorm.entity';
import { AcademicSessionTypeOrmEntity } from '../../infrastructure/typeorm/entities/academic-session.typeorm.entity';
import { ClassTypeOrmEntity } from '../../infrastructure/typeorm/entities/class.typeorm.entity';
import { GroupTypeOrmEntity } from '../../infrastructure/typeorm/entities/group.typeorm.entity';
import { SectionTypeOrmEntity } from '../../infrastructure/typeorm/entities/section.typeorm.entity';
import { SubjectTypeOrmEntity } from '../../infrastructure/typeorm/entities/subject.typeorm.entity';
import { BatchTypeOrmEntity } from '../../infrastructure/typeorm/entities/batch.typeorm.entity';
import { SubjectAllocationTypeOrmEntity } from '../../infrastructure/typeorm/entities/subject-allocation.typeorm.entity';

import { CreateBranchDto } from '../../interface/dto/create-branch.dto';
import { CreateAcademicSessionDto } from '../../interface/dto/create-academic-session.dto';
import { CreateClassDto } from '../../interface/dto/create-class.dto';
import {
  CreateGroupDto,
  CreateSectionDto,
} from '../../interface/dto/create-group-section.dto';
import { CreateSubjectDto } from '../../interface/dto/create-subject.dto';
import { CreateBatchDto } from '../../interface/dto/create-batch.dto';
import { CreateSubjectAllocationDto } from '../../interface/dto/create-subject-allocation.dto';

@Injectable()
export class AcademicsService {
  constructor(
    @InjectRepository(BranchTypeOrmEntity)
    private branchRepo: Repository<BranchTypeOrmEntity>,
    @InjectRepository(AcademicSessionTypeOrmEntity)
    private sessionRepo: Repository<AcademicSessionTypeOrmEntity>,
    @InjectRepository(ClassTypeOrmEntity)
    private classRepo: Repository<ClassTypeOrmEntity>,
    @InjectRepository(GroupTypeOrmEntity)
    private groupRepo: Repository<GroupTypeOrmEntity>,
    @InjectRepository(SectionTypeOrmEntity)
    private sectionRepo: Repository<SectionTypeOrmEntity>,
    @InjectRepository(SubjectTypeOrmEntity)
    private subjectRepo: Repository<SubjectTypeOrmEntity>,
    @InjectRepository(BatchTypeOrmEntity)
    private batchRepo: Repository<BatchTypeOrmEntity>,
    @InjectRepository(SubjectAllocationTypeOrmEntity)
    private allocationRepo: Repository<SubjectAllocationTypeOrmEntity>,
  ) {}

  // ================= BRANCHES =================
  async createBranch(tenantId: string, dto: CreateBranchDto) {
    try {
      const entity = this.branchRepo.create({ ...dto, tenantId });
      return await this.branchRepo.save(entity);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Branch '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getBranches(tenantId: string) {
    return this.branchRepo.find({ where: { tenantId } });
  }

  // ================= SESSIONS =================
  async createSession(tenantId: string, dto: CreateAcademicSessionDto) {
    // If setting to current, we must unset others
    if (dto.isCurrent) {
      await this.sessionRepo.update(
        { tenantId, isCurrent: true },
        { isCurrent: false },
      );
    }
    try {
      const entity = this.sessionRepo.create({ ...dto, tenantId });
      return await this.sessionRepo.save(entity);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Session '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSessions(tenantId: string) {
    return this.sessionRepo.find({ where: { tenantId } });
  }

  // ================= CLASSES =================
  async createClass(tenantId: string, dto: CreateClassDto) {
    try {
      const entity = this.classRepo.create({ ...dto, tenantId });
      return await this.classRepo.save(entity);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Class '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getClasses(tenantId: string) {
    return this.classRepo.find({ where: { tenantId } });
  }

  // ================= GROUPS & SECTIONS =================
  async createGroup(tenantId: string, dto: CreateGroupDto) {
    try {
      return await this.groupRepo.save(
        this.groupRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Group '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getGroups(tenantId: string) {
    return this.groupRepo.find({ where: { tenantId } });
  }

  async createSection(tenantId: string, dto: CreateSectionDto) {
    try {
      return await this.sectionRepo.save(
        this.sectionRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Section '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSections(tenantId: string) {
    return this.sectionRepo.find({ where: { tenantId } });
  }

  // ================= SUBJECTS =================
  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    try {
      return await this.subjectRepo.save(
        this.subjectRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(`Subject '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSubjects(tenantId: string) {
    return this.subjectRepo.find({ where: { tenantId } });
  }

  // ================= BATCHES =================
  async createBatch(tenantId: string, dto: CreateBatchDto) {
    // Basic verification that these IDs exist and belong to the tenant
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branchId, tenantId },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const session = await this.sessionRepo.findOne({
      where: { id: dto.sessionId, tenantId },
    });
    if (!session) throw new NotFoundException('Session not found');

    const cls = await this.classRepo.findOne({
      where: { id: dto.classId, tenantId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.sectionRepo.findOne({
      where: { id: dto.sectionId, tenantId },
    });
    if (!section) throw new NotFoundException('Section not found');

    if (dto.groupId) {
      const group = await this.groupRepo.findOne({
        where: { id: dto.groupId, tenantId },
      });
      if (!group) throw new NotFoundException('Group not found');
    }

    try {
      const batch = this.batchRepo.create({ ...dto, tenantId });
      return await this.batchRepo.save(batch);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'This exact classroom batch already exists.',
        );
      }
      throw error;
    }
  }

  async getBatches(tenantId: string) {
    return this.batchRepo.find({
      where: { tenantId },
      relations: {
        branch: true,
        session: true,
        classEntity: true,
        group: true,
        section: true,
      },
    });
  }

  // ================= SUBJECT ALLOCATIONS =================
  async createSubjectAllocation(
    tenantId: string,
    dto: CreateSubjectAllocationDto,
  ) {
    const cls = await this.classRepo.findOne({
      where: { id: dto.classId, tenantId },
    });
    if (!cls) throw new NotFoundException('Class not found');

    const subject = await this.subjectRepo.findOne({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    if (dto.groupId) {
      const group = await this.groupRepo.findOne({
        where: { id: dto.groupId, tenantId },
      });
      if (!group) throw new NotFoundException('Group not found');
    }

    try {
      const allocation = this.allocationRepo.create({ ...dto, tenantId });
      return await this.allocationRepo.save(allocation);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          'This subject is already allocated to this class and group.',
        );
      }
      throw error;
    }
  }

  async getSubjectAllocations(tenantId: string) {
    return this.allocationRepo.find({
      where: { tenantId },
      relations: {
        classEntity: true,
        group: true,
        subject: true,
      },
    });
  }
}
