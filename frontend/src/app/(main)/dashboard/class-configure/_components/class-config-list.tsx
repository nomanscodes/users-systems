import type { ClassConfig } from "./types";
import { SectionCard } from "./section-card";
import { ClassConfigItem } from "./class-config-item";

interface ClassConfigListProps {
  orderedSelected: string[];
  configs: Record<string, ClassConfig>;
  onUpdateConfig: (cls: string, patch: Partial<ClassConfig>) => void;
}

export function ClassConfigList({ orderedSelected, configs, onUpdateConfig }: ClassConfigListProps) {
  return (
    <SectionCard
      step={3}
      title="Configure Each Selected Class"
      hint="Each class can have different groups and sections — or none at all"
    >
      {orderedSelected.length === 0 ? (
        <p className="text-sm text-muted-foreground">Select a class above to configure it.</p>
      ) : (
        <div className="space-y-3">
          {orderedSelected.map((cls) => (
            <ClassConfigItem
              key={cls}
              cls={cls}
              config={configs[cls]}
              onUpdate={(patch) => onUpdateConfig(cls, patch)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
