import { BRANCHES, SESSIONS } from "./constants";
import { Pill } from "./pill";
import { SectionCard } from "./section-card";

interface BranchSessionSelectorProps {
  branch: string;
  session: string;
  onBranchChange: (b: string) => void;
  onSessionChange: (s: string) => void;
}

export function BranchSessionSelector({
  branch,
  session,
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
            {BRANCHES.map((b) => (
              <Pill key={b} selected={branch === b} onClick={() => onBranchChange(b)}>
                {b}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Session
          </p>
          <div className="flex flex-wrap gap-2">
            {SESSIONS.map((s) => (
              <Pill key={s} selected={session === s} onClick={() => onSessionChange(s)}>
                {s}
              </Pill>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
