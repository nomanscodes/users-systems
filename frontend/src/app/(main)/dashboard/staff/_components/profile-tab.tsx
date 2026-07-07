'use client';

import { useState } from 'react';
import { Pencil, Loader2, User, Briefcase, GraduationCap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateStaff } from '@/features/staff/hooks/use-staff';
import { useDesignations } from '@/features/staff/hooks/use-designations';
import { useAuthStore } from '@/stores/auth.store';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { StaffMember } from '@/features/staff/types/staff.dto';

interface ProfileTabProps {
  staffMember: StaffMember;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
      <span className="text-sm">{value || <span className="text-muted-foreground/50 italic">Not set</span>}</span>
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
      </div>
      <div className="px-4 py-3">
        {children}
      </div>
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

  const u = staffMember.user;

  const startEdit = () => {
    setDesignationId(staffMember.designationId);
    setDepartment(staffMember.department ?? '');
    setJoiningDate(staffMember.joiningDate ?? '');
    setQualification(staffMember.qualification ?? '');
    setSubjectSpecialty(staffMember.subjectSpecialty ?? '');
    setEditMode(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Record<string, string | undefined> = {};
    if (designationId !== staffMember.designationId) payload.designationId = designationId || undefined;
    const cleanDept = department.trim() || undefined;
    if (cleanDept !== (staffMember.department ?? undefined)) payload.department = cleanDept;
    const cleanJoining = joiningDate || undefined;
    if (cleanJoining !== (staffMember.joiningDate ?? undefined)) payload.joiningDate = cleanJoining;
    const cleanQual = qualification.trim() || undefined;
    if (cleanQual !== (staffMember.qualification ?? undefined)) payload.qualification = cleanQual;
    const cleanSpecialty = subjectSpecialty.trim() || undefined;
    if (cleanSpecialty !== (staffMember.subjectSpecialty ?? undefined)) payload.subjectSpecialty = cleanSpecialty;

    if (Object.keys(payload).length === 0) { setEditMode(false); return; }

    try {
      await updateStaff.mutateAsync({ id: staffMember.id, data: payload });
      setEditMode(false);
    } catch {
      // Error toast handled by hook
    }
  };

  if (editMode) {
    return (
      <form onSubmit={handleSave} className="space-y-4">
        <SectionCard icon={Briefcase} title="Position">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Designation</Label>
              <SearchableSelect
                value={designationId}
                onValueChange={setDesignationId}
                options={designations?.map((d) => ({ value: d.id, label: d.title, description: d.category === 'TEACHING' ? 'Teaching' : d.category === 'NON_TEACHING' ? 'Non-Teaching' : 'Admin' })) ?? []}
                placeholder="Select designation"
                searchPlaceholder="Search designations..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Department</Label>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} className="h-8 text-sm" />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={GraduationCap} title="Professional Details">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Joining Date</Label>
              <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Qualification</Label>
              <Input value={qualification} onChange={(e) => setQualification(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subject Specialty</Label>
              <Input value={subjectSpecialty} onChange={(e) => setSubjectSpecialty(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
        </SectionCard>

        <div className="flex gap-2 pt-2">
          <Button type="submit" size="sm" disabled={updateStaff.isPending}>
            {updateStaff.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5 h-8">
          <Pencil className="w-3.5 h-3.5" /> Edit Profile
        </Button>
      </div>

      {/* Account Info */}
      <SectionCard icon={User} title="Account">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="First Name" value={u.firstName} />
          <InfoRow label="Last Name" value={u.lastName} />
          <InfoRow label="Email" value={<span className="flex items-center gap-1">{u.email}</span>} />
          <InfoRow label="Phone" value={u.phone ?? null} />
        </div>
      </SectionCard>

      {/* Position Info */}
      <SectionCard icon={Briefcase} title="Position">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Designation" value={staffMember.designation?.title} />
          <InfoRow
            label="Category"
            value={
              staffMember.designation?.category
                ? staffMember.designation.category.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
                : null
            }
          />
          <InfoRow label="Department" value={staffMember.department} />
          <InfoRow label="Employee ID" value={staffMember.employeeId} />
        </div>
      </SectionCard>

      {/* Professional Details */}
      <SectionCard icon={GraduationCap} title="Professional Details">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InfoRow label="Joining Date" value={staffMember.joiningDate} />
          <InfoRow label="Qualification" value={staffMember.qualification} />
          <div className="col-span-2">
            <InfoRow label="Subject Specialty" value={staffMember.subjectSpecialty} />
          </div>
        </div>
      </SectionCard>

      {/* Salary — SCHOOL_ADMIN only */}
      {isSchoolAdmin && (
        <SectionCard icon={DollarSign} title="Compensation">
          <div>
            <InfoRow
              label="Salary"
              value={
                staffMember.salary != null
                  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT' }).format(staffMember.salary)
                  : null
              }
            />
            <p className="text-[11px] text-muted-foreground/60 mt-2">
              Salary is read-only. Contact your system admin to modify.
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
