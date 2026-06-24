'use client';

import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AudienceFooter } from '@/components/audience/AudienceFooter';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  MOCK_AUDIENCE_PROJECTS,
  formatCurrency,
  type AudienceProject,
  type AudienceProjectStatus,
} from '@/data/mock-audience-projects';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

const STATUS_DOT: Record<AudienceProjectStatus, string> = {
  Closed: 'bg-gray-400',
  Bid: 'bg-gray-400',
  Live: 'bg-green-500',
  Draft: 'bg-amber-400',
};

function ProjectTypeIcon() {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"
      aria-label="Audience project"
    >
      <span className="wm-groups text-lg" aria-hidden="true" />
    </span>
  );
}

function ProjectNameCell({ project }: { project: AudienceProject }) {
  return (
    <div className="min-w-0 py-1">
      <Link
        href={`/projects/${project.id}`}
        className="block truncate font-semibold text-gray-900 hover:text-blue-600 hover:underline"
      >
        {project.name}
      </Link>
      <span className="text-xs text-gray-500">Project ID: {project.projectId}</span>
    </div>
  );
}

function StatusCell({ project }: { project: AudienceProject }) {
  const { showToast } = useWuShowToast();

  const statusContent = (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[project.status]}`}
        aria-hidden="true"
      />
      {project.status}
      {project.status === 'Bid' && (
        <span className="wm-expand-more text-base text-gray-500" aria-hidden="true" />
      )}
    </span>
  );

  if (project.status !== 'Bid') {
    return statusContent;
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className="rounded-md px-1 py-0.5 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label={`Change status for ${project.name}`}
        >
          {statusContent}
        </button>
      }
      align="start"
    >
      <WuMenuItem onSelect={() => showToast({ message: 'Status updated to Live', variant: 'success' })}>
        Mark as Live
      </WuMenuItem>
      <WuMenuItem onSelect={() => showToast({ message: 'Status updated to Closed', variant: 'success' })}>
        Mark as Closed
      </WuMenuItem>
    </WuMenu>
  );
}

function ProgressCell({ percent }: { percent: number }) {
  return (
    <div className="min-w-[100px] space-y-1.5">
      <span className="text-sm font-medium text-gray-900">{percent}%</span>
      <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${Math.min(percent, 100)}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

export default function AudienceLandingPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<AudienceProject[]>([]);

  const columns: IWuTableColumnDef<AudienceProject>[] = [
    {
      accessorKey: 'type',
      header: 'Type',
      cell: () => <ProjectTypeIcon />,
      enableSorting: false as const,
    },
    {
      accessorKey: 'name',
      header: 'Project name',
      filterable: true,
      cell: ({ row }) => <ProjectNameCell project={row.original} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterable: true,
      cell: ({ row }) => <StatusCell project={row.original} />,
    },
    {
      accessorKey: 'progressPercent',
      header: 'Progress',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => <ProgressCell percent={row.original.progressPercent} />,
    },
    {
      accessorKey: 'completesCurrent',
      header: 'Completes',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {row.original.completesCurrent.toLocaleString()} of{' '}
          {row.original.completesTarget.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'costPerComplete',
      header: 'Cost per complete',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(row.original.costPerComplete)}
        </span>
      ),
    },
    {
      accessorKey: 'totalCost',
      header: 'Total cost',
      headerAlign: 'right',
      cellAlign: 'right',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-900">
          {formatCurrency(row.original.totalCost)}
        </span>
      ),
    },
  ];

  const filteredData = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_AUDIENCE_PROJECTS;
    return MOCK_AUDIENCE_PROJECTS.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.projectId.toLowerCase().includes(query) ||
        p.status.toLowerCase().includes(query)
    );
  }, [search]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center px-6 py-4">
        <WuButton onClick={() => router.push('/projects/create')}>
          <span className="wm-add" aria-hidden="true" /> Create project
        </WuButton>

        <div className="ml-auto shrink-0">
          <WuInput
            variant="flat"
            placeholder="Search"
            Icon={<span className="wm-search" aria-hidden="true" />}
            iconPosition="left"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-[179px] bg-[#F5F5F5]"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex-1 px-6 pb-4">
        <WuTable
          data={filteredData as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
          filterText={search}
          stickyHeader
          rowSelection={{
            isEnabled: true,
            selectedRows: selectedRows as unknown[],
            onRowSelect: setSelectedRows as Dispatch<SetStateAction<unknown[]>>,
            rowUniqueKey: 'id',
          }}
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No projects found"
              description="Try adjusting your search"
            />
          }
        />
      </div>

      <AudienceFooter />
    </div>
  );
}
