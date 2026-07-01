import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
  step: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function SectionCard({ step, title, hint, children }: SectionCardProps) {
  return (
    <div className="overflow-hidden rounded-[0.6rem] border border-border/50 bg-card shadow-xs mb-8">
      <div className="border-b border-border/50 px-6 py-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">
          {step}. {title}
        </h2>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
