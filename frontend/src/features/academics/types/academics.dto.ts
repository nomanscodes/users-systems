export interface Branch {
  id: string;
  name: string;
  address?: string;
  contactNumber?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchPayload {
  name: string;
  address?: string;
  contactNumber?: string;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload>;

// --- Sessions ---
export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionPayload {
  name: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
}

export type UpdateSessionPayload = Partial<CreateSessionPayload>;

// --- Classes ---
export interface ClassEntity {
  id: string;
  name: string;
  numericValue: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClassPayload {
  name: string;
  numericValue: number;
}

export type UpdateClassPayload = Partial<CreateClassPayload>;

// --- Groups ---
export interface Group {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupPayload {
  name: string;
}

export type UpdateGroupPayload = Partial<CreateGroupPayload>;

// --- Sections ---
export interface Section {
  id: string;
  name: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionPayload {
  name: string;
}

export type UpdateSectionPayload = Partial<CreateSectionPayload>;

// --- Subjects ---
export enum SubjectType {
  MANDATORY = 'MANDATORY',
  OPTIONAL = 'OPTIONAL',
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  type: SubjectType;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectPayload {
  name: string;
  code?: string;
  type?: SubjectType;
}

export type UpdateSubjectPayload = Partial<CreateSubjectPayload>;

// --- Batches ---
export interface Batch {
  id: string;
  branchId: string;
  sessionId: string;
  classId: string;
  groupId: string | null;
  sectionId: string | null;
  tenantId: string;
  branch?: Branch;
  session?: AcademicSession;
  classEntity?: ClassEntity;
  group?: Group;
  section?: Section;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBatchPayload {
  branchId: string;
  sessionId: string;
  classId: string;
  groupId?: string;
  sectionId?: string;
}

export interface SyncBatchesPayload {
  branchId: string;
  sessionId: string;
  batches: CreateBatchPayload[];
}

// --- Subject Allocations ---
export interface SubjectAllocation {
  id: string;
  tenantId: string;
  classId: string;
  groupId: string | null;
  subjectId: string;
  classEntity?: ClassEntity;
  group?: Group | null;
  subject?: Subject;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubjectAllocationPayload {
  classId: string;
  groupId?: string | null;
  subjectId: string;
}
