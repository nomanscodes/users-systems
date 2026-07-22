'use client';

import { useState } from 'react';
import { Mail, Phone, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStaffMember } from '@/features/staff/hooks/use-staff';
import { ProfileTab } from './profile-tab';
import { RolesTab } from './roles-tab';
import { TeachingAssignmentsTab } from './teaching-assignments-tab';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', dot: 'bg-green-500', cls: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' },
  INACTIVE: { label: 'Inactive', dot: 'bg-muted-foreground/50', cls: 'bg-muted text-muted-foreground' },
  SUSPENDED: { label: 'Suspended', dot: 'bg-red-500', cls: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' },
} as const;

const CATEGORY_CONFIG = {
  TEACHING: { label: 'Teaching', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  NON_TEACHING: { label: 'Non-Teaching', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  ADMIN: { label: 'Admin', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
} as const;

interface StaffDetailDrawerProps {
  staffId: string | null;
  onClose: () => void;
}

type TabValue = 'profile' | 'roles' | 'assignments';

export function StaffDetailDrawer({ staffId, onClose }: StaffDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('profile');
  const { data: staffMember, isLoading } = useStaffMember(staffId);

  const isTeaching = staffMember?.designation?.category === 'TEACHING';
  const initials = staffMember
    ? `${staffMember.user.firstName[0]}${staffMember.user.lastName[0]}`.toUpperCase()
    : '';
  const statusCfg = staffMember ? STATUS_CONFIG[staffMember.user.status] : null;
  const categoryCfg = staffMember?.designation?.category
    ? CATEGORY_CONFIG[staffMember.designation.category]
    : null;

  const tabs: { value: TabValue; label: string }[] = [
    { value: 'profile', label: 'Profile' },
    { value: 'roles', label: 'Roles' },
    ...(isTeaching ? [{ value: 'assignments' as TabValue, label: 'Teaching' }] : []),
  ];

  return (
    <Sheet open={!!staffId} onOpenChange={(o) => { if (!o) { setActiveTab('profile'); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0" side="right">

        {/* ── Header ── */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle className="text-[15px] font-semibold">Staff Profile</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            View and manage this staff member's details, roles, and assignments.
          </SheetDescription>

          {/* Profile identity block */}
          <div className="mt-4 pt-4 border-t">
            {isLoading || !staffMember ? (
              <div className="flex items-center gap-3">
                <Skeleton className="h-11 w-11 rounded-lg shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <span className="text-sm font-semibold text-primary tracking-tight">{initials}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">{staffMember.user.firstName} {staffMember.user.lastName}</p>
                    {statusCfg && (
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {staffMember.designation && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        {staffMember.designation.title}
                      </span>
                    )}
                    {categoryCfg && (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${categoryCfg.cls}`}>
                        {categoryCfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{staffMember.user.email}</span>
                    </span>
                    {staffMember.user.phone && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                        <Phone className="w-3 h-3" />
                        {staffMember.user.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* ── Manual Tab Bar — full style control, no shadcn override issues ── */}
        {!isLoading && staffMember && (
          <div className="flex items-end gap-0 border-b px-6 shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`h-10 px-4 text-sm transition-colors relative ${
                  activeTab === tab.value
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {/* Underline indicator */}
                {activeTab === tab.value && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">
          {isLoading || !staffMember ? (
            <div className="px-6 py-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="px-6 py-5">
              {activeTab === 'profile' && <ProfileTab staffMember={staffMember} />}
              {activeTab === 'roles' && <RolesTab staffId={staffMember.id} />}
              {activeTab === 'assignments' && isTeaching && <TeachingAssignmentsTab staffId={staffMember.id} />}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
