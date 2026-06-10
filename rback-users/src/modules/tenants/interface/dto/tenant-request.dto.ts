import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TenantStatus } from '../../../../common/enums/tenant-status.enum';

/**
 * DTO for public self-registration (POST /tenants/register)
 * No auth required. Status is always set to TRIAL by the system.
 */
export class SelfRegisterTenantDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  schoolName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  schoolEmail: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  schoolPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  adminFirstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  adminLastName: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  adminEmail: string;

  @IsNotEmpty()
  @IsString()
  @Matches(
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,72}$/,
    {
      message:
        'Password must be 8–72 characters and contain at least one uppercase letter, one number, and one special character.',
    },
  )
  adminPassword: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  adminPhone?: string;
}

/**
 * DTO for Super Admin creating a tenant (POST /tenants)
 * Extends self-registration with an optional status override.
 */
export class CreateTenantByAdminDto extends SelfRegisterTenantDto {
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}
