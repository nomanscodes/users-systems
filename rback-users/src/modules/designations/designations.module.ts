import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignationTypeOrmEntity } from './infrastructure/typeorm/entities/designation.typeorm.entity';
import { DesignationsService } from './application/services/designations.service';
import { DesignationsController } from './interface/http/designations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DesignationTypeOrmEntity])],
  controllers: [DesignationsController],
  providers: [DesignationsService],
  exports: [DesignationsService, TypeOrmModule],
})
export class DesignationsModule {}
