import { apiClient } from '@/lib/api-client';
import type { RegisterTenantPayload } from '../types/tenant.dto';

export const TenantService = {
  register: async (data: RegisterTenantPayload) => {
    const response: any = await apiClient.post('/v1/tenants/register', data);
    return response.data;
  }
};
