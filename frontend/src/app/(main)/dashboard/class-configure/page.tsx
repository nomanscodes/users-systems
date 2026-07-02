"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { configFromBatches, defaultConfig, labelsFor, payloadsFor } from "./_components/utils";
import type { ClassConfig } from "./_components/types";
import type { CreateBatchPayload } from "@/features/academics/types/academics.dto";

import { PageContainer } from "@/components/page-container";
import { ClassConfigItem } from "./_components/class-config-item";
import { Toaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { useBranches } from "@/features/academics/hooks/use-branches";
import { useSessions } from "@/features/academics/hooks/use-sessions";
import { useClasses } from "@/features/academics/hooks/use-classes";
import { useGroups } from "@/features/academics/hooks/use-groups";
import { useSections } from "@/features/academics/hooks/use-sections";
import { useBatches, useSyncBatches } from "@/features/academics/hooks/use-batches";

export default function ClassConfigurePage() {
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const { data: classes = [], isLoading: isLoadingClasses } = useClasses();
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups();
  const { data: sections = [], isLoading: isLoadingSections } = useSections();
  const { data: existingBatches, isLoading: isLoadingBatches } = useBatches();

  const isLoading =
    isLoadingBranches || isLoadingSessions || isLoadingClasses ||
    isLoadingGroups || isLoadingSections || isLoadingBatches;

  const [branchId, setBranchId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, ClassConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const syncBatches = useSyncBatches();

  // Auto-select first branch/session
  if (!isLoading && branches.length > 0 && !branchId) setBranchId(branches[0].id);
  if (!isLoading && sessions.length > 0 && !sessionId) setSessionId(sessions[0].id);

  // Pre-load from DB
  useEffect(() => {
    if (isLoadingBatches || !existingBatches) return;
    if (!branchId || !sessionId || existingBatches.length === 0) return;

    const active = existingBatches.filter(
      (b) => b.branchId === branchId && b.sessionId === sessionId
    );
    const classIds = Array.from(new Set(active.map((b) => b.classId)));
    setSelectedClassIds(classIds);

    const newConfigs: Record<string, ClassConfig> = {};
    for (const cid of classIds) {
      const clsBatches = active.filter((b) => b.classId === cid);
      newConfigs[cid] = configFromBatches(clsBatches);
    }

    setSelectedClassIds((prev) => {
      const same = prev.length === classIds.length && prev.every((v, i) => v === classIds[i]);
      return same ? prev : classIds;
    });
    setConfigs((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(newConfigs);
      return same ? prev : newConfigs;
    });
  }, [branchId, sessionId, existingBatches, isLoadingBatches]);

  const orderedSelected = useMemo(
    () => classes.filter((c) => selectedClassIds.includes(c.id)),
    [classes, selectedClassIds]
  );

  const maps = useMemo(() => ({
    classMap: Object.fromEntries(classes.map((c) => [c.id, c.name])),
    groupMap: Object.fromEntries(groups.map((g) => [g.id, g.name])),
    sectionMap: Object.fromEntries(sections.map((s) => [s.id, s.name])),
  }), [classes, groups, sections]);

  const allLabels = useMemo(() => {
    const out: string[] = [];
    for (const cls of orderedSelected) {
      out.push(...labelsFor(cls.id, configs[cls.id] ?? defaultConfig(), maps.classMap, maps.groupMap, maps.sectionMap));
    }
    return out;
  }, [orderedSelected, configs, maps]);

  const handleAddClass = (classId: string) => {
    if (selectedClassIds.includes(classId)) return;
    setSelectedClassIds((prev) => [...prev, classId]);
    setConfigs((prev) => ({ ...prev, [classId]: defaultConfig() }));
  };

  const handleRemoveClass = (classId: string) => {
    setSelectedClassIds((prev) => prev.filter((id) => id !== classId));
  };

  const handleUpdateConfig = (classId: string, cfg: Partial<ClassConfig> | ClassConfig) => {
    setConfigs((prev) => ({ ...prev, [classId]: { ...(prev[classId] ?? defaultConfig()), ...cfg } as ClassConfig }));
  };

  const handleSave = async () => {
    if (!branchId || !sessionId) {
      toast.error("Select a branch and session first.");
      return;
    }
    setIsSaving(true);
    const allPayloads: CreateBatchPayload[] = [];
    for (const cls of orderedSelected) {
      allPayloads.push(...payloadsFor(branchId, sessionId, cls.id, configs[cls.id] ?? defaultConfig()));
    }
    try {
      await syncBatches.mutateAsync({ branchId, sessionId, batches: allPayloads });
      toast.success("Classrooms synchronized successfully!", {
        description: `${allLabels.length} classroom${allLabels.length !== 1 ? "s" : ""} configured.`,
      });
    } catch {
      // handled by hook
    } finally {
      setIsSaving(false);
    }
  };

  const availableClasses = classes.filter(
    (c) =>
      !selectedClassIds.includes(c.id) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col mb-2">
            <Skeleton className="h-3 w-48 mb-3" />
            <Skeleton className="h-9 w-72 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 w-[280px] rounded-xl" />)}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Toaster position="top-right" richColors />
      <div className="flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex flex-col mb-2">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
            <span>Academic Setup</span>
            <span className="mx-2 font-light">/</span>
            <span className="text-foreground/70">Class Configure</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
                Classroom Configuration
              </h1>
              <p className="mt-1.5 text-[15px] text-muted-foreground max-w-2xl">
                Configure each class with its groups and per-group sections. Each column represents one class — groups and sections are configured independently.
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving || orderedSelected.length === 0} className="shrink-0 gap-2">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Configuration
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Branch", value: branches.find((b) => b.id === branchId)?.name ?? "—", icon: Building2, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Session", value: sessions.find((s) => s.id === sessionId)?.name ?? "—", icon: CalendarDays, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Classes Configured", value: orderedSelected.length, icon: GraduationCap, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Total Classrooms", value: allLabels.length, icon: Layers, color: "text-orange-500", bg: "bg-orange-500/10" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-xl font-bold text-foreground truncate">{stat.value}</p>
                </div>
                <div className={cn("rounded-lg p-2 shrink-0", stat.bg)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Scope Selectors ── */}
        <div className="grid grid-cols-2 gap-4">
          {/* Branch picker */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> Branch
            </p>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBranchId(b.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all",
                    branchId === b.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {b.name}
                </button>
              ))}
              {branches.length === 0 && <p className="text-sm text-muted-foreground">No branches found.</p>}
            </div>
          </div>

          {/* Session picker */}
          <div className="rounded-xl border border-border/50 bg-card p-4 shadow-xs">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Session
            </p>
            <div className="flex flex-wrap gap-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSessionId(s.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-all",
                    sessionId === s.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {s.name}
                </button>
              ))}
              {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions found.</p>}
            </div>
          </div>
        </div>

        {/* ── Add Class bar ── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search classes to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 bg-background"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {availableClasses.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleAddClass(c.id)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5" />
                {c.name}
              </button>
            ))}
            {availableClasses.length === 0 && selectedClassIds.length > 0 && (
              <p className="text-[12px] text-muted-foreground self-center">All classes added.</p>
            )}
          </div>
        </div>

        {/* ── Kanban Board ── */}
        {orderedSelected.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/20 py-24 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No classes added yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Click a class above to add it as a column and configure its groups and sections.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {orderedSelected.map((cls) => (
                <ClassConfigItem
                  key={cls.id}
                  classId={cls.id}
                  className={cls.name}
                  config={configs[cls.id] ?? defaultConfig()}
                  groups={groups}
                  sections={sections}
                  onUpdate={(cfg) => handleUpdateConfig(cls.id, cfg)}
                  onRemove={() => handleRemoveClass(cls.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Preview ── */}
        {allLabels.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
            <div className="border-b border-border/40 bg-muted/30 px-5 py-3 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-foreground">Preview — Classrooms to be Generated</p>
              <Badge variant="secondary" className="text-[11px]">
                {allLabels.length} classroom{allLabels.length !== 1 ? "s" : ""}
              </Badge>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {allLabels.map((label) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-[12px] text-muted-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-background/80 px-5 py-3 backdrop-blur shadow-sm supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-primary" />
              <strong className="text-foreground">{orderedSelected.length}</strong>&nbsp;classes
            </span>
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-green-500" />
              <strong className="text-foreground">{allLabels.length}</strong>&nbsp;classrooms
            </span>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || orderedSelected.length === 0 || !branchId || !sessionId}
            className="gap-2"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
