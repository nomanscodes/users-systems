'use client';

import { useState } from 'react';
import { Loader2, Plus, X, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { useStaffRoles, useAssignStaffRole, useRemoveStaffRole } from '@/features/staff/hooks/use-staff-assignments';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import type { StaffRole } from '@/features/staff/types/staff.dto';

interface RolesTabProps {
  staffId: string;
}

export function RolesTab({ staffId }: RolesTabProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<StaffRole | null>(null);

  const { data: staffRoles, isLoading: isLoadingStaffRoles, isError: isStaffRolesError } = useStaffRoles(staffId);
  const { data: allRoles, isLoading: isLoadingAllRoles } = useRoles();
  const assignRole = useAssignStaffRole(staffId);
  const removeRole = useRemoveStaffRole(staffId);

  const assignedRoleIds = new Set(staffRoles?.map((sr) => sr.roleId) ?? []);

  // Filter out already-assigned roles from the "add" dropdown
  const availableRoles = allRoles?.filter((r) => !assignedRoleIds.has(r.id)) ?? [];

  const handleAssign = (roleId: string) => {
    assignRole.mutate({ roleIds: [roleId] });
    setAddOpen(false);
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

  // If the roles endpoint fails (e.g. 404), show a graceful fallback
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
            <span className="text-xs text-muted-foreground">
              ({staffRoles.length})
            </span>
          )}
        </div>

        {/* Add Role Popover */}
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Role
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="end">
            <Command>
              <CommandInput placeholder="Search roles..." />
              <CommandList>
                <CommandEmpty>
                  {availableRoles.length === 0
                    ? 'All roles assigned.'
                    : 'No roles found.'}
                </CommandEmpty>
                <CommandGroup>
                  {availableRoles.map((role) => (
                    <CommandItem
                      key={role.id}
                      value={role.name}
                      onSelect={() => handleAssign(role.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        {role.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {role.description}
                          </span>
                        )}
                      </div>
                      {role.isSystemRole && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                          System
                        </Badge>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Role Chips */}
      {staffRoles && staffRoles.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {staffRoles.map((sr) => (
            <Badge
              key={sr.roleId}
              variant="secondary"
              className="gap-1.5 pr-1.5 pl-2.5 py-1 text-sm font-normal group"
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
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50">
            <ShieldAlert className="w-6 h-6 text-muted-foreground/40" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">No roles assigned</p>
            <p className="text-xs text-muted-foreground/70">
              Click &quot;Add Role&quot; to assign a role to this staff member.
            </p>
          </div>
        </div>
      )}

      {/* Info text */}
      <p className="text-xs text-muted-foreground/60">
        Roles control what this staff member can access. System roles cannot be removed.
      </p>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!roleToRemove} onOpenChange={(o) => { if (!o) setRoleToRemove(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the <strong>&quot;{roleToRemove?.role.name}&quot;</strong> role
              from this staff member? They will lose all permissions associated with this role.
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
