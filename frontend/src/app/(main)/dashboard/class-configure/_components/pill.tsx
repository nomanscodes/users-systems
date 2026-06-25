import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PillProps {
  selected: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  showCheck?: boolean;
}

export function Pill({ selected, onClick, children, showCheck = false }: PillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border border-transparent"
          : "bg-background text-muted-foreground border border-border hover:border-[#475569] hover:text-foreground",
      )}
    >
      {showCheck && selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {children}
    </button>
  );
}
