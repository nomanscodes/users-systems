'use client';

import { useState } from 'react';
import { Plus, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import { CreateRoleDialog } from './create-role-dialog';

interface RoleListPanelProps {
  selectedRoleId: string | null;
  onSelect: (id: string) => void;
}

export function RoleListPanel({ selectedRoleId, onSelect }: RoleListPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: roles, isLoading, isError } = useRoles();

  return (
    <div className="flex flex-col h-full rounded-xl border bg-card overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <span className="text-sm font-semibold">Roles</span>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Create Role
        </Button>
      </div>

      {/* Role List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                <Skeleton className="w-7 h-7 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
            ))}
          </>
        )}

        {isError && (
          <p className="text-center text-xs text-destructive py-6">
            Failed to load roles.
          </p>
        )}

        {!isLoading && !isError && roles?.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
            <Shield className="w-8 h-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No roles yet.</p>
            <p className="text-xs text-muted-foreground/70">Create your first role to get started.</p>
          </div>
        )}

        {roles?.map((role) => (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            className={cn(
              'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
              'hover:bg-muted/60',
              selectedRoleId === role.id
                ? 'bg-primary/10 text-primary'
                : 'text-foreground',
            )}
          >
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-md shrink-0 text-xs font-bold',
                selectedRoleId === role.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {role.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{role.name}</span>
                {role.isSystemRole && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 shrink-0 font-normal"
                  >
                    System
                  </Badge>
                )}
              </div>
              {role.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {role.description}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Create Role Dialog */}
      <CreateRoleDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          setCreateOpen(false);
          onSelect(id);
        }}
      />
    </div>
  );
}
