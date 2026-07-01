import { apiClient } from '@/lib/api-client';
import type {
  Branch,
  CreateBranchPayload,
  UpdateBranchPayload,
  AcademicSession,
  CreateSessionPayload,
  UpdateSessionPayload,
  ClassEntity,
  CreateClassPayload,
  UpdateClassPayload,
  Group,
  CreateGroupPayload,
  UpdateGroupPayload,
  Section,
  CreateSectionPayload,
  UpdateSectionPayload,
  Subject,
  CreateSubjectPayload,
  UpdateSubjectPayload,
  CreateBatchPayload
} from '../types/academics.dto';

// Helper to unwrap backend ApiResponse
const unwrap = <T>(response: any): T => response.data;

export const AcademicsService = {
  // --- Branches ---
  getBranches: () => apiClient.get('/v1/academics/branches').then(unwrap<Branch[]>),
  getBranch: (id: string) => apiClient.get(`/v1/academics/branches/${id}`).then(unwrap<Branch>),
  createBranch: (data: CreateBranchPayload) => apiClient.post('/v1/academics/branches', data).then(unwrap<Branch>),
  updateBranch: (id: string, data: UpdateBranchPayload) => apiClient.patch(`/v1/academics/branches/${id}`, data).then(unwrap<Branch>),
  deleteBranch: (id: string) => apiClient.delete(`/v1/academics/branches/${id}`),

  // --- Sessions ---
  getSessions: () => apiClient.get('/v1/academics/sessions').then(unwrap<AcademicSession[]>),
  getSession: (id: string) => apiClient.get(`/v1/academics/sessions/${id}`).then(unwrap<AcademicSession>),
  createSession: (data: CreateSessionPayload) => apiClient.post('/v1/academics/sessions', data).then(unwrap<AcademicSession>),
  updateSession: (id: string, data: UpdateSessionPayload) => apiClient.patch(`/v1/academics/sessions/${id}`, data).then(unwrap<AcademicSession>),
  deleteSession: (id: string) => apiClient.delete(`/v1/academics/sessions/${id}`),

  // --- Classes ---
  getClasses: () => apiClient.get('/v1/academics/classes').then(unwrap<ClassEntity[]>),
  getClass: (id: string) => apiClient.get(`/v1/academics/classes/${id}`).then(unwrap<ClassEntity>),
  createClass: (data: CreateClassPayload) => apiClient.post('/v1/academics/classes', data).then(unwrap<ClassEntity>),
  updateClass: (id: string, data: UpdateClassPayload) => apiClient.patch(`/v1/academics/classes/${id}`, data).then(unwrap<ClassEntity>),
  deleteClass: (id: string) => apiClient.delete(`/v1/academics/classes/${id}`),

  // --- Groups ---
  getGroups: () => apiClient.get('/v1/academics/groups').then(unwrap<Group[]>),
  getGroup: (id: string) => apiClient.get(`/v1/academics/groups/${id}`).then(unwrap<Group>),
  createGroup: (data: CreateGroupPayload) => apiClient.post('/v1/academics/groups', data).then(unwrap<Group>),
  updateGroup: (id: string, data: UpdateGroupPayload) => apiClient.patch(`/v1/academics/groups/${id}`, data).then(unwrap<Group>),
  deleteGroup: (id: string) => apiClient.delete(`/v1/academics/groups/${id}`),

  // --- Sections ---
  getSections: () => apiClient.get('/v1/academics/sections').then(unwrap<Section[]>),
  getSection: (id: string) => apiClient.get(`/v1/academics/sections/${id}`).then(unwrap<Section>),
  createSection: (data: CreateSectionPayload) => apiClient.post('/v1/academics/sections', data).then(unwrap<Section>),
  updateSection: (id: string, data: UpdateSectionPayload) => apiClient.patch(`/v1/academics/sections/${id}`, data).then(unwrap<Section>),
  deleteSection: (id: string) => apiClient.delete(`/v1/academics/sections/${id}`),

  // --- Subjects ---
  getSubjects: () => apiClient.get('/v1/academics/subjects').then(unwrap<Subject[]>),
  getSubject: (id: string) => apiClient.get(`/v1/academics/subjects/${id}`).then(unwrap<Subject>),
  createSubject: (data: CreateSubjectPayload) => apiClient.post('/v1/academics/subjects', data).then(unwrap<Subject>),
  updateSubject: (id: string, data: UpdateSubjectPayload) => apiClient.patch(`/v1/academics/subjects/${id}`, data).then(unwrap<Subject>),
  deleteSubject: (id: string) => apiClient.delete(`/v1/academics/subjects/${id}`),

  // --- Batches ---
  createBatches: (data: CreateBatchPayload[]) => apiClient.post('/v1/academics/batches', data).then(unwrap<any>),
};
