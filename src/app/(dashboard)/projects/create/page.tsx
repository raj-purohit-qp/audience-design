'use client';

import { useEffect } from 'react';
import { CreateProjectForm } from '@/components/multi-country/CreateProjectForm';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import { setActiveWorkspaceId } from '@/data/workspace-session';

export default function CreateProjectPage() {
  const { currentUser, isMine } = useWorkspaceSession();
  const canCreate = currentUser.projectCreation.specializedSample;

  useEffect(() => {
    if (!isMine) setActiveWorkspaceId('mine');
  }, [isMine]);

  if (!canCreate) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <EmptyState
          icon="wm-lock"
          title="You can't create Specialized sample projects"
          description="Ask the primary user if you need project creation access."
        />
      </div>
    );
  }

  return <CreateProjectForm />;
}
