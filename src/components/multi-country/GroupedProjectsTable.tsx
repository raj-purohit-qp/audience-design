'use client';

import { useMemo, useState, type MouseEvent, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { AudienceProject, AudienceProjectStatus, PushProjectResult } from '@/data/mock-audience-projects';
import {
  MOCK_AUDIENCE_PROJECTS,
  formatCurrency,
} from '@/data/mock-audience-projects';
import {
  MOCK_MULTI_COUNTRY_PARENT,
  type ChildCountryProject,
} from '@/data/mock-multi-country';
import { PushProjectModal } from '@/components/projects/PushProjectModal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import { isLaunchedStatus, markAudienceProjectLaunched } from '@/data/mock-home';
import {
  DEMO_WORKSPACE_OPTIONS,
  getProjectOwnerId,
  possessiveName,
  workspaceDescription,
  workspaceHeading,
  type DemoWorkspaceScenario,
} from '@/data/mock-workspace';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false },
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false },
);

const STATUS_DOT: Record<AudienceProjectStatus, string> = {
  Bid: 'bg-[#1b87e6]',
  Paused: 'bg-[#f9ab00]',
  'Soft-launched': 'bg-[#1b87e6]',
  Live: 'bg-[#188038]',
  Closed: 'bg-[#9aa0a6]',
};

/** Dropdown option labels (stored value → menu label). Full-launch maps to Live. */
const STATUS_OPTION_LABEL: Record<AudienceProjectStatus, string> = {
  Bid: 'Bid',
  Paused: 'Paused',
  'Soft-launched': 'Soft-launch',
  Live: 'Full-launch',
  Closed: 'Closed',
};

const STATUS_TRANSITIONS: Record<AudienceProjectStatus, AudienceProjectStatus[]> = {
  Bid: ['Soft-launched', 'Live', 'Closed'],
  'Soft-launched': ['Paused', 'Live', 'Closed'],
  Live: ['Soft-launched', 'Paused', 'Closed'],
  Paused: ['Soft-launched', 'Live', 'Closed'],
  Closed: [],
};

type ChildProjectRow = ChildCountryProject & {
  sameCpiPushCount: number;
};

interface ProjectRowMetrics {
  id: string;
  name: string;
  projectId: string;
  href: string;
  status: AudienceProjectStatus;
  progressPercent: number;
  completesCurrent: number;
  completesTarget: number;
  averageCpi: number;
  actualCost: number;
  totalCost: number;
  sameCpiPushCount: number;
  indent?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

type PushTarget = {
  id: string;
  name: string;
  costPerComplete: number;
  sameCpiPushCount: number;
  kind: 'standalone' | 'child' | 'parent';
};

function StatusBadge({ status }: { status: AudienceProjectStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#3c4043]">
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {status}
    </span>
  );
}

function StatusCell({
  status,
  onChange,
}: {
  status: AudienceProjectStatus;
  onChange?: (next: AudienceProjectStatus) => void;
}) {
  const options = STATUS_TRANSITIONS[status];
  const canChange = Boolean(onChange) && options.length > 0;

  if (!canChange) {
    return <StatusBadge status={status} />;
  }

  return (
    <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <WuMenu
        variant="outlined"
        position={{ side: 'bottom', align: 'start', sideOffset: 4 }}
        Trigger={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded border border-[#dadce0] bg-white px-2 py-0.5 text-sm text-[#3c4043] hover:bg-[#f8f9fa]"
            aria-label={`Change status from ${status}`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
            {status}
            <span className="wm-expand-more text-sm text-[#5f6368]" aria-hidden="true" />
          </button>
        }
      >
        {options.map((option) => (
          <WuMenuItem key={option} onClick={() => onChange?.(option)}>
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[option]}`}
                aria-hidden="true"
              />
              {STATUS_OPTION_LABEL[option]}
            </span>
          </WuMenuItem>
        ))}
      </WuMenu>
    </div>
  );
}

function SelectAllCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={(e) => onChange(e.target.checked)}
      aria-label="Select all projects"
      className="h-4 w-4 accent-[#1b87e6]"
    />
  );
}

const HEADER_CELL =
  'h-10 px-4 text-left align-middle text-xs font-medium text-[#545E6B]';

function SortIcons() {
  return (
    <span className="ml-1 inline-flex flex-col leading-none text-[#8c9baa]" aria-hidden="true">
      <span className="wm-arrow-drop-up -mb-1 text-[10px]" />
      <span className="wm-arrow-drop-down -mt-1 text-[10px]" />
    </span>
  );
}

function SortableHeader({ children }: { children: ReactNode }) {
  return (
    <th className={HEADER_CELL}>
      <span className="inline-flex items-center">
        {children}
        <SortIcons />
      </span>
    </th>
  );
}

function ProgressCell({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="min-w-[88px]">
      <div className="mb-1 text-sm tabular-nums text-[#3c4043]">{pct}%</div>
      <div className="h-1 overflow-hidden rounded-full bg-[#e8eaed]">
        <div
          className="h-full rounded-full bg-[#1b87e6] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** WickUI accordion chevron — placed on the far right of expandable rows. */
function AccordionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span
      className={`wm-expand-more inline-flex text-base text-[#5f6368] transition-transform duration-200 ${
        expanded ? 'rotate-180' : ''
      }`}
      aria-hidden="true"
    />
  );
}

function childToRow(child: ChildProjectRow, parentId: string): ProjectRowMetrics {
  const progressPercent =
    child.responses > 0 ? Math.round((child.collected / child.responses) * 100) : 0;

  return {
    id: child.id,
    // Country code stays as the right-side suffix only (e.g. BrandTracker_DE)
    name: child.name,
    projectId: child.projectId,
    href: `/projects/${parentId}?country=${child.countryCode}`,
    status: child.status as AudienceProjectStatus,
    progressPercent,
    completesCurrent: child.collected,
    completesTarget: child.responses,
    averageCpi: child.cpi,
    actualCost: Number((child.collected * child.cpi).toFixed(2)),
    totalCost: child.totalCost,
    sameCpiPushCount: child.sameCpiPushCount,
    indent: true,
  };
}

const TABLE_COL_COUNT = 10;

function ProjectDividerRow() {
  return (
    <tr aria-hidden="true" className="pointer-events-none">
      <td colSpan={TABLE_COL_COUNT} className="p-0">
        <div className="h-px w-full bg-[#e0e4e8]" />
      </td>
    </tr>
  );
}

function ProjectTableRow({
  row,
  selected,
  onSelect,
  onPush,
  onStatusChange,
  dividerBelow = false,
}: {
  row: ProjectRowMetrics;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onPush?: (row: ProjectRowMetrics) => void;
  onStatusChange?: (next: AudienceProjectStatus) => void;
  /** Project-level separator; for multi-country, only under the last country row. */
  dividerBelow?: boolean;
}) {
  const showPush = row.status === 'Live' && !!onPush;

  function handleRowClick(e: MouseEvent<HTMLTableRowElement>) {
    if (!row.expandable || !row.onToggle) return;
    const target = e.target as HTMLElement;
    // Keep checkbox, links, buttons, and other controls from toggling the accordion.
    if (target.closest('a, button, input, label, [role="button"]')) return;
    row.onToggle();
  }

  return (
    <>
      <tr
        className={`group hover:bg-[#f8f9fa] ${row.expandable ? 'cursor-pointer' : ''}`}
        data-expanded={row.expanded}
        onClick={handleRowClick}
      >
        <td className="w-10 px-3 py-3" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${row.name}`}
            className="h-4 w-4 accent-[rgb(var(--wu-blue-p))]"
          />
        </td>
        <td className={`px-3 py-3 ${row.indent ? 'pl-10' : ''}`}>
          <Link
            href={row.href}
            className="font-medium text-[rgb(var(--wu-blue-p))] hover:text-[rgb(var(--wu-blue-pHover-deep))] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.name}
          </Link>
          <span className="mt-0.5 block text-xs text-[#80868b]">
            Project ID: {row.projectId}
          </span>
        </td>
        <td className="px-3 py-3">
          <StatusCell status={row.status} onChange={onStatusChange} />
        </td>
        <td className="px-3 py-3">
          <ProgressCell value={row.progressPercent} />
        </td>
        <td className="px-3 py-3 tabular-nums text-[#3c4043]">
          {row.completesCurrent.toLocaleString()} of {row.completesTarget.toLocaleString()}
        </td>
        <td className="px-3 py-3 tabular-nums text-[#3c4043]">
          {formatCurrency(row.averageCpi)}
        </td>
        <td className="px-3 py-3 tabular-nums text-[#3c4043]">
          {formatCurrency(row.actualCost)}
        </td>
        <td className="px-3 py-3 tabular-nums text-[#3c4043]">
          {formatCurrency(row.totalCost)}
        </td>
        <td className="w-[5.5rem] px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
          {showPush ? (
            <div className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <WuButton
                type="button"
                variant="outlined"
                color="primary"
                size="sm"
                onClick={() => onPush(row)}
                aria-label={`Push ${row.name}`}
              >
                Push
              </WuButton>
            </div>
          ) : null}
        </td>
        <td className="w-10 px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
          {row.expandable ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-[#f1f3f4]"
              onClick={row.onToggle}
              aria-expanded={row.expanded}
              aria-label={row.expanded ? 'Collapse countries' : 'Expand countries'}
            >
              <AccordionChevron expanded={!!row.expanded} />
            </button>
          ) : null}
        </td>
      </tr>
      {dividerBelow ? <ProjectDividerRow /> : null}
    </>
  );
}

function aggregateChildren(children: ChildProjectRow[]) {
  const totalResponses = children.reduce((s, c) => s + c.responses, 0);
  const totalCollected = children.reduce((s, c) => s + c.collected, 0);
  const totalCost = children.reduce((s, c) => s + c.totalCost, 0);
  const actualCost = children.reduce((s, c) => s + c.collected * c.cpi, 0);
  const progressPercent =
    totalResponses > 0 ? Math.round((totalCollected / totalResponses) * 100) : 0;
  const averageCpi = totalResponses > 0 ? totalCost / totalResponses : 0;

  return {
    totalResponses,
    totalCollected,
    totalCost,
    actualCost: Number(actualCost.toFixed(2)),
    progressPercent,
    averageCpi: Number(averageCpi.toFixed(2)),
  };
}

export function GroupedProjectsTable() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const {
    scenario,
    setScenario,
    isMine,
    owner,
    canWrite,
    canCreate,
    hideMyProjects,
    isRevoked,
    revokedOwnerName,
    returnToMyWorkspace,
  } = useWorkspaceSession();
  const [search, setSearch] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    () => new Set([MOCK_MULTI_COUNTRY_PARENT.id]),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [projects, setProjects] = useState<AudienceProject[]>(() =>
    MOCK_AUDIENCE_PROJECTS.map((p) => ({ ...p })),
  );
  const [multiChildren, setMultiChildren] = useState<ChildProjectRow[]>(() =>
    MOCK_MULTI_COUNTRY_PARENT.children.map((c) => ({ ...c, sameCpiPushCount: 0 })),
  );
  const [parentSameCpiPushCount, setParentSameCpiPushCount] = useState(0);
  const [parentStatus, setParentStatus] = useState<AudienceProjectStatus>(
    () => MOCK_MULTI_COUNTRY_PARENT.status as AudienceProjectStatus,
  );
  const [pushTarget, setPushTarget] = useState<PushTarget | null>(null);

  const parentMetrics = useMemo(() => aggregateChildren(multiChildren), [multiChildren]);
  const workspaceOwnerId = owner.id;

  const filteredStandalone = useMemo(() => {
    const owned =
      hideMyProjects && isMine
        ? []
        : projects.filter((project) => getProjectOwnerId(project.id) === workspaceOwnerId);
    const query = search.trim().toLowerCase();
    if (!query) return owned;
    return owned.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query),
    );
  }, [projects, search, workspaceOwnerId, hideMyProjects, isMine]);

  const showParent = useMemo(() => {
    if (hideMyProjects && isMine) return false;
    if (getProjectOwnerId(MOCK_MULTI_COUNTRY_PARENT.id) !== workspaceOwnerId) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      MOCK_MULTI_COUNTRY_PARENT.name.toLowerCase().includes(query) ||
      MOCK_MULTI_COUNTRY_PARENT.projectId.toLowerCase().includes(query) ||
      multiChildren.some(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.projectId.toLowerCase().includes(query),
      )
    );
  }, [search, multiChildren, workspaceOwnerId, hideMyProjects, isMine]);

  const visibleChildRows = useMemo(() => {
    if (!showParent || !expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id)) return [];
    return multiChildren.map((child) => childToRow(child, MOCK_MULTI_COUNTRY_PARENT.id));
  }, [showParent, expandedParents, multiChildren]);

  const visibleRowIds = useMemo(() => {
    const ids: string[] = [];
    if (showParent) {
      ids.push(MOCK_MULTI_COUNTRY_PARENT.id);
      visibleChildRows.forEach((row) => ids.push(row.id));
    }
    filteredStandalone.forEach((p) => ids.push(p.id));
    return ids;
  }, [showParent, visibleChildRows, filteredStandalone]);

  const allVisibleSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedIds.has(id));

  function toggleParent(id: string) {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) visibleRowIds.forEach((id) => next.add(id));
      else visibleRowIds.forEach((id) => next.delete(id));
      return next;
    });
  }

  function handleStatusChange(
    id: string,
    kind: 'standalone' | 'child' | 'parent',
    next: AudienceProjectStatus,
  ) {
    if (!canWrite) return;
    const allowed =
      kind === 'parent'
        ? STATUS_TRANSITIONS[parentStatus]
        : kind === 'child'
          ? STATUS_TRANSITIONS[
              (multiChildren.find((c) => c.id === id)?.status as AudienceProjectStatus) ?? 'Closed'
            ]
          : STATUS_TRANSITIONS[
              projects.find((p) => p.id === id)?.status ?? 'Closed'
            ];

    if (!allowed.includes(next)) return;

    if (isLaunchedStatus(next)) {
      markAudienceProjectLaunched();
    }

    if (kind === 'standalone') {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)));
    } else if (kind === 'child') {
      setMultiChildren((prev) =>
        prev.map((child) =>
          child.id === id
            ? { ...child, status: next as ChildCountryProject['status'] }
            : child,
        ),
      );
    } else {
      setParentStatus(next);
    }

    showToast({
      message: `Status updated to ${STATUS_OPTION_LABEL[next]}.`,
      variant: 'success',
    });
  }

  function standaloneToRow(project: AudienceProject): ProjectRowMetrics {
    return {
      id: project.id,
      name: project.name,
      projectId: project.projectId,
      href: `/projects/${project.id}`,
      status: project.status,
      progressPercent: project.progressPercent,
      completesCurrent: project.completesCurrent,
      completesTarget: project.completesTarget,
      averageCpi: project.costPerComplete,
      actualCost: project.currentCost,
      totalCost: project.projectCost,
      sameCpiPushCount: project.sameCpiPushCount ?? 0,
    };
  }

  function handlePushConfirm(result: PushProjectResult) {
    if (!pushTarget) return;

    if (pushTarget.kind === 'standalone') {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== pushTarget.id) return p;
          const nextCount = result.mode === 'same' ? (p.sameCpiPushCount ?? 0) + 1 : 0;
          return {
            ...p,
            costPerComplete: result.cpi,
            sameCpiPushCount: nextCount,
            currentCost: Number((p.completesCurrent * result.cpi).toFixed(2)),
            projectCost: Number((p.completesTarget * result.cpi).toFixed(2)),
          };
        }),
      );
    } else if (pushTarget.kind === 'parent') {
      setParentSameCpiPushCount(result.mode === 'same' ? parentSameCpiPushCount + 1 : 0);
      setMultiChildren((prev) =>
        prev.map((child) => {
          if (child.status !== 'Live') return child;
          const nextCount = result.mode === 'same' ? child.sameCpiPushCount + 1 : 0;
          const nextCpi = result.mode === 'same' ? child.cpi : result.cpi;
          return {
            ...child,
            cpi: nextCpi,
            sameCpiPushCount: nextCount,
            totalCost: Number((child.responses * nextCpi).toFixed(2)),
          };
        }),
      );
    } else {
      setMultiChildren((prev) =>
        prev.map((child) => {
          if (child.id !== pushTarget.id) return child;
          const nextCount = result.mode === 'same' ? child.sameCpiPushCount + 1 : 0;
          return {
            ...child,
            cpi: result.cpi,
            sameCpiPushCount: nextCount,
            totalCost: Number((child.responses * result.cpi).toFixed(2)),
          };
        }),
      );
    }

    showToast({
      message:
        result.mode === 'same'
          ? `Project pushed at ${formatCurrency(result.cpi)}.`
          : `Project pushed at higher CPI ${formatCurrency(result.cpi)}.`,
      variant: 'success',
    });
    setPushTarget(null);
  }

  const parentRow: ProjectRowMetrics = {
    id: MOCK_MULTI_COUNTRY_PARENT.id,
    name: MOCK_MULTI_COUNTRY_PARENT.name,
    projectId: MOCK_MULTI_COUNTRY_PARENT.projectId,
    href: `/projects/${MOCK_MULTI_COUNTRY_PARENT.id}`,
    status: parentStatus,
    progressPercent: parentMetrics.progressPercent,
    completesCurrent: parentMetrics.totalCollected,
    completesTarget: parentMetrics.totalResponses,
    averageCpi: parentMetrics.averageCpi,
    actualCost: parentMetrics.actualCost,
    totalCost: parentMetrics.totalCost,
    sameCpiPushCount: parentSameCpiPushCount,
    expandable: true,
    expanded: expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id),
    onToggle: () => toggleParent(MOCK_MULTI_COUNTRY_PARENT.id),
  };

  const heading = workspaceHeading(isMine, owner.name);
  const description = workspaceDescription(isMine, owner.name);
  const hasRows = showParent || filteredStandalone.length > 0;
  const searched = search.trim().length > 0;

  const demoSelect = (
    <WuSelect
      data={DEMO_WORKSPACE_OPTIONS as unknown as Record<string, unknown>[]}
      accessorKey={{ value: 'value', label: 'label' }}
      value={
        DEMO_WORKSPACE_OPTIONS.find((option) => option.value === scenario) as unknown as Record<
          string,
          unknown
        >
      }
      onSelect={(item) => setScenario((item as { value: DemoWorkspaceScenario }).value)}
      variant="outlined"
      labelPosition="left"
      Label={<span className="whitespace-nowrap text-xs font-medium text-[#8c9baa]">Demo</span>}
      className="w-[11.5rem] shrink-0 [&_button]:!h-8 [&_button]:!min-h-8 [&_button]:!px-2 [&_button]:!text-xs"
    />
  );

  if (isRevoked) {
    return (
      <div className="space-y-4 px-6 pt-4">
        <PageHeader title="Access unavailable" action={demoSelect} />
        <div className="rounded-lg border border-[#e0e4e8] bg-white">
          <EmptyState
            icon="wm-lock"
            title="Access unavailable"
            description={`You no longer have access to ${possessiveName(revokedOwnerName)} workspace.`}
            action={
              <WuButton onClick={returnToMyWorkspace}>Go to My Workspace</WuButton>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-6 pt-4">
      <PageHeader
        title={heading}
        description={description}
        action={
          <div className="flex flex-wrap items-center justify-end gap-3">
            {demoSelect}
            {!canWrite && !isMine ? (
              <WuChip size="sm" variant="secondary">
                Read
              </WuChip>
            ) : null}
            {canWrite && !isMine ? (
              <WuChip size="sm" color="success">
                Read & write
              </WuChip>
            ) : null}
            {canCreate ? (
              <WuButton onClick={() => router.push('/projects/create')}>
                <span className="wm-add" aria-hidden="true" /> Create project
              </WuButton>
            ) : null}
          </div>
        }
      />

      {!hasRows && !searched ? null : (
      <div className="flex justify-start">
        <WuInput
          variant="flat"
          placeholder="Search"
          Icon={<span className="wm-search text-sm" aria-hidden="true" />}
          iconPosition="left"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[160px] !bg-[rgba(0,0,0,0.04)]"
          aria-label="Search projects"
        />
      </div>
      )}

      {!hasRows ? (
        <div className="rounded-lg border border-[#e0e4e8] bg-white">
          <EmptyState
            icon="wm-folder"
            title={
              searched
                ? 'No projects match your search.'
                : isMine
                  ? 'No projects yet'
                  : 'No projects available'
            }
            description={
              searched
                ? 'Try a different name or project ID.'
                : isMine
                  ? 'Projects you create will appear here.'
                  : 'There are currently no projects in this workspace.'
            }
            action={
              isMine && canCreate && !searched ? (
                <WuButton onClick={() => router.push('/projects/create')}>
                  <span className="wm-add" aria-hidden="true" /> Create project
                </WuButton>
              ) : undefined
            }
          />
        </div>
      ) : (
      <div className="overflow-x-auto rounded-md border border-[#e0e4e8] bg-white">
        <table className="min-w-[1120px] w-full border-collapse text-sm" aria-label="Specialized sample">
          <thead>
            <tr className="bg-[#EEEEEE]">
              <th className={`w-10 ${HEADER_CELL}`}>
                <SelectAllCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <SortableHeader>Project name</SortableHeader>
              <SortableHeader>Status</SortableHeader>
              <SortableHeader>Progress</SortableHeader>
              <SortableHeader>Completes</SortableHeader>
              <SortableHeader>Average CPI</SortableHeader>
              <SortableHeader>Actual Cost</SortableHeader>
              <SortableHeader>Total Cost</SortableHeader>
              <th className={`w-[5.5rem] ${HEADER_CELL}`} aria-label="Actions" />
              <th className={`w-10 ${HEADER_CELL}`} aria-label="Expand" />
            </tr>
          </thead>
          <tbody>
            {showParent && (
              <>
                <ProjectTableRow
                  row={parentRow}
                  selected={selectedIds.has(parentRow.id)}
                  onSelect={(checked) => toggleRow(parentRow.id, checked)}
                  dividerBelow={!parentRow.expanded}
                  onStatusChange={
                    canWrite
                      ? (next) => handleStatusChange(parentRow.id, 'parent', next)
                      : undefined
                  }
                  onPush={
                    canWrite && parentRow.status === 'Live'
                      ? (target) =>
                          setPushTarget({
                            id: target.id,
                            name: target.name,
                            costPerComplete: target.averageCpi,
                            sameCpiPushCount: target.sameCpiPushCount,
                            kind: 'parent',
                          })
                      : undefined
                  }
                />
                {visibleChildRows.map((row, index) => (
                  <ProjectTableRow
                    key={row.id}
                    row={row}
                    selected={selectedIds.has(row.id)}
                    onSelect={(checked) => toggleRow(row.id, checked)}
                    dividerBelow={index === visibleChildRows.length - 1}
                    onStatusChange={
                      canWrite ? (next) => handleStatusChange(row.id, 'child', next) : undefined
                    }
                    onPush={
                      canWrite && row.status === 'Live'
                        ? (target) =>
                            setPushTarget({
                              id: target.id,
                              name: target.name,
                              costPerComplete: target.averageCpi,
                              sameCpiPushCount: target.sameCpiPushCount,
                              kind: 'child',
                            })
                        : undefined
                    }
                  />
                ))}
              </>
            )}

            {filteredStandalone.map((project) => {
              const row = standaloneToRow(project);
              return (
                <ProjectTableRow
                  key={project.id}
                  row={row}
                  selected={selectedIds.has(row.id)}
                  onSelect={(checked) => toggleRow(row.id, checked)}
                  dividerBelow
                  onStatusChange={
                    canWrite
                      ? (next) => handleStatusChange(row.id, 'standalone', next)
                      : undefined
                  }
                  onPush={
                    canWrite && row.status === 'Live'
                      ? (target) =>
                          setPushTarget({
                            id: target.id,
                            name: target.name,
                            costPerComplete: target.averageCpi,
                            sameCpiPushCount: target.sameCpiPushCount,
                            kind: 'standalone',
                          })
                      : undefined
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      <PushProjectModal
        open={!!pushTarget}
        onOpenChange={(open) => {
          if (!open) setPushTarget(null);
        }}
        projectName={pushTarget?.name ?? ''}
        currentCpi={pushTarget?.costPerComplete ?? 0}
        sameCpiPushCount={pushTarget?.sameCpiPushCount}
        onConfirm={handlePushConfirm}
      />
    </div>
  );
}
