'use client';

import { User, Mail, Phone, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStaffMember } from '@/features/staff/hooks/use-staff';
import { ProfileTab } from './profile-tab';
import { RolesTab } from './roles-tab';
import { TeachingAssignmentsTab } from './teaching-assignments-tab';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
  INACTIVE: { label: 'Inactive', className: 'bg-muted text-muted-foreground' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' },
} as const;

const CATEGORY_CONFIG = {
  TEACHING: { label: 'Teaching', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  NON_TEACHING: { label: 'Non-Teaching', className: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  ADMIN: { label: 'Admin', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
} as const;

interface StaffDetailDrawerProps {
  staffId: string | null;
  onClose: () => void;
}

export function StaffDetailDrawer({ staffId, onClose }: StaffDetailDrawerProps) {
  const { data: staffMember, isLoading } = useStaffMember(staffId);

  const isTeaching = staffMember?.designation?.category === 'TEACHING';

  return (
    <Sheet open={!!staffId} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0" side="right">
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          {isLoading || !staffMember ? (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-28" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 shrink-0">
                <span className="text-lg font-semibold text-primary">
                  {staffMember.user.firstName[0]}{staffMember.user.lastName[0]}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold truncate">
                    {staffMember.user.firstName} {staffMember.user.lastName}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_CONFIG[staffMember.user.status].className
                    }`}
                  >
                    {STATUS_CONFIG[staffMember.user.status].label}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {staffMember.designation && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Briefcase className="w-3 h-3" />
                      {staffMember.designation.title}
                    </span>
                  )}
                  {staffMember.designation?.category && (
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        CATEGORY_CONFIG[staffMember.designation.category].className
                      }`}
                    >
                      {CATEGORY_CONFIG[staffMember.designation.category].label}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-1.5">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="w-3 h-3" />
                    {staffMember.user.email}
                  </span>
                  {staffMember.user.phone && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {staffMember.user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetHeader>

        {/* Tabs */}
        <div className="flex-1 overflow-hidden">
          {isLoading || !staffMember ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="profile" className="h-full flex flex-col">
              <TabsList className="px-6 border-b rounded-none h-11 bg-transparent justify-start gap-1 shrink-0">
                <TabsTrigger value="profile" className="text-sm rounded-md data-[state=active]:bg-muted">
                  Profile
                </TabsTrigger>
                <TabsTrigger value="roles" className="text-sm rounded-md data-[state=active]:bg-muted">
                  Roles
                </TabsTrigger>
                {isTeaching && (
                  <TabsTrigger value="assignments" className="text-sm rounded-md data-[state=active]:bg-muted">
                    Teaching
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="flex-1 overflow-y-auto">
                <TabsContent value="profile" className="mt-0 p-6">
                  <ProfileTab staffMember={staffMember} />
                </TabsContent>

                <TabsContent value="roles" className="mt-0 p-6">
                  <RolesTab staffId={staffMember.id} />
                </TabsContent>

                {isTeaching && (
                  <TabsContent value="assignments" className="mt-0 p-6">
                    <TeachingAssignmentsTab staffId={staffMember.id} />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
