import { Pill } from "./pill";
import { SectionCard } from "./section-card";
import type { ClassEntity } from "@/features/academics/types/academics.dto";

interface ClassSelectorProps {
  classes: ClassEntity[];
  selectedClassIds: string[];
  onToggle: (id: string) => void;
}

export function ClassSelector({ classes, selectedClassIds, onToggle }: ClassSelectorProps) {
  return (
    <SectionCard step={2} title="Select Classes" hint="Pick which classes you want to set up">
      <div className="flex flex-wrap gap-2">
        {classes.map((cls) => (
          <Pill key={cls.id} selected={selectedClassIds.includes(cls.id)} onClick={() => onToggle(cls.id)} showCheck>
            {cls.name}
          </Pill>
        ))}
        {classes.length === 0 && <span className="text-sm text-muted-foreground">No classes found.</span>}
      </div>
    </SectionCard>
  );
}
