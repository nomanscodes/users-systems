import { useQuery } from '@tanstack/react-query';
import { RbacService } from '../api/rbac.service';

/**
 * Fetches all 20 system permissions seeded on boot.
 * These are immutable — no mutations exist.
 */
export const usePermissions = () => {
  return useQuery({
    queryKey: ['rbac', 'permissions'],
    queryFn: RbacService.getAllPermissions,
    staleTime: 1000 * 60 * 60, // 1 hour — permissions never change at runtime
  });
};
