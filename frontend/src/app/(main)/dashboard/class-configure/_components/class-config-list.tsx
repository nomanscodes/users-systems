import type { ClassConfig } from "./types";
import { SectionCard } from "./section-card";
import { ClassConfigItem } from "./class-config-item";
import type { Group, Section, ClassEntity } from "@/features/academics/types/academics.dto";

interface ClassConfigListProps {
  orderedSelected: ClassEntity[];
  configs: Record<string, ClassConfig>;
  groups: Group[];
  sections: Section[];
  onUpdateConfig: (classId: string, patch: Partial<ClassConfig>) => void;
}

export function ClassConfigList({ 
  orderedSelected, 
  configs, 
  groups, 
  sections, 
  onUpdateConfig 
}: ClassConfigListProps) {
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
              key={cls.id}
              classId={cls.id}
              className={cls.name}
              config={configs[cls.id]}
              groups={groups}
              sections={sections}
              onUpdate={(patch) => onUpdateConfig(cls.id, patch)}
            />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
