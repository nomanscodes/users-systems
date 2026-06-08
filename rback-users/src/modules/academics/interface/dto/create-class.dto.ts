import {
  IsNotEmpty,
  IsString,
  IsNumber,
  MaxLength,
  Min,
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
