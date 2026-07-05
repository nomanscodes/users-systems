'use client';

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
        <SheetHeader className="px-6 py-5 border-b">
          {isLoading || !staffMember ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold">
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
                <p className="text-sm text-muted-foreground mt-0.5">
                  {staffMember.designation?.title}
                </p>
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
                {/* Teaching Assignments tab — only for TEACHING category staff */}
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
                  <RolesTab />
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
