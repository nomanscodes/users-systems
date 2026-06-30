"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "../../hooks/use-classes";
import type { ClassEntity } from "../../types/academics.dto";

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: ClassEntity };

export function ClassesTab() {
  const { data: items = [], isLoading } = useClasses();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>({ type: "closed" });
  const [form, setForm] = useState({ name: "", numericValue: 1 });
  const [toDelete, setToDelete] = useState<ClassEntity | null>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: "", numericValue: 1 });
    setMode({ type: "create" });
  };

  const openEdit = (c: ClassEntity) => {
    setForm({ name: c.name, numericValue: c.numericValue });
    setMode({ type: "edit", item: c });
  };

  const close = () => {
    setMode({ type: "closed" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || form.numericValue < 1) return;
    
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
        placeholder="Search classes..."
        buttonLabel="Add New Class"
        onAddClick={openCreate}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Numeric Value</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={3} label="Loading classes..." />
            ) : filtered.length === 0 ? (
              <EmptyRow colSpan={3} label="No classes found." />
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.numericValue}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(c)} onDelete={() => setToDelete(c)} />
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
              <DialogTitle>{isEdit ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>
                Add a class level used across your academic structure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="class-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="class-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Class 10"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="class-numeric">
                  Numeric Value <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="class-numeric"
                  type="number"
                  min={1}
                  required
                  value={form.numericValue}
                  onChange={(e) =>
                    setForm({ ...form, numericValue: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Class"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        entity="Class"
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
