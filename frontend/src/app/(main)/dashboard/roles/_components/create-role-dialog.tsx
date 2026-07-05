'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useCreateRole } from '@/features/rbac/hooks/use-roles';

interface CreateRoleDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (newRoleId: string) => void;
}

export function CreateRoleDialog({ open, onClose, onCreated }: CreateRoleDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const createRole = useCreateRole();

  const handleClose = () => {
    setName('');
    setDescription('');
    setNameError('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError('');

    if (!name.trim()) {
      setNameError('Role name is required.');
      return;
    }

    try {
      const newRole = await createRole.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      handleClose();
      onCreated(newRole.id);
    } catch (err: any) {
      // Backend throws 400 BadRequestException for duplicate role name
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('already exists')) {
        setNameError('A role with this name already exists.');
      } else {
        setNameError('Failed to create role. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
          <DialogDescription>
            Roles group permissions together. Assign roles to staff members to control their access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); }}
              placeholder="e.g. Class Teacher, Exam Controller"
              maxLength={100}
              autoFocus
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional — describe what this role is for"
              rows={3}
              className="resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={createRole.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
