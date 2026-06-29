'use client';

import { GroupedProjectsTable } from '@/components/multi-country/GroupedProjectsTable';
import { AudienceFooter } from '@/components/audience/AudienceFooter';

export default function AudienceLandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      <GroupedProjectsTable />
      <AudienceFooter />
    </div>
  );
}
