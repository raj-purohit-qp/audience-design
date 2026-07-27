'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import type { OrganizationPanelSettings } from '@/data/mock-org-panel-settings';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);

type OrgDetailsRow = Pick<
  OrganizationPanelSettings,
  'orgId' | 'orgName' | 'userEmail' | 'license' | 'accountManager'
>;

export function OrganizationDetailsTable({
  settings,
  title = 'Organization detail',
}: {
  settings: OrganizationPanelSettings;
  title?: string;
}) {
  const { showToast } = useWuShowToast();

  const rows = useMemo<OrgDetailsRow[]>(
    () => [
      {
        orgId: settings.orgId,
        orgName: settings.orgName,
        userEmail: settings.userEmail,
        license: settings.license,
        accountManager: settings.accountManager,
      },
    ],
    [settings],
  );

  const columns = useMemo<IWuTableColumnDef<OrgDetailsRow>[]>(
    () => [
      {
        accessorKey: 'orgId',
        header: 'Org ID',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.orgId}</span>
        ),
      },
      {
        accessorKey: 'orgName',
        header: 'Org name',
        cell: ({ row }) => (
          <button
            type="button"
            className="max-w-[16rem] truncate text-left text-sm text-[#1b87e6] hover:underline"
            title={row.original.orgName}
            onClick={() =>
              showToast({ message: `Opened ${row.original.orgName}`, variant: 'success' })
            }
          >
            {row.original.orgName}
          </button>
        ),
      },
      {
        accessorKey: 'userEmail',
        header: 'User email',
        cell: ({ row }) => (
          <span className="text-sm">
            <button
              type="button"
              className="text-[#1b87e6] hover:underline"
              onClick={() =>
                showToast({
                  message: `User profile: ${row.original.userEmail}`,
                  variant: 'success',
                })
              }
            >
              {row.original.userEmail}
            </button>
            <button
              type="button"
              className="ml-1 text-[#1b87e6] hover:underline"
              onClick={() =>
                showToast({
                  message: `Login as ${row.original.userEmail}`,
                  variant: 'success',
                })
              }
            >
              (login)
            </button>
          </span>
        ),
      },
      {
        accessorKey: 'license',
        header: 'License',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.license}</span>
        ),
      },
      {
        accessorKey: 'accountManager',
        header: 'Account manager',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.accountManager}</span>
        ),
      },
    ],
    [showToast],
  );

  return (
    <div className="overflow-hidden rounded-lg border border-[#e0e4e8] bg-white shadow-sm">
      <div className="border-b border-[#eef0f3] px-5 py-4">
        <p className="text-base font-semibold text-[#1a2340]">{title}</p>
      </div>
      <div className="px-2 py-2 [&_thead_tr]:bg-[#f5f5f5] [&_th]:text-[#54606b]">
        <WuTable
          data={rows as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
        />
      </div>
    </div>
  );
}
