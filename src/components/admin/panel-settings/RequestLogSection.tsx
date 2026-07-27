'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import type { RequestLogEntry, RequestLogStatus } from '@/data/mock-org-panel-settings';
import { EmptyState } from '@/components/ui/EmptyState';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);

const STATUS_CHIP: Record<
  RequestLogStatus,
  { label: string; color: 'warning' | 'success' | 'danger' }
> = {
  pending: { label: 'Pending', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'danger' },
};

export function RequestLogSection({ entries }: { entries: RequestLogEntry[] }) {
  const columns = useMemo<IWuTableColumnDef<RequestLogEntry>[]>(
    () => [
      {
        accessorKey: 'accountManager',
        header: 'Account manager',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.accountManager}</span>
        ),
      },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-sm text-[#54606b]">
            {row.original.date}
            <span className="text-[#8c9baa]"> · {row.original.time}</span>
          </span>
        ),
      },
      {
        accessorKey: 'pricingModel',
        header: 'Pricing model',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.pricingModel}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const chip = STATUS_CHIP[row.original.status];
          return (
            <WuChip size="sm" color={chip.color}>
              {chip.label}
            </WuChip>
          );
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => {
          const { status, reason } = row.original;
          if (status === 'rejected' && reason) {
            return (
              <span className="block max-w-xs whitespace-normal text-sm text-[#54606b]">
                {reason}
              </span>
            );
          }
          if (status === 'rejected') {
            return <span className="text-sm text-[#8c9baa]">—</span>;
          }
          return <span className="text-sm text-[#8c9baa]">—</span>;
        },
      },
    ],
    [],
  );

  return (
    <div className="rounded-lg border border-[#e0e4e8] bg-white px-5 py-5 shadow-sm">
      <div className="mb-4">
        <p className="text-base font-semibold text-[#1a2340]">Request log</p>
        <p className="mt-0.5 text-sm text-[#8c9baa]">
          History of pricing approval requests for this organization.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon="wm-history"
          title="No approval requests yet."
          description="Submitted requests will appear here with status and rejection reasons."
        />
      ) : (
        <WuTable
          data={entries as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
        />
      )}
    </div>
  );
}
