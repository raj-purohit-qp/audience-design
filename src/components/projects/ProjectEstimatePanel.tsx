'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { formatEstimateDate, type ProjectEstimate } from '@/data/mock-project-create';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);

export interface CountryCostBreakdownRow {
  code: string;
  flag: string;
  label: string;
  responses: number;
  cpi: number;
  total: number;
}

interface ProjectEstimatePanelProps {
  responses: number;
  estimate: ProjectEstimate;
  completionDate: Date | undefined;
  onCreateProject: () => void;
  countryCount?: number;
  countryBreakdown?: CountryCostBreakdownRow[];
}

export function ProjectEstimatePanel({
  responses,
  estimate,
  completionDate,
  onCreateProject,
  countryCount,
  countryBreakdown = [],
}: ProjectEstimatePanelProps) {
  const isFeasible = estimate.feasibility === 'high';
  const isMultiCountry = (countryCount ?? countryBreakdown.length) > 1;

  const rows: { label: string; value: string }[] = isMultiCountry
    ? [
        { label: 'Countries', value: String(countryCount ?? countryBreakdown.length) },
        { label: 'Respondents', value: responses.toLocaleString() },
        { label: 'Est. completion date', value: formatEstimateDate(completionDate) },
      ]
    : [
        { label: 'Respondents', value: responses.toLocaleString() },
        { label: 'Cost per completion', value: `$${estimate.costPerInterview.toFixed(2)}` },
        { label: 'Est. completion date', value: formatEstimateDate(completionDate) },
      ];

  const breakdownColumns = useMemo<IWuTableColumnDef<CountryCostBreakdownRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: 'Country',
        size: 56,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-[11px] text-[#1a2340]" title={row.original.label}>
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: 'responses',
        header: 'Resp.',
        size: 48,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-[11px] tabular-nums text-[#1a2340]">
            {row.original.responses.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'cpi',
        header: 'CPI',
        size: 44,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-[11px] tabular-nums text-[#1a2340]">
            ${row.original.cpi.toFixed(2)}
          </span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        size: 60,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-[#1a2340]">
            ${row.original.total.toFixed(2)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <aside className="w-full shrink-0 lg:w-[300px]">
      <WuCard rounded className="overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
        <WuCardHeader>
          <WuHeading size="sm">Your estimate</WuHeading>
        </WuCardHeader>

        {isMultiCountry && (
          <div className="px-5 pt-4">
            <p className="mb-1.5 text-xs font-medium text-[#8c9baa]">Cost by country</p>
            <div className="overflow-hidden rounded-md border border-[#eef0f3] [&_table]:w-full [&_thead_tr]:bg-[#f5f6f8] [&_th]:px-1.5 [&_th]:py-1.5 [&_th]:text-[10px] [&_td]:px-1.5 [&_td]:py-1.5">
              <WuTable
                data={countryBreakdown as unknown[]}
                columns={breakdownColumns as unknown as IWuTableColumnDef<unknown>[]}
                variant="unstyled"
                size="compact"
                tableLayout="fixed"
              />
            </div>
          </div>
        )}

        <dl className={`space-y-3.5 px-5 ${isMultiCountry ? 'pt-3.5' : 'pt-4'}`}>
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-sm text-[#54606b]">{label}</dt>
              <dd className="text-sm font-medium tabular-nums text-[#1a2340]">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-3.5 px-5 pt-3.5 pb-4">
          <div className="flex items-center justify-between gap-4 border-t border-[#eef0f3] pt-3.5">
            <dt className="text-sm font-semibold text-[#1a2340]">
              Total{isMultiCountry ? ' (all countries)' : ''}
            </dt>
            <dd className="text-sm font-semibold tabular-nums text-[#1a2340]">
              ${estimate.totalCost.toFixed(2)} USD
            </dd>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="mb-4">
            <WuChip size="sm" shape="rounded" color={isFeasible ? 'success' : 'warning'}>
              {isFeasible ? 'Your sample is feasible.' : 'Sample feasibility may be limited.'}
            </WuChip>
          </div>

          <WuButton className="w-full" color="primary" onClick={onCreateProject}>
            Create project
          </WuButton>
        </div>

        <div className="flex gap-2 border-t border-[#cfe2f5] bg-[#e8f0fe] px-4 py-3 text-xs leading-relaxed text-[#1a4a7a]">
          <span className="wm-info mt-0.5 shrink-0 text-sm" aria-hidden="true" />
          <p>
            Note: Audience pricing shown is for self service. Managed service, by the audience
            team, may have higher cost associated due to additional support and project
            management.
          </p>
        </div>
      </WuCard>
    </aside>
  );
}
