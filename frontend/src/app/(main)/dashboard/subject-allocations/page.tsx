"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SubjectDndPanel, subjectColor } from "./_components/subject-dnd-panel";
import { DroppableColumn } from "./_components/droppable-column";
import {
  BookOpen,
  GraduationCap,
  LayoutGrid,
  Loader2,
  MoreVertical,
  Plus,
  Save,
  Copy,
  Trash2,
  Search,
  Layers,
  CheckCircle2,
  Circle,
  TrendingUp,
  Map,
  List,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/page-container";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

import { useSubjects } from "@/features/academics/hooks/use-subjects";
import { useBatches } from "@/features/academics/hooks/use-batches";
import {
  useSubjectAllocations,
  useCreateSubjectAllocation,
  useDeleteSubjectAllocation,
} from "@/features/academics/hooks/use-subject-allocations";
import type {
  ClassEntity,
  Group,
  Subject,
} from "@/features/academics/types/academics.dto";

// ─── Column: a unique (class, group?) combination ────────────────────────────

interface Column {
  /** E.g. "classId::groupId" or "classId::none" */
  id: string;
  classEntity: ClassEntity;
  group: Group | null;
  /** IDs of allocations for this column: subjectId -> allocationId */
  allocationMap: Record<string, string>;
}

// ─── Subject color palette (deterministic based on index) ────────────────────

// ─── Add Subject Dialog ──────────────────────────────────────────────────────

function AddSubjectDialog({
  open,
  onOpenChange,
  allSubjects,
  allocatedSubjectIds,
  isAdding,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allSubjects: Subject[];
  allocatedSubjectIds: string[];
  isAdding: boolean;
  onAdd: (subjectIds: string[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const available = allSubjects.filter(
    (s) =>
      !allocatedSubjectIds.includes(s.id) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.code ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    onAdd(Array.from(checked));
    setChecked(new Set());
    setSearch("");
  };

  const handleClose = () => {
    setChecked(new Set());
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add Subjects</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search subjects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1 rounded-lg border border-border/50 p-2">
          {available.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {allSubjects.length === 0
                ? "No subjects created yet."
                : "All subjects are already allocated."}
            </p>
          ) : (
            available.map((s, idx) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={checked.has(s.id)}
                  onCheckedChange={() => toggle(s.id)}
                />
                <div className={cn("h-2 w-2 shrink-0 rounded-full", subjectColor(idx))} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{s.name}</p>
                  {s.code && <p className="text-[11px] text-muted-foreground">{s.code}</p>}
                </div>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide shrink-0",
                    s.type === "MANDATORY"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {s.type}
                </span>
              </label>
            ))
          )}
        </div>
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            {checked.size > 0 ? `${checked.size} selected` : "Select subjects to add"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={checked.size === 0 || isAdding} onClick={handleAdd}>
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add {checked.size > 0 ? `(${checked.size})` : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Column Card ─────────────────────────────────────────────────────────────

function ColumnCard({
  column,
  allSubjects,
  onAddSubjects,
  onRemoveSubject,
  onCopyColumn,
  isAdding,
  isRemoving,
}: {
  column: Column;
  allSubjects: Subject[];
  onAddSubjects: (col: Column, subjectIds: string[]) => void;
  onRemoveSubject: (allocationId: string) => void;
  onCopyColumn: (col: Column) => void;
  isAdding: boolean;
  isRemoving: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const allocatedSubjectIds = Object.keys(column.allocationMap);
  const allocatedSubjects = allocatedSubjectIds
    .map((sid) => allSubjects.find((s) => s.id === sid))
    .filter(Boolean) as Subject[];

  return (
    <div className="flex w-[220px] shrink-0 flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-border/40 bg-muted/30 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="truncate text-[13px] font-semibold text-foreground">
              {column.classEntity.name}
            </p>
          </div>
          {column.group && (
            <Badge variant="secondary" className="mt-1 h-4 rounded-sm px-1.5 text-[10px]">
              {column.group.name}
            </Badge>
          )}
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {allocatedSubjects.length} Subjects
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onCopyColumn(column)}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copy subjects
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Subject list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2.5 min-h-[60px]">
        {allocatedSubjects.map((s, idx) => (
          <div
            key={s.id}
            className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 group hover:border-border transition-all"
          >
            <div className={cn("h-2 w-2 shrink-0 rounded-full", subjectColor(
              allSubjects.findIndex((as) => as.id === s.id)
            ))} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground leading-none">
                {s.name}
              </p>
              {s.code && (
                <p className="mt-0.5 text-[10px] text-muted-foreground">{s.code}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
              disabled={isRemoving}
              onClick={() => onRemoveSubject(column.allocationMap[s.id])}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Subject Button */}
      <div className="border-t border-border/40 p-2">
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border/60 py-2 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Subject
        </button>
      </div>

      <AddSubjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        allSubjects={allSubjects}
        allocatedSubjectIds={allocatedSubjectIds}
        isAdding={isAdding}
        onAdd={(ids) => {
          onAddSubjects(column, ids);
          setDialogOpen(false);
        }}
      />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-[220px] shrink-0 rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
          <div className="border-b border-border/40 bg-muted/30 p-3.5 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="p-2.5 space-y-1.5">
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubjectAllocationsPage() {
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: batches = [], isLoading: batchesLoading } = useBatches();
  const { data: allocations = [], isLoading: allocationsLoading } = useSubjectAllocations();

  const createAllocation = useCreateSubjectAllocation();
  const deleteAllocation = useDeleteSubjectAllocation();

  const [view, setView] = useState<"matrix" | "heatmap" | "list">("matrix");
  const [searchQuery, setSearchQuery] = useState("");
  const [clipboard, setClipboard] = useState<string[]>([]);
  const [activeDragSubjectId, setActiveDragSubjectId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 16,   // must move 16px before drag activates
      },
    })
  );

  const activeDragSubject = activeDragSubjectId
    ? subjects.find((s) => s.id === activeDragSubjectId) ?? null
    : null;

  const isLoading = subjectsLoading || batchesLoading || allocationsLoading;

  // Build matrix columns from BATCHES (deduplicated by classId + groupId).
  // Sections are completely ignored — subjects differ only by class+group.
  const columns = useMemo<Column[]>(() => {
    if (batches.length === 0) return [];

    const seen = new Set<string>();
    const uniqueCombos: { colId: string; classEntity: ClassEntity; group: Group | null }[] = [];

    for (const batch of batches) {
      const classEntity = batch.classEntity;
      if (!classEntity) continue; // skip if relation not loaded
      const group = batch.group ?? null;
      const colId = `${batch.classId}::${batch.groupId ?? "none"}`;
      if (seen.has(colId)) continue; // deduplicate — ignore sectionId
      seen.add(colId);
      uniqueCombos.push({ colId, classEntity, group });
    }

    // Attach allocationMap to each column
    return uniqueCombos.map(({ colId, classEntity, group }) => {
      const allocationMap: Record<string, string> = {};
      for (const alloc of allocations) {
        const allocColId = `${alloc.classId}::${alloc.groupId ?? "none"}`;
        if (allocColId === colId) {
          allocationMap[alloc.subjectId] = alloc.id;
        }
      }
      return { id: colId, classEntity, group, allocationMap };
    }).sort((a, b) => {
      const aNum = a.classEntity.numericValue ?? 0;
      const bNum = b.classEntity.numericValue ?? 0;
      if (aNum !== bNum) return aNum - bNum;
      return (a.group?.name ?? "").localeCompare(b.group?.name ?? "");
    });
  }, [batches, allocations]);

  const stats = useMemo(() => {
    const totalMappings = allocations.length;
    const optionalCount = allocations.filter(
      (a) => subjects.find((s) => s.id === a.subjectId)?.type === "OPTIONAL"
    ).length;
    const coverage = columns.length > 0 && subjects.length > 0
      ? Math.round((totalMappings / (subjects.length * columns.length)) * 100)
      : 0;
    return { totalMappings, optionalCount, coverage };
  }, [allocations, subjects, columns]);

  const filteredColumns = searchQuery
    ? columns.filter(
      (c) =>
        c.classEntity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.group?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
    : columns;

  // Add subjects to a column: fire one mutation per subject
  const handleAddSubjects = async (col: Column, subjectIds: string[]) => {
    const promises = subjectIds.map((subjectId) =>
      createAllocation.mutateAsync({
        classId: col.classEntity.id,
        groupId: col.group?.id ?? null,
        subjectId,
      })
    );
    try {
      await Promise.all(promises);
      toast.success(`${subjectIds.length} subject${subjectIds.length === 1 ? "" : "s"} allocated.`);
    } catch {
      // individual errors handled by hook
    }
  };

  const handleRemoveSubject = (allocationId: string) => {
    deleteAllocation.mutate(allocationId);
  };

  const handleCopyColumn = (col: Column) => {
    const subjectIds = Object.keys(col.allocationMap);
    setClipboard(subjectIds);
    toast.info(
      `Copied ${subjectIds.length} subjects from ${col.classEntity.name}${col.group ? ` · ${col.group.name}` : ""}. Click another column's menu to paste.`
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const subjectId = event.active.data.current?.subjectId;
    if (subjectId) setActiveDragSubjectId(subjectId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragSubjectId(null);
    const { active, over } = event;
    if (!over) return;

    const subjectId = active.data.current?.subjectId as string | undefined;
    const columnId = over.data.current?.columnId as string | undefined;
    if (!subjectId || !columnId) return;

    const col = columns.find((c) => c.id === columnId);
    if (!col) return;

    // Skip if already allocated
    if (col.allocationMap[subjectId]) {
      toast.info("Subject is already in this column.");
      return;
    }

    createAllocation.mutate({
      classId: col.classEntity.id,
      groupId: col.group?.id ?? null,
      subjectId,
    });
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col mb-2">
            <Skeleton className="h-3 w-48 mb-3" />
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <LoadingSkeleton />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Toaster position="top-right" richColors />
      <div className="flex h-full flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col mb-2">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
            <span>Academic Setup</span>
            <span className="mx-2 font-light">/</span>
            <span className="text-foreground/70">Curriculum Matrix</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
                Curriculum Matrix
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Design and manage your curriculum across classes and groups.
                Add or remove subjects per program column in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: "Total Subjects",
              value: subjects.length,
              sub: `${subjects.filter((s) => s.type === "MANDATORY").length} mandatory`,
              icon: BookOpen,
              color: "text-blue-500",
              bg: "bg-blue-500/10",
            },
            {
              label: "Programs",
              value: columns.length,
              sub: `Unique class + group combinations`,
              icon: GraduationCap,
              color: "text-purple-500",
              bg: "bg-purple-500/10",
            },
            {
              label: "Total Mappings",
              value: stats.totalMappings,
              sub: "Active assignments",
              icon: Layers,
              color: "text-green-500",
              bg: "bg-green-500/10",
            },
            {
              label: "Coverage",
              value: `${stats.coverage}%`,
              sub: "Curriculum coverage",
              icon: TrendingUp,
              color: "text-orange-500",
              bg: "bg-orange-500/10",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border/50 bg-card p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{stat.sub}</p>
                </div>
                <div className={cn("rounded-lg p-2", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
            {[
              { key: "matrix", label: "Matrix View", icon: LayoutGrid },
              { key: "heatmap", label: "Heatmap View", icon: Map },
              { key: "list", label: "Subject List View", icon: List },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key as typeof view)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
                  view === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-64 pl-9 bg-background"
            />
          </div>
        </div>

        {/* ── Empty state ── */}
        {(subjects.length === 0 || batches.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {subjects.length === 0
                  ? "No subjects found"
                  : "No classrooms configured yet"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {subjects.length === 0
                  ? "Please create subjects in Academic Setup first."
                  : "Please configure classes and groups in Class Configure first. Each configured batch will appear as a column here."}
              </p>
            </div>
          </div>
        )}

        {/* ── Matrix Board ── */}
        {subjects.length > 0 && batches.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto pb-6">
              <div className="flex gap-4 min-w-max items-start">
                {/* Left subject panel — sticky on horizontal scroll */}
                <div className="sticky left-0 z-20 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80 rounded-xl">
                  <SubjectDndPanel subjects={subjects} />
                </div>

                {/* Columns */}
                {filteredColumns.map((col) => (
                  <DroppableColumn key={col.id} columnId={col.id}>
                    <ColumnCard
                      column={col}
                      allSubjects={subjects}
                      onAddSubjects={handleAddSubjects}
                      onRemoveSubject={handleRemoveSubject}
                      onCopyColumn={handleCopyColumn}
                      isAdding={createAllocation.isPending}
                      isRemoving={deleteAllocation.isPending}
                    />
                  </DroppableColumn>
                ))}

                {filteredColumns.length === 0 && (
                  <div className="flex h-48 w-64 shrink-0 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 text-center">
                    <Search className="h-6 w-6 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No columns match your search.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Drag overlay: floating subject card while dragging */}
            <DragOverlay>
              {activeDragSubject && (
                <div className="flex items-center gap-2.5 rounded-lg border border-primary bg-card px-3 py-2.5 shadow-xl ring-1 ring-primary/30 rotate-2 opacity-95 w-[190px]">
                  <div className={cn("h-2 w-2 shrink-0 rounded-full", subjectColor(
                    subjects.findIndex((s) => s.id === activeDragSubject.id)
                  ))} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">{activeDragSubject.name}</p>
                    {activeDragSubject.code && (
                      <p className="text-[10px] text-muted-foreground">{activeDragSubject.code}</p>
                    )}
                  </div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {/* ── Status Footer ── */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/80 px-5 py-3 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <strong className="text-foreground">{stats.totalMappings}</strong>&nbsp;Total Mappings
            </span>
            <span className="flex items-center gap-1.5">
              <Circle className="h-4 w-4 text-muted-foreground/50" />
              <strong className="text-foreground">{columns.length}</strong>&nbsp;Programs Configured
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Changes are saved automatically when you add or remove subjects.
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
