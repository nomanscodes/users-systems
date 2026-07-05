'use client';

import { useState } from 'react';
import { Briefcase, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useDesignations, useDeleteDesignation } from '@/features/staff/hooks/use-designations';
import type { Designation } from '@/features/staff/types/staff.dto';
import { DesignationForm } from './designation-form';

const CATEGORY_CONFIG = {
  TEACHING: { label: 'Teaching', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  NON_TEACHING: { label: 'Non-Teaching', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  ADMIN: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
} as const;

export function DesignationsPageClient() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);

  const { data: designations, isLoading, isError } = useDesignations();
  const deleteDesignation = useDeleteDesignation();

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Briefcase className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Designations</h1>
            <p className="text-sm text-muted-foreground">
              Define job titles and categories for your staff.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Designation
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <DesignationForm
          mode="create"
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      )}

      {/* Loading */}
      {isLoading && (
        <div className="rounded-xl border divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-center text-sm text-destructive py-8">
          Failed to load designations.
        </p>
      )}

      {/* Empty State */}
      {!isLoading && !isError && designations?.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-dashed text-center">
          <Briefcase className="w-10 h-10 text-muted-foreground/30" />
          <p className="font-medium text-muted-foreground">No designations yet</p>
          <p className="text-sm text-muted-foreground/70">
            Add your first designation to start inviting staff.
          </p>
          <Button variant="outline" onClick={() => setShowCreateForm(true)} className="mt-1">
            <Plus className="w-4 h-4 mr-2" /> Add Designation
          </Button>
        </div>
      )}

      {/* Designations Table */}
      {!isLoading && designations && designations.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {designations.map((designation) => (
                <tr key={designation.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">
                    {editingDesignation?.id === designation.id ? (
                      <DesignationForm
                        mode="edit"
                        designation={designation}
                        onCancel={() => setEditingDesignation(null)}
                        onSuccess={() => setEditingDesignation(null)}
                      />
                    ) : (
                      designation.title
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingDesignation?.id !== designation.id && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          CATEGORY_CONFIG[designation.category].className
                        }`}
                      >
                        {CATEGORY_CONFIG[designation.category].label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingDesignation?.id !== designation.id && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingDesignation(designation)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{designation.title}"?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this designation. Staff members currently assigned to it will need a new designation.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteDesignation.mutate(designation.id)}
                              >
                                {deleteDesignation.isPending && (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                )}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
