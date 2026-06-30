import { Metadata } from 'next';
import { AcademicConfiguration } from '@/features/academics/components/academic-configuration';

export const metadata: Metadata = {
  title: 'Academic Configuration',
  description: 'Manage branches, sessions, classes, and subjects.',
};

export default function AcademicSetupPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <AcademicConfiguration />
    </div>
  );
}
