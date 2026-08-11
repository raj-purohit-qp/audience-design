'use client';

import dynamic from 'next/dynamic';
import type { MultiSourceLaunchSettings } from '@/data/mock-org-panel-settings';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);

export function MultiSourceLaunchFields({
  section,
  readOnly,
  onChange,
}: {
  section: MultiSourceLaunchSettings;
  readOnly: boolean;
  onChange: (updates: Partial<MultiSourceLaunchSettings>) => void;
}) {
  return (
    <div className="max-w-xl space-y-4">
      <div className="flex items-start justify-between gap-6 rounded-md border border-[#e0e4e8] bg-white px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#1a2340]">Launch with community</p>
          <p className="mt-1 text-xs text-[#8c9baa]">
            Allow this account to launch Audience projects using community as an additional
            sample source.
          </p>
        </div>
        <WuToggle
          checked={section.launchWithCommunity}
          disabled={readOnly}
          Label={section.launchWithCommunity ? 'On' : 'Off'}
          labelPosition="right"
          onChange={(checked) => onChange({ launchWithCommunity: checked })}
          aria-label="Launch with community"
        />
      </div>
    </div>
  );
}
