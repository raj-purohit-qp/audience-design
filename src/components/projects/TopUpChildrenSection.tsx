'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { TopUpChildRef } from '@/data/audience-project-store';

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

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e8eaed]">
      <div
        className="h-full rounded-full bg-[#1b87e6] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function statusChipColor(
  status: TopUpChildRef['status'],
): 'success' | 'warning' | undefined {
  if (status === 'Live') return 'success';
  if (status === 'Paused') return 'warning';
  return undefined;
}

interface TopUpChildrenSectionProps {
  childrenProjects: TopUpChildRef[];
}

export function TopUpChildrenSection({ childrenProjects }: TopUpChildrenSectionProps) {
  if (childrenProjects.length === 0) return null;

  return (
    <WuCard rounded className="mb-5 overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
      <WuCardHeader className="flex flex-col items-start gap-0.5">
        <WuHeading size="sm">Top-up projects</WuHeading>
        <p className="text-sm font-normal text-[#8c9baa]">
          Child projects launched from this parent
        </p>
      </WuCardHeader>

      <ul className="divide-y divide-[#eef0f3]">
        {childrenProjects.map((child) => {
          const pct =
            child.responses > 0
              ? Math.round((child.collected / child.responses) * 1000) / 10
              : 0;

          return (
            <li key={child.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
              <div className="min-w-[11rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/projects/${child.id}`}
                    className="text-sm font-medium text-[rgb(var(--wu-blue-p))] hover:underline"
                  >
                    {child.name}
                  </Link>
                  <WuChip size="sm" shape="rounded" color={statusChipColor(child.status)}>
                    {child.status}
                  </WuChip>
                </div>
                <p className="mt-0.5 text-xs text-[#8c9baa]">{child.projectId}</p>
              </div>

              <div className="min-w-[12rem] flex-[1.5]">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-[#8c9baa]">
                  <span>
                    {child.collected.toLocaleString()} / {child.responses.toLocaleString()}
                  </span>
                  <span className="tabular-nums text-[#1a2340]">{pct.toFixed(1)}%</span>
                </div>
                <ProgressBar pct={pct} />
              </div>
            </li>
          );
        })}
      </ul>
    </WuCard>
  );
}
