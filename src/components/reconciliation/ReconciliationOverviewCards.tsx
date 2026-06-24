'use client';

import dynamic from 'next/dynamic';
import type { ReconciliationMeta } from '@/data/mock-reconciliation';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false }
);

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconFg: string;
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ icon, iconBg, iconFg, label, value, sub }: StatCardProps) {
  return (
    <WuCard rounded className="flex flex-col overflow-hidden p-0 shadow-sm">
      <WuCardHeader className="flex items-center gap-2 border-b border-[#eef0f3] px-4 py-2.5 text-xs font-medium text-[#8c9baa]">
        <span
          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded ${iconBg} ${iconFg}`}
        >
          <span className={`${icon} text-[15px]`} aria-hidden="true" />
        </span>
        {label}
      </WuCardHeader>
      <div className="flex flex-col gap-0.5 px-4 py-3">
        <p className="text-[24px] font-normal leading-tight text-[#1a2340]">{value}</p>
        {sub && <p className="text-[11px] text-[#8c9baa]">{sub}</p>}
      </div>
    </WuCard>
  );
}

export function ReconciliationOverviewCards({ meta }: { meta: ReconciliationMeta }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon="wm-fact-check"
        iconBg="bg-[#e8f0fe]"
        iconFg="text-[#1b87e6]"
        label="Eligible responses"
        value={meta.eligibleResponses.toLocaleString()}
        sub="Completed interviews"
      />
      <StatCard
        icon="wm-rule"
        iconBg="bg-[#fff8e1]"
        iconFg="text-[#b06d00]"
        label="Maximum reconciliation allowed"
        value={`${meta.maxIds} IDs`}
        sub={`${meta.maxPct}% of completed responses`}
      />
      <StatCard
        icon="wm-account-balance-wallet"
        iconBg="bg-[#e8f5e9]"
        iconFg="text-[#188038]"
        label="Estimated refund available"
        value={`$${meta.estimatedRefund.toFixed(2)}`}
        sub={`Based on $${meta.cpi.toFixed(2)} CPI`}
      />
      <StatCard
        icon="wm-event"
        iconBg="bg-[#fce8e6]"
        iconFg="text-[#d93025]"
        label="Submission deadline"
        value={meta.deadlineDate}
        sub={`${meta.daysRemaining} days remaining`}
      />
    </div>
  );
}
