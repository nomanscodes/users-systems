import { CLASSES } from "./constants";
import { Pill } from "./pill";
import { SectionCard } from "./section-card";

interface ClassSelectorProps {
  selectedClasses: string[];
  onToggle: (cls: string) => void;
}

export function ClassSelector({ selectedClasses, onToggle }: ClassSelectorProps) {
  return (
    <SectionCard step={2} title="Select Classes" hint="Pick which classes you want to set up">
      <div className="flex flex-wrap gap-2">
        {CLASSES.map((cls) => (
          <Pill key={cls} selected={selectedClasses.includes(cls)} onClick={() => onToggle(cls)} showCheck>
            {cls}
          </Pill>
        ))}
      </div>
    </SectionCard>
  );
}
