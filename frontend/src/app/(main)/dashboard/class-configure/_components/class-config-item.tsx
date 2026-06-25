import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ClassConfig } from "./types";
import { GROUPS, SECTIONS } from "./constants";
import { batchesFor, toggleArr } from "./utils";
import { Pill } from "./pill";
import { ToggleSwitch } from "./toggle-switch";

interface ClassConfigItemProps {
  cls: string;
  config: ClassConfig;
  onUpdate: (patch: Partial<ClassConfig>) => void;
}

export function ClassConfigItem({ cls, config, onUpdate }: ClassConfigItemProps) {
  const batches = batchesFor(config);

  return (
    <div className="rounded-xl border border-border bg-background p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{cls}</h3>
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
            id={`groups-toggle-${cls}`}
            checked={config.groupsOn}
            onCheckedChange={(v) => onUpdate({ groupsOn: v })}
            label="This class has groups"
          />
        </div>
        {config.groupsOn ? (
          <div className="flex flex-wrap gap-2">
            {GROUPS.map((g) => (
              <Pill
                key={g}
                selected={config.groups.includes(g)}
                onClick={() => onUpdate({ groups: toggleArr(config.groups, g) })}
                showCheck
              >
                {g}
              </Pill>
            ))}
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
            id={`sections-toggle-${cls}`}
            checked={config.sectionsOn}
            onCheckedChange={(v) => onUpdate({ sectionsOn: v })}
            label="This class has sections"
          />
        </div>
        {config.sectionsOn ? (
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <Pill
                key={s}
                selected={config.sections.includes(s)}
                onClick={() => onUpdate({ sections: toggleArr(config.sections, s) })}
                showCheck
              >
                {s}
              </Pill>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No sections — 1 classroom per group</p>
        )}
      </div>
    </div>
  );
}
