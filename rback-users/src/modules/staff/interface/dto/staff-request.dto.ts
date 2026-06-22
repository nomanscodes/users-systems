import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class InviteStaffDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsNotEmpty()
  @IsString()
  designationId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  roleIds: string[];
}

export class AssignTeacherDto {
  @IsNotEmpty()
  @IsString()
  batchId: string;

  @IsNotEmpty()
  @IsString()
  subjectId: string;
}

export class UpdateStaffProfileDto {
  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  joiningDate?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  subjectSpecialty?: string;
}
