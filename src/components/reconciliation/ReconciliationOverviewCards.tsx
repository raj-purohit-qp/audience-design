'use client';

import {
  getRemainingReconciliationIds,
  getTotalIdsSubmitted,
  type ReconciliationMeta,
} from '@/data/mock-reconciliation';
import { MetricCard } from '@/components/ui/MetricCard';

export function ReconciliationOverviewCards({ meta }: { meta: ReconciliationMeta }) {
  const submitted = getTotalIdsSubmitted(meta);
  const remaining = getRemainingReconciliationIds(meta);
  const hasSubmissions = meta.requests.length > 0;
  const remainingRefund = remaining * meta.cpi;

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
        icon="wm-assignment-return"
        iconBg="bg-[#fff8e1]"
        iconFg="text-[#b06d00]"
        label="IDs reconciled so far"
        value={`${submitted} IDs`}
        sub={
          submitted === 0
            ? 'No submissions yet'
            : `${meta.requests.length} ${meta.requests.length === 1 ? 'submission' : 'submissions'}`
        }
      />
      <MetricCard
        icon="wm-account-balance-wallet"
        iconBg="bg-[#e8f5e9]"
        iconFg="text-[#188038]"
        label="Estimated refund available"
        value={`$${(hasSubmissions ? remainingRefund : meta.estimatedRefund).toFixed(2)}`}
        sub={`Based on $${meta.cpi.toFixed(2)} CPI`}
      />
      <MetricCard
        icon="wm-event"
        iconBg="bg-[#fce8e6]"
        iconFg="text-[#d93025]"
        label="Submission deadline"
        value={meta.deadlineDate}
        sub={
          hasSubmissions && remaining > 0 && meta.daysRemaining > 0
            ? `${meta.daysRemaining} days remaining · Window open`
            : `${meta.daysRemaining} days remaining`
        }
      />
    </div>
  );
}
