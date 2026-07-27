import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { SuperAdminService } from './application/services/super-admin.service';
import { SuperAdminController } from './interface/http/super-admin.controller';

@Module({
  imports: [PermissionsModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
