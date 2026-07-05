'use client';

import { useState } from 'react';
import { Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUpdateStaff } from '@/features/staff/hooks/use-staff';
import { useDesignations } from '@/features/staff/hooks/use-designations';
import { useAuthStore } from '@/stores/auth.store';
import type { StaffMember } from '@/features/staff/types/staff.dto';

interface ProfileTabProps {
  staffMember: StaffMember;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      <span className="text-sm">{value || <span className="text-muted-foreground/50 italic">Not set</span>}</span>
    </div>
  );
}

export function ProfileTab({ staffMember }: ProfileTabProps) {
  const [editMode, setEditMode] = useState(false);
  const [designationId, setDesignationId] = useState('');
  const [department, setDepartment] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [qualification, setQualification] = useState('');
  const [subjectSpecialty, setSubjectSpecialty] = useState('');

  const userType = useAuthStore((s) => s.user?.userType);
  const isSchoolAdmin = userType === 'SCHOOL_ADMIN';

  const { data: designations } = useDesignations();
  const updateStaff = useUpdateStaff();

  const p = staffMember.staffProfile;
  const u = staffMember.user;

  const startEdit = () => {
    setDesignationId(p.designationId);
    setDepartment(p.department ?? '');
    setJoiningDate(p.joiningDate ?? '');
    setQualification(p.qualification ?? '');
    setSubjectSpecialty(p.subjectSpecialty ?? '');
    setEditMode(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStaff.mutateAsync({
      id: staffMember.id,
      data: {
        designationId: designationId || undefined,
        department: department.trim() || undefined,
        joiningDate: joiningDate || undefined,
        qualification: qualification.trim() || undefined,
        subjectSpecialty: subjectSpecialty.trim() || undefined,
      },
    });
    setEditMode(false);
  };

  if (editMode) {
    return (
      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Designation</Label>
          <Select value={designationId} onValueChange={setDesignationId}>
            <SelectTrigger>
              <SelectValue placeholder="Select designation" />
            </SelectTrigger>
            <SelectContent>
              {designations?.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Department</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} />
        </div>

        <div className="space-y-1.5">
          <Label>Joining Date</Label>
          <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Qualification</Label>
          <Input value={qualification} onChange={(e) => setQualification(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Subject Specialty</Label>
          <Input value={subjectSpecialty} onChange={(e) => setSubjectSpecialty(e.target.value)} />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={updateStaff.isPending}>
            {updateStaff.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" variant="ghost" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={startEdit} className="gap-2">
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {/* Read-only user account fields */}
        <InfoRow label="First Name" value={u.firstName} />
        <InfoRow label="Last Name" value={u.lastName} />
        <div className="col-span-2">
          <InfoRow
            label="Email"
            value={
              <span>
                {u.email}{' '}
                <span className="text-xs text-muted-foreground/60">(Managed via user account)</span>
              </span>
            }
          />
        </div>
        <InfoRow label="Phone" value={u.phone ?? null} />
        <InfoRow label="Employee ID" value={p.employeeId} />

        {/* Editable profile fields */}
        <div className="col-span-2 border-t my-1" />
        <InfoRow label="Designation" value={p.designation.title} />
        <InfoRow label="Category" value={p.designation.category} />
        <InfoRow label="Department" value={p.department} />
        <InfoRow label="Joining Date" value={p.joiningDate} />
        <InfoRow label="Qualification" value={p.qualification} />
        <InfoRow label="Subject Specialty" value={p.subjectSpecialty} />

        {/* Salary — SCHOOL_ADMIN only, completely hidden from STAFF */}
        {isSchoolAdmin && (
          <>
            <div className="col-span-2 border-t my-1" />
            <div className="col-span-2">
              <InfoRow
                label="Salary"
                value={
                  p.salary != null
                    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT' }).format(p.salary)
                    : null
                }
              />
              <p className="text-xs text-muted-foreground/60 mt-1">
                Salary cannot be edited from this panel. Contact your system admin.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
