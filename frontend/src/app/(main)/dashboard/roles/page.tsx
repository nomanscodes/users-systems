import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RolesPageClient } from './_components/roles-page';

export const metadata: Metadata = {
  title: 'Roles & Permissions',
  description: 'Create and manage system roles. Assign fine-grained permissions to control what each staff member can access.',
};

function LoadingSkeleton() {
  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)] animate-pulse">
      <div className="w-72 shrink-0 rounded-xl bg-muted/40" />
      <div className="flex-1 rounded-xl bg-muted/40" />
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <RolesPageClient />
    </Suspense>
  );
}
