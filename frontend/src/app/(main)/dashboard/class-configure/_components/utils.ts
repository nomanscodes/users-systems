import type { ClassConfig, GroupConfig } from "./types";
import type { CreateBatchPayload } from "@/features/academics/types/academics.dto";

export function defaultConfig(): ClassConfig {
  return { groupsOn: false, groups: [], noGroupSectionIds: [] };
}

export function toggleArr<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

/** Total batch count that will be generated for one class. */
export function batchesFor(cfg: ClassConfig): number {
  if (!cfg.groupsOn) {
    // No groups: either 1 batch (no sections) or N batches (N sections)
    return cfg.noGroupSectionIds.length > 0 ? cfg.noGroupSectionIds.length : 1;
  }
  if (cfg.groups.length === 0) return 0;

  // Each group contributes its own section count (min 1 — the unsectioned classroom)
  return cfg.groups.reduce((total, g) => {
    return total + (g.sectionIds.length > 0 ? g.sectionIds.length : 1);
  }, 0);
}

/** Human-readable labels for the preview panel. */
export function labelsFor(
  classId: string,
  cfg: ClassConfig,
  classMap: Record<string, string>,
  groupMap: Record<string, string>,
  sectionMap: Record<string, string>
): string[] {
  const clsName = classMap[classId] || "Unknown Class";
  const out: string[] = [];

  if (!cfg.groupsOn) {
    // No groups
    if (cfg.noGroupSectionIds.length === 0) {
      out.push(clsName);
    } else {
      for (const sid of cfg.noGroupSectionIds) {
        out.push([clsName, sectionMap[sid]].filter(Boolean).join(" – "));
      }
    }
    return out;
  }

  // Groups enabled
  for (const g of cfg.groups) {
    const gName = groupMap[g.groupId];
    if (g.sectionIds.length === 0) {
      out.push([clsName, gName].filter(Boolean).join(" – "));
    } else {
      for (const sid of g.sectionIds) {
        out.push([clsName, gName, sectionMap[sid]].filter(Boolean).join(" – "));
      }
    }
  }
  return out;
}

/** Build the actual CreateBatchPayload array to send to the backend. */
export function payloadsFor(
  branchId: string,
  sessionId: string,
  classId: string,
  cfg: ClassConfig
): CreateBatchPayload[] {
  const out: CreateBatchPayload[] = [];

  if (!cfg.groupsOn) {
    if (cfg.noGroupSectionIds.length === 0) {
      out.push({ branchId, sessionId, classId });
    } else {
      for (const sectionId of cfg.noGroupSectionIds) {
        out.push({ branchId, sessionId, classId, sectionId });
      }
    }
    return out;
  }

  // Each group independently carries its own sections
  for (const g of cfg.groups) {
    if (g.sectionIds.length === 0) {
      out.push({ branchId, sessionId, classId, groupId: g.groupId });
    } else {
      for (const sectionId of g.sectionIds) {
        out.push({ branchId, sessionId, classId, groupId: g.groupId, sectionId });
      }
    }
  }
  return out;
}

/** Toggle a group on/off within a ClassConfig — preserves existing section config. */
export function toggleGroup(cfg: ClassConfig, groupId: string): ClassConfig {
  const exists = cfg.groups.find((g) => g.groupId === groupId);
  if (exists) {
    return { ...cfg, groups: cfg.groups.filter((g) => g.groupId !== groupId) };
  }
  return { ...cfg, groups: [...cfg.groups, { groupId, sectionIds: [] }] };
}

/** Toggle a section for a specific group within a ClassConfig. */
export function toggleSectionForGroup(
  cfg: ClassConfig,
  groupId: string,
  sectionId: string
): ClassConfig {
  return {
    ...cfg,
    groups: cfg.groups.map((g) =>
      g.groupId !== groupId
        ? g
        : { ...g, sectionIds: toggleArr(g.sectionIds, sectionId) }
    ),
  };
}

/**
 * Rebuild a ClassConfig from existing batches loaded from the DB.
 * Used to pre-populate the UI on page load.
 */
export function configFromBatches(
  batches: Array<{ groupId: string | null; sectionId: string | null }>
): ClassConfig {
  const hasGroups = batches.some((b) => b.groupId !== null);

  if (!hasGroups) {
    // No groups — collect sections
    const sectionIds = batches
      .map((b) => b.sectionId)
      .filter((s): s is string => s !== null);
    return { groupsOn: false, groups: [], noGroupSectionIds: sectionIds };
  }

  // Rebuild per-group configs
  const groupMap = new Map<string, GroupConfig>();
  for (const b of batches) {
    if (!b.groupId) continue;
    if (!groupMap.has(b.groupId)) {
      groupMap.set(b.groupId, { groupId: b.groupId, sectionIds: [] });
    }
    if (b.sectionId) {
      groupMap.get(b.groupId)!.sectionIds.push(b.sectionId);
    }
  }

  return {
    groupsOn: true,
    groups: Array.from(groupMap.values()),
    noGroupSectionIds: [],
  };
}
