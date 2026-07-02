"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Search, GripVertical, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Subject } from "@/features/academics/types/academics.dto";

// ─── Draggable Subject Item ──────────────────────────────────────────────────

const DOT_COLORS = [
  "bg-blue-500","bg-green-500","bg-orange-500","bg-purple-500",
  "bg-red-500","bg-teal-500","bg-cyan-500","bg-lime-500",
  "bg-pink-500","bg-indigo-500","bg-yellow-500","bg-violet-500",
  "bg-amber-500","bg-rose-500","bg-sky-500","bg-emerald-500",
];

export function subjectColor(index: number) {
  return DOT_COLORS[index % DOT_COLORS.length];
}

function DraggableSubjectItem({
  subject,
  index,
}: {
  subject: Subject;
  index: number;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `subject::${subject.id}`,
    data: { type: "subject", subjectId: subject.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-border/50 bg-card px-3 py-2.5 transition-all select-none",
        isDragging
          ? "opacity-40 shadow-lg scale-95"
          : "hover:border-primary/40 hover:shadow-sm cursor-grab active:cursor-grabbing"
      )}
    >
      {/* Drag handle */}
      <span
        {...listeners}
        className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </span>

      <div className={cn("h-2 w-2 shrink-0 rounded-full", subjectColor(index))} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground leading-none">
          {subject.name}
        </p>
        {subject.code && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{subject.code}</p>
        )}
      </div>

      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
          subject.type === "MANDATORY"
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {subject.type === "MANDATORY" ? "M" : "O"}
      </span>
    </div>
  );
}

// ─── Panel ───────────────────────────────────────────────────────────────────

interface SubjectDndPanelProps {
  subjects: Subject[];
}

export function SubjectDndPanel({ subjects }: SubjectDndPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "MANDATORY" | "OPTIONAL">("ALL");

  const filtered = subjects.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? "").toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "ALL" || s.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="flex w-[200px] shrink-0 flex-col rounded-xl border border-border/50 bg-card shadow-xs overflow-hidden h-full">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/30 px-3.5 py-3">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground">
          Subjects
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Drag to assign to a class
        </p>
      </div>

      {/* Search */}
      <div className="p-2.5 border-b border-border/40 space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs bg-background"
          />
        </div>
        {/* Filter pills */}
        <div className="flex gap-1">
          {(["ALL", "MANDATORY", "OPTIONAL"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 rounded-md px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide transition-colors",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {f === "MANDATORY" ? "Mand." : f === "OPTIONAL" ? "Opt." : "All"}
            </button>
          ))}
        </div>
      </div>

      {/* Count badge */}
      <div className="px-3 pt-2 pb-1">
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {filtered.length} / {subjects.length}
        </Badge>
      </div>

      {/* Subject list */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-[11px] text-muted-foreground">
            No subjects found.
          </p>
        ) : (
          filtered.map((s) => (
            <DraggableSubjectItem
              key={s.id}
              subject={s}
              index={subjects.findIndex((x) => x.id === s.id)}
            />
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="border-t border-border/40 px-3 py-2">
        <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Drag a subject into any class column to allocate it
        </p>
      </div>
    </div>
  );
}
