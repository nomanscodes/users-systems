"use client";

import { useMemo, useState } from "react";

import { CLASSES } from "./_components/constants";
import { defaultConfig, labelsFor, toggleArr } from "./_components/utils";
import type { ClassConfig } from "./_components/types";

import { BranchSessionSelector } from "./_components/branch-session-selector";
import { ClassSelector } from "./_components/class-selector";
import { ClassConfigList } from "./_components/class-config-list";
import { PreviewPanel } from "./_components/preview-panel";
import { GenerateButton } from "./_components/generate-button";

export default function ClassConfigurePage() {
  const [branch, setBranch] = useState("Main Campus");
  const [session, setSession] = useState("2026–2027");

  const [selectedClasses, setSelectedClasses] = useState<string[]>([
    "Class 1",
    "Class 9",
    "Class 10",
  ]);

  const [configs, setConfigs] = useState<Record<string, ClassConfig>>({
    "Class 1": defaultConfig("Class 1"),
    "Class 9": defaultConfig("Class 9"),
    "Class 10": defaultConfig("Class 10"),
  });

  const [created, setCreated] = useState(false);

  // Toggle a class on/off and lazily initialise its config
  const handleToggleClass = (cls: string) => {
    setSelectedClasses((prev) => toggleArr(prev, cls));
    setConfigs((prev) => {
      if (prev[cls]) return prev;
      return { ...prev, [cls]: defaultConfig(cls) };
    });
  };

  // Patch a single class config
  const handleUpdateConfig = (cls: string, patch: Partial<ClassConfig>) => {
    setConfigs((prev) => ({ ...prev, [cls]: { ...prev[cls], ...patch } }));
  };

  // Preserve CLASSES ordering
  const orderedSelected = CLASSES.filter((c) => selectedClasses.includes(c));

  const allLabels = useMemo(() => {
    const out: string[] = [];
    for (const cls of orderedSelected) {
      out.push(...labelsFor(cls, configs[cls] ?? defaultConfig(cls)));
    }
    return out;
  }, [orderedSelected, configs]);

  return (
    <div className="mx-auto max-w-[800px] space-y-6 py-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Classroom Bulk Generator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure each class — we'll create all classrooms automatically.
        </p>
      </div>

      {/* Step 1 — Branch & Session */}
      <BranchSessionSelector
        branch={branch}
        session={session}
        onBranchChange={setBranch}
        onSessionChange={setSession}
      />

      {/* Step 2 — Class selection */}
      <ClassSelector selectedClasses={selectedClasses} onToggle={handleToggleClass} />

      {/* Step 3 — Per-class configuration */}
      <ClassConfigList
        orderedSelected={orderedSelected}
        configs={configs}
        onUpdateConfig={handleUpdateConfig}
      />

      {/* Preview */}
      <PreviewPanel labels={allLabels} />

      {/* Generate / Success */}
      <GenerateButton
        count={allLabels.length}
        disabled={orderedSelected.length === 0}
        created={created}
        onGenerate={() => setCreated(true)}
      />
    </div>
  );
}
