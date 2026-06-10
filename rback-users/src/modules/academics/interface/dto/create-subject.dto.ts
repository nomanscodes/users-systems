import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';

export enum SubjectType {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
}

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsEnum(SubjectType)
  @IsOptional()
  type?: SubjectType;
}

export class UpdateSubjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string | null;

  @IsEnum(SubjectType)
  @IsOptional()
  type?: SubjectType;
}
