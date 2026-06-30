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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <Button onClick={onAddClick} className="gap-2">
        <Plus className="size-4" />
        {buttonLabel}
      </Button>
    </div>
  );
}
