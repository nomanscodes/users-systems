import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcademicSessionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // e.g., "2026-2027"

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}

export class UpdateAcademicSessionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  startDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;
}
