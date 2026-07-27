import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AssignPermissionsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  permissionIds: string[];
}

export class AssignMenuPermissionDto {
  @IsUUID()
  menuId: string;

  @IsBoolean()
  canView: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canDelete: boolean;
}
