export interface RegisterTenantPayload {
  schoolName: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
}
