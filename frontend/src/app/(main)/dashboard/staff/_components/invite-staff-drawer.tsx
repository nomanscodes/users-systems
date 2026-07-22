'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const CATEGORY_CONFIG = {
  TEACHING: { label: 'Teaching', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400' },
  NON_TEACHING: { label: 'Non-Teaching', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' },
  ADMIN: { label: 'Admin', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400' },
} as const;

export function InviteStaffDrawer({ open, onClose, onSuccess }: InviteStaffDrawerProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [emailError, setEmailError] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleError, setRoleError] = useState('');
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
    if (selectedRoleIds.length === 0) { setRoleError('Select at least one role.'); return; }
    try {
      const response = await inviteStaff.mutateAsync({
        email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(),
        phone: phone.trim() || undefined, department: department.trim() || undefined,
        designationId, roleIds: selectedRoleIds,
      });
      reset();
      onSuccess(response);
    } catch (err: any) {
      const status = err?.statusCode ?? err?.status;
      const msg: string = err?.message || '';
      if (status === 409 || msg.toLowerCase().includes('email')) {
        setCurrentStep(1); setEmailError('A user with this email already exists.');
      } else if (status === 404) {
        setRoleError('One or more selected roles or designations no longer exist.');
      } else {
        setRoleError('Failed to invite staff member. Please try again.');
      }
    }
  };

  const noDesignations = !designations || designations.length === 0;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0 overflow-hidden" side="right">

        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b shrink-0">
          <SheetTitle className="text-[15px] font-semibold">Invite Staff Member</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Add a new staff member. They will receive a temporary password.
          </SheetDescription>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="flex items-center px-6 py-3 border-b shrink-0 bg-muted/20">
          {STEPS.map((s, i) => (
            <div key={s.step} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-colors ${
                    currentStep === s.step
                      ? 'bg-primary border-primary text-primary-foreground'
                      : currentStep > s.step
                      ? 'bg-primary/15 border-primary/30 text-primary'
                      : 'bg-transparent border-border text-muted-foreground'
                  }`}
                >
                  {currentStep > s.step ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    s.step
                  )}
                </div>
                <span
                  className={`text-xs truncate ${
                    currentStep === s.step
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-2 h-px bg-border min-w-[12px]" />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Step 1 */}
          {currentStep === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-first-name" className="text-xs font-medium">
                    First Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inv-first-name"
                    value={firstName}
                    onChange={(e) => { setFirstName(e.target.value); setFirstNameError(''); }}
                    maxLength={100}
                    placeholder="Jane"
                    className={firstNameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}
                  />
                  {firstNameError && <p className="text-xs text-destructive">{firstNameError}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inv-last-name" className="text-xs font-medium">
                    Last Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="inv-last-name"
                    value={lastName}
                    onChange={(e) => { setLastName(e.target.value); setLastNameError(''); }}
                    maxLength={100}
                    placeholder="Doe"
                    className={lastNameError ? 'border-destructive focus-visible:ring-destructive/20' : ''}
                  />
                  {lastNameError && <p className="text-xs text-destructive">{lastNameError}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-email" className="text-xs font-medium">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  maxLength={255}
                  placeholder="jane.doe@school.com"
                  className={emailError ? 'border-destructive focus-visible:ring-destructive/20' : ''}
                />
                {emailError && <p className="text-xs text-destructive">{emailError}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-phone" className="text-xs font-medium">
                  Phone <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input id="inv-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} placeholder="+880 17..." />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-department" className="text-xs font-medium">
                  Department <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  id="inv-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Science Department"
                />
              </div>

              <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2 border">
                Joining date, qualifications, and salary can be added after creation.
              </p>
            </>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {noDesignations ? (
                <div className="flex flex-col gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">No designations configured</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Create at least one designation before inviting staff.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/staff/designations"
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline ml-7"
                  >
                    Go to Designations <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Designation <span className="text-destructive">*</span>
                  </Label>
                  <SearchableSelect
                    value={designationId}
                    onValueChange={(v) => { setDesignationId(v); setDesignationError(''); }}
                    options={
                      designations?.map((d) => ({
                        value: d.id,
                        label: d.title,
                        description:
                          d.category === 'TEACHING' ? 'Teaching' :
                          d.category === 'NON_TEACHING' ? 'Non-Teaching' : 'Admin',
                      })) ?? []
                    }
                    placeholder="Select a designation"
                    searchPlaceholder="Search designations..."
                  />
                  {designationError && <p className="text-xs text-destructive">{designationError}</p>}

                  {designationId && (() => {
                    const d = designations?.find((x) => x.id === designationId);
                    if (!d) return null;
                    const cat = CATEGORY_CONFIG[d.category as keyof typeof CATEGORY_CONFIG];
                    return (
                      <div className="flex items-center gap-2 mt-2 rounded-lg border bg-muted/30 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{d.title}</p>
                        </div>
                        {cat && (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${cat.cls}`}>
                            {cat.label}
                          </span>
                        )}
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2 border">
                Roles control what this staff member can access. Select at least one.
              </p>

              {roles && roles.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No roles available. Create roles in Roles &amp; Permissions first.
                </p>
              ) : (
                <div className="space-y-2">
                  {roles?.map((role) => {
                    const isSelected = selectedRoleIds.includes(role.id);
                    return (
                      <div
                        key={role.id}
                        className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
                            : 'border-border hover:bg-muted/30'
                        }`}
                        onClick={() => toggleRole(role.id)}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
                          }`}
                        >
                          {isSelected && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{role.name}</p>
                            {role.isSystemRole && (
                              <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">system</span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{role.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {roleError && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive">{roleError}</p>
                </div>
              )}

              {selectedRoleIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{selectedRoleIds.length}</span>{' '}
                  role{selectedRoleIds.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex items-center justify-between shrink-0">
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
