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

type DialogMode<T> =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: T };

interface SimpleEntity {
  id: string;
  name: string;
}

interface SimpleNameTabProps<T extends SimpleEntity> {
  entityLabel: string;
  placeholderExample: string;
  items: T[];
  isLoading: boolean;
  createMutation: any;
  updateMutation: any;
  deleteMutation: any;
}

export function SimpleNameTab<T extends SimpleEntity>({
  entityLabel,
  placeholderExample,
  items,
  isLoading,
  createMutation,
  updateMutation,
  deleteMutation,
}: SimpleNameTabProps<T>) {
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode<T>>({ type: "closed" });
  const [name, setName] = useState("");
  const [toDelete, setToDelete] = useState<T | null>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setName("");
    setMode({ type: "create" });
  };

  const openEdit = (i: T) => {
    setName(i.name);
    setMode({ type: "edit", item: i });
  };

  const close = () => {
    setMode({ type: "closed" });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode.type === "edit") {
      updateMutation.mutate(
        { id: mode.item.id, data: { name } },
        { onSuccess: close }
      );
    } else {
      createMutation.mutate({ name }, { onSuccess: close });
    }
  };

  const isEdit = mode.type === "edit";
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      <TabHeader
        search={search}
        setSearch={setSearch}
        placeholder={`Search ${entityLabel.toLowerCase()}s...`}
        buttonLabel={`Add New ${entityLabel}`}
        onAddClick={openCreate}
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <EmptyRow colSpan={2} label={`Loading ${entityLabel.toLowerCase()}s...`} />
            ) : filtered.length === 0 ? (
              <EmptyRow colSpan={2} label={`No ${entityLabel.toLowerCase()}s found.`} />
            ) : (
              filtered.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-medium">{g.name}</TableCell>
                  <TableCell>
                    <RowActions onEdit={() => openEdit(g)} onDelete={() => setToDelete(g)} />
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
              <DialogTitle>
                {isEdit ? `Edit ${entityLabel}` : `Add New ${entityLabel}`}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? `Update the name of this ${entityLabel.toLowerCase()}.`
                  : `Create a new ${entityLabel.toLowerCase()}.`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="simple-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="simple-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={placeholderExample}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : `Create ${entityLabel}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        entity={entityLabel}
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
