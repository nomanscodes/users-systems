'use client';

import { Loader2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeactivateStaff } from '@/features/staff/hooks/use-staff';
import type { StaffMember, UserStatus } from '@/features/staff/types/staff.dto';

const CATEGORY_CONFIG = {
  TEACHING: { label: 'Teaching', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  NON_TEACHING: { label: 'Non-Teaching', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  ADMIN: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
} as const;

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
  INACTIVE: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' },
} as const;

interface StaffTableProps {
  staff: StaffMember[];
  isLoading: boolean;
  isError: boolean;
  filter: UserStatus;
  searchQuery: string;
  onSelect: (id: string) => void;
}

export function StaffTable({ staff, isLoading, isError, filter, searchQuery, onSelect }: StaffTableProps) {
  const deactivateStaff = useDeactivateStaff();

  // Client-side filter by status + search
  const filtered = staff.filter((s) => {
    if (s.user.status !== filter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const fullName = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
    return fullName.includes(q) || s.user.email.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {['Name', 'Email', 'Designation', 'Category', 'Status', ''].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-sm text-destructive py-12">
        Failed to load staff members.
      </p>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <p className="text-muted-foreground text-sm">No staff members found.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Designation</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-2.5 w-24" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {filtered.map((member) => {
            const fullName = `${member.user.firstName} ${member.user.lastName}`;
            const catCfg = CATEGORY_CONFIG[member.designation?.category] ?? CATEGORY_CONFIG.TEACHING;
            const statusCfg = STATUS_CONFIG[member.user.status] ?? STATUS_CONFIG.ACTIVE;

            return (
              <tr
                key={member.id}
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => onSelect(member.id)}
              >
                <td className="px-4 py-3 font-medium">{fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{member.user.email}</td>
                <td className="px-4 py-3">{member.designation?.title ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catCfg.className}`}>
                    {catCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                    {statusCfg.label}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={(e) => { e.stopPropagation(); onSelect(member.id); }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {member.user.status === 'ACTIVE' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate {fullName}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will revoke their login access. They will remain in the system as inactive and can be viewed but cannot log in.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive hover:bg-destructive/90"
                              onClick={() => deactivateStaff.mutate(member.id)}
                            >
                              {deactivateStaff.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
