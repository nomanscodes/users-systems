'use client';

import { useState } from 'react';
import { Pencil, Loader2, Briefcase, GraduationCap, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateStaff } from '@/features/staff/hooks/use-staff';
import { useDesignations } from '@/features/staff/hooks/use-designations';
import { useAuthStore } from '@/stores/auth.store';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { StaffMember } from '@/features/staff/types/staff.dto';

interface ProfileTabProps {
  staffMember: StaffMember;
}

/** Label + value, completely flat — no wrapper border */
function Field({ label, value }: { label: string; value?: React.ReactNode | null }) {
  return (
    <div className="space-y-0.5 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-sm text-foreground break-words">
        {value || <span className="text-muted-foreground/40 italic text-xs">—</span>}
      </p>
    </div>
  );
}

/** Thin section divider with label — no bg, no card */
function Section({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
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
    } catch { /* toast handled by hook */ }
  };

  /* ── EDIT MODE ── */
  if (editMode) {
    return (
      <form onSubmit={handleSave} className="space-y-5">
        <Section label="Position" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Designation</Label>
            <SearchableSelect
              value={designationId}
              onValueChange={setDesignationId}
              options={designations?.map((d) => ({
                value: d.id, label: d.title,
                description: d.category === 'TEACHING' ? 'Teaching' : d.category === 'NON_TEACHING' ? 'Non-Teaching' : 'Admin',
              })) ?? []}
              placeholder="Select designation"
              searchPlaceholder="Search designations..."
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Department</Label>
            <Input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} />
          </div>
        </div>

        <Section label="Professional Details" />
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Joining Date</Label>
            <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Qualification</Label>
            <Input value={qualification} onChange={(e) => setQualification(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Subject Specialty</Label>
            <Input value={subjectSpecialty} onChange={(e) => setSubjectSpecialty(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" size="sm" disabled={updateStaff.isPending}>
            {updateStaff.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Changes
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  /* ── VIEW MODE ── */
  return (
    <div className="space-y-4">
      {/* Account — Edit button inline with section header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 shrink-0">Account</span>
          <div className="flex-1 h-px bg-border" />
          <Button size="sm" variant="ghost" onClick={startEdit} className="gap-1 h-6 text-xs px-2 text-muted-foreground hover:text-foreground shrink-0">
            <Pencil className="w-3 h-3" />
            Edit
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="First Name" value={u.firstName} />
          <Field label="Last Name" value={u.lastName} />
          <div className="col-span-2">
            <Field label="Email" value={u.email} />
          </div>
          {u.phone && (
            <div className="col-span-2">
              <Field label="Phone" value={u.phone} />
            </div>
          )}
        </div>
      </div>

      {/* Position */}
      <div className="space-y-3">
        <Section label="Position" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Designation" value={staffMember.designation?.title} />
          <Field
            label="Category"
            value={
              staffMember.designation?.category
                ? staffMember.designation.category.replace('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
                : null
            }
          />
          <Field label="Department" value={staffMember.department} />
          <Field label="Employee ID" value={staffMember.employeeId} />
        </div>
      </div>

      {/* Professional Details */}
      <div className="space-y-3">
        <Section label="Professional Details" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Joining Date" value={staffMember.joiningDate} />
          <Field label="Qualification" value={staffMember.qualification} />
          <div className="col-span-2">
            <Field label="Subject Specialty" value={staffMember.subjectSpecialty} />
          </div>
        </div>
      </div>

      {/* Compensation — admin only */}
      {isSchoolAdmin && (
        <div className="space-y-3">
          <Section label="Compensation" />
          <Field
            label="Salary"
            value={
              staffMember.salary != null
                ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'BDT' }).format(staffMember.salary)
                : null
            }
          />
          <p className="text-[11px] text-muted-foreground/40">Salary is read-only. Contact your system admin to modify.</p>
        </div>
      )}
    </div>
  );
}
