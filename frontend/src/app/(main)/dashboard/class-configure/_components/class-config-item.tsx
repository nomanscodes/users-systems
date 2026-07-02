"use client";

import { GraduationCap, MoreVertical, Plus, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { ClassConfig } from "./types";
import { batchesFor, toggleArr, toggleGroup, toggleSectionForGroup } from "./utils";
import type { Group, Section } from "@/features/academics/types/academics.dto";

interface ClassConfigItemProps {
  classId: string;
  className: string;
  config: ClassConfig;
  groups: Group[];
  sections: Section[];
  onUpdate: (patch: Partial<ClassConfig> | ClassConfig) => void;
  onRemove: () => void;
}

export function ClassConfigItem({
  classId,
  className,
  config,
  groups,
  sections,
  onUpdate,
  onRemove,
}: ClassConfigItemProps) {
  const batches = batchesFor(config);

  return (
    <div className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden">
      {/* ── Column Header ── */}
      <div className="flex items-start justify-between gap-2 border-b border-border/40 bg-muted/30 px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
            <p className="truncate text-[13px] font-semibold text-foreground">{className}</p>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {batches} classroom{batches !== 1 ? "s" : ""} will be generated
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Groups Toggle ── */}
      <div className="border-b border-border/40 px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] font-medium text-foreground">Has Groups?</span>
          </div>
          <Switch
            checked={config.groupsOn}
            onCheckedChange={(v) =>
              onUpdate({ ...config, groupsOn: v, groups: v ? config.groups : [] })
            }
          />
        </div>
        {!config.groupsOn && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Single stream — configure sections below.
          </p>
        )}
      </div>

      {/* ── No-Group Sections (when groupsOn = false) ── */}
      {!config.groupsOn && (
        <div className="px-3.5 py-3 space-y-2 border-b border-border/40">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Sections
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s) => {
              const active = config.noGroupSectionIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() =>
                    onUpdate({
                      ...config,
                      noGroupSectionIds: toggleArr(config.noGroupSectionIds, s.id),
                    })
                  }
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {s.name}
                </button>
              );
            })}
            {sections.length === 0 && (
              <p className="text-[11px] text-muted-foreground">No sections found.</p>
            )}
          </div>
          {sections.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {config.noGroupSectionIds.length === 0
                ? "No sections selected — 1 classroom"
                : `${config.noGroupSectionIds.length} section(s) selected`}
            </p>
          )}
        </div>
      )}

      {/* ── Groups + Per-Group Sections (when groupsOn = true) ── */}
      {config.groupsOn && (
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
          {groups.length === 0 && (
            <p className="py-4 text-center text-[12px] text-muted-foreground">
              No groups found. Add groups in Academic Setup first.
            </p>
          )}
          {groups.map((g) => {
            const groupCfg = config.groups.find((gc) => gc.groupId === g.id);
            const isOn = Boolean(groupCfg);

            return (
              <div
                key={g.id}
                className={cn(
                  "rounded-lg border p-2.5 transition-all",
                  isOn
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/50 bg-background opacity-60"
                )}
              >
                {/* Group row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isOn}
                      onCheckedChange={() => onUpdate(toggleGroup(config, g.id))}
                    />
                    <span className="text-[12px] font-semibold text-foreground">{g.name}</span>
                  </div>
                  {isOn && (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
                      {groupCfg!.sectionIds.length > 0
                        ? `${groupCfg!.sectionIds.length} sections`
                        : "1 classroom"}
                    </Badge>
                  )}
                </div>

                {/* Per-group section picker */}
                {isOn && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Sections for {g.name}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {sections.map((s) => {
                        const sActive = groupCfg!.sectionIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() =>
                              onUpdate(toggleSectionForGroup(config, g.id, s.id))
                            }
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[11px] font-medium transition-all",
                              sActive
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 bg-card text-muted-foreground hover:border-primary/40"
                            )}
                          >
                            {s.name}
                          </button>
                        );
                      })}
                      {sections.length === 0 && (
                        <span className="text-[10px] text-muted-foreground">No sections.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
