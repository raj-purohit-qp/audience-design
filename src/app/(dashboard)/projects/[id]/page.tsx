'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { ProjectDashboard }    from '@/components/projects/ProjectDashboard';
import { ReconciliationTab }   from '@/components/reconciliation/ReconciliationTab';
import { EmptyState }          from '@/components/ui/EmptyState';
import {
  resolveAudienceProject,
  saveAudienceProject,
  type AudienceProjectDetail,
} from '@/data/audience-project-store';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false }
);

function withLaunchDefaults(project: AudienceProjectDetail): AudienceProjectDetail {
  return {
    ...project,
    status: 'Live',
    collected: 614,
    launchDate: 'Jun 2, 2026',
    etcDate: 'Jun 26, 2026',
    daysElapsed: 8,
    velocityPerHour: 5,
    realtimeIR: 76,
    realtimeLOI: 6.8,
  };
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [project, setProject] = useState<AudienceProjectDetail | null>(null);

  useEffect(() => {
    setProject(resolveAudienceProject(id));
  }, [id]);

  function persist(updated: AudienceProjectDetail) {
    saveAudienceProject(updated);
    setProject(updated);
  }

  function handleEdit()   { router.push('/projects/create'); }

  function handleLaunch() {
    if (!project) return;
    persist(withLaunchDefaults(project));
    showToast({ message: 'Survey launched!', variant: 'success' });
  }

  function handlePause() {
    if (!project) return;
    persist({ ...project, status: 'Paused' });
    showToast({ message: 'Survey paused.', variant: 'success' });
  }

  function handleResume() {
    if (!project) return;
    persist({ ...project, status: 'Live' });
    showToast({ message: 'Survey resumed.', variant: 'success' });
  }

  function handleClose() {
    if (!project) return;
    persist({ ...project, status: 'Closed' });
    showToast({ message: 'Survey closed.', variant: 'success' });
  }

  if (!project) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[#f4f6f9] p-6">
        <EmptyState icon="wm-hourglass-empty" title="Loading project" description="Fetching project details…" />
      </div>
    );
  }

  const showReconciliation = project.status === 'Closed';

  const tabItems: IWuTabItem[] = [
    {
      value: 'details',
      Trigger: (
        <span className="flex items-center gap-1.5">
          <span className="wm-info text-base" aria-hidden="true" />
          Project details
        </span>
      ),
      Content: (
        <ProjectDashboard
          project={project}
          onEdit={handleEdit}
          onLaunch={handleLaunch}
          onPause={handlePause}
          onResume={handleResume}
          onClose={handleClose}
        />
      ),
    },
    ...(showReconciliation
      ? [
          {
            value: 'reconciliation',
            Trigger: (
              <span className="flex items-center gap-1.5">
                <span className="wm-assignment-return text-base" aria-hidden="true" />
                Reconciliation
              </span>
            ),
            Content: <ReconciliationTab projectName={project.name} />,
          } satisfies IWuTabItem,
        ]
      : []),
  ];

  return (
    <div className="min-h-full bg-[#f4f6f9]">
      <WuTab
        items={tabItems}
        defaultValue="details"
        className="w-full"
      />
    </div>
  );
}
