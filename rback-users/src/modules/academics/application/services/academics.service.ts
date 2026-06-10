import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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

import {
  CreateBranchDto,
  UpdateBranchDto,
} from '../../interface/dto/create-branch.dto';
import {
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
} from '../../interface/dto/create-academic-session.dto';
import {
  CreateClassDto,
  UpdateClassDto,
} from '../../interface/dto/create-class.dto';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreateSectionDto,
  UpdateSectionDto,
} from '../../interface/dto/create-group-section.dto';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
} from '../../interface/dto/create-subject.dto';
import { CreateBatchDto } from '../../interface/dto/create-batch.dto';
import { CreateSubjectAllocationDto } from '../../interface/dto/create-subject-allocation.dto';

/** Helper: checks MySQL duplicate entry error code */
function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as Record<string, unknown>).code === 'ER_DUP_ENTRY'
  );
}

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

  // =====================================================================
  // BRANCHES
  // =====================================================================

  async createBranch(tenantId: string, dto: CreateBranchDto) {
    try {
      const entity = this.branchRepo.create({ ...dto, tenantId });
      return await this.branchRepo.save(entity);
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Branch '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getBranches(tenantId: string) {
    return this.branchRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async getBranchById(id: string, tenantId: string) {
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found.');
    return branch;
  }

  async updateBranch(id: string, tenantId: string, dto: UpdateBranchDto) {
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found.');
    try {
      await this.branchRepo.update({ id, tenantId }, dto);
      return this.branchRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(
          `Branch name '${dto.name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async deleteBranch(id: string, tenantId: string) {
    const branch = await this.branchRepo.findOne({ where: { id, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found.');
    await this.branchRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // SESSIONS
  // =====================================================================

  async createSession(tenantId: string, dto: CreateAcademicSessionDto) {
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('endDate must be after startDate.');
    }
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
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Session '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSessions(tenantId: string) {
    return this.sessionRepo.find({
      where: { tenantId },
      order: { startDate: 'DESC' },
    });
  }

  async getSessionById(id: string, tenantId: string) {
    const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
    if (!session) throw new NotFoundException('Session not found.');
    return session;
  }

  async updateSession(
    id: string,
    tenantId: string,
    dto: UpdateAcademicSessionDto,
  ) {
    const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
    if (!session) throw new NotFoundException('Session not found.');

    // Validate date range using merged values
    const startDate = dto.startDate
      ? new Date(dto.startDate)
      : session.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : session.endDate;
    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate.');
    }

    // Enforce isCurrent singleton
    if (dto.isCurrent === true) {
      await this.sessionRepo.update(
        { tenantId, isCurrent: true },
        { isCurrent: false },
      );
    }

    try {
      await this.sessionRepo.update({ id, tenantId }, dto);
      return this.sessionRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(
          `Session name '${dto.name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async deleteSession(id: string, tenantId: string) {
    const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
    if (!session) throw new NotFoundException('Session not found.');
    await this.sessionRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // CLASSES
  // =====================================================================

  async createClass(tenantId: string, dto: CreateClassDto) {
    try {
      const entity = this.classRepo.create({ ...dto, tenantId });
      return await this.classRepo.save(entity);
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Class '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getClasses(tenantId: string) {
    return this.classRepo.find({
      where: { tenantId },
      order: { numericValue: 'ASC' },
    });
  }

  async getClassById(id: string, tenantId: string) {
    const cls = await this.classRepo.findOne({ where: { id, tenantId } });
    if (!cls) throw new NotFoundException('Class not found.');
    return cls;
  }

  async updateClass(id: string, tenantId: string, dto: UpdateClassDto) {
    const cls = await this.classRepo.findOne({ where: { id, tenantId } });
    if (!cls) throw new NotFoundException('Class not found.');
    try {
      await this.classRepo.update({ id, tenantId }, dto);
      return this.classRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Class name '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async deleteClass(id: string, tenantId: string) {
    const cls = await this.classRepo.findOne({ where: { id, tenantId } });
    if (!cls) throw new NotFoundException('Class not found.');
    await this.classRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // GROUPS
  // =====================================================================

  async createGroup(tenantId: string, dto: CreateGroupDto) {
    try {
      return await this.groupRepo.save(
        this.groupRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Group '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getGroups(tenantId: string) {
    return this.groupRepo.find({ where: { tenantId }, order: { name: 'ASC' } });
  }

  async getGroupById(id: string, tenantId: string) {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new NotFoundException('Group not found.');
    return group;
  }

  async updateGroup(id: string, tenantId: string, dto: UpdateGroupDto) {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new NotFoundException('Group not found.');
    try {
      await this.groupRepo.update({ id, tenantId }, dto);
      return this.groupRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Group name '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async deleteGroup(id: string, tenantId: string) {
    const group = await this.groupRepo.findOne({ where: { id, tenantId } });
    if (!group) throw new NotFoundException('Group not found.');
    await this.groupRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // SECTIONS
  // =====================================================================

  async createSection(tenantId: string, dto: CreateSectionDto) {
    try {
      return await this.sectionRepo.save(
        this.sectionRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Section '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSections(tenantId: string) {
    return this.sectionRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async getSectionById(id: string, tenantId: string) {
    const section = await this.sectionRepo.findOne({ where: { id, tenantId } });
    if (!section) throw new NotFoundException('Section not found.');
    return section;
  }

  async updateSection(id: string, tenantId: string, dto: UpdateSectionDto) {
    const section = await this.sectionRepo.findOne({ where: { id, tenantId } });
    if (!section) throw new NotFoundException('Section not found.');
    try {
      await this.sectionRepo.update({ id, tenantId }, dto);
      return this.sectionRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(
          `Section name '${dto.name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async deleteSection(id: string, tenantId: string) {
    const section = await this.sectionRepo.findOne({ where: { id, tenantId } });
    if (!section) throw new NotFoundException('Section not found.');
    await this.sectionRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // SUBJECTS
  // =====================================================================

  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    try {
      return await this.subjectRepo.save(
        this.subjectRepo.create({ ...dto, tenantId }),
      );
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(`Subject '${dto.name}' already exists.`);
      }
      throw error;
    }
  }

  async getSubjects(tenantId: string) {
    return this.subjectRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async getSubjectById(id: string, tenantId: string) {
    const subject = await this.subjectRepo.findOne({ where: { id, tenantId } });
    if (!subject) throw new NotFoundException('Subject not found.');
    return subject;
  }

  async updateSubject(id: string, tenantId: string, dto: UpdateSubjectDto) {
    const subject = await this.subjectRepo.findOne({ where: { id, tenantId } });
    if (!subject) throw new NotFoundException('Subject not found.');
    try {
      await this.subjectRepo.update({ id, tenantId }, dto);
      return this.subjectRepo.findOneBy({ id });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(
          `Subject name '${dto.name}' already exists.`,
        );
      }
      throw error;
    }
  }

  async deleteSubject(id: string, tenantId: string) {
    const subject = await this.subjectRepo.findOne({ where: { id, tenantId } });
    if (!subject) throw new NotFoundException('Subject not found.');
    await this.subjectRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // BATCHES — GAP-04: parallel existence checks instead of 5 sequential queries
  // =====================================================================

  async createBatch(tenantId: string, dto: CreateBatchDto) {
    // Fire all existence checks in parallel (GAP-04 fix)
    const [branchOk, sessionOk, classOk, sectionOk, groupOk] =
      await Promise.all([
        this.branchRepo.existsBy({ id: dto.branchId, tenantId }),
        this.sessionRepo.existsBy({ id: dto.sessionId, tenantId }),
        this.classRepo.existsBy({ id: dto.classId, tenantId }),
        this.sectionRepo.existsBy({ id: dto.sectionId, tenantId }),
        dto.groupId
          ? this.groupRepo.existsBy({ id: dto.groupId, tenantId })
          : Promise.resolve(true),
      ]);

    if (!branchOk)
      throw new NotFoundException(
        'Branch not found or does not belong to your tenant.',
      );
    if (!sessionOk)
      throw new NotFoundException(
        'Session not found or does not belong to your tenant.',
      );
    if (!classOk)
      throw new NotFoundException(
        'Class not found or does not belong to your tenant.',
      );
    if (!sectionOk)
      throw new NotFoundException(
        'Section not found or does not belong to your tenant.',
      );
    if (!groupOk)
      throw new NotFoundException(
        'Group not found or does not belong to your tenant.',
      );

    try {
      const batch = this.batchRepo.create({ ...dto, tenantId });
      return await this.batchRepo.save(batch);
    } catch (error) {
      if (isDuplicateEntry(error)) {
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

  async getBatchById(id: string, tenantId: string) {
    const batch = await this.batchRepo.findOne({
      where: { id, tenantId },
      relations: {
        branch: true,
        session: true,
        classEntity: true,
        group: true,
        section: true,
      },
    });
    if (!batch) throw new NotFoundException('Batch not found.');
    return batch;
  }

  async deleteBatch(id: string, tenantId: string) {
    const batch = await this.batchRepo.findOne({ where: { id, tenantId } });
    if (!batch) throw new NotFoundException('Batch not found.');
    await this.batchRepo.delete({ id, tenantId });
  }

  // =====================================================================
  // SUBJECT ALLOCATIONS
  // =====================================================================

  async createSubjectAllocation(
    tenantId: string,
    dto: CreateSubjectAllocationDto,
  ) {
    const [classOk, subjectOk, groupOk] = await Promise.all([
      this.classRepo.existsBy({ id: dto.classId, tenantId }),
      this.subjectRepo.existsBy({ id: dto.subjectId, tenantId }),
      dto.groupId
        ? this.groupRepo.existsBy({ id: dto.groupId, tenantId })
        : Promise.resolve(true),
    ]);

    if (!classOk)
      throw new NotFoundException(
        'Class not found or does not belong to your tenant.',
      );
    if (!subjectOk)
      throw new NotFoundException(
        'Subject not found or does not belong to your tenant.',
      );
    if (!groupOk)
      throw new NotFoundException(
        'Group not found or does not belong to your tenant.',
      );

    try {
      const allocation = this.allocationRepo.create({ ...dto, tenantId });
      return await this.allocationRepo.save(allocation);
    } catch (error) {
      if (isDuplicateEntry(error)) {
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

  async deleteSubjectAllocation(id: string, tenantId: string) {
    const allocation = await this.allocationRepo.findOne({
      where: { id, tenantId },
    });
    if (!allocation)
      throw new NotFoundException('Subject allocation not found.');
    await this.allocationRepo.delete({ id, tenantId });
  }
}
