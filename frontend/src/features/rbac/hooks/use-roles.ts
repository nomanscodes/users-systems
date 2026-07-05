import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RbacService } from '../api/rbac.service';
import type { CreateRolePayload, UpdateRolePayload, AssignPermissionsPayload } from '../types/rbac.dto';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetches the bare roles list. Does NOT include rolePermissions[].
 * Use useRole(id) when you need the full permission matrix for a role.
 */
export const useRoles = () => {
  return useQuery({
    queryKey: ['rbac', 'roles'],
    queryFn: RbacService.getRoles,
  });
};

/**
 * Fetches a single role with full rolePermissions[] array.
 * This is the detailed view — always use this for the permission matrix panel.
 */
export const useRole = (id: string | null) => {
  return useQuery({
    queryKey: ['rbac', 'roles', id],
    queryFn: () => RbacService.getRole(id!),
    enabled: !!id,
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Creates a new tenant-scoped role.
 * Error is NOT toasted here — caller handles inline (400 on duplicate name).
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRolePayload) => RbacService.createRole(data),
    onSuccess: () => {
      toast.success('Role created successfully');
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
    // No onError toast — component handles inline error display for 400 duplicate name
  });
};

/**
 * Updates role name and/or description.
 * Error is NOT toasted here — caller handles inline (400 on duplicate name).
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRolePayload }) =>
      RbacService.updateRole(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles', id] });
    },
    // No onError toast — component handles inline error display
  });
};

/**
 * Deletes a role. Backend uses ON DELETE CASCADE — role_permissions and
 * user_roles are automatically cleaned up. No conflict error expected.
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RbacService.deleteRole(id),
    onSuccess: () => {
      toast.success('Role deleted');
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles'] });
    },
    onError: () => {
      toast.error('Failed to delete role');
    },
  });
};

/**
 * Assigns one or more permissions to a role.
 * Silent — no toast. The permission matrix handles per-checkbox state.
 * NOTE: Assigning permissions to system roles IS allowed by the backend.
 */
export const useAssignPermissions = (roleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignPermissionsPayload) =>
      RbacService.assignPermissions(roleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles', roleId] });
    },
    // Silent — no toast on success or error. Checkbox shows loading state.
  });
};

/**
 * Removes a single permission from a role.
 * Silent — no toast. The permission matrix handles per-checkbox state.
 */
export const useRemovePermission = (roleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissionId: string) =>
      RbacService.removePermission(roleId, permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbac', 'roles', roleId] });
    },
    // Silent — no toast on success or error. Checkbox shows loading state.
  });
};
