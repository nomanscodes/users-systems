"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { defaultConfig, labelsFor, toggleArr, payloadsFor } from "./_components/utils";
import type { ClassConfig } from "./_components/types";
import type { CreateBatchPayload } from "@/features/academics/types/academics.dto";

import { PageContainer } from "@/components/page-container";
import { BranchSessionSelector } from "./_components/branch-session-selector";
import { ClassSelector } from "./_components/class-selector";
import { ClassConfigList } from "./_components/class-config-list";
import { PreviewPanel } from "./_components/preview-panel";
import { GenerateButton } from "./_components/generate-button";

import { useBranches } from "@/features/academics/hooks/use-branches";
import { useSessions } from "@/features/academics/hooks/use-sessions";
import { useClasses } from "@/features/academics/hooks/use-classes";
import { useGroups } from "@/features/academics/hooks/use-groups";
import { useSections } from "@/features/academics/hooks/use-sections";
import { useCreateBatches } from "@/features/academics/hooks/use-batches";

export default function ClassConfigurePage() {
  // Fetch dynamic setup data concurrently
  const { data: branches = [], isLoading: loadingBranches } = useBranches();
  const { data: sessions = [], isLoading: loadingSessions } = useSessions();
  const { data: classes = [], isLoading: loadingClasses } = useClasses();
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const { data: sections = [], isLoading: loadingSections } = useSections();

  const isLoading = loadingBranches || loadingSessions || loadingClasses || loadingGroups || loadingSections;

  // Since we load async, let's keep track of selections by ID
  const [branchId, setBranchId] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [configs, setConfigs] = useState<Record<string, ClassConfig>>({});
  const [created, setCreated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const createBatches = useCreateBatches();

  // Default selection when data loads if nothing is selected yet
  if (!isLoading && branches.length > 0 && !branchId) setBranchId(branches[0].id);
  if (!isLoading && sessions.length > 0 && !sessionId) setSessionId(sessions[0].id);

  // Toggle a class on/off and lazily initialise its config
  const handleToggleClass = (classId: string) => {
    setSelectedClassIds((prev) => toggleArr(prev, classId));
    setConfigs((prev) => {
      if (prev[classId]) return prev;
      return { ...prev, [classId]: defaultConfig() };
    });
  };

  // Patch a single class config
  const handleUpdateConfig = (classId: string, patch: Partial<ClassConfig>) => {
    setConfigs((prev) => ({ ...prev, [classId]: { ...prev[classId], ...patch } }));
  };

  // Preserve ordering based on the API response order
  const orderedSelected = useMemo(() => {
    return classes.filter((c) => selectedClassIds.includes(c.id));
  }, [classes, selectedClassIds]);

  const allLabels = useMemo(() => {
    // Create maps for fast ID to Name lookups
    const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
    const groupMap = Object.fromEntries(groups.map(g => [g.id, g.name]));
    const sectionMap = Object.fromEntries(sections.map(s => [s.id, s.name]));

    const out: string[] = [];
    for (const cls of orderedSelected) {
      out.push(...labelsFor(cls.id, configs[cls.id] ?? defaultConfig(), classMap, groupMap, sectionMap));
    }
    return out;
  }, [orderedSelected, configs, classes, groups, sections]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCreated(false);
    
    // Gather all payloads across all selected classes
    const allPayloads: CreateBatchPayload[] = [];
    for (const cls of orderedSelected) {
      allPayloads.push(
        ...payloadsFor(branchId, sessionId, cls.id, configs[cls.id] ?? defaultConfig())
      );
    }
    
    try {
      // Fire ONE bulk request containing all combinations
      await createBatches.mutateAsync(allPayloads);
      setCreated(true);
    } catch (error) {
      console.error("Failed to generate some batches", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Loading configuration data...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Page header */}
      <div className="flex flex-col mb-8">
        <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
          <span>Academic Setup</span>
          <span className="mx-2 font-light">/</span>
          <span className="text-foreground/70">Class Configure</span>
        </div>
        <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
          Classroom Bulk Generator
        </h1>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-3xl">
          Configure each class and its respective groups and sections. We will automatically generate
          the correct batches for your selected branch and session.
        </p>
      </div>

      {/* Step 1 — Branch & Session */}
      <BranchSessionSelector
        branches={branches}
        sessions={sessions}
        branchId={branchId}
        sessionId={sessionId}
        onBranchChange={setBranchId}
        onSessionChange={setSessionId}
      />

      {/* Step 2 — Class selection */}
      <ClassSelector classes={classes} selectedClassIds={selectedClassIds} onToggle={handleToggleClass} />

      {/* Step 3 — Per-class configuration */}
      <ClassConfigList
        orderedSelected={orderedSelected}
        configs={configs}
        groups={groups}
        sections={sections}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Preview */}
      <PreviewPanel labels={allLabels} />

      {/* Generate / Success */}
      <GenerateButton
        count={allLabels.length}
        disabled={orderedSelected.length === 0 || !branchId || !sessionId}
        loading={isGenerating}
        created={created}
        onGenerate={handleGenerate}
      />
    </PageContainer>
  );
}
