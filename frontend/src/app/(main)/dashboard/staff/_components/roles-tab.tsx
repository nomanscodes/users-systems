'use client';

import { useState } from 'react';
import { Loader2, Plus, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useStaffRoles, useAssignStaffRole, useRemoveStaffRole } from '@/features/staff/hooks/use-staff-assignments';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import type { StaffRole } from '@/features/staff/types/staff.dto';

interface RolesTabProps {
  staffId: string;
}

export function RolesTab({ staffId }: RolesTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleToRemove, setRoleToRemove] = useState<StaffRole | null>(null);

  const { data: staffRoles, isLoading: isLoadingStaffRoles, isError: isStaffRolesError } = useStaffRoles(staffId);
  const { data: allRoles, isLoading: isLoadingAllRoles } = useRoles();
  const assignRole = useAssignStaffRole(staffId);
  const removeRole = useRemoveStaffRole(staffId);

  const assignedRoleIds = new Set(staffRoles?.map((sr) => sr.roleId) ?? []);
  const availableRoles = allRoles?.filter((r) => !assignedRoleIds.has(r.id)) ?? [];

  const handleAssign = () => {
    if (!selectedRoleId) return;
    assignRole.mutate(
      { roleIds: [selectedRoleId] },
      { onSuccess: () => { setSelectedRoleId(''); setShowAdd(false); } },
    );
  };

  const handleRemove = () => {
    if (!roleToRemove) return;
    removeRole.mutate(roleToRemove.roleId);
    setRoleToRemove(null);
  };

  if (isLoadingStaffRoles || isLoadingAllRoles) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-28 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isStaffRolesError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50">
          <ShieldAlert className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">Unable to load roles</p>
          <p className="text-xs text-muted-foreground/70">
            The roles service may be unavailable. Roles were assigned during staff creation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Assigned Roles</span>
          {staffRoles && (
            <span className="text-xs text-muted-foreground">({staffRoles.length})</span>
          )}
        </div>
        {!showAdd && (
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />
            Add Role
          </Button>
        )}
      </div>

      {/* Add Role Form */}
      {showAdd && (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <div className="space-y-1.5">
            <span className="text-xs font-medium">Select Role</span>
            <SearchableSelect
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
              options={availableRoles.map((r) => ({
                value: r.id,
                label: r.name,
                description: r.description ?? undefined,
              }))}
              placeholder="Choose a role..."
              searchPlaceholder="Search roles..."
              emptyText={availableRoles.length === 0 ? 'All roles assigned.' : 'No roles found.'}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAssign} disabled={!selectedRoleId || assignRole.isPending}>
              {assignRole.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setSelectedRoleId(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Role Chips */}
      {staffRoles && staffRoles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {staffRoles.map((sr) => (
            <Badge
              key={sr.roleId}
              variant="secondary"
              className="gap-1.5 pr-1.5 pl-2.5 py-1 text-sm font-normal"
            >
              <span>{sr.role.name}</span>
              {sr.role.isSystemRole && (
                <span className="text-[10px] text-muted-foreground">(system)</span>
              )}
              <button
                onClick={() => setRoleToRemove(sr)}
                className="ml-1 rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive transition-colors"
                aria-label={`Remove ${sr.role.name} role`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        !showAdd && (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No roles assigned</p>
              <p className="text-xs text-muted-foreground/70">
                Click &quot;Add Role&quot; to assign a role.
              </p>
            </div>
          </div>
        )
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground/60">
        Roles control what this staff member can access in the system.
      </p>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!roleToRemove} onOpenChange={(o) => { if (!o) setRoleToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove role?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>&quot;{roleToRemove?.role.name}&quot;</strong> from this staff member?
              They will lose all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleRemove}
            >
              {removeRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
