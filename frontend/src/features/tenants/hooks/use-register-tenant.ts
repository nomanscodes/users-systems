import { useMutation } from '@tanstack/react-query';
import { TenantService } from '../api/tenant.service';
import type { RegisterTenantPayload } from '../types/tenant.dto';

export const useRegisterTenant = () => {
  return useMutation<any, any, RegisterTenantPayload>({
    mutationFn: TenantService.register,
  });
};
