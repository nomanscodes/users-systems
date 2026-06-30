"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TabHeader } from "../shared/tab-header";
import { RowActions } from "../shared/row-actions";
import { EmptyRow } from "../shared/empty-row";
import { DeleteConfirm } from "../shared/delete-confirm";

import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "../../hooks/use-subjects";
import { Subject, SubjectType } from "../../types/academics.dto";

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: Subject };

export function SubjectsTab() {
  const { data: items = [], isLoading } = useSubjects();
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>({ type: "closed" });
  const [form, setForm] = useState<{
    name: string;
    code: string;
    type: SubjectType;
  }>({ name: "", code: "", type: SubjectType.MANDATORY });
  const [toDelete, setToDelete] = useState<Subject | null>(null);

  const filtered = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      (i.code ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: "", code: "", type: SubjectType.MANDATORY });
    setMode({ type: "create" });
  };

  const openEdit = (s: Subject) => {
    setForm({ name: s.name, code: s.code ?? "", type: s.type });
    setMode({ type: "edit", item: s });
  };

  const close = () => {
    setMode({ type: "closed" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (mode.type === "edit") {
      updateMutation.mutate(
        { id: mode.item.id, data: form },
        { onSuccess: close }
      );
    } else {
      createMutation.mutate(form, { onSuccess: close });
    }
  };

  const isEdit = mode.type === "edit";
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <TabHeader
        search={search}
        setSearch={setSearch}
        placeholder="Search subjects..."
        buttonLabel="Add New Subject"
        onAddClick={openCreate}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={4} label="Loading subjects..." />
            ) : filtered.length === 0 ? (
              <EmptyRow colSpan={4} label="No subjects found." />
            ) : (
              filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.code || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.type === SubjectType.MANDATORY ? "default" : "secondary"}>
                      {s.type}
                    </Badge>
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
              <DialogTitle>{isEdit ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                Define a subject taught in your institution.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="subject-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Mathematics"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject-code">Code</Label>
                <Input
                  id="subject-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="MATH101"
                />
              </div>
              <div className="grid gap-2">
                <Label>Subject Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: SubjectType) =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SubjectType.MANDATORY}>Mandatory</SelectItem>
                    <SelectItem value={SubjectType.OPTIONAL}>Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Subject"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        entity="Subject"
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
