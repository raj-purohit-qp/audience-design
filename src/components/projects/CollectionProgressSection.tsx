'use client';

import dynamic from 'next/dynamic';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
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
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#e8eaed]">
      <div
        className="h-full rounded-full bg-[#1b87e6] transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

interface CollectionProgressSectionProps {
  collected: number;
  required: number;
  velocity: number;
  etcDate: string;
  daysElapsed: number;
  /** Show Push for Live projects only */
  showPush?: boolean;
  onPush?: () => void;
}

export function CollectionProgressSection({
  collected,
  required,
  velocity,
  etcDate,
  daysElapsed,
  showPush = false,
  onPush,
}: CollectionProgressSectionProps) {
  const pct = required > 0 ? (collected / required) * 100 : 0;
  const remaining = Math.max(0, required - collected);
  const pctLabel = pct.toFixed(1);

  const stats = [
    { label: 'Remaining', value: remaining.toLocaleString(), icon: 'wm-hourglass-empty' },
    { label: 'Days elapsed', value: String(daysElapsed), icon: 'wm-calendar-today' },
    { label: 'Responses / hr', value: `${velocity.toLocaleString()}/hr`, icon: 'wm-speed' },
    { label: 'Est. completion', value: etcDate, icon: 'wm-event-available' },
  ];

  return (
    <WuCard rounded className="mb-5 overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <WuHeading size="sm">Collection progress</WuHeading>
            <WuSubtext size="sm" className="mt-1">
              {collected.toLocaleString()} of {required.toLocaleString()} target responses collected
            </WuSubtext>
            <p className="mt-3 text-[28px] font-normal leading-none tabular-nums text-[#1a2340]">
              {pctLabel}%{' '}
              <span className="text-sm font-normal text-[#8c9baa]">complete</span>
            </p>
          </div>
          {showPush && onPush ? (
            <WuButton
              variant="outline"
              color="primary"
              size="sm"
              className="shrink-0"
              onClick={onPush}
            >
              Push
            </WuButton>
          ) : null}
        </div>

        <ProgressBar pct={pct} />

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map(({ label, value, icon }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-lg bg-[#f5f6f8] px-3 py-4 text-center"
            >
              <span className={`${icon} mb-1.5 text-xl text-[#54606b]`} aria-hidden="true" />
              <p className="text-[11px] font-medium text-[#8c9baa]">{label}</p>
              <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-[#1a2340]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </WuCard>
  );
}
