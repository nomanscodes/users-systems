import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchTypeOrmEntity } from './infrastructure/typeorm/entities/branch.typeorm.entity';
import { AcademicSessionTypeOrmEntity } from './infrastructure/typeorm/entities/academic-session.typeorm.entity';
import { ClassTypeOrmEntity } from './infrastructure/typeorm/entities/class.typeorm.entity';
import { GroupTypeOrmEntity } from './infrastructure/typeorm/entities/group.typeorm.entity';
import { SectionTypeOrmEntity } from './infrastructure/typeorm/entities/section.typeorm.entity';
import { SubjectTypeOrmEntity } from './infrastructure/typeorm/entities/subject.typeorm.entity';
import { BatchTypeOrmEntity } from './infrastructure/typeorm/entities/batch.typeorm.entity';
import { SubjectAllocationTypeOrmEntity } from './infrastructure/typeorm/entities/subject-allocation.typeorm.entity';

import { AcademicsService } from './application/services/academics.service';
import { AcademicsController } from './interface/http/academics.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BranchTypeOrmEntity,
      AcademicSessionTypeOrmEntity,
      ClassTypeOrmEntity,
      GroupTypeOrmEntity,
      SectionTypeOrmEntity,
      SubjectTypeOrmEntity,
      BatchTypeOrmEntity,
      SubjectAllocationTypeOrmEntity,
    ]),
  ],
  controllers: [AcademicsController],
  providers: [AcademicsService],
  exports: [AcademicsService],
})
export class AcademicsModule {}
