'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useStaffAssignments, useAssignTeacher, useRemoveAssignment } from '@/features/staff/hooks/use-staff-assignments';
import { useBatches } from '@/features/academics/hooks/use-batches';
import { useSubjectAllocations } from '@/features/academics/hooks/use-subject-allocations';

interface TeachingAssignmentsTabProps { staffId: string; }

export function TeachingAssignmentsTab({ staffId }: TeachingAssignmentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignError, setAssignError] = useState('');

  const { data: assignments, isLoading } = useStaffAssignments(staffId);
  const { data: batches } = useBatches();
  // Use allocations — NOT the raw subject list — so subject dropdown is filtered by class
  const { data: allocations } = useSubjectAllocations();
  const assignTeacher = useAssignTeacher(staffId);
  const removeAssignment = useRemoveAssignment(staffId);

  const classOptions = batches
    ? Array.from(new Map(batches.filter((b) => b.classEntity).map((b) => [b.classId, { value: b.classId, label: b.classEntity!.name }])).values()).sort((a, b) => a.label.localeCompare(b.label))
    : [];

  const groupOptions = batches && classId
    ? Array.from(new Map(batches.filter((b) => b.classId === classId && b.groupId && b.group).map((b) => [b.groupId!, { value: b.groupId!, label: b.group!.name }])).values())
    : [];

  const sectionOptions = batches && classId
    ? Array.from(new Map(batches.filter((b) => b.classId === classId && (groupOptions.length === 0 || b.groupId === (groupId || null)) && b.sectionId && b.section).map((b) => [b.sectionId!, { value: b.sectionId!, label: b.section!.name }])).values())
    : [];

  const resolvedBatchId = batches?.find((b) => b.classId === classId && (groupOptions.length === 0 || b.groupId === (groupId || null)) && (sectionOptions.length === 0 || b.sectionId === (sectionId || null)))?.id;

  /**
   * Subject options filtered by the selected class (and group if applicable).
   * Uses subject_allocations — not the raw subject list — to prevent assigning
   * a subject that is not allocated to the selected class.
   */
  const subjectOptions = (() => {
    if (!classId || !allocations) return [];
    // Effective groupId: if the class has groups, use the selected groupId (or empty = none selected yet)
    const effectiveGroupId = groupOptions.length > 0 ? (groupId || null) : null;
    return allocations
      .filter((a) => {
        if (!a.subject) return false;
        if (a.classId !== classId) return false;
        // If the class has groups, match on groupId; if no groups, match on null groupId allocations
        if (groupOptions.length > 0) return a.groupId === effectiveGroupId;
        return a.groupId === null;
      })
      .map((a) => ({
        value: a.subject!.id,
        label: a.subject!.name,
        description: a.subject!.code ?? undefined,
      }));
  })();

  const handleAssign = async () => {
    setAssignError('');
    if (!subjectId) { setAssignError('Please select a subject.'); return; }
    if (!classId) { setAssignError('Please select a class.'); return; }
    if (!resolvedBatchId) { setAssignError('Could not resolve batch. Please reselect.'); return; }
    try {
      await assignTeacher.mutateAsync({ batchId: resolvedBatchId, subjectId });
      setShowForm(false);
      setSubjectId(''); setClassId(''); setGroupId(''); setSectionId('');
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      const msg: string = err?.message || '';
      if (status === 409) {
        setAssignError('Already assigned to this subject in this batch.');
      } else if (status === 400) {
        // Backend allocation guard: subject not allocated to this class
        setAssignError(msg || 'This subject is not allocated to the selected class.');
      } else {
        setAssignError('Failed to assign. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {assignments?.length ?? 0} assignment{(assignments?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        {!showForm && (
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setShowForm(true)}>
            <Plus className="w-3 h-3" />
            Assign
          </Button>
        )}
      </div>

      {/* Assign form */}
      {showForm && (
        <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Select a class first, then pick an allocated subject</p>
          {/* 1. Class — must come first, subjects depend on it */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Class</Label>
            <SearchableSelect value={classId} onValueChange={(v) => { setClassId(v); setGroupId(''); setSectionId(''); setSubjectId(''); }} options={classOptions} placeholder="Select class" searchPlaceholder="Search classes..." />
          </div>
          {/* 2. Group — only shown when the selected class has groups */}
          {classId && groupOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Group</Label>
              <SearchableSelect value={groupId} onValueChange={(v) => { setGroupId(v); setSectionId(''); setSubjectId(''); }} options={groupOptions} placeholder="Select group" searchPlaceholder="Search groups..." />
            </div>
          )}
          {classId && sectionOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Section</Label>
              <SearchableSelect value={sectionId} onValueChange={setSectionId} options={sectionOptions} placeholder="Select section" searchPlaceholder="Search sections..." />
            </div>
          )}
          {/* 3. Subject — only allocated subjects for the selected class/group */}
          {classId && (groupOptions.length === 0 || groupId) && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Subject</Label>
              {subjectOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/40 border rounded px-3 py-2">
                  No subjects allocated to this class yet. Add them in Subject Allocations.
                </p>
              ) : (
                <SearchableSelect
                  value={subjectId}
                  onValueChange={setSubjectId}
                  options={subjectOptions}
                  placeholder="Select subject"
                  searchPlaceholder="Search subjects..."
                />
              )}
            </div>
          )}
          {assignError && <p className="text-xs text-destructive">{assignError}</p>}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAssign} disabled={assignTeacher.isPending}>
              {assignTeacher.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setAssignError(''); }}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Assignment list */}
      {assignments && assignments.length > 0 ? (
        <div className="divide-y border rounded-lg overflow-hidden">
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-3 group hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{a.subject.name}</p>
                  {a.subject.code && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">{a.subject.code}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {[a.batch.classEntity?.name, a.batch.group?.name, a.batch.section?.name, a.batch.session?.name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all shrink-0"
                    aria-label="Remove assignment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
                    <AlertDialogDescription>Remove {a.subject.name} from {a.batch.classEntity?.name}? This cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => removeAssignment.mutate(a.id)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      ) : (
        !showForm && (
          <div className="rounded-lg border border-dashed py-10 text-center">
            <BookOpen className="w-7 h-7 text-muted-foreground/25 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No teaching assignments yet</p>
            <p className="text-xs text-muted-foreground/50 mt-0.5">Use &quot;Assign&quot; to add a class.</p>
          </div>
        )
      )}
    </div>
  );
}
