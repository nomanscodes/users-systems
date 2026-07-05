'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import { useStaffAssignments, useAssignTeacher, useRemoveAssignment } from '@/features/staff/hooks/use-staff-assignments';
import { useBatches } from '@/features/academics/hooks/use-batches';
import { useSubjects } from '@/features/academics/hooks/use-subjects';

interface TeachingAssignmentsTabProps {
  staffId: string;
}

export function TeachingAssignmentsTab({ staffId }: TeachingAssignmentsTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignError, setAssignError] = useState('');

  const { data: assignments, isLoading } = useStaffAssignments(staffId);
  const { data: subjects } = useSubjects();
  const { data: batches } = useBatches();
  const assignTeacher = useAssignTeacher(staffId);
  const removeAssignment = useRemoveAssignment(staffId);

  // Derive unique class options from batches
  const classOptions = batches
    ? Array.from(
        new Map(
          batches
            .filter((b) => b.classEntity)
            .map((b) => [b.classId, { id: b.classId, name: b.classEntity!.name }]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name))
    : [];

  // Derive group options filtered by selected class
  const groupOptions = batches && classId
    ? Array.from(
        new Map(
          batches
            .filter((b) => b.classId === classId && b.groupId && b.group)
            .map((b) => [b.groupId!, { id: b.groupId!, name: b.group!.name }]),
        ).values(),
      )
    : [];

  // Derive section options filtered by class + group
  const sectionOptions = batches && classId
    ? Array.from(
        new Map(
          batches
            .filter(
              (b) =>
                b.classId === classId &&
                (groupOptions.length === 0 || b.groupId === (groupId || null)) &&
                b.sectionId &&
                b.section,
            )
            .map((b) => [b.sectionId!, { id: b.sectionId!, name: b.section!.name }]),
        ).values(),
      )
    : [];

  // Resolve batchId from selections
  const resolvedBatchId = batches
    ? batches.find(
        (b) =>
          b.classId === classId &&
          (groupOptions.length === 0 || b.groupId === (groupId || null)) &&
          (sectionOptions.length === 0 || b.sectionId === (sectionId || null)),
      )?.id
    : undefined;

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
      if (status === 409) {
        setAssignError('This teacher is already assigned to this subject in this batch.');
      } else {
        setAssignError('Failed to assign. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Assignment List */}
      {assignments && assignments.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Subject</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Class</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Group</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Section</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Session</th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2">
                    {a.subject.name}
                    {a.subject.code && (
                      <span className="ml-1 text-xs text-muted-foreground">({a.subject.code})</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{a.batch.classEntity?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.batch.group?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.batch.section?.name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{a.batch.session?.name ?? '—'}</td>
                  <td className="px-3 py-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove {a.subject.name} assignment from {a.batch.classEntity?.name}? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90"
                            onClick={() => removeAssignment.mutate(a.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-8 text-center">
          <p className="text-sm text-muted-foreground">No teaching assignments yet.</p>
        </div>
      )}

      {/* Assign Form */}
      {showForm ? (
        <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
          <p className="text-sm font-medium">Assign to Class</p>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.code ? ` (${s.code})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setGroupId(''); setSectionId(''); }}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {classOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group — only shown if batches have groups for this class */}
          {classId && groupOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Group</Label>
              <Select value={groupId} onValueChange={(v) => { setGroupId(v); setSectionId(''); }}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select group" /></SelectTrigger>
                <SelectContent>
                  {groupOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Section — only shown if batches have sections */}
          {classId && sectionOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Section</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sectionOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {assignError && <p className="text-xs text-destructive">{assignError}</p>}

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleAssign} disabled={assignTeacher.isPending}>
              {assignTeacher.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Assign
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setAssignError(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Assign to Class
        </Button>
      )}
    </div>
  );
}
