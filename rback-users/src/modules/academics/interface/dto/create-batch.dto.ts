import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateBatchDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  groupId?: string; // Optional — some schools have no streams/groups

  @IsUUID()
  @IsOptional()
  sectionId?: string; // Optional — some schools have no section divisions
}

export class ResolveBatchDto {
  @IsUUID()
  @IsNotEmpty()
  branchId: string;

  @IsUUID()
  @IsNotEmpty()
  sessionId: string;

  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsOptional()
  sectionId?: string;
}
