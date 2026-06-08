import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class CreateSubjectAllocationDto {
  @IsUUID()
  @IsNotEmpty()
  classId: string;

  @IsUUID()
  @IsOptional()
  groupId?: string;

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;
}
