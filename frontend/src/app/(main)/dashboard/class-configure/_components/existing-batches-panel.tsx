import { Trash2, Loader2, ServerCrash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBatches, useDeleteBatch } from "@/features/academics/hooks/use-batches";
import type { Batch } from "@/features/academics/types/academics.dto";

export function ExistingBatchesPanel() {
  const { data: batches = [], isLoading, isError } = useBatches();
  const deleteBatch = useDeleteBatch();

  const count = batches.length;

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-[0.6rem] border border-border/50 bg-card shadow-xs mb-8 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="overflow-hidden rounded-[0.6rem] border border-border/50 bg-card shadow-xs mb-8 flex items-center justify-center p-8 text-destructive flex-col gap-2">
        <ServerCrash className="h-8 w-8" />
        <p className="font-medium">Failed to load existing batches</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[0.6rem] border border-border/50 bg-card shadow-xs mb-8">
      <div className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Manage Existing Classrooms (Batches)</h2>
        <Badge
          variant="outline"
          className="border-primary/40 bg-primary/10 text-primary text-sm font-semibold"
        >
          {count} Total Classroom{count === 1 ? "" : "s"}
        </Badge>
      </div>
      <div className="p-6">
        {count === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No classrooms have been generated yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {batches.map((batch: Batch) => {
              // Construct human readable label
              const parts = [batch.classEntity?.name];
              if (batch.group) parts.push(batch.group.name);
              if (batch.section) parts.push(batch.section.name);
              parts.push(`(${batch.session?.name})`);
              const label = parts.join(" - ");

              return (
                <div
                  key={batch.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-4 py-3 hover:bg-muted/30 transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{batch.branch?.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${label}?`)) {
                        deleteBatch.mutate(batch.id);
                      }
                    }}
                    disabled={deleteBatch.isPending}
                  >
                    {deleteBatch.isPending && deleteBatch.variables === batch.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
