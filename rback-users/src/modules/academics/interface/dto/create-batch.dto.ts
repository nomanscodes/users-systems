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
  groupId?: string; // Optional for lower classes without groups

  @IsUUID()
  @IsNotEmpty()
  sectionId: string;
}
