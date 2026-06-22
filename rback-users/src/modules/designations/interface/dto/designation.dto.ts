import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DesignationCategory } from '../../../../common/enums/designation-category.enum';

export class CreateDesignationDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  title: string;

  @IsNotEmpty()
  @IsEnum(DesignationCategory)
  category: DesignationCategory;
}

export class UpdateDesignationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsEnum(DesignationCategory)
  category?: DesignationCategory;
}
