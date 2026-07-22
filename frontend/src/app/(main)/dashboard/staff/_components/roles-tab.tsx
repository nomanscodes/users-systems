'use client';

import { useState } from 'react';
import { Loader2, Plus, X, ShieldCheck, ShieldAlert, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useStaffRoles, useAssignStaffRole, useRemoveStaffRole } from '@/features/staff/hooks/use-staff-assignments';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import type { StaffRole } from '@/features/staff/types/staff.dto';

interface RolesTabProps { staffId: string; }

export function RolesTab({ staffId }: RolesTabProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleToRemove, setRoleToRemove] = useState<StaffRole | null>(null);

  const { data: staffRoles, isLoading: isLoadingStaffRoles, isError } = useStaffRoles(staffId);
  const { data: allRoles, isLoading: isLoadingAllRoles } = useRoles();
  const assignRole = useAssignStaffRole(staffId);
  const removeRole = useRemoveStaffRole(staffId);

  const assignedRoleIds = new Set(staffRoles?.map((sr) => sr.roleId) ?? []);
  const availableRoles = allRoles?.filter((r) => !assignedRoleIds.has(r.id)) ?? [];

  const handleAssign = () => {
    if (!selectedRoleId) return;
    assignRole.mutate({ roleIds: [selectedRoleId] }, {
      onSuccess: () => { setSelectedRoleId(''); setShowAdd(false); },
    });
  };

  const handleRemove = () => {
    if (!roleToRemove) return;
    removeRole.mutate(roleToRemove.roleId);
    setRoleToRemove(null);
  };

  if (isLoadingStaffRoles || isLoadingAllRoles) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <ShieldAlert className="w-8 h-8 text-muted-foreground/25" />
        <p className="text-sm text-muted-foreground">Unable to load roles</p>
        <p className="text-xs text-muted-foreground/60">The roles service may be unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {staffRoles?.length ?? 0} role{(staffRoles?.length ?? 0) !== 1 ? 's' : ''} assigned
        </p>
        {!showAdd && (
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="w-3 h-3" />
            Add Role
          </Button>
        )}
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <SearchableSelect
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            options={availableRoles.map((r) => ({ value: r.id, label: r.name, description: r.description ?? undefined }))}
            placeholder="Choose a role..."
            searchPlaceholder="Search roles..."
            emptyText={availableRoles.length === 0 ? 'All roles already assigned.' : 'No roles found.'}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAssign} disabled={!selectedRoleId || assignRole.isPending}>
              {assignRole.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowAdd(false); setSelectedRoleId(''); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Role list — flat, no outer card border */}
      {staffRoles && staffRoles.length > 0 ? (
        <div className="divide-y border rounded-lg overflow-hidden">
          {staffRoles.map((sr) => (
            <div key={sr.roleId} className="flex items-center gap-3 px-3 py-3 group hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/8 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{sr.role.name}</p>
                  {sr.role.isSystemRole && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">system</span>
                  )}
                </div>
                {sr.role.description && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{sr.role.description}</p>
                )}
              </div>
              <button
                onClick={() => setRoleToRemove(sr)}
                className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
                aria-label={`Remove ${sr.role.name}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !showAdd && (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <ShieldOff className="w-7 h-7 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No roles assigned</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">Use &quot;Add Role&quot; to assign access.</p>
          </div>
        )
      )}

      {/* Confirm remove */}
      <AlertDialog open={!!roleToRemove} onOpenChange={(o) => { if (!o) setRoleToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove role?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove <strong>&quot;{roleToRemove?.role.name}&quot;</strong> from this staff member? They will lose all permissions associated with this role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleRemove}>
              {removeRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Remove Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
