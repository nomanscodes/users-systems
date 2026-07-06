'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { RoleListPanel } from './role-list-panel';
import { RoleDetailPanel } from './role-detail-panel';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import { usePermissions } from '@/features/rbac/hooks/use-permissions';

export function RolesPageClient() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const { data: roles } = useRoles();
  const { data: allPermissions } = usePermissions();

  const totalRoles = roles?.length ?? 0;
  const systemRoles = roles?.filter((r) => r.isSystemRole).length ?? 0;
  const editableRoles = totalRoles - systemRoles;
  const totalPermissions = allPermissions?.length ?? 0;

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">
              Create roles and assign permissions to control staff access.
            </p>
          </div>
        </div>

        {/* Top summary cards — compact */}
        <div className="hidden md:grid grid-cols-4 gap-3 ml-auto">
          <div className="rounded-xl border px-4 py-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
            <p className="mt-1 text-2xl font-bold leading-none">{totalRoles}</p>
            <p className="mt-0.5 text-[11px] opacity-60">{editableRoles} editable · {systemRoles} system</p>
          </div>

          <div className="rounded-xl border px-4 py-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Permissions</p>
            <p className="mt-1 text-2xl font-bold leading-none">{totalPermissions}</p>
            <p className="mt-0.5 text-[11px] opacity-60">All available permissions</p>
          </div>

          <div className="rounded-xl border px-4 py-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">System Roles</p>
            <p className="mt-1 text-2xl font-bold leading-none">{systemRoles}</p>
            <p className="mt-0.5 text-[11px] opacity-60">Protected by the system</p>
          </div>

          <div className="rounded-xl border px-4 py-3 bg-card">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Editable Roles</p>
            <p className="mt-1 text-2xl font-bold leading-none">{editableRoles}</p>
            <p className="mt-0.5 text-[11px] opacity-60">Create, edit or delete</p>
          </div>
        </div>
      </div>

      {/* Main Two-Panel Layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Panel — Role List */}
        <div className="w-80 shrink-0">
          <RoleListPanel
            selectedRoleId={selectedRoleId}
            onSelect={setSelectedRoleId}
          />
        </div>

        {/* Right Panel — Role Detail or Empty State */}
        <div className="flex-1 min-w-0">
          {selectedRoleId ? (
            <RoleDetailPanel
              roleId={selectedRoleId}
              onDeleted={() => setSelectedRoleId(null)}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed">
              <div className="flex flex-col items-center gap-3 text-center p-8">
                <ShieldCheck className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">Select a role</p>
                <p className="text-xs text-muted-foreground/70 max-w-[28ch]">
                  Choose a role from the list to view and edit its permissions. Use the search to quickly find roles.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
