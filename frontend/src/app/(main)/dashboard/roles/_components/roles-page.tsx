'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { RoleListPanel } from './role-list-panel';
import { RoleDetailPanel } from './role-detail-panel';

export function RolesPageClient() {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Page Header */}
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

      {/* Two-Panel Layout */}
      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left Panel — Role List */}
        <div className="w-72 shrink-0">
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
                <p className="text-xs text-muted-foreground/70 max-w-[22ch]">
                  Choose a role from the list to view and edit its permissions.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
