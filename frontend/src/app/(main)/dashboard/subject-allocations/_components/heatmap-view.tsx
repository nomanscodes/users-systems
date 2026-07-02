"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Subject, ClassEntity, Group } from "@/features/academics/types/academics.dto";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HeatmapColumn {
  id: string;
  classEntity: ClassEntity;
  group: Group | null;
  allocationMap: Record<string, string>;
}

interface HeatmapViewProps {
  subjects: Subject[];
  columns: HeatmapColumn[];
}

// ─── SVG Donut Ring (column coverage indicator) ───────────────────────────────

function DonutRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const strokeW = 3.5;
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  const stroke =
    pct === 100
      ? "#10b981"
      : pct >= 75
      ? "#22c55e"
      : pct >= 50
      ? "#f59e0b"
      : pct > 0
      ? "#fb923c"
      : "#cbd5e1";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" style={{ display: "block" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={strokeW}
          className="stroke-border/30"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={strokeW}
          stroke={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums"
        style={{ color: stroke }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ─── Heatmap Tile (solid block — real heatmap style, no icons) ────────────────

interface TileProps {
  allocated: boolean;
  mandatory: boolean;
  isRowHovered: boolean;
  isColHovered: boolean;
  tooltip: string;
}

function HeatmapTile({ allocated, mandatory, isRowHovered, isColHovered, tooltip }: TileProps) {
  return (
    <div
      title={tooltip}
      className={cn(
        "relative h-7 w-full rounded-md transition-all duration-150 cursor-default select-none",
        allocated && mandatory
          ? "bg-emerald-500/80 shadow-sm shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/40"
          : allocated && !mandatory
          ? "bg-indigo-400/75 shadow-sm shadow-indigo-400/20 hover:bg-indigo-400 hover:shadow-indigo-400/40"
          : "border border-dashed border-border/40 bg-muted/20 hover:bg-muted/40",
        (isRowHovered || isColHovered) && !allocated && "bg-muted/35",
        "hover:scale-105 hover:z-10"
      )}
    />
  );
}

// ─── Mini row progress bar ────────────────────────────────────────────────────

function RowBar({ pct, count, total }: { pct: number; count: number; total: number }) {
  const color =
    pct === 100
      ? "bg-emerald-500"
      : pct >= 75
      ? "bg-green-400"
      : pct >= 50
      ? "bg-amber-400"
      : pct > 0
      ? "bg-orange-400"
      : "bg-muted-foreground/20";

  const textColor =
    pct === 100
      ? "text-emerald-500"
      : pct >= 75
      ? "text-green-500"
      : pct >= 50
      ? "text-amber-500"
      : "text-muted-foreground";

  return (
    <div className="flex flex-col items-end gap-0.5 pr-1">
      <span className={cn("text-[12px] font-bold tabular-nums leading-none", textColor)}>
        {pct}%
      </span>
      <div className="flex w-14 items-center gap-1">
        <div className="h-1.5 flex-1 rounded-full bg-border/40 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <span className="text-[9px] text-muted-foreground tabular-nums">
        {count}/{total}
      </span>
    </div>
  );
}

// ─── Main HeatmapView ─────────────────────────────────────────────────────────

export function HeatmapView({ subjects, columns }: HeatmapViewProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | "MANDATORY" | "OPTIONAL">("ALL");
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  const filteredSubjects = useMemo(
    () =>
      typeFilter === "ALL"
        ? subjects
        : subjects.filter((s) => s.type === typeFilter),
    [subjects, typeFilter]
  );

  const colStats = useMemo(
    () =>
      columns.map((col) => {
        const total = filteredSubjects.length;
        const allocated = filteredSubjects.filter((s) => col.allocationMap[s.id]).length;
        return {
          id: col.id,
          pct: total > 0 ? Math.round((allocated / total) * 100) : 0,
          allocated,
          total,
        };
      }),
    [columns, filteredSubjects]
  );

  const rowStats = useMemo(
    () =>
      filteredSubjects.map((s) => {
        const allocated = columns.filter((c) => c.allocationMap[s.id]).length;
        return {
          id: s.id,
          allocated,
          total: columns.length,
          pct: columns.length > 0 ? Math.round((allocated / columns.length) * 100) : 0,
        };
      }),
    [filteredSubjects, columns]
  );

  const overall = useMemo(() => {
    const total = filteredSubjects.length * columns.length;
    const allocated = filteredSubjects.reduce(
      (sum, s) => sum + columns.filter((c) => c.allocationMap[s.id]).length,
      0
    );
    return { pct: total > 0 ? Math.round((allocated / total) * 100) : 0, allocated, total };
  }, [filteredSubjects, columns]);

  // Summary stats
  const mandatoryCount = subjects.filter((s) => s.type === "MANDATORY").length;
  const optionalCount = subjects.filter((s) => s.type === "OPTIONAL").length;
  const fullyCoveredCols = colStats.filter((s) => s.pct === 100).length;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Top summary cards ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: "Overall Coverage",
            value: `${overall.pct}%`,
            sub: `${overall.allocated} of ${overall.total} cells`,
            accent:
              overall.pct === 100
                ? "border-emerald-400/50 bg-emerald-500/5 text-emerald-600"
                : overall.pct >= 75
                ? "border-green-400/40 bg-green-500/5 text-green-600"
                : overall.pct >= 50
                ? "border-amber-400/40 bg-amber-500/5 text-amber-600"
                : "border-border/50 bg-muted/30 text-muted-foreground",
          },
          {
            label: "Programs",
            value: columns.length,
            sub: `${fullyCoveredCols} fully covered`,
            accent: "border-border/50 bg-muted/20 text-foreground",
          },
          {
            label: "Mandatory Subjects",
            value: mandatoryCount,
            sub: `of ${subjects.length} total subjects`,
            accent: "border-primary/20 bg-primary/5 text-primary",
          },
          {
            label: "Optional Subjects",
            value: optionalCount,
            sub: `of ${subjects.length} total subjects`,
            accent: "border-indigo-400/30 bg-indigo-500/5 text-indigo-500",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={cn(
              "rounded-xl border px-4 py-3 transition-all",
              card.accent
            )}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold leading-none">{card.value}</p>
            <p className="mt-0.5 text-[11px] opacity-60">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter pills */}
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
          {(["ALL", "MANDATORY", "OPTIONAL"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setTypeFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12px] font-medium transition-all",
                typeFilter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "ALL" ? "All subjects" : f === "MANDATORY" ? "Mandatory only" : "Optional only"}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-emerald-500/80" />
            Mandatory · Allocated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-indigo-400/75" />
            Optional · Allocated
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm border border-dashed border-border/50 bg-muted/20" />
            Not yet assigned
          </span>
        </div>
      </div>

      {/* ── Heatmap table ── */}
      <div className="overflow-auto rounded-xl border border-border/50 bg-card shadow-xs">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Corner */}
              <th className="sticky left-0 z-30 min-w-[210px] border-b border-r border-border/40 bg-muted/60 px-4 py-4 text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Subject / Program →
                </span>
              </th>

              {/* Column headers with donut ring */}
              {columns.map((col, ci) => {
                const stat = colStats[ci];
                const isHighlighted = hoveredCol === col.id;
                return (
                  <th
                    key={col.id}
                    onMouseEnter={() => setHoveredCol(col.id)}
                    onMouseLeave={() => setHoveredCol(null)}
                    className={cn(
                      "min-w-[100px] border-b border-r border-border/40 px-2 py-3 text-center transition-colors duration-150",
                      isHighlighted ? "bg-primary/8" : "bg-muted/60"
                    )}
                  >
                    {/* Donut ring */}
                    <div className="flex justify-center mb-1.5">
                      <DonutRing pct={stat.pct} size={40} />
                    </div>
                    <p className="text-[11px] font-bold text-foreground truncate">
                      {col.classEntity.name}
                    </p>
                    {col.group ? (
                      <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold text-primary">
                        {col.group.name}
                      </span>
                    ) : (
                      <span className="mt-0.5 inline-block text-[9px] text-muted-foreground">
                        Common
                      </span>
                    )}
                    <p className="mt-1 text-[9px] text-muted-foreground tabular-nums">
                      {stat.allocated}/{stat.total}
                    </p>
                  </th>
                );
              })}

              {/* Row % header */}
              <th className="min-w-[80px] border-b border-border/40 bg-muted/60 px-3 py-4 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Coverage
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredSubjects.map((subject, si) => {
              const rStat = rowStats[si];
              const isRowHovered = hoveredRow === subject.id;

              return (
                <tr
                  key={subject.id}
                  onMouseEnter={() => setHoveredRow(subject.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    "transition-colors duration-100",
                    isRowHovered
                      ? "bg-primary/5"
                      : si % 2 === 0
                      ? "bg-background"
                      : "bg-muted/10"
                  )}
                >
                  {/* Subject label — sticky */}
                  <td className="sticky left-0 z-10 border-r border-border/40 bg-inherit px-4 py-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "h-6 w-1 shrink-0 rounded-full",
                          subject.type === "MANDATORY"
                            ? "bg-emerald-500"
                            : "bg-indigo-400"
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-foreground leading-tight">
                          {subject.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {subject.code && (
                            <span className="text-[10px] text-muted-foreground">
                              {subject.code}
                            </span>
                          )}
                          <span
                            className={cn(
                              "rounded px-1 py-px text-[8px] font-bold uppercase tracking-wide",
                              subject.type === "MANDATORY"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-indigo-500/10 text-indigo-500"
                            )}
                          >
                            {subject.type === "MANDATORY" ? "Mandatory" : "Optional"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Tiles */}
                  {columns.map((col) => {
                    const allocated = Boolean(col.allocationMap[subject.id]);
                    const isColHovered = hoveredCol === col.id;
                    const tooltip = `${subject.name} → ${col.classEntity.name}${col.group ? ` · ${col.group.name}` : ""}: ${allocated ? "Allocated ✓" : "Not assigned"}`;

                    return (
                      <td
                        key={col.id}
                        className={cn(
                          "border-r border-border/30 px-2 py-2 transition-colors duration-100",
                          isColHovered && !isRowHovered && "bg-primary/5"
                        )}
                      >
                        <HeatmapTile
                          allocated={allocated}
                          mandatory={subject.type === "MANDATORY"}
                          isRowHovered={isRowHovered}
                          isColHovered={isColHovered}
                          tooltip={tooltip}
                        />
                      </td>
                    );
                  })}

                  {/* Row coverage bar */}
                  <td className="px-2 py-2">
                    <RowBar
                      pct={rStat.pct}
                      count={rStat.allocated}
                      total={rStat.total}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ── Footer summary row ── */}
          <tfoot>
            <tr className="border-t border-border/50 bg-muted/40">
              <td className="sticky left-0 z-10 bg-muted/40 px-4 py-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Column total
                </span>
              </td>
              {colStats.map((stat) => (
                <td key={stat.id} className="border-r border-border/30 px-2 py-2 text-center">
                  <span
                    className={cn(
                      "text-[11px] font-bold tabular-nums",
                      stat.pct === 100
                        ? "text-emerald-500"
                        : stat.pct >= 50
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {stat.allocated}/{stat.total}
                  </span>
                </td>
              ))}
              <td className="px-3 py-2 text-right">
                <span
                  className={cn(
                    "text-[12px] font-bold tabular-nums",
                    overall.pct === 100
                      ? "text-emerald-500"
                      : overall.pct >= 50
                      ? "text-amber-500"
                      : "text-muted-foreground"
                  )}
                >
                  {overall.pct}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>

        {filteredSubjects.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No subjects match the filter.
          </p>
        )}
      </div>
    </div>
  );
}
