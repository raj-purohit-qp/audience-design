'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { ProjectDashboard } from '@/components/projects/ProjectDashboard';
import { ProjectDetailHeader, ReconciliationTabTrigger } from '@/components/projects/ProjectDetailHeader';
import { PushProjectModal } from '@/components/projects/PushProjectModal';
import { TopUpModal } from '@/components/projects/TopUpModal';
import { ReconciliationTab } from '@/components/reconciliation/ReconciliationTab';
import { MultiCountryOverviewTab } from '@/components/multi-country/MultiCountryOverviewTab';
import { MultiCountryProjectHeader } from '@/components/multi-country/MultiCountryProjectHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DetailPageContent, DetailTabContainer } from '@/components/ui/page-layout';
import { WorkspaceContextBar } from '@/components/workspace/WorkspaceContextBar';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import {
  getProjectOwnerId,
  possessiveName,
} from '@/data/mock-workspace';
import { setActiveWorkspaceId } from '@/data/workspace-session';
import {
  attachMultiCountryTopUp,
  attachTopUpChild,
  buildAudienceProjectDetail,
  countryOriginalRequired,
  isMultiCountryProject,
  nextTopUpProjectName,
  perCountryRequiredResponses,
  resolveProject,
  saveProject,
  type AudienceProjectDetail,
  type SingleCountryProjectDetail,
} from '@/data/audience-project-store';
import { getCountryByCode, MULTI_COUNTRY_CATALOG } from '@/data/mock-multi-country';
import { formatCurrency, type PushProjectResult } from '@/data/mock-audience-projects';
import { markAudienceProjectLaunched } from '@/data/mock-home';

const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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
  const { showToast } = useWuShowToast();
  const workspace = useWorkspaceSession();
  const [project, setProject] = useState<AudienceProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [pushOpen, setPushOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpCountry, setTopUpCountry] = useState('');

  useEffect(() => {
    setProject(resolveProject(id));
  }, [id]);

  const ownerId = project ? getProjectOwnerId(project.id) : null;
  const isOwnProject = ownerId === workspace.currentUser.id;
  const sharedGrant = ownerId
    ? workspace.sharedWorkspaces.find((item) => item.id === ownerId)
    : undefined;
  const hasAccess = Boolean(project) && (isOwnProject || Boolean(sharedGrant));
  const readOnly = Boolean(project) && !isOwnProject && sharedGrant?.access === 'read';
  const projectOwner =
    ownerId === workspace.currentUser.id
      ? workspace.currentUser
      : workspace.members.find((member) => member.id === ownerId);

  useEffect(() => {
    if (!project || !ownerId || !hasAccess) return;
    const nextId = isOwnProject ? 'mine' : ownerId;
    if (workspace.isMine && isOwnProject) return;
    if (!workspace.isMine && workspace.activeId === ownerId) return;
    setActiveWorkspaceId(nextId);
  }, [project, ownerId, hasAccess, isOwnProject, workspace.isMine, workspace.activeId]);

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
    if (readOnly) return;
    router.push('/projects/create');
  }

  function handleLaunch() {
    if (!project || readOnly) return;
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
    markAudienceProjectLaunched();
    showToast({ message: 'Survey launched!', variant: 'success' });
  }

  function handlePause() {
    if (!project || readOnly) return;
    persist({ ...project, status: 'Paused' });
    showToast({ message: 'Survey paused.', variant: 'success' });
  }

  function handleResume() {
    if (!project || readOnly) return;
    persist({ ...project, status: 'Live' });
    showToast({ message: 'Survey resumed.', variant: 'success' });
  }

  function handleClose() {
    if (!project || readOnly) return;
    if (isMultiCountryProject(project)) {
      persist({
        ...project,
        status: 'Closed',
        originalRequiredResponses:
          project.originalRequiredResponses ?? perCountryRequiredResponses(project),
        children: project.children.map((child) => ({ ...child, status: 'Closed' as const })),
      });
    } else {
      persist({
        ...project,
        status: 'Closed',
        originalRequiredResponses: project.originalRequiredResponses ?? project.responses,
      });
    }
    showToast({ message: 'Survey closed.', variant: 'success' });
  }

  function handleTopUpConfirm(additionalResponses: number) {
    if (!project || readOnly) return;
    if (!isMultiCountryProject(project) && project.topUpOfProjectId) return;
    if (isMultiCountryProject(project)) {
      if (!topUpCountry) return;
      const country = getCountryByCode(topUpCountry);
      const parent = attachMultiCountryTopUp(project, {
        name: nextTopUpProjectName(project.name, topUpCountry),
        countryCode: topUpCountry,
        responses: additionalResponses,
        incidenceRate: project.incidenceRate,
        surveyLengthMinutes: project.surveyLengthMinutes,
      });
      persist(parent);
      markAudienceProjectLaunched();
      showToast({
        message: `Top-up started — collecting ${additionalResponses.toLocaleString()} additional responses in ${country?.label ?? topUpCountry}.`,
        variant: 'success',
      });
      return;
    }
    const country =
      MULTI_COUNTRY_CATALOG.find((item) => item.label === project.country) ??
      MULTI_COUNTRY_CATALOG[0];
    const child = buildAudienceProjectDetail({
      name: nextTopUpProjectName(project.name),
      country,
      responses: additionalResponses,
      incidenceRate: project.incidenceRate,
      surveyLengthMinutes: project.surveyLengthMinutes,
      demographics: project.demographics,
      genderQuotas: project.genderQuotas,
      uniqueResponseProjects: project.uniqueResponseProjects,
      status: 'Live',
    });
    const { parent } = attachTopUpChild(project, {
      ...child,
      costPerInterview: project.costPerInterview,
      totalCost: Number((project.costPerInterview * additionalResponses).toFixed(2)),
    });
    persist(parent);
    markAudienceProjectLaunched();
    showToast({
      message: `Top-up started — collecting ${additionalResponses.toLocaleString()} additional responses.`,
      variant: 'success',
    });
  }

  function handlePushConfirm(result: PushProjectResult) {
    if (!project || isMultiCountryProject(project) || readOnly) return;
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

  if (!project) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[#f4f6f9] p-6">
        <EmptyState icon="wm-hourglass-empty" title="Loading project" description="Fetching project details…" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex min-h-[320px] items-center justify-center bg-[#f4f6f9] p-6">
        <EmptyState
          icon="wm-lock"
          title="Access unavailable"
          description={`You no longer have access to ${possessiveName(projectOwner?.name ?? 'this')} workspace.`}
          action={
            <WuButton onClick={workspace.returnToMyWorkspace}>Go to My Workspace</WuButton>
          }
        />
      </div>
    );
  }

  const reconciliationEnabled = project.status === 'Closed';

  function handleTabChange(value: string) {
    if (value === 'reconciliation' && !reconciliationEnabled) return;
    setActiveTab(value);
  }

  if (isMultiCountryProject(project)) {
    const selectedOriginalChild = project.children.find(
      (child) => child.countryCode === topUpCountry && !child.id.includes('-topup-'),
    );
    const showCountryTopUp = !readOnly && selectedOriginalChild?.status === 'Closed';

    const tabItems: IWuTabItem[] = [
      {
        value: 'overview',
        Trigger: (
          <span className="flex items-center gap-1.5">
            <span className="wm-dashboard text-base" aria-hidden="true" />
            Overview
          </span>
        ),
        Content: (
          <MultiCountryOverviewTab
            project={project}
            onCountryViewChange={setTopUpCountry}
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
        <WorkspaceContextBar
          isMine={isOwnProject}
          ownerName={projectOwner?.name ?? workspace.owner.name}
          access={isOwnProject ? 'owner' : sharedGrant?.access ?? 'read'}
        />
        <MultiCountryProjectHeader
          project={project}
          onLaunch={handleLaunch}
          onPause={handlePause}
          onResume={handleResume}
          onClose={handleClose}
          onTopUp={showCountryTopUp ? () => setTopUpOpen(true) : undefined}
          readOnly={readOnly}
        />
        <div className="border-b border-[#e0e4e8] bg-white">
          <DetailTabContainer>
            <WuTab items={tabItems} defaultValue="overview" className="w-full" />
          </DetailTabContainer>
        </div>
        <TopUpModal
          open={topUpOpen}
          onOpenChange={setTopUpOpen}
          originalRequiredResponses={
            topUpCountry
              ? countryOriginalRequired(project, topUpCountry)
              : perCountryRequiredResponses(project)
          }
          reconciledResponses={project.reconciledResponses ?? 0}
          quantityNote="This quantity is added to this country only."
          sameCriteriaDescription="Keep this country’s targeting and add responses for it only."
          onConfirmSameCriteria={handleTopUpConfirm}
          onEditCriteria={() => {
            if (!topUpCountry) return;
            router.push(`/projects/create?topUpFrom=${project.id}&country=${topUpCountry}`);
          }}
        />
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
        <ProjectDashboard
          project={project}
          onPush={readOnly ? undefined : () => setPushOpen(true)}
        />
      ),
    },
    {
      value: 'reconciliation',
      Trigger: <ReconciliationTabTrigger disabled={!reconciliationEnabled} />,
      Content: reconciliationEnabled ? (
        <ReconciliationTab
          projectName={project.name}
          onReconciled={(idsSubmitted) => {
            persist({
              ...project,
              reconciledResponses: (project.reconciledResponses ?? 0) + idsSubmitted,
            });
          }}
        />
      ) : (
        <DetailPageContent className="text-center text-sm text-gray-500">
          Reconciliation is available after the project is closed.
        </DetailPageContent>
      ),
    },
  ];

  return (
    <div className="min-h-full bg-[#f4f6f9]">
      <WorkspaceContextBar
        isMine={isOwnProject}
        ownerName={projectOwner?.name ?? workspace.owner.name}
        access={isOwnProject ? 'owner' : sharedGrant?.access ?? 'read'}
      />
      <ProjectDetailHeader
        project={project}
        onEdit={handleEdit}
        onLaunch={handleLaunch}
        onPause={handlePause}
        onResume={handleResume}
        onClose={handleClose}
        onTopUp={
          readOnly || project.topUpOfProjectId ? undefined : () => setTopUpOpen(true)
        }
        readOnly={readOnly}
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
      <TopUpModal
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        originalRequiredResponses={project.originalRequiredResponses ?? project.responses}
        reconciledResponses={project.reconciledResponses ?? 0}
        onConfirmSameCriteria={handleTopUpConfirm}
        onEditCriteria={() => router.push(`/projects/create?topUpFrom=${project.id}`)}
      />
    </div>
  );
}
