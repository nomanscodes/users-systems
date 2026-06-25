import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
}

export function ToggleSwitch({ id, checked, onCheckedChange, label }: ToggleSwitchProps) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs text-muted-foreground cursor-pointer select-none">
        {label}
      </Label>
    </div>
  );
}
