'use client';

import dynamic from 'next/dynamic';
import type { CountryPlan } from '@/data/mock-multi-country';
import { getCountryByCode, summarizeProjectCost } from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

interface ProjectSummaryPanelProps {
  plans: CountryPlan[];
  launchDisabled?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export function ProjectSummaryPanel({
  plans,
  launchDisabled,
  actionLabel = 'Continue',
  onAction,
}: ProjectSummaryPanelProps) {
  const summary = summarizeProjectCost(plans);

  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <WuCard rounded className="sticky top-5 overflow-hidden border border-gray-200 bg-gray-50 p-0">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Project summary</h2>
        </div>

        <dl className="space-y-3 px-5 py-4">
          <div className="flex justify-between gap-4">
            <dt className="text-sm text-gray-600">Countries</dt>
            <dd className="text-sm font-medium text-gray-900">{summary.countryCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-sm text-gray-600">Responses</dt>
            <dd className="text-sm font-medium text-gray-900">
              {summary.totalResponses.toLocaleString()}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-gray-200 pt-3">
            <dt className="text-sm font-semibold text-gray-900">Estimated cost</dt>
            <dd className="text-sm font-semibold text-gray-900">
              {formatCurrency(summary.totalCost)}
            </dd>
          </div>
        </dl>

        {plans.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-3">
            <p className="mb-2 text-xs font-medium text-gray-500">Country breakdown</p>
            <ul className="space-y-1.5">
              {plans.map((plan) => {
                const country = getCountryByCode(plan.countryCode);
                return (
                  <li key={plan.countryCode} className="flex justify-between text-xs text-gray-700">
                    <span>{country?.value ?? plan.countryCode}</span>
                    <span>{formatCurrency(plan.estimatedCost)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {onAction && (
          <div className="px-5 pb-4 pt-2">
            <WuButton className="w-full" disabled={launchDisabled} onClick={onAction}>
              {actionLabel}
            </WuButton>
          </div>
        )}
      </WuCard>
    </aside>
  );
}
