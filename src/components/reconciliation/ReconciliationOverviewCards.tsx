'use client';

import dynamic from 'next/dynamic';
import type { ReconciliationMeta } from '@/data/mock-reconciliation';
import { MetricCard } from '@/components/ui/MetricCard';

export function ReconciliationOverviewCards({ meta }: { meta: ReconciliationMeta }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon="wm-fact-check"
        iconBg="bg-[#e8f0fe]"
        iconFg="text-[#1b87e6]"
        label="Eligible responses"
        value={meta.eligibleResponses.toLocaleString()}
        sub="Completed interviews"
      />
      <MetricCard
        icon="wm-rule"
        iconBg="bg-[#fff8e1]"
        iconFg="text-[#b06d00]"
        label="Maximum reconciliation allowed"
        value={`${meta.maxIds} IDs`}
        sub={`${meta.maxPct}% of completed responses`}
      />
      <MetricCard
        icon="wm-account-balance-wallet"
        iconBg="bg-[#e8f5e9]"
        iconFg="text-[#188038]"
        label="Estimated refund available"
        value={`$${meta.estimatedRefund.toFixed(2)}`}
        sub={`Based on $${meta.cpi.toFixed(2)} CPI`}
      />
      <MetricCard
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
