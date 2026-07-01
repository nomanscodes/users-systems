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
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from "../../hooks/use-branches";
import type { Branch } from "../../types/academics.dto";

type DialogMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; item: Branch };

const emptyBranch = { name: "", address: "", contactNumber: "" };

export function BranchesTab() {
  const { data: items = [], isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<DialogMode>({ type: "closed" });
  const [form, setForm] = useState(emptyBranch);
  const [toDelete, setToDelete] = useState<Branch | null>(null);

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm(emptyBranch);
    setMode({ type: "create" });
  };
  
  const openEdit = (b: Branch) => {
    setForm({
      name: b.name,
      address: b.address ?? "",
      contactNumber: b.contactNumber ?? "",
    });
    setMode({ type: "edit", item: b });
  };
  
  const close = () => {
    setMode({ type: "closed" });
    setForm(emptyBranch);
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
        placeholder="Search branches..."
        buttonLabel="Add New Branch"
        onAddClick={openCreate}
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Contact Number</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <EmptyRow colSpan={4} label="Loading branches..." />
          ) : filtered.length === 0 ? (
            <EmptyRow colSpan={4} label="No branches found." />
          ) : (
            filtered.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-medium">{b.name}</TableCell>
                <TableCell className="text-muted-foreground">{b.address || "—"}</TableCell>
                <TableCell className="text-muted-foreground">{b.contactNumber || "—"}</TableCell>
                <TableCell>
                  <RowActions onEdit={() => openEdit(b)} onDelete={() => setToDelete(b)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={mode.type !== "closed"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit Branch" : "Add New Branch"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update the details of this branch."
                  : "Create a new branch location for your institution."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="branch-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="branch-name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Main Campus"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch-address">Address</Label>
                <Input
                  id="branch-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, City"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="branch-contact">Contact Number</Label>
                <Input
                  id="branch-contact"
                  value={form.contactNumber}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        entity="Branch"
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
