'use client';

import dynamic from 'next/dynamic';
import type { MultiCountryProjectDetail } from '@/data/mock-multi-country';
import { detailPageGutter } from '@/components/ui/page-layout';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);

function statusChipColor(
  status: MultiCountryProjectDetail['status'],
): 'success' | 'warning' | 'danger' | undefined {
  if (status === 'Live') return 'success';
  if (status === 'Paused') return 'warning';
  if (status === 'Closed') return 'danger';
  return undefined;
}

interface MultiCountryProjectHeaderProps {
  project: MultiCountryProjectDetail;
  onLaunch: () => void;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
}

export function MultiCountryProjectHeader({
  project,
  onLaunch,
  onPause,
  onResume,
  onClose,
}: MultiCountryProjectHeaderProps) {
  return (
    <header className="border-b border-[#e0e4e8] bg-white">
      <div className={`${detailPageGutter} flex flex-wrap items-start justify-between gap-4 py-5`}>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <WuHeading size="lg">{project.name}</WuHeading>
            <WuChip size="sm" shape="rounded" color={statusChipColor(project.status)}>
              {project.status}
            </WuChip>
            <WuChip size="sm" variant="secondary">
              Multi-country
            </WuChip>
          </div>
          <WuSubtext size="sm">
            {project.countries.length} countries · #{project.projectId}
          </WuSubtext>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {project.status === 'Draft' && (
            <WuButton Icon={<span className="wm-rocket-launch" />} iconPosition="left" onClick={onLaunch}>
              Launch survey
            </WuButton>
          )}
          {project.status === 'Live' && (
            <>
              <WuButton variant="outlined" color="primary" Icon={<span className="wm-pause" />} iconPosition="left" onClick={onPause}>
                Pause survey
              </WuButton>
              <WuButton variant="outlined" color="error" Icon={<span className="wm-cancel" />} iconPosition="left" onClick={onClose}>
                Close survey
              </WuButton>
            </>
          )}
          {project.status === 'Paused' && (
            <WuButton variant="outlined" color="primary" Icon={<span className="wm-play-arrow" />} iconPosition="left" onClick={onResume}>
              Resume survey
            </WuButton>
          )}
          {project.status === 'Closed' && (
            <WuButton variant="outlined" disabled Icon={<span className="wm-cancel" />} iconPosition="left">
              Closed
            </WuButton>
          )}
        </div>
      </div>
    </header>
  );
}
