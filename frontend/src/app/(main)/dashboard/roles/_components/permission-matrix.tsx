'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAssignPermissions, useRemovePermission } from '@/features/rbac/hooks/use-roles';
import type { Role, Permission } from '@/features/rbac/types/rbac.dto';

// Human-readable action labels
const ACTION_LABELS: Record<string, string> = {
  read: 'View',
  write: 'Create & Edit',
  delete: 'Delete',
  publish: 'Publish',
  export: 'Export',
};

// Resource display names (title case)
const RESOURCE_LABELS: Record<string, string> = {
  students: 'Students',
  staff: 'Staff',
  fees: 'Fees',
  attendance: 'Attendance',
  exams: 'Exams',
  reports: 'Reports',
  academics: 'Academics',
  roles: 'Roles & Permissions',
};

interface PermissionMatrixProps {
  role: Role;
  allPermissions: Permission[];
}

export function PermissionMatrix({ role, allPermissions }: PermissionMatrixProps) {
  // Track which specific permission is pending a toggle (for per-checkbox loading state)
  const [pendingId, setPendingId] = useState<string | null>(null);

  const assignPermissions = useAssignPermissions(role.id);
  const removePermission = useRemovePermission(role.id);

  // Build a Set of currently assigned permission IDs for O(1) lookup
  const assignedIds = new Set(
    role.rolePermissions?.map((rp) => rp.permissionId) ?? [],
  );

  // Group allPermissions by resource
  const grouped = allPermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {});

  const handleToggle = async (permission: Permission, checked: boolean) => {
    if (pendingId) return; // prevent concurrent toggles

    setPendingId(permission.id);
    try {
      if (checked) {
        await assignPermissions.mutateAsync({ permissionIds: [permission.id] });
      } else {
        await removePermission.mutateAsync(permission.id);
      }
    } finally {
      setPendingId(null);
    }
  };

  const resourceKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1">
        Permission Matrix
      </p>

      {resourceKeys.map((resource) => {
        const perms = grouped[resource];
        const assignedCount = perms.filter((p) => assignedIds.has(p.id)).length;

        return (
          <div key={resource} className="rounded-lg border bg-card/50">
            {/* Resource Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <span className="text-sm font-medium">
                {RESOURCE_LABELS[resource] ?? resource}
              </span>
              <span className="text-xs text-muted-foreground">
                {assignedCount}/{perms.length}
              </span>
            </div>

            {/* Permission Rows */}
            <div className="px-4 py-2 space-y-1">
              {perms.map((perm) => {
                const isChecked = assignedIds.has(perm.id);
                const isPending = pendingId === perm.id;
                const checkboxId = `perm-${perm.id}`;

                return (
                  <div
                    key={perm.id}
                    className={cn(
                      'flex items-center gap-3 py-1.5 rounded-md px-1 transition-colors',
                      'hover:bg-muted/40',
                    )}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                    ) : (
                      <Checkbox
                        id={checkboxId}
                        checked={isChecked}
                        disabled={!!pendingId}
                        onCheckedChange={(checked) =>
                          handleToggle(perm, checked as boolean)
                        }
                        className="shrink-0"
                      />
                    )}
                    <Label
                      htmlFor={checkboxId}
                      className={cn(
                        'text-sm cursor-pointer select-none flex-1',
                        isPending && 'text-muted-foreground',
                      )}
                    >
                      {ACTION_LABELS[perm.action] ?? perm.action}{' '}
                      <span className="text-muted-foreground font-normal text-xs">
                        ({perm.action})
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
