import type { ClassConfig } from "./types";
import { GROUPS, SECTIONS } from "./constants";

export function defaultConfig(cls: string): ClassConfig {
  if (cls === "Class 9" || cls === "Class 10") {
    return {
      groupsOn: true,
      groups: ["Science", "Commerce"],
      sectionsOn: true,
      sections: ["Section A", "Section B"],
    };
  }
  return { groupsOn: false, groups: [], sectionsOn: false, sections: [] };
}

export function toggleArr<T>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function batchesFor(cfg: ClassConfig): number {
  const g = cfg.groupsOn && cfg.groups.length ? cfg.groups.length : 1;
  const s = cfg.sectionsOn && cfg.sections.length ? cfg.sections.length : 1;
  return g * s;
}

export function labelsFor(cls: string, cfg: ClassConfig): string[] {
  const groups =
    cfg.groupsOn && cfg.groups.length
      ? [...GROUPS].filter((g) => cfg.groups.includes(g))
      : [null];
  const sections =
    cfg.sectionsOn && cfg.sections.length
      ? [...SECTIONS].filter((s) => cfg.sections.includes(s))
      : [null];

  const out: string[] = [];
  for (const g of groups) {
    for (const s of sections) {
      out.push([cls, g, s].filter(Boolean).join(" – "));
    }
  }
  return out;
}
