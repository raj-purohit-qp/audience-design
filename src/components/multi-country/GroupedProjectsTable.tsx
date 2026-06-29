'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AudienceProject, AudienceProjectStatus } from '@/data/mock-audience-projects';
import { MOCK_AUDIENCE_PROJECTS, formatCurrency } from '@/data/mock-audience-projects';
import { MOCK_MULTI_COUNTRY_PARENT } from '@/data/mock-multi-country';
import { DASHBOARD_REGIONS } from '@/data/mock-multi-country';
import { getCountryByCode } from '@/data/mock-multi-country';

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

const STATUS_DOT: Record<AudienceProjectStatus, string> = {
  Closed: 'bg-gray-400',
  Bid: 'bg-gray-400',
  Live: 'bg-green-500',
  Draft: 'bg-amber-400',
};

function StatusDot({ status }: { status: string }) {
  const color = STATUS_DOT[status as AudienceProjectStatus] ?? 'bg-gray-400';
  return <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} aria-hidden="true" />;
}

export function GroupedProjectsTable() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set(['mc-parent-001']));
  const [countryFilter, setCountryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('All regions');
  const [statusFilter, setStatusFilter] = useState('all');

  const parentSummary = useMemo(() => {
    const totalCost = MOCK_MULTI_COUNTRY_PARENT.countries.reduce((s, c) => s + c.estimatedCost, 0);
    const totalResponses = MOCK_MULTI_COUNTRY_PARENT.countries.reduce((s, c) => s + c.responses, 0);
    const totalCollected = MOCK_MULTI_COUNTRY_PARENT.children.reduce((s, c) => s + c.collected, 0);
    return { totalCost, totalResponses, totalCollected };
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

  function toggleParent(id: string) {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const progressPct = Math.round(
    (parentSummary.totalCollected / parentSummary.totalResponses) * 100,
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-6">
        <WuSelect
          data={[{ value: 'all', label: 'All countries' }, ...MOCK_MULTI_COUNTRY_PARENT.children.map((c) => ({
            value: c.countryCode,
            label: `${getCountryByCode(c.countryCode)?.flag} ${getCountryByCode(c.countryCode)?.label}`,
          }))]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: countryFilter, label: countryFilter === 'all' ? 'All countries' : getCountryByCode(countryFilter)?.label ?? countryFilter }}
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
            { value: 'Live', label: 'Live' },
            { value: 'Draft', label: 'Draft' },
            { value: 'Closed', label: 'Closed' },
            { value: 'Bid', label: 'Bid' },
          ]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: statusFilter, label: statusFilter === 'all' ? 'All statuses' : statusFilter }}
          onSelect={(v) => setStatusFilter((v as { value: string }).value)}
          Label="Status"
          variant="outlined"
          className="min-w-[140px]"
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

      <div className="mx-6 overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm" aria-label="Projects">
          <thead className="bg-gray-50">
            <tr>
              {['Project', 'Countries', 'Responses', 'Cost', 'Status', 'Progress'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showParent && (
              <>
                <tr className="border-t border-gray-100 bg-blue-50/30">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-left font-semibold text-gray-900 hover:text-blue-600"
                      onClick={() => toggleParent(MOCK_MULTI_COUNTRY_PARENT.id)}
                      aria-expanded={expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id)}
                    >
                      <span className="text-gray-500">
                        {expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id) ? '▼' : '▶'}
                      </span>
                      <Link
                        href={`/projects/${MOCK_MULTI_COUNTRY_PARENT.id}`}
                        className="hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {MOCK_MULTI_COUNTRY_PARENT.name}
                      </Link>
                    </button>
                    <span className="ml-6 block text-xs text-gray-500">
                      {MOCK_MULTI_COUNTRY_PARENT.projectId}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{MOCK_MULTI_COUNTRY_PARENT.countries.length}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {parentSummary.totalCollected.toLocaleString()} of{' '}
                    {parentSummary.totalResponses.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCurrency(parentSummary.totalCost)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <StatusDot status={MOCK_MULTI_COUNTRY_PARENT.status} />
                      {MOCK_MULTI_COUNTRY_PARENT.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="text-xs text-gray-600">{progressPct}%</span>
                    </div>
                  </td>
                </tr>
                {expandedParents.has(MOCK_MULTI_COUNTRY_PARENT.id) &&
                  MOCK_MULTI_COUNTRY_PARENT.children
                    .filter((child) => countryFilter === 'all' || child.countryCode === countryFilter)
                    .map((child) => {
                      const country = getCountryByCode(child.countryCode);
                      const pct = child.responses > 0 ? Math.round((child.collected / child.responses) * 100) : 0;
                      return (
                        <tr key={child.id} className="border-t border-gray-50 bg-gray-50/50">
                          <td className="px-4 py-2.5 pl-12">
                            <Link
                              href={`/projects/${MOCK_MULTI_COUNTRY_PARENT.id}?country=${child.countryCode}`}
                              className="font-medium text-gray-800 hover:text-blue-600 hover:underline"
                            >
                              {country?.flag} {child.name}
                            </Link>
                            <span className="block text-xs text-gray-500">{child.projectId}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">{country?.label}</td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {child.collected.toLocaleString()} of {child.responses.toLocaleString()}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">{formatCurrency(child.totalCost)}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex items-center gap-1.5 text-xs">
                              <StatusDot status={child.status} />
                              {child.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs text-gray-600">{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
              </>
            )}

            {filteredStandalone.map((project) => (
              <StandaloneRow key={project.id} project={project} />
            ))}
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

function StandaloneRow({ project }: { project: AudienceProject }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3">
        <Link href={`/projects/${project.id}`} className="font-semibold text-gray-900 hover:text-blue-600 hover:underline">
          {project.name}
        </Link>
        <span className="block text-xs text-gray-500">{project.projectId}</span>
      </td>
      <td className="px-4 py-3 text-gray-500">1</td>
      <td className="px-4 py-3 text-gray-700">
        {project.completesCurrent.toLocaleString()} of {project.completesTarget.toLocaleString()}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(project.totalCost)}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status={project.status} />
          {project.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-600">{project.progressPercent}%</span>
      </td>
    </tr>
  );
}
