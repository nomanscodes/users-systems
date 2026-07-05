'use client';

import { ShieldAlert } from 'lucide-react';

/**
 * Roles Tab — PLACEHOLDER ONLY
 *
 * Backend endpoints for staff role management are NOT YET IMPLEMENTED:
 *   GET  /staff/:id/roles   ← pending
 *   POST /staff/:id/roles   ← pending
 *   DELETE /staff/:id/roles/:roleId ← pending
 *
 * Marked as pending in: phase-0.4a-implementation-plan.md (lines 126-128)
 *
 * When the backend ships these endpoints:
 * 1. Uncomment the hooks in use-staff-assignments.ts
 * 2. Replace this component with the full role chip UI
 */
export function RolesTab() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted/50">
        <ShieldAlert className="w-7 h-7 text-muted-foreground/40" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-muted-foreground">Role Management Coming Soon</p>
        <p className="text-sm text-muted-foreground/70 max-w-[30ch]">
          Individual staff role assignment will be available in a future update.
        </p>
        <p className="text-xs text-muted-foreground/50 mt-2">
          Roles are currently assigned during the staff invite process.
        </p>
      </div>
    </div>
  );
}
