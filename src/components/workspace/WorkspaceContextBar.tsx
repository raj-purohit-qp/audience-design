'use client';

import dynamic from 'next/dynamic';
import {
  workspaceHeading,
  type AccessLevel,
} from '@/data/mock-workspace';

const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);

export function WorkspaceContextBar({
  isMine,
  ownerName,
  access,
}: {
  isMine: boolean;
  ownerName: string;
  access: AccessLevel | 'owner';
}) {
  const readOnly = access === 'read';
  const canManage = access === 'read_write';

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[#e0e4e8] bg-[#f8f9fa] px-6 py-2.5">
      <span className="wm-folder text-base text-[#54606b]" aria-hidden="true" />
      <WuSubtext size="sm" className="text-[#1a2340]">
        {isMine ? 'Viewing My Workspace' : `Viewing ${workspaceHeading(false, ownerName)}`}
      </WuSubtext>
      {readOnly ? (
        <WuChip size="sm" variant="secondary">
          Read
        </WuChip>
      ) : null}
      {canManage ? (
        <WuChip size="sm" color="success">
          Read & write
        </WuChip>
      ) : null}
    </div>
  );
}
