import {
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

export class UpdateTenantStatusDto {
  @IsNotEmpty()
  @IsEnum(TenantStatus, {
    message: `status must be one of: ${Object.values(TenantStatus).join(', ')}`,
  })
  status: TenantStatus;
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string | null;
}
