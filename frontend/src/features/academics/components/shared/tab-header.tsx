import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TabHeader({
  search,
  setSearch,
  placeholder,
  buttonLabel,
  onAddClick,
}: {
  search: string;
  setSearch: (s: string) => void;
  placeholder: string;
  buttonLabel: string;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-2">
      <div className="relative w-full sm:max-w-[20rem]">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-10 rounded-xl bg-background border-border/60 shadow-sm transition-colors hover:border-border focus-visible:border-ring"
        />
      </div>
      <Button onClick={onAddClick} className="gap-2 rounded-[0.6rem] px-5 h-10 shadow-sm">
        <Plus className="size-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}
