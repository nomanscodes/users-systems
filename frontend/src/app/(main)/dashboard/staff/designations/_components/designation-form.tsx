'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateDesignation, useUpdateDesignation } from '@/features/staff/hooks/use-designations';
import type { Designation, DesignationCategory } from '@/features/staff/types/staff.dto';

const CATEGORY_OPTIONS: { value: DesignationCategory; label: string }[] = [
  { value: 'TEACHING', label: 'Teaching' },
  { value: 'NON_TEACHING', label: 'Non-Teaching' },
  { value: 'ADMIN', label: 'Admin' },
];

interface DesignationFormProps {
  mode: 'create' | 'edit';
  designation?: Designation;
  onCancel: () => void;
  onSuccess: () => void;
}

export function DesignationForm({ mode, designation, onCancel, onSuccess }: DesignationFormProps) {
  const [title, setTitle] = useState(designation?.title ?? '');
  const [category, setCategory] = useState<DesignationCategory>(designation?.category ?? 'TEACHING');
  const [titleError, setTitleError] = useState('');

  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const isPending = createDesignation.isPending || updateDesignation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');

    if (!title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    try {
      if (mode === 'create') {
        await createDesignation.mutateAsync({ title: title.trim(), category });
      } else {
        await updateDesignation.mutateAsync({
          id: designation!.id,
          data: { title: title.trim(), category },
        });
      }
      onSuccess();
    } catch (err: any) {
      // Backend returns 409 ConflictException for duplicate title
      const msg: string = err?.message || '';
      if (msg.toLowerCase().includes('already exists') || err?.statusCode === 409) {
        setTitleError('A designation with this title already exists.');
      } else {
        setTitleError('Failed to save. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3 py-2">
      <div className="flex-1 space-y-1">
        <Label htmlFor="desig-title" className="text-xs">Title</Label>
        <Input
          id="desig-title"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
          placeholder="e.g. Senior Science Teacher"
          maxLength={100}
          autoFocus
          className="h-8 text-sm"
          aria-invalid={!!titleError}
        />
        {titleError && <p className="text-xs text-destructive">{titleError}</p>}
      </div>

      <div className="w-40 space-y-1">
        <Label className="text-xs">Category</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as DesignationCategory)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="h-8" disabled={isPending}>
          {isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
          {mode === 'create' ? 'Add' : 'Save'}
        </Button>
        <Button type="button" size="sm" variant="ghost" className="h-8" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
