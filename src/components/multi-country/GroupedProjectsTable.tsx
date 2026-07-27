'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AudienceProject, AudienceProjectStatus } from '@/data/mock-audience-projects';
import {
  MOCK_AUDIENCE_PROJECTS,
  formatCurrency,
  formatPercent,
} from '@/data/mock-audience-projects';
import {
  MOCK_MULTI_COUNTRY_PARENT,
  DASHBOARD_REGIONS,
  getCountryByCode,
  type ChildCountryProject,
} from '@/data/mock-multi-country';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
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

const STATUS_CHIP: Record<
  AudienceProjectStatus,
  { color: 'success' | 'warning' | 'danger' | undefined; bg: string; fg: string }
> = {
  Bid: { color: undefined, bg: '#f5f6f8', fg: '#54606b' },
  Paused: { color: 'warning', bg: '#fff8e1', fg: '#b06d00' },
  'Soft-launched': { color: undefined, bg: '#e8f0fe', fg: '#1b87e6' },
  Live: { color: 'success', bg: '#e8f5e9', fg: '#188038' },
  Closed: { color: undefined, bg: '#f5f6f8', fg: '#54606b' },
};

const TABLE_HEADERS = [
  'Project name',
  'Status',
  'Progress',
  'Complete',
  'Cost per complete',
  'Current IR',
  'Current cost',
  'Project cost',
] as const;

interface ProjectRowMetrics {
  id: string;
  name: string;
  projectId: string;
  href: string;
  status: AudienceProjectStatus;
  progressPercent: number;
  completesCurrent: number;
  costPerComplete: number;
  currentIr: number;
  currentCost: number;
  projectCost: number;
  indent?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

function StatusChip({ status }: { status: AudienceProjectStatus }) {
  const cfg = STATUS_CHIP[status];
  return (
    <WuChip size="sm" shape="rounded" color={cfg.color}>
      {status}
    </WuChip>
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

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex min-w-[120px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e0e4e8]">
        <div
          className="h-full rounded-full bg-[#1b87e6] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-xs tabular-nums text-[#54606b]">{pct}%</span>
    </div>
  );
}

function childToRow(child: ChildCountryProject, parentId: string): ProjectRowMetrics {
  const country = getCountryByCode(child.countryCode);
  const progressPercent =
    child.responses > 0 ? Math.round((child.collected / child.responses) * 100) : 0;

  return {
    id: child.id,
    name: `${country?.flag ?? ''} ${child.name}`.trim(),
    projectId: child.projectId,
    href: `/projects/${parentId}?country=${child.countryCode}`,
    status: child.status as AudienceProjectStatus,
    progressPercent,
    completesCurrent: child.collected,
    costPerComplete: child.cpi,
    currentIr: child.currentIr,
    currentCost: Number((child.collected * child.cpi).toFixed(2)),
    projectCost: child.totalCost,
    indent: true,
  };
}

function ProjectTableRow({
  row,
  selected,
  onSelect,
}: {
  row: ProjectRowMetrics;
  selected: boolean;
  onSelect: (checked: boolean) => void;
}) {
  return (
    <tr className="border-t border-[#eef0f3] hover:bg-[#f9fafb]">
      <td className="w-10 px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
          aria-label={`Select ${row.name}`}
          className="h-4 w-4 accent-[#1b87e6]"
        />
      </td>
      <td className={`px-4 py-3 ${row.indent ? 'pl-10' : ''}`}>
        {row.expandable ? (
          <button
            type="button"
            className="flex items-start gap-2 text-left"
            onClick={row.onToggle}
            aria-expanded={row.expanded}
          >
            <span className="mt-0.5 shrink-0 text-xs text-[#8c9baa]">
              {row.expanded ? '▼' : '▶'}
            </span>
            <span>
              <Link
                href={row.href}
                className="font-medium text-[#1a2340] hover:text-[#1b87e6] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {row.name}
              </Link>
              <span className="mt-0.5 block text-xs text-[#8c9baa]">{row.projectId}</span>
            </span>
          </button>
        ) : (
          <>
            <Link
              href={row.href}
              className="font-medium text-[#1a2340] hover:text-[#1b87e6] hover:underline"
            >
              {row.name}
            </Link>
            <span className="mt-0.5 block text-xs text-[#8c9baa]">{row.projectId}</span>
          </>
        )}
      </td>
      <td className="px-4 py-3">
        <StatusChip status={row.status} />
      </td>
      <td className="px-4 py-3">
        <ProgressBar value={row.progressPercent} />
      </td>
      <td className="px-4 py-3 tabular-nums text-[#1a2340]">
        {row.completesCurrent.toLocaleString()}
      </td>
      <td className="px-4 py-3 tabular-nums text-[#1a2340]">
        {formatCurrency(row.costPerComplete)}
      </td>
      <td className="px-4 py-3 tabular-nums text-[#1a2340]">
        {formatPercent(row.currentIr)}
      </td>
      <td className="px-4 py-3 tabular-nums text-[#1a2340]">
        {formatCurrency(row.currentCost)}
      </td>
      <td className="px-4 py-3 tabular-nums font-medium text-[#1a2340]">
        {formatCurrency(row.projectCost)}
      </td>
    </tr>
  );
}

export function GroupedProjectsTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set(['mc-parent-001']));
  const [countryFilter, setCountryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('All regions');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const parentMetrics = useMemo(() => {
    const children = MOCK_MULTI_COUNTRY_PARENT.children;
    const totalResponses = children.reduce((s, c) => s + c.responses, 0);
    const totalCollected = children.reduce((s, c) => s + c.collected, 0);
    const projectCost = children.reduce((s, c) => s + c.totalCost, 0);
    const currentCost = children.reduce((s, c) => s + c.collected * c.cpi, 0);
    const currentIr =
      children.length > 0
        ? Math.round(children.reduce((s, c) => s + c.currentIr, 0) / children.length)
        : 0;
    const progressPercent =
      totalResponses > 0 ? Math.round((totalCollected / totalResponses) * 100) : 0;
    const costPerComplete = totalResponses > 0 ? projectCost / totalResponses : 0;

    return {
      totalResponses,
      totalCollected,
      projectCost,
      currentCost: Number(currentCost.toFixed(2)),
      currentIr,
      progressPercent,
      costPerComplete: Number(costPerComplete.toFixed(2)),
    };
  }, []);

  const filteredStandalone = useMemo(() => {
    const query = search.trim().toLowerCase();
    return MOCK_AUDIENCE_PROJECTS.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query)
      );
    });
  }, [search, statusFilter]);

  const showParent = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (statusFilter !== 'all' && MOCK_MULTI_COUNTRY_PARENT.status !== statusFilter) return false;
    if (countryFilter !== 'all') {
      const hasCountry = MOCK_MULTI_COUNTRY_PARENT.children.some((c) => c.countryCode === countryFilter);
      if (!hasCountry) return false;
    }
    if (regionFilter !== 'All regions') {
      const hasRegion = MOCK_MULTI_COUNTRY_PARENT.children.some((c) => {
        const country = getCountryByCode(c.countryCode);
        return country?.region === regionFilter;
      });
      if (!hasRegion) return false;
    }
    if (!query) return true;
    return (
      MOCK_MULTI_COUNTRY_PARENT.name.toLowerCase().includes(query) ||
      MOCK_MULTI_COUNTRY_PARENT.projectId.toLowerCase().includes(query)
    );
  }, [search, countryFilter, regionFilter, statusFilter]);

  const visibleRowIds = useMemo(() => {
    const ids: string[] = [];
    if (showParent) {
      ids.push(MOCK_MULTI_COUNTRY_PARENT.id);
      if (expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id)) {
        MOCK_MULTI_COUNTRY_PARENT.children
          .filter((child) => countryFilter === 'all' || child.countryCode === countryFilter)
          .forEach((child) => ids.push(child.id));
      }
    }
    filteredStandalone.forEach((p) => ids.push(p.id));
    return ids;
  }, [showParent, expandedParents, countryFilter, filteredStandalone]);

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
      costPerComplete: project.costPerComplete,
      currentIr: project.currentIr,
      currentCost: project.currentCost,
      projectCost: project.projectCost,
    };
  }

  const parentRow: ProjectRowMetrics = {
    id: MOCK_MULTI_COUNTRY_PARENT.id,
    name: MOCK_MULTI_COUNTRY_PARENT.name,
    projectId: MOCK_MULTI_COUNTRY_PARENT.projectId,
    href: `/projects/${MOCK_MULTI_COUNTRY_PARENT.id}`,
    status: MOCK_MULTI_COUNTRY_PARENT.status as AudienceProjectStatus,
    progressPercent: parentMetrics.progressPercent,
    completesCurrent: parentMetrics.totalCollected,
    costPerComplete: parentMetrics.costPerComplete,
    currentIr: parentMetrics.currentIr,
    currentCost: parentMetrics.currentCost,
    projectCost: parentMetrics.projectCost,
    expandable: true,
    expanded: expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id),
    onToggle: () => toggleParent(MOCK_MULTI_COUNTRY_PARENT.id),
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 px-6">
        <WuSelect
          data={[
            { value: 'all', label: 'All countries' },
            ...MOCK_MULTI_COUNTRY_PARENT.children.map((c) => ({
              value: c.countryCode,
              label: `${getCountryByCode(c.countryCode)?.flag} ${getCountryByCode(c.countryCode)?.label}`,
            })),
          ]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{
            value: countryFilter,
            label:
              countryFilter === 'all'
                ? 'All countries'
                : (getCountryByCode(countryFilter)?.label ?? countryFilter),
          }}
          onSelect={(v) => setCountryFilter((v as { value: string }).value)}
          Label="Country"
          variant="outlined"
          className="min-w-[160px]"
        />
        <WuSelect
          data={DASHBOARD_REGIONS.map((r) => ({ value: r, label: r }))}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: regionFilter, label: regionFilter }}
          onSelect={(v) => setRegionFilter((v as { value: string }).value)}
          Label="Region"
          variant="outlined"
          className="min-w-[160px]"
        />
        <WuSelect
          data={[
            { value: 'all', label: 'All statuses' },
            { value: 'Bid', label: 'Bid' },
            { value: 'Paused', label: 'Paused' },
            { value: 'Soft-launched', label: 'Soft-launched' },
            { value: 'Live', label: 'Live' },
            { value: 'Closed', label: 'Closed' },
          ]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: statusFilter, label: statusFilter === 'all' ? 'All statuses' : statusFilter }}
          onSelect={(v) => setStatusFilter((v as { value: string }).value)}
          Label="Status"
          variant="outlined"
          className="min-w-[160px]"
        />
        <div className="ml-auto">
          <WuInput
            variant="flat"
            placeholder="Search"
            Icon={<span className="wm-search" aria-hidden="true" />}
            iconPosition="left"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[179px] bg-[#F5F5F5]"
            aria-label="Search projects"
          />
        </div>
      </div>

      <div className="mx-6 overflow-x-auto rounded-md border border-[#e0e4e8] bg-white">
        <table className="min-w-[1100px] w-full text-sm" aria-label="Projects">
          <thead className="bg-[#f5f6f8]">
            <tr>
              <th className="w-10 px-3 py-3">
                <SelectAllCheckbox
                  checked={allVisibleSelected}
                  indeterminate={someVisibleSelected && !allVisibleSelected}
                  onChange={toggleSelectAll}
                />
              </th>
              {TABLE_HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium text-[#8c9baa]"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showParent && (
              <>
                <ProjectTableRow
                  row={parentRow}
                  selected={selectedIds.has(parentRow.id)}
                  onSelect={(checked) => toggleRow(parentRow.id, checked)}
                />
                {expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id) &&
                  MOCK_MULTI_COUNTRY_PARENT.children
                    .filter((child) => countryFilter === 'all' || child.countryCode === countryFilter)
                    .map((child) => {
                      const row = childToRow(child, MOCK_MULTI_COUNTRY_PARENT.id);
                      return (
                        <ProjectTableRow
                          key={child.id}
                          row={row}
                          selected={selectedIds.has(row.id)}
                          onSelect={(checked) => toggleRow(row.id, checked)}
                        />
                      );
                    })}
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
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6">
        <WuButton onClick={() => router.push('/projects/create')}>
          <span className="wm-add" aria-hidden="true" /> Create project
        </WuButton>
      </div>
    </div>
  );
}
