'use client';

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
    <div className="mb-5 rounded-md border border-[#e0e4e8] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-[#1a2340]">Collection progress</h3>
          <p className="mt-0.5 text-[13px] text-gray-500">
            {collected.toLocaleString()} of {required.toLocaleString()} target responses collected
          </p>
        </div>
        <div className="text-right">
          <div className="text-[32px] font-normal leading-none text-[#1b87e6]">
            {pct.toFixed(1)}%
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wide text-gray-500">complete</div>
        </div>
      </div>

      <ProgressBar pct={pct} height={10} />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2.5 rounded bg-[#f5f6f8] px-3.5 py-2.5"
          >
            <span className={`${stat.icon} text-[22px]`} style={{ color: stat.color }} aria-hidden="true" />
            <div>
              <div className="text-[15px] font-medium text-[#1a2340]">{stat.value}</div>
              <div className="text-[11px] text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
