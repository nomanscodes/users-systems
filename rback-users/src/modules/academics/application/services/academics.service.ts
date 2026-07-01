import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

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
import {
  CreateBatchDto,
  ResolveBatchDto,
} from '../../interface/dto/create-batch.dto';
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

  async createBatches(tenantId: string, dtos: CreateBatchDto[]) {
    // 1. Fetch existing batches to manually check duplicates since MySQL unique indexes
    // do not catch NULL = NULL duplicates (SQL standard).
    const existingBatches = await this.batchRepo.find({
      select: {
        branchId: true,
        sessionId: true,
        classId: true,
        groupId: true,
        sectionId: true,
      },
      where: { tenantId },
    });

    const getSig = (b: {
      branchId: string;
      sessionId: string;
      classId: string;
      groupId?: string | null;
      sectionId?: string | null;
    }) =>
      `${b.branchId}_${b.sessionId}_${b.classId}_${b.groupId || 'null'}_${b.sectionId || 'null'}`;

    const existingSigs = new Set(existingBatches.map(getSig));
    const entitiesToInsert = [];

    // 2. Filter the payload to only new combinations
    for (const dto of dtos) {
      const sig = getSig(dto);
      if (!existingSigs.has(sig)) {
        existingSigs.add(sig); // Add to set to prevent duplicates within the payload itself
        entitiesToInsert.push(this.batchRepo.create({ ...dto, tenantId }));
      }
    }

    if (entitiesToInsert.length === 0) {
      return []; // All requested combinations already exist
    }

    try {
      // 3. Bulk insert using TypeORM save array
      return await this.batchRepo.save(entitiesToInsert, { chunk: 100 });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new ConflictException(
          'One or more of these classroom combinations already exist.',
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

  /**
   * Resolves cascade dropdown selections → a single batch_id.
   *
   * The frontend never stores or remembers batch IDs. When a coordinator
   * selects (Branch + Session + Class + Group? + Section?) from dropdowns,
   * this endpoint finds the matching batch and returns its id + a
   * human-readable label for display.
   *
   * Used by: Student Admission form, Attendance, Roster lookup.
   */
  async resolveBatch(tenantId: string, dto: ResolveBatchDto) {
    const batch = await this.batchRepo.findOne({
      where: {
        tenantId,
        branchId: dto.branchId,
        sessionId: dto.sessionId,
        classId: dto.classId,
        groupId: dto.groupId ?? IsNull(),
        sectionId: dto.sectionId ?? IsNull(),
      },
      relations: {
        branch: true,
        session: true,
        classEntity: true,
        group: true,
        section: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        'No batch found for this combination. Make sure the batch has been set up for this session.',
      );
    }

    return {
      batchId: batch.id,
      label: this.generateBatchLabel(batch),
    };
  }

  /**
   * Generates a human-readable label for a batch.
   * Format: "Class 10 – Science – Section A (2026–2027)"
   * Null group/section are simply omitted from the label.
   */
  generateBatchLabel(batch: {
    classEntity: { name: string };
    group: { name: string } | null;
    section: { name: string } | null;
    session: { name: string };
  }): string {
    const parts: string[] = [batch.classEntity.name];
    if (batch.group) parts.push(batch.group.name);
    if (batch.section) parts.push(batch.section.name);
    parts.push(`(${batch.session.name})`);
    return parts.join(' \u2013 ');
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
