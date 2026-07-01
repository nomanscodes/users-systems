import { Pill } from "./pill";
import { SectionCard } from "./section-card";
import type { Branch, AcademicSession } from "@/features/academics/types/academics.dto";

interface BranchSessionSelectorProps {
  branches: Branch[];
  sessions: AcademicSession[];
  branchId: string;
  sessionId: string;
  onBranchChange: (id: string) => void;
  onSessionChange: (id: string) => void;
}

export function BranchSessionSelector({
  branches,
  sessions,
  branchId,
  sessionId,
  onBranchChange,
  onSessionChange,
}: BranchSessionSelectorProps) {
  return (
    <SectionCard step={1} title="Select Branch & Session">
      <div className="flex flex-wrap gap-8">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Branch
          </p>
          <div className="flex flex-wrap gap-2">
            {branches.map((b) => (
              <Pill key={b.id} selected={branchId === b.id} onClick={() => onBranchChange(b.id)}>
                {b.name}
              </Pill>
            ))}
            {branches.length === 0 && <span className="text-sm text-muted-foreground">No branches found.</span>}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Session
          </p>
          <div className="flex flex-wrap gap-2">
            {sessions.map((s) => (
              <Pill key={s.id} selected={sessionId === s.id} onClick={() => onSessionChange(s.id)}>
                {s.name}
              </Pill>
            ))}
            {sessions.length === 0 && <span className="text-sm text-muted-foreground">No sessions found.</span>}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
