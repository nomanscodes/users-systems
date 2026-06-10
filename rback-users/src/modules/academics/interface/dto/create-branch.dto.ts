import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactNumber?: string;
}

export class UpdateBranchDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  address?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactNumber?: string | null;
}
