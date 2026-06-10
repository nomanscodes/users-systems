import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // e.g., "Science"
}

export class UpdateGroupDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // e.g., "Section A"
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}
