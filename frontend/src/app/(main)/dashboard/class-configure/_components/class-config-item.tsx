import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ClassConfig } from "./types";
import { batchesFor, toggleArr } from "./utils";
import { Pill } from "./pill";
import { ToggleSwitch } from "./toggle-switch";
import type { Group, Section } from "@/features/academics/types/academics.dto";

interface ClassConfigItemProps {
  classId: string;
  className: string;
  config: ClassConfig;
  groups: Group[];
  sections: Section[];
  onUpdate: (patch: Partial<ClassConfig>) => void;
}

export function ClassConfigItem({
  classId,
  className,
  config,
  groups,
  sections,
  onUpdate,
}: ClassConfigItemProps) {
  const batches = batchesFor(config);

  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{className}</h3>
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary text-xs font-semibold"
        >
          {batches} batch{batches === 1 ? "" : "es"}
        </Badge>
      </div>

      {/* Groups section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Groups / Streams
          </span>
          <ToggleSwitch
            id={`groups-toggle-${classId}`}
            checked={config.groupsOn}
            onCheckedChange={(v) => onUpdate({ groupsOn: v })}
            label="This class has groups"
          />
        </div>
        {config.groupsOn ? (
          <div className="flex flex-wrap gap-2">
            {groups.map((g) => (
              <Pill
                key={g.id}
                selected={config.groupIds.includes(g.id)}
                onClick={() => onUpdate({ groupIds: toggleArr(config.groupIds, g.id) })}
                showCheck
              >
                {g.name}
              </Pill>
            ))}
            {groups.length === 0 && <span className="text-sm text-muted-foreground">No groups found.</span>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No groups — 1 classroom per section</p>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Sections section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Sections
          </span>
          <ToggleSwitch
            id={`sections-toggle-${classId}`}
            checked={config.sectionsOn}
            onCheckedChange={(v) => onUpdate({ sectionsOn: v })}
            label="This class has sections"
          />
        </div>
        {config.sectionsOn ? (
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <Pill
                key={s.id}
                selected={config.sectionIds.includes(s.id)}
                onClick={() => onUpdate({ sectionIds: toggleArr(config.sectionIds, s.id) })}
                showCheck
              >
                {s.name}
              </Pill>
            ))}
            {sections.length === 0 && <span className="text-sm text-muted-foreground">No sections found.</span>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No sections — 1 classroom per group</p>
        )}
      </div>
    </div>
  );
}
