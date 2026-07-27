'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import type { PendingApprovalRequestSummary } from '@/data/mock-org-panel-settings';
import { EmptyState } from '@/components/ui/EmptyState';
import { truncate } from '@/data/mock-utils';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

export function PendingRequestsTable({
  requests,
  approvingOrgId,
  onViewRequest,
  onApprove,
}: {
  requests: PendingApprovalRequestSummary[];
  approvingOrgId: string | null;
  onViewRequest: (orgId: string) => void;
  onApprove: (orgId: string) => void;
}) {
  const columns = useMemo<IWuTableColumnDef<PendingApprovalRequestSummary>[]>(
    () => [
      {
        accessorKey: 'orgId',
        header: 'Org ID',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-[#1a2340]">{row.original.orgId}</span>
        ),
      },
      {
        accessorKey: 'orgName',
        header: 'Org name',
        cell: ({ row }) => (
          <span className="block max-w-[14rem] truncate text-sm text-[#1a2340]" title={row.original.orgName}>
            {row.original.orgName}
          </span>
        ),
      },
      {
        accessorKey: 'accountManager',
        header: 'AM name',
        cell: ({ row }) => (
          <span className="text-sm text-[#54606b]">{row.original.accountManager}</span>
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
        accessorKey: 'comment',
        header: 'Comment',
        cell: ({ row }) => {
          const comment = row.original.comment.trim();
          if (!comment) {
            return <span className="text-sm text-[#8c9baa]">—</span>;
          }
          return (
            <span className="block max-w-[16rem] text-sm text-[#54606b]" title={comment}>
              {truncate(comment, 72)}
            </span>
          );
        },
      },
      {
        accessorKey: 'requestLogId',
        id: 'actions',
        header: '',
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => {
          const orgId = row.original.orgId;
          const isApproving = approvingOrgId === orgId;
          return (
            <div className="request-row-actions flex items-center justify-end gap-2 opacity-0 transition-opacity duration-150">
              <WuButton
                type="button"
                variant="outline"
                color="primary"
                size="sm"
                onClick={() => onViewRequest(orgId)}
                disabled={!!approvingOrgId}
              >
                View request
              </WuButton>
              <WuButton
                type="button"
                size="sm"
                onClick={() => onApprove(orgId)}
                disabled={!!approvingOrgId}
                loading={isApproving}
              >
                Approve
              </WuButton>
            </div>
          );
        },
      },
    ],
    [approvingOrgId, onApprove, onViewRequest],
  );

  return (
    <div className="rounded-lg border border-[#e0e4e8] bg-white px-5 py-5 shadow-sm">
      <div className="mb-4">
        <p className="text-base font-semibold text-[#1a2340]">Pending requests</p>
        <p className="mt-0.5 text-sm text-[#8c9baa]">
          Review pricing changes submitted by Account managers. Hover a row to View or Approve.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="wm-task-alt"
          title="No pending requests."
          description="When Admins submit pricing changes, they will appear here for review."
        />
      ) : (
        <div className="[&_tbody_tr:hover_.request-row-actions]:opacity-100">
          <WuTable
            data={requests as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          />
        </div>
      )}
    </div>
  );
}
