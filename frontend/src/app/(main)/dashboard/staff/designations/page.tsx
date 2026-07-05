import { Suspense } from 'react';
import type { Metadata } from 'next';
import { DesignationsPageClient } from './_components/designations-page';

export const metadata: Metadata = {
  title: 'Designations',
  description: 'Manage job designations and categories for your school staff.',
};

export default function DesignationsPage() {
  return (
    <Suspense fallback={<div className="h-64 rounded-xl bg-muted/40 animate-pulse" />}>
      <DesignationsPageClient />
    </Suspense>
  );
}
