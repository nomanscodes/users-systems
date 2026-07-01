import type { ClassConfig } from "./types";
import type { CreateBatchPayload } from "@/features/academics/types/academics.dto";

export function defaultConfig(): ClassConfig {
  // By default, groups and sections are off. Users can toggle them on.
  return { groupsOn: false, groupIds: [], sectionsOn: false, sectionIds: [] };
}

export function toggleArr<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function batchesFor(cfg: ClassConfig): number {
  const g = cfg.groupsOn && cfg.groupIds.length ? cfg.groupIds.length : 1;
  const s = cfg.sectionsOn && cfg.sectionIds.length ? cfg.sectionIds.length : 1;
  return g * s;
}

export function labelsFor(
  classId: string,
  cfg: ClassConfig,
  classMap: Record<string, string>,
  groupMap: Record<string, string>,
  sectionMap: Record<string, string>
): string[] {
  const clsName = classMap[classId] || "Unknown Class";

  const groupNames =
    cfg.groupsOn && cfg.groupIds.length
      ? cfg.groupIds.map((id) => groupMap[id]).filter(Boolean)
      : [null];
      
  const sectionNames =
    cfg.sectionsOn && cfg.sectionIds.length
      ? cfg.sectionIds.map((id) => sectionMap[id]).filter(Boolean)
      : [null];

  const out: string[] = [];
  for (const g of groupNames) {
    for (const s of sectionNames) {
      out.push([clsName, g, s].filter(Boolean).join(" – "));
    }
  }
  return out;
}

export function payloadsFor(
  branchId: string,
  sessionId: string,
  classId: string,
  cfg: ClassConfig
): CreateBatchPayload[] {
  const groupIds = cfg.groupsOn && cfg.groupIds.length ? cfg.groupIds : [undefined];
  const sectionIds = cfg.sectionsOn && cfg.sectionIds.length ? cfg.sectionIds : [undefined];

  const out: CreateBatchPayload[] = [];
  for (const g of groupIds) {
    for (const s of sectionIds) {
      out.push({
        branchId,
        sessionId,
        classId,
        groupId: g,
        sectionId: s,
      });
    }
  }
  return out;
}
