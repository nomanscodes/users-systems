import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewPanelProps {
  labels: string[];
}

export function PreviewPanel({ labels }: PreviewPanelProps) {
  const count = labels.length;

  return (
    <div className="overflow-hidden rounded-[0.6rem] border border-border/50 bg-card shadow-xs mb-8">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Preview generated batches</h2>
        <Badge
          variant="outline"
          className="border-success/40 bg-success/10 text-success text-sm font-semibold"
        >
          {count} classroom{count === 1 ? "" : "s"} will be generated
        </Badge>
      </div>
      <div className="p-6">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground">No classes selected yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <span
                key={label}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
