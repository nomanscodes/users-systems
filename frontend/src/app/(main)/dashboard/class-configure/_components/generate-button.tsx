import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GenerateButtonProps {
  count: number;
  disabled: boolean;
  loading?: boolean;
  created: boolean;
  onGenerate: () => void;
}

export function GenerateButton({ count, disabled, loading, created, onGenerate }: GenerateButtonProps) {
  if (created) {
    return (
      <Alert className="border-success/40 bg-success/10">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AlertTitle className="text-success font-semibold">Success!</AlertTitle>
        <AlertDescription className="text-success/80">
          {count} classroom{count === 1 ? "" : "s"} created successfully.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Button
      type="button"
      size="lg"
      disabled={disabled || loading}
      onClick={onGenerate}
      className={
        disabled || loading
          ? "w-full cursor-not-allowed"
          : "w-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white hover:opacity-95 hover:bg-none"
      }
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Generating...
        </span>
      ) : disabled ? (
        "Select at least one class"
      ) : (
        `✓ Generate ${count} Classroom${count === 1 ? "" : "s"}`
      )}
    </Button>
  );
}
