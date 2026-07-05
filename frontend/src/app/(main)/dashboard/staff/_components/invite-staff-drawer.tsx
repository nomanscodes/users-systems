'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useDesignations } from '@/features/staff/hooks/use-designations';
import { useRoles } from '@/features/rbac/hooks/use-roles';
import { useInviteStaff } from '@/features/staff/hooks/use-staff';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { InviteStaffResponse } from '@/features/staff/types/staff.dto';


interface InviteStaffDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (response: InviteStaffResponse) => void;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { step: 1 as Step, label: 'Personal Details' },
  { step: 2 as Step, label: 'Designation' },
  { step: 3 as Step, label: 'Roles' },
];

export function InviteStaffDrawer({ open, onClose, onSuccess }: InviteStaffDrawerProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);

  // Step 1 fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 2 field
  const [designationId, setDesignationId] = useState('');

  // Step 3 field
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleError, setRoleError] = useState('');

  // Field errors
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [designationError, setDesignationError] = useState('');

  const { data: designations } = useDesignations();
  const { data: roles } = useRoles();
  const inviteStaff = useInviteStaff();

  const reset = () => {
    setCurrentStep(1);
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setDepartment('');
    setEmailError(''); setFirstNameError(''); setLastNameError('');
    setDesignationId(''); setDesignationError('');
    setSelectedRoleIds([]); setRoleError('');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleNext = () => {
    if (currentStep === 1) {
      let valid = true;
      if (!firstName.trim()) { setFirstNameError('First name is required.'); valid = false; }
      if (!lastName.trim()) { setLastNameError('Last name is required.'); valid = false; }
      if (!email.trim()) { setEmailError('Email is required.'); valid = false; }
      if (!valid) return;
    }
    if (currentStep === 2) {
      if (!designationId) { setDesignationError('Please select a designation.'); return; }
    }
    setCurrentStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  };

  const handleBack = () => setCurrentStep((s) => (s > 1 ? ((s - 1) as Step) : s));

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
    );
    setRoleError('');
  };

  const handleSubmit = async () => {
    if (selectedRoleIds.length === 0) {
      setRoleError('Select at least one role.');
      return;
    }

    try {
      const response = await inviteStaff.mutateAsync({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        designationId,
        roleIds: selectedRoleIds,
      });
      reset();
      onSuccess(response);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      const msg: string = err?.message || '';

      if (status === 409 || msg.toLowerCase().includes('email')) {
        // Go back to Step 1 to show the email error
        setCurrentStep(1);
        setEmailError('A user with this email already exists.');
      } else if (status === 404) {
        setRoleError('One or more selected roles or designations no longer exist. Please reselect.');
      } else {
        setRoleError('Failed to invite staff member. Please try again.');
      }
    }
  };

  const noDesignations = !designations || designations.length === 0;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden" side="right">
        <SheetHeader className="px-6 pt-6 pb-4 shrink-0">
          <SheetTitle>Invite Staff Member</SheetTitle>
          <SheetDescription>
            Add a new staff member to your school. They will receive a temporary password.
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center px-6 py-3 border-b border-t shrink-0">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex items-center min-w-0">
              <div
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  currentStep === s.step
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > s.step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {currentStep > s.step ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
              </div>
              <span
                className={`ml-2 text-xs whitespace-nowrap ${
                  currentStep === s.step ? 'font-medium' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-6 shrink-0 h-px bg-border mx-3" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* ─ Step 1: Personal Details ─ */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-first-name">First Name <span className="text-destructive">*</span></Label>
                  <Input id="inv-first-name" value={firstName} onChange={(e) => { setFirstName(e.target.value); setFirstNameError(''); }} maxLength={100} />
                  {firstNameError && <p className="text-xs text-destructive">{firstNameError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-last-name">Last Name <span className="text-destructive">*</span></Label>
                  <Input id="inv-last-name" value={lastName} onChange={(e) => { setLastName(e.target.value); setLastNameError(''); }} maxLength={100} />
                  {lastNameError && <p className="text-xs text-destructive">{lastNameError}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-email">Email <span className="text-destructive">*</span></Label>
                <Input id="inv-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }} maxLength={255} />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-phone">Phone</Label>
                <Input id="inv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-department">Department</Label>
                <Input id="inv-department" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} placeholder="e.g. Science Department" />
              </div>

              <p className="text-xs text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                Additional details (joining date, qualifications) can be added after the staff member is created.
              </p>
            </>
          )}

          {/* ─ Step 2: Designation ─ */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {noDesignations ? (
                <div className="flex flex-col gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No designations configured</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      You need at least one designation before inviting staff.
                    </p>
                  </div>
                  <Link href="/dashboard/staff/designations" className="text-xs font-medium text-amber-700 dark:text-amber-300 underline">
                    Go to Designations settings →
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Designation <span className="text-destructive">*</span></Label>
                  <SearchableSelect
                    value={designationId}
                    onValueChange={(v) => { setDesignationId(v); setDesignationError(''); }}
                    options={
                      designations?.map((d) => ({
                        value: d.id,
                        label: d.title,
                        description: d.category === 'TEACHING' ? 'Teaching' : d.category === 'NON_TEACHING' ? 'Non-Teaching' : 'Admin',
                      })) ?? []
                    }
                    placeholder="Select a designation"
                    searchPlaceholder="Search designations..."
                  />
                  {designationError && <p className="text-xs text-destructive">{designationError}</p>}
                </div>
              )}
            </div>
          )}

          {/* ─ Step 3: Roles ─ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Roles control what this staff member can access in the system. Select at least one.
                </p>
              </div>

              {roles && roles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No roles available. Create roles in Roles & Permissions first.
                </p>
              ) : (
                <div className="space-y-2">
                  {roles?.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-start gap-3 rounded-lg border px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => toggleRole(role.id)}
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.includes(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {roleError && <p className="text-xs text-destructive">{roleError}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-between shrink-0">
          <Button variant="ghost" onClick={currentStep === 1 ? handleClose : handleBack}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          {currentStep < 3 ? (
            <Button onClick={handleNext} disabled={currentStep === 2 && noDesignations}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={inviteStaff.isPending}>
              {inviteStaff.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Invite Staff Member
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
