import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignationTypeOrmEntity } from '../../infrastructure/typeorm/entities/designation.typeorm.entity';
import {
  CreateDesignationDto,
  UpdateDesignationDto,
} from '../../interface/dto/designation.dto';

@Injectable()
export class DesignationsService {
  constructor(
    @InjectRepository(DesignationTypeOrmEntity)
    private readonly designationRepo: Repository<DesignationTypeOrmEntity>,
  ) {}

  async create(tenantId: string, dto: CreateDesignationDto) {
    const existing = await this.designationRepo.findOne({
      where: { tenantId, title: dto.title },
    });
    if (existing) {
      throw new ConflictException(
        `Designation with title '${dto.title}' already exists.`,
      );
    }

    const designation = this.designationRepo.create({
      tenantId,
      title: dto.title,
      category: dto.category,
    });

    return this.designationRepo.save(designation);
  }

  async findAll(tenantId: string) {
    return this.designationRepo.find({
      where: { tenantId },
      order: { title: 'ASC' },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateDesignationDto) {
    const designation = await this.designationRepo.findOne({
      where: { id, tenantId },
    });
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    if (dto.title && dto.title !== designation.title) {
      const existing = await this.designationRepo.findOne({
        where: { tenantId, title: dto.title },
      });
      if (existing) {
        throw new ConflictException(
          `Designation with title '${dto.title}' already exists.`,
        );
      }
    }

    Object.assign(designation, dto);
    return this.designationRepo.save(designation);
  }

  async delete(tenantId: string, id: string) {
    const designation = await this.designationRepo.findOne({
      where: { id, tenantId },
    });
    if (!designation) {
      throw new NotFoundException('Designation not found');
    }

    try {
      await this.designationRepo.delete(id);
    } catch {
      throw new ForbiddenException(
        'Cannot delete designation because it is in use.',
      );
    }

    return true;
  }
}
