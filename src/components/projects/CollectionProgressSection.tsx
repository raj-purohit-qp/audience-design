'use client';

import dynamic from 'next/dynamic';

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

function ProgressBar({
  pct,
  color = '#1b87e6',
  height = 8,
}: {
  pct: number;
  color?: string;
  height?: number;
}) {
  return (
    <div
      className="overflow-hidden rounded-full bg-[#e8eaed]"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          background: color,
        }}
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
}

export function CollectionProgressSection({
  collected,
  required,
  velocity,
  etcDate,
  daysElapsed,
}: CollectionProgressSectionProps) {
  const pct = required > 0 ? (collected / required) * 100 : 0;
  const remaining = Math.max(0, required - collected);

  const stats = [
    { label: 'Remaining', value: remaining.toLocaleString(), icon: 'wm-hourglass-empty', color: '#1b87e6' },
    { label: 'Responses / hr', value: `${velocity}/hr`, icon: 'wm-speed', color: '#188038' },
    { label: 'Est. completion', value: etcDate, icon: 'wm-event', color: '#b06d00' },
    { label: 'Days elapsed', value: `${daysElapsed} days`, icon: 'wm-calendar-today', color: '#6b7280' },
  ];

  return (
    <WuCard rounded className="mb-5 overflow-hidden p-0 shadow-sm">
      <WuCardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <WuHeading size="sm">Collection progress</WuHeading>
          <WuSubtext size="sm" className="mt-0.5">
            {collected.toLocaleString()} of {required.toLocaleString()} target responses collected
          </WuSubtext>
        </div>
        <div className="text-right">
          <p className="text-2xl font-normal text-[#1a2340]">{Math.round(pct)}%</p>
          <WuSubtext size="sm">Complete</WuSubtext>
        </div>
      </WuCardHeader>

      <div className="px-4 pb-4">
        <ProgressBar pct={pct} />

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, value, icon, color }) => (
            <div key={label} className="flex items-start gap-2">
              <span className={`${icon} text-base`} style={{ color }} aria-hidden="true" />
              <div>
                <p className="text-[11px] font-medium text-[#8c9baa]">{label}</p>
                <p className="text-sm font-medium text-[#1a2340]">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </WuCard>
  );
}
