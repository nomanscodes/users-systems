'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/searchable-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageContainer } from '@/components/page-container';
import { TabHeader } from '@/features/academics/components/shared/tab-header';
import { RowActions } from '@/features/academics/components/shared/row-actions';
import { EmptyRow } from '@/features/academics/components/shared/empty-row';
import { DeleteConfirm } from '@/features/academics/components/shared/delete-confirm';
import {
  useDesignations,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from '@/features/staff/hooks/use-designations';
import type { Designation, DesignationCategory } from '@/features/staff/types/staff.dto';

// ─── Types ────────────────────────────────────────────────────────────────────

type DialogMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'edit'; item: Designation };

const EMPTY_FORM = { title: '', category: 'TEACHING' as DesignationCategory };

const CATEGORY_OPTIONS: SearchableSelectOption[] = [
  { value: 'TEACHING',     label: 'Teaching',     description: 'Teachers assigned to batches & subjects' },
  { value: 'NON_TEACHING', label: 'Non-Teaching', description: 'Support staff not assigned to classes' },
  { value: 'ADMIN',        label: 'Admin',         description: 'Administrative and management roles' },
];

const CATEGORY_BADGE: Record<DesignationCategory, string> = {
  TEACHING:
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  NON_TEACHING:
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  ADMIN:
    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
};

const CATEGORY_LABEL: Record<DesignationCategory, string> = {
  TEACHING: 'Teaching',
  NON_TEACHING: 'Non-Teaching',
  ADMIN: 'Admin',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DesignationsPageClient() {
  const { data: items = [], isLoading } = useDesignations();
  const createMutation = useCreateDesignation();
  const updateMutation = useUpdateDesignation();
  const deleteMutation = useDeleteDesignation();

  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<DialogMode>({ type: 'closed' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [titleError, setTitleError] = useState('');
  const [toDelete, setToDelete] = useState<Designation | null>(null);

  const filtered = items.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setTitleError('');
    setMode({ type: 'create' });
  };

  const openEdit = (item: Designation) => {
    setForm({ title: item.title, category: item.category });
    setTitleError('');
    setMode({ type: 'edit', item });
  };

  const close = () => {
    setMode({ type: 'closed' });
    setTitleError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTitleError('');
    if (!form.title.trim()) {
      setTitleError('Title is required.');
      return;
    }

    try {
      if (mode.type === 'edit') {
        await updateMutation.mutateAsync({ id: mode.item.id, data: form });
      } else {
        await createMutation.mutateAsync(form);
      }
      close();
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      if (status === 409 || String(err?.message).toLowerCase().includes('already exists')) {
        setTitleError('A designation with this title already exists.');
      } else {
        setTitleError('Failed to save. Please try again.');
      }
    }
  };

  const isEdit = mode.type === 'edit';
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
          <span>People</span>
          <span className="mx-2 font-light">/</span>
          <span className="text-foreground/70">Designations</span>
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
          Designations
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-2xl">
          Define job titles and categories for your staff. Designations are used during
          staff invite and control access to teaching assignments.
        </p>
      </div>

      <div className="space-y-4">
        {/* Search + Add button */}
        <TabHeader
          search={search}
          setSearch={setSearch}
          placeholder="Search designations..."
          buttonLabel="Add Designation"
          onAddClick={openCreate}
        />

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={3} label="Loading designations..." />
            ) : filtered.length === 0 ? (
              <EmptyRow
                colSpan={3}
                label={search ? 'No designations match your search.' : 'No designations yet. Add one to get started.'}
              />
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>
                    <span className={CATEGORY_BADGE[d.category]}>
                      {CATEGORY_LABEL[d.category]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <RowActions
                      onEdit={() => openEdit(d)}
                      onDelete={() => setToDelete(d)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={mode.type !== 'closed'} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Designation' : 'Add Designation'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update the title or category of this designation.'
                : 'Add a new job title designation for your staff.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="desig-title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="desig-title"
                value={form.title}
                onChange={(e) => { setForm((f) => ({ ...f, title: e.target.value })); setTitleError(''); }}
                placeholder="e.g. Senior Science Teacher"
                maxLength={100}
                autoFocus
                aria-invalid={!!titleError}
              />
              {titleError && <p className="text-xs text-destructive">{titleError}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <SearchableSelect
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as DesignationCategory }))}
                options={CATEGORY_OPTIONS}
                placeholder="Select a category"
                searchPlaceholder="Search categories..."
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Add Designation'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => { if (!o) setToDelete(null); }}
        entity="Designation"
        itemName={toDelete?.title}
        onConfirm={() => {
          if (toDelete) {
            deleteMutation.mutate(toDelete.id, { onSuccess: () => setToDelete(null) });
          }
        }}
        isDeleting={deleteMutation.isPending}
      />
    </PageContainer>
  );
}
