'use client';

import { useState } from 'react';
import { Pencil, Trash2, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useRole, useUpdateRole, useDeleteRole } from '@/features/rbac/hooks/use-roles';
import { usePermissions } from '@/features/rbac/hooks/use-permissions';
import { PermissionMatrix } from './permission-matrix';

interface RoleDetailPanelProps {
  roleId: string;
  onDeleted: () => void;
}

export function RoleDetailPanel({ roleId, onDeleted }: RoleDetailPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [nameError, setNameError] = useState('');

  const { data: role, isLoading: roleLoading } = useRole(roleId);
  const { data: allPermissions, isLoading: permsLoading } = usePermissions();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const isLoading = roleLoading || permsLoading;

  const startEdit = () => {
    setEditName(role?.name ?? '');
    setEditDesc(role?.description ?? '');
    setNameError('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setNameError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');
    if (!editName.trim()) { setNameError('Name is required.'); return; }

    try {
      await updateRole.mutateAsync({ id: roleId, data: { name: editName.trim(), description: editDesc.trim() || undefined } });
      setEditMode(false);
    } catch (err: any) {
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setNameError('A role with this name already exists.');
      } else {
        setNameError('Failed to update. Please try again.');
      }
    }
  };

  const handleDelete = async () => {
    await deleteRole.mutateAsync(roleId);
    onDeleted();
  };

  if (isLoading) {
    return (
      <div className="h-full rounded-xl border bg-card p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-full" />
                <Skeleton className="h-7 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!role) return null;

  return (
    <div className="flex flex-col h-full rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b shrink-0">
        {editMode ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="edit-role-name" className="text-xs">Role Name</Label>
              <Input
                id="edit-role-name"
                value={editName}
                onChange={(e) => { setEditName(e.target.value); setNameError(''); }}
                maxLength={100}
                autoFocus
                className="h-8 text-sm"
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-role-desc" className="text-xs">Description</Label>
              <Textarea
                id="edit-role-desc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={updateRole.isPending}>
                {updateRole.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold truncate">{role.name}</h2>
                {role.isSystemRole && (
                  <Badge variant="secondary" className="text-xs shrink-0">System</Badge>
                )}
              </div>
              {role.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {role.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Edit button — hidden for system roles */}
              {!role.isSystemRole && (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={startEdit}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {/* Delete button — hidden for system roles */}
              {!role.isSystemRole && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{role.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the role and remove it from all assigned staff members. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={handleDelete}
                      >
                        {deleteRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Delete Role
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </div>

      {/* System Role Info Banner */}
      {role.isSystemRole && (
        <div className="mx-4 mt-4 flex items-start gap-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            This is a system role. Name and deletion are locked, but you can still adjust its permissions.
          </p>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="flex-1 overflow-y-auto p-4">
        {allPermissions && role && (
          <PermissionMatrix
            role={role}
            allPermissions={allPermissions}
          />
        )}
      </div>
    </div>
  );
}
