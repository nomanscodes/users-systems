import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreviewPanelProps {
  labels: string[];
}

export function PreviewPanel({ labels }: PreviewPanelProps) {
  const count = labels.length;

  return (
    <Card className="border-primary/40 bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground">Preview</CardTitle>
          <Badge
            variant="outline"
            className="border-success/40 bg-success/10 text-success text-sm font-semibold"
          >
            {count} classroom{count === 1 ? "" : "s"} will be generated
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
