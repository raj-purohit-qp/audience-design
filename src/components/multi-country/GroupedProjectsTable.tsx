'use client';

import { useMemo, useState, type ReactNode } from 'react';
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

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

const STATUS_DOT: Record<AudienceProjectStatus, string> = {
  Bid: 'bg-[#1b87e6]',
  Paused: 'bg-[#f9ab00]',
  'Soft-launched': 'bg-[#1b87e6]',
  Live: 'bg-[#188038]',
  Closed: 'bg-[#9aa0a6]',
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

function StatusCell({ status }: { status: AudienceProjectStatus }) {
  const isBid = status === 'Bid';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-sm text-[#3c4043] ${
        isBid ? 'rounded border border-[#dadce0] bg-white px-2 py-0.5' : ''
      }`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {status}
      {isBid ? (
        <span className="wm-expand-more text-sm text-[#5f6368]" aria-hidden="true" />
      ) : null}
    </span>
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

const TABLE_COL_COUNT = 11;

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
  dividerBelow = false,
}: {
  row: ProjectRowMetrics;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onPush?: (row: ProjectRowMetrics) => void;
  /** Project-level separator; for multi-country, only under the last country row. */
  dividerBelow?: boolean;
}) {
  const showPush = row.status === 'Live' && !!onPush;

  return (
    <>
      <tr className="group hover:bg-[#f8f9fa]" data-expanded={row.expanded}>
        <td className="w-10 px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            aria-label={`Select ${row.name}`}
            className="h-4 w-4 accent-[#1b87e6]"
          />
        </td>
        <td className="w-12 px-2 py-3 text-center">
          {!row.indent ? (
            <span
              className="wm-people text-lg text-[#5f6368]"
              aria-label="Audience"
              title="Audience"
            />
          ) : null}
        </td>
        <td className={`px-3 py-3 ${row.indent ? 'pl-10' : ''}`}>
          <Link
            href={row.href}
            className="font-medium text-[#1b87e6] hover:underline"
          >
            {row.name}
          </Link>
          <span className="mt-0.5 block text-xs text-[#80868b]">
            Project ID: {row.projectId}
          </span>
        </td>
        <td className="px-3 py-3">
          <StatusCell status={row.status} />
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
        <td className="w-[5.5rem] px-2 py-3 text-right">
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
        <td className="w-10 px-2 py-3 text-center">
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
  const [pushTarget, setPushTarget] = useState<PushTarget | null>(null);

  const parentMetrics = useMemo(() => aggregateChildren(multiChildren), [multiChildren]);

  const filteredStandalone = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query),
    );
  }, [projects, search]);

  const showParent = useMemo(() => {
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
  }, [search, multiChildren]);

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
    status: MOCK_MULTI_COUNTRY_PARENT.status as AudienceProjectStatus,
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

  return (
    <div className="space-y-4 px-6 pt-4">
      <PageHeader
        title="Projects"
        action={
          <WuButton onClick={() => router.push('/projects/create')}>
            <span className="wm-add" aria-hidden="true" /> Create project
          </WuButton>
        }
      />

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

      <div className="overflow-x-auto rounded-md border border-[#e0e4e8] bg-white">
        <table className="min-w-[1120px] w-full border-collapse text-sm" aria-label="Projects">
          <thead>
            <tr className="bg-[#EEEEEE]">
              <th className={`w-10 ${HEADER_CELL}`}>
                <SelectAllCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className={`w-[4.5rem] ${HEADER_CELL}`}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="wm-people text-sm text-[#545E6B]" aria-hidden="true" />
                  Type
                </span>
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
                  onPush={
                    parentRow.status === 'Live'
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
                    onPush={
                      row.status === 'Live'
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
                  onPush={
                    row.status === 'Live'
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
