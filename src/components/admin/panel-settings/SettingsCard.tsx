'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

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
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);

export function SettingsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <WuCard rounded className="overflow-hidden p-0 shadow-sm">
      <WuCardHeader className="border-b border-[#eef0f3] px-5 py-4">
        <div>
          <WuHeading size="sm">{title}</WuHeading>
          {subtitle && (
            <WuSubtext size="sm" className="mt-0.5">
              {subtitle}
            </WuSubtext>
          )}
        </div>
      </WuCardHeader>
      <div className="px-5 py-5">{children}</div>
    </WuCard>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="rounded-lg border border-[#e0e4e8] bg-white p-5">
        <div className="h-4 w-48 rounded bg-[#eef0f3]" />
        <div className="mt-4 h-10 w-full max-w-xs rounded bg-[#eef0f3]" />
      </div>
      <div className="rounded-lg border border-[#e0e4e8] bg-white p-5">
        <div className="h-4 w-64 rounded bg-[#eef0f3]" />
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-[#eef0f3]" />
              <div className="h-10 w-full rounded bg-[#eef0f3]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
