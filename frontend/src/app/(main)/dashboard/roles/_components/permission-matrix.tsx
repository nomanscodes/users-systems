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

// Small SVG donut ring reused from subject heatmap for compact progress
function DonutRing({ pct, size = 32 }: { pct: number; size?: number }) {
  const strokeW = 3.5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const stroke =
    pct === 100
      ? '#10b981'
      : pct >= 75
      ? '#22c55e'
      : pct >= 50
      ? '#f59e0b'
      : pct > 0
      ? '#fb923c'
      : '#cbd5e1';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeW} className="stroke-border/30" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeW}
          stroke={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums" style={{ color: stroke }}>
        {pct}%
      </span>
    </div>
  );
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
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide px-1">Permission Matrix</p>

      {resourceKeys.map((resource) => {
        const perms = grouped[resource];
        const assignedCount = perms.filter((p) => assignedIds.has(p.id)).length;
        const pct = Math.round((assignedCount / perms.length) * 100);

        return (
          <div key={resource} className="rounded-lg border bg-card/50">
            {/* Resource Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  <DonutRing pct={pct} size={36} />
                </div>
                <div>
                  <div className="text-sm font-medium">{RESOURCE_LABELS[resource] ?? resource}</div>
                  <div className="text-xs text-muted-foreground">{assignedCount}/{perms.length} permissions</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{pct}%</div>
            </div>

            {/* Permission Rows */}
            <div className="px-4 py-2 space-y-1">
              {perms.map((perm) => {
                const isChecked = assignedIds.has(perm.id);
                const isPending = pendingId === perm.id;
                const checkboxId = `perm-${perm.id}`;

                return (
                  <div key={perm.id} className={cn('flex items-center gap-3 py-1.5 rounded-md px-1 transition-colors', 'hover:bg-muted/40')}>
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
                    ) : (
                      <Checkbox id={checkboxId} checked={isChecked} disabled={!!pendingId} onCheckedChange={(checked) => handleToggle(perm, checked as boolean)} className="shrink-0" />
                    )}
                    <Label htmlFor={checkboxId} className={cn('text-sm cursor-pointer select-none flex-1', isPending && 'text-muted-foreground')}>
                      {ACTION_LABELS[perm.action] ?? perm.action}{' '}
                      <span className="text-muted-foreground font-normal text-xs">({perm.action})</span>
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
