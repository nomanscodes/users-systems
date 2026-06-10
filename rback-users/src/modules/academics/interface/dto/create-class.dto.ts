import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MaxLength,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // e.g., "Class 10"

  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  numericValue: number; // e.g., 10
}

export class UpdateClassDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  numericValue?: number;
}
