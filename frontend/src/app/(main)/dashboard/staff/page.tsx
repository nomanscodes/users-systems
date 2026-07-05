import { Suspense } from 'react';
import type { Metadata } from 'next';
import { StaffPageClient } from './_components/staff-page';

export const metadata: Metadata = {
  title: 'Staff Directory',
  description: 'Manage your school staff — invite, assign designations, roles, and teaching classes.',
};

export default function StaffPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-xl bg-muted/40 animate-pulse" />}>
      <StaffPageClient />
    </Suspense>
  );
}
