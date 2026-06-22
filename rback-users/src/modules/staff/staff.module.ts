import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffProfileTypeOrmEntity } from './infrastructure/typeorm/entities/staff-profile.typeorm.entity';
import { TeacherAssignmentTypeOrmEntity } from './infrastructure/typeorm/entities/teacher-assignment.typeorm.entity';
import { StaffService } from './application/services/staff.service';
import { StaffController } from './interface/http/staff.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StaffProfileTypeOrmEntity,
      TeacherAssignmentTypeOrmEntity,
    ]),
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService, TypeOrmModule],
})
export class StaffModule {}
