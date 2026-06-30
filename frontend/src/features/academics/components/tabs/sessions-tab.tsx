"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { TabHeader } from "../shared/tab-header";
import { RowActions } from "../shared/row-actions";
import { EmptyRow } from "../shared/empty-row";
import { DeleteConfirm } from "../shared/delete-confirm";
import { DatePickerField } from "../shared/date-picker-field";

import {
  useSessions,
  useCreateSession,
  useUpdateSession,
  useDeleteSession,
} from "../../hooks/use-sessions";
import type { AcademicSession } from "../../types/academics.dto";

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: AcademicSession };

export function SessionsTab() {
  const { data: items = [], isLoading } = useSessions();
  const createMutation = useCreateSession();
  const updateMutation = useUpdateSession();
  const deleteMutation = useDeleteSession();

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>({ type: "closed" });
  const [form, setForm] = useState<{
    name: string;
    startDate?: string;
    endDate?: string;
    isCurrent: boolean;
  }>({ name: "", isCurrent: false });
  const [toDelete, setToDelete] = useState<AcademicSession | null>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: "", isCurrent: false });
    setMode({ type: "create" });
  };

  const openEdit = (s: AcademicSession) => {
    setForm({
      name: s.name,
      startDate: s.startDate,
      endDate: s.endDate,
      isCurrent: s.isCurrent,
    });
    setMode({ type: "edit", item: s });
  };

  const close = () => {
    setMode({ type: "closed" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.startDate || !form.endDate) return;
    
    const payload = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      isCurrent: form.isCurrent,
    };

    if (mode.type === "edit") {
      updateMutation.mutate(
        { id: mode.item.id, data: payload },
        { onSuccess: close }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: close });
    }
  };

  const isEdit = mode.type === "edit";
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <TabHeader
        search={search}
        setSearch={setSearch}
        placeholder="Search sessions..."
        buttonLabel="Add New Session"
        onAddClick={openCreate}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={5} label="Loading sessions..." />
            ) : filtered.length === 0 ? (
              <EmptyRow colSpan={5} label="No sessions found." />
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.startDate ? format(new Date(s.startDate), "PP") : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.endDate ? format(new Date(s.endDate), "PP") : "—"}
                  </TableCell>
                  <TableCell>
                    {s.isCurrent ? (
                      <Badge className="gap-1">
                        <CheckCircle2 className="size-3" /> Current
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Archived</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={mode.type !== "closed"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Session" : "Add New Session"}</DialogTitle>
              <DialogDescription>
                Define an academic session with start and end dates.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="session-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="session-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="2026-2027"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>
                    Start Date <span className="text-destructive">*</span>
                  </Label>
                  <DatePickerField
                    value={form.startDate}
                    onChange={(d) => setForm({ ...form, startDate: d?.toISOString() })}
                    placeholder="Pick start date"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>
                    End Date <span className="text-destructive">*</span>
                  </Label>
                  <DatePickerField
                    value={form.endDate}
                    onChange={(d) => setForm({ ...form, endDate: d?.toISOString() })}
                    placeholder="Pick end date"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                <Checkbox
                  id="session-current"
                  checked={form.isCurrent}
                  onCheckedChange={(v) => setForm({ ...form, isCurrent: Boolean(v) })}
                />
                <Label htmlFor="session-current" className="text-sm font-normal cursor-pointer">
                  Mark as current session
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        entity="Session"
        itemName={toDelete?.name}
        isDeleting={deleteMutation.isPending}
        onConfirm={() => {
          if (toDelete) {
            deleteMutation.mutate(toDelete.id, {
              onSuccess: () => setToDelete(null)
            });
          }
        }}
      />
    </div>
  );
}
