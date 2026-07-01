import { Metadata } from 'next';
import { Suspense } from 'react';
import { AcademicConfiguration } from '@/features/academics/components/academic-configuration';

export const metadata: Metadata = {
  title: 'Academic Configuration',
  description: 'Manage branches, sessions, classes, and subjects.',
};

export default function AcademicSetupPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading configuration...</div>}>
        <AcademicConfiguration />
      </Suspense>
    </div>
  );
}
