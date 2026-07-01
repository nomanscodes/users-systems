"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookMarked,
  Check,
  Info,
  Layers,
  Loader2,
  Save,
  Sparkles,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/page-container";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Subject = {
  id: string;
  name: string;
  code: string;
  type: "MANDATORY" | "OPTIONAL";
};

const CLASSES = [
  { id: "c9", name: "Class 9" },
  { id: "c10", name: "Class 10" },
  { id: "c11", name: "Class 11" },
  { id: "c12", name: "Class 12" },
];

const GROUPS = [
  { id: "none", name: "None / Common" },
  { id: "science", name: "Science" },
  { id: "commerce", name: "Commerce" },
  { id: "humanities", name: "Humanities" },
];

const SUBJECTS: Subject[] = [
  { id: "phy", name: "Physics", code: "PHY-101", type: "MANDATORY" },
  { id: "chem", name: "Chemistry", code: "CHE-102", type: "MANDATORY" },
  { id: "bio", name: "Biology", code: "BIO-103", type: "OPTIONAL" },
  { id: "math", name: "Mathematics", code: "MAT-104", type: "MANDATORY" },
  { id: "hmath", name: "Higher Math", code: "MAT-201", type: "OPTIONAL" },
  { id: "eng", name: "English", code: "ENG-105", type: "MANDATORY" },
  { id: "ben", name: "Bengali", code: "BEN-106", type: "MANDATORY" },
  { id: "acc", name: "Accounting", code: "ACC-107", type: "OPTIONAL" },
  { id: "bst", name: "Business Studies", code: "BST-108", type: "OPTIONAL" },
  { id: "eco", name: "Economics", code: "ECO-109", type: "OPTIONAL" },
  { id: "his", name: "History", code: "HIS-110", type: "OPTIONAL" },
  { id: "geo", name: "Geography", code: "GEO-111", type: "OPTIONAL" },
  { id: "cs", name: "Computer Science", code: "CSC-112", type: "OPTIONAL" },
  { id: "ict", name: "ICT", code: "ICT-113", type: "MANDATORY" },
  { id: "pe", name: "Physical Education", code: "PED-114", type: "MANDATORY" },
];

// Mocked "database" of saved allocations, keyed by `${classId}::${groupId}`.
const SAVED_ALLOCATIONS: Record<string, string[]> = {
  "c9::none": ["math", "eng", "ben", "ict", "pe"],
  "c10::none": ["math", "eng", "ben", "ict", "pe"],
  "c11::science": ["phy", "chem", "math", "hmath", "eng", "ict"],
  "c11::commerce": ["acc", "bst", "eco", "eng", "ben", "ict"],
  "c11::humanities": ["his", "geo", "eco", "eng", "ben", "ict"],
  "c12::science": ["phy", "chem", "bio", "math", "eng"],
};

export default function SubjectAllocationsPage() {
  const [classId, setClassId] = useState<string>("");
  const [groupId, setGroupId] = useState<string>("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initial, setInitial] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [classOpen, setClassOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);

  const scopeReady = Boolean(classId);
  const scopeKey = scopeReady ? `${classId}::${groupId || "none"}` : "";

  useEffect(() => {
    if (!scopeReady) {
      setSelected(new Set());
      setInitial(new Set());
      return;
    }
    const saved = new Set(SAVED_ALLOCATIONS[scopeKey] ?? []);
    setSelected(saved);
    setInitial(new Set(saved));
  }, [scopeKey, scopeReady]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const dirty = useMemo(() => {
    if (selected.size !== initial.size) return true;
    for (const id of selected) if (!initial.has(id)) return true;
    return false;
  }, [selected, initial]);

  const className = CLASSES.find((c) => c.id === classId)?.name;
  const groupName = GROUPS.find((g) => g.id === groupId)?.name ?? "None / Common";

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    SAVED_ALLOCATIONS[scopeKey] = Array.from(selected);
    setInitial(new Set(selected));
    setSaving(false);
    toast.success("Curriculum updated successfully", {
      description: `${className} · ${groupName} — ${selected.size} subject${selected.size === 1 ? "" : "s"} allocated.`,
    });
  };

  return (
    <PageContainer>
      <div className="flex w-full flex-col gap-6">
        <Toaster position="top-right" richColors />

        {/* Page header */}
        <div className="flex flex-col mb-8">
          <div className="flex items-center text-[11px] font-bold tracking-widest text-muted-foreground/80 uppercase mb-3">
            <span>Academic Setup</span>
            <span className="mx-2 font-light">/</span>
            <span className="text-foreground/70">Subject Allocations</span>
          </div>
          <h1 className="text-[2rem] font-bold tracking-tight text-foreground leading-tight">
            Subject Allocations
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-3xl">
            Define the curriculum and reading list for each class and group. Allocate mandatory and optional subjects.
          </p>
        </div>

        {/* Scope Selector */}
        <Card className="overflow-hidden rounded-[0.6rem] border border-border/50 shadow-xs">
          <CardHeader className="border-b border-border/50 bg-muted/10 px-6 py-5">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Scope</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="class-select" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Select Class <span className="text-destructive">*</span>
                </Label>
                <Popover open={classOpen} onOpenChange={setClassOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={classOpen}
                      className="w-full justify-between bg-background font-normal"
                    >
                      {classId
                        ? CLASSES.find((c) => c.id === classId)?.name
                        : "Choose a class..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search classes..." />
                      <CommandList>
                        <CommandEmpty>No class found.</CommandEmpty>
                        <CommandGroup>
                          {CLASSES.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setClassId(c.id);
                                setClassOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  classId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="group-select" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Select Group <span className="text-muted-foreground/70">(optional)</span>
                </Label>
                <Popover open={groupOpen} onOpenChange={setGroupOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={groupOpen}
                      disabled={!scopeReady}
                      className="w-full justify-between bg-background font-normal"
                    >
                      {groupId
                        ? GROUPS.find((g) => g.id === groupId)?.name
                        : "None / Common"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search groups..." />
                      <CommandList>
                        <CommandEmpty>No group found.</CommandEmpty>
                        <CommandGroup>
                          {GROUPS.map((g) => (
                            <CommandItem
                              key={g.id}
                              value={g.name}
                              onSelect={() => {
                                setGroupId(g.id);
                                setGroupOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  groupId === g.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {g.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Checklist */}
        <Card className="overflow-hidden rounded-[0.6rem] border border-border/50 shadow-xs">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/50 bg-muted/10 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2">
                <BookMarked className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Available Subjects</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {scopeReady
                    ? `Toggle subjects to build the curriculum for ${className}${groupId && groupId !== "none" ? ` · ${groupName}` : ""}.`
                    : "Select a scope to begin allocating subjects."}
                </p>
              </div>
            </div>
            {scopeReady && (
              <Badge variant="secondary" className="shrink-0">
                {selected.size} / {SUBJECTS.length} selected
              </Badge>
            )}
          </CardHeader>

          <CardContent className="p-6">
            {!scopeReady ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-[0.6rem] border border-dashed border-border/60 bg-muted/20 py-24 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Please select a Class to view available subjects
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Curriculum options unlock once a scope is chosen.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SUBJECTS.map((s) => {
                  const active = selected.has(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggle(s.id)}
                      className={cn(
                        "group relative flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
                        "hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary ring-1 ring-primary/20 bg-primary/[0.02]"
                          : "border-border/60 shadow-xs",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground shadow-sm"
                            : "border-input bg-muted/50 text-transparent group-hover:border-primary/40 group-hover:bg-background",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {s.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{s.code}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                              s.type === "MANDATORY"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {s.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>

          {/* Sticky Action Footer */}
          <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-xl border-t bg-background/80 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {scopeReady
                ? dirty
                  ? "You have unsaved changes."
                  : "All changes saved."
                : "Select a scope to save allocations."}
            </div>
            <Button
              onClick={handleSave}
              disabled={!scopeReady || !dirty || saving}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Allocations
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
