'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';
import { ProjectDetailHeader, ReconciliationTabTrigger } from '@/components/projects/ProjectDetailHeader';
import { PushProjectModal } from '@/components/projects/PushProjectModal';
import { ReconciliationTab } from '@/components/reconciliation/ReconciliationTab';
import { MultiCountryOverviewTab } from '@/components/multi-country/MultiCountryOverviewTab';
import { MultiCountryProjectHeader } from '@/components/multi-country/MultiCountryProjectHeader';
import { CountriesTab } from '@/components/multi-country/CountriesTab';
import { EmptyState } from '@/components/ui/EmptyState';
import { DetailPageContent, DetailTabContainer } from '@/components/ui/page-layout';
import {
  isMultiCountryProject,
  resolveProject,
  saveProject,
  type AudienceProjectDetail,
  type SingleCountryProjectDetail,
} from '@/data/audience-project-store';
import { formatCurrency, type PushProjectResult } from '@/data/mock-audience-projects';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
);

function withLaunchDefaults(project: SingleCountryProjectDetail): SingleCountryProjectDetail {
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
  const searchParams = useSearchParams();
  const { showToast } = useWuShowToast();
  const [project, setProject] = useState<AudienceProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [pushOpen, setPushOpen] = useState(false);

  useEffect(() => {
    setProject(resolveProject(id));
  }, [id]);

  useEffect(() => {
    if (project && project.status !== 'Closed' && activeTab === 'reconciliation') {
      setActiveTab('details');
    }
  }, [project, activeTab]);

  function persist(updated: AudienceProjectDetail) {
    saveProject(updated);
    setProject(updated);
  }

  function handleEdit() {
    router.push('/projects/create');
  }

  function handleLaunch() {
    if (!project) return;
    if (isMultiCountryProject(project)) {
      persist({
        ...project,
        status: 'Live',
        launchDate: 'Jun 1, 2026',
        children: project.children.map((c) => ({ ...c, status: 'Live' as const, collected: Math.floor(c.responses * 0.4) })),
      });
    } else {
      persist(withLaunchDefaults(project));
    }
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

  function handlePushConfirm(result: PushProjectResult) {
    if (!project || isMultiCountryProject(project)) return;
    const nextCount =
      result.mode === 'same' ? (project.sameCpiPushCount ?? 0) + 1 : 0;
    persist({
      ...project,
      costPerInterview: result.cpi,
      sameCpiPushCount: nextCount,
      totalCost: Number((project.responses * result.cpi).toFixed(2)),
    });
    showToast({
      message:
        result.mode === 'same'
          ? `Project pushed at ${formatCurrency(result.cpi)}.`
          : `Project pushed at higher CPI ${formatCurrency(result.cpi)}.`,
      variant: 'success',
    });
  }

  function handleAddCountry() {
    showToast({ message: 'BrandTracker_FR will be created without affecting existing countries', variant: 'success' });
  }

  if (!project) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[#f4f6f9] p-6">
        <EmptyState icon="wm-hourglass-empty" title="Loading project" description="Fetching project details…" />
      </div>
    );
  }

  const reconciliationEnabled = project.status === 'Closed';
  const defaultTab = searchParams.get('country') ? 'countries' : 'overview';

  function handleTabChange(value: string) {
    if (value === 'reconciliation' && !reconciliationEnabled) return;
    setActiveTab(value);
  }

  if (isMultiCountryProject(project)) {
    const tabItems: IWuTabItem[] = [
      {
        value: 'overview',
        Trigger: (
          <span className="flex items-center gap-1.5">
            <span className="wm-dashboard text-base" aria-hidden="true" />
            Overview
          </span>
        ),
        Content: <MultiCountryOverviewTab project={project} />,
      },
      {
        value: 'countries',
        Trigger: (
          <span className="flex items-center gap-1.5">
            <span className="wm-public text-base" aria-hidden="true" />
            Countries
          </span>
        ),
        Content: (
          <CountriesTab
            children={project.children}
            onAddCountry={handleAddCountry}
          />
        ),
      },
      {
        value: 'reconciliation',
        Trigger: <ReconciliationTabTrigger disabled={!reconciliationEnabled} />,
        Content: reconciliationEnabled ? (
          <ReconciliationTab projectName={project.name} />
        ) : (
          <DetailPageContent className="text-center text-sm text-gray-500">
            Reconciliation is available after the project is closed.
          </DetailPageContent>
        ),
      },
    ];

    return (
      <div className="min-h-full bg-[#f4f6f9]">
        <MultiCountryProjectHeader
          project={project}
          onLaunch={handleLaunch}
          onPause={handlePause}
          onResume={handleResume}
          onClose={handleClose}
        />
        <div className="border-b border-[#e0e4e8] bg-white">
          <DetailTabContainer>
            <WuTab items={tabItems} defaultValue={defaultTab} className="w-full" />
          </DetailTabContainer>
        </div>
      </div>
    );
  }

  const tabItems: IWuTabItem[] = [
    {
      value: 'details',
      Trigger: (
        <span className="flex items-center gap-1.5">
          <span className="wm-dashboard text-base" aria-hidden="true" />
          Overview
        </span>
      ),
      Content: (
        <ProjectDashboard project={project} onPush={() => setPushOpen(true)} />
      ),
    },
    {
      value: 'reconciliation',
      Trigger: <ReconciliationTabTrigger disabled={!reconciliationEnabled} />,
      Content: reconciliationEnabled ? (
        <ReconciliationTab projectName={project.name} />
      ) : (
        <DetailPageContent className="text-center text-sm text-gray-500">
          Reconciliation is available after the project is closed.
        </DetailPageContent>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-[#f4f6f9]">
      <ProjectDetailHeader
        project={project}
        onEdit={handleEdit}
        onLaunch={handleLaunch}
        onPause={handlePause}
        onResume={handleResume}
        onClose={handleClose}
      />
      <div className="border-b border-[#e0e4e8] bg-white">
        <DetailTabContainer>
          <WuTab
            items={tabItems}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          />
        </DetailTabContainer>
      </div>

      <PushProjectModal
        open={pushOpen}
        onOpenChange={setPushOpen}
        projectName={project.name}
        currentCpi={project.costPerInterview}
        sameCpiPushCount={project.sameCpiPushCount}
        onConfirm={handlePushConfirm}
      />
    </div>
  );
}
