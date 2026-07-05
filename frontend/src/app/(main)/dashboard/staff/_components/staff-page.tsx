'use client';

import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStaff } from '@/features/staff/hooks/use-staff';
import type { UserStatus } from '@/features/staff/types/staff.dto';
import { StaffTable } from './staff-table';
import { InviteStaffDrawer } from './invite-staff-drawer';
import { StaffDetailDrawer } from './staff-detail-drawer';
import type { InviteStaffResponse } from '@/features/staff/types/staff.dto';
import { TempPasswordDialog } from './temp-password-dialog';

const STATUS_FILTERS: { label: string; value: UserStatus }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
];

export function StaffPageClient() {
  const [activeFilter, setActiveFilter] = useState<UserStatus>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [inviteDrawerOpen, setInviteDrawerOpen] = useState(false);
  const [tempPasswordData, setTempPasswordData] = useState<InviteStaffResponse | null>(null);

  const { data: staff, isLoading, isError } = useStaff();

  const handleInviteSuccess = (response: InviteStaffResponse) => {
    setInviteDrawerOpen(false);
    setTempPasswordData(response); // opens TempPasswordDialog
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Staff Directory</h1>
            <p className="text-sm text-muted-foreground">
              Invite and manage all staff members in your school.
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteDrawerOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Staff Member
        </Button>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-4">
        {/* Status Filter Tabs */}
        <div className="flex rounded-lg border bg-muted/30 p-0.5 gap-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeFilter === f.value
                  ? 'bg-background shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>

        {/* Count */}
        {staff && (
          <span className="text-sm text-muted-foreground ml-auto">
            {staff.filter((s) => s.user.status === activeFilter).length} member(s)
          </span>
        )}
      </div>

      {/* Table */}
      <StaffTable
        staff={staff ?? []}
        isLoading={isLoading}
        isError={isError}
        filter={activeFilter}
        searchQuery={searchQuery}
        onSelect={setSelectedStaffId}
      />

      {/* Invite Drawer */}
      <InviteStaffDrawer
        open={inviteDrawerOpen}
        onClose={() => setInviteDrawerOpen(false)}
        onSuccess={handleInviteSuccess}
      />

      {/* Temp Password Dialog — shown after successful invite */}
      <TempPasswordDialog
        open={!!tempPasswordData}
        data={tempPasswordData}
        onClose={() => setTempPasswordData(null)}
      />

      {/* Staff Detail Drawer */}
      <StaffDetailDrawer
        staffId={selectedStaffId}
        onClose={() => setSelectedStaffId(null)}
      />
    </div>
  );
}
