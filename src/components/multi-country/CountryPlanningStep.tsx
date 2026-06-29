'use client';

import dynamic from 'next/dynamic';
import type { CountryPlan } from '@/data/mock-multi-country';
import {
  getCountryByCode,
  getSetupStatusLabel,
  summarizeProjectCost,
} from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';

const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);

interface CountryPlanningStepProps {
  plans: CountryPlan[];
}

function StatusChip({ status }: { status: CountryPlan['setupStatus'] }) {
  const color =
    status === 'ready' ? 'success' : status === 'missing_criteria' ? 'danger' : undefined;
  return <WuChip size="sm" color={color}>{getSetupStatusLabel(status)}</WuChip>;
}

export function CountryPlanningStep({ plans }: CountryPlanningStepProps) {
  const summary = summarizeProjectCost(plans);

  if (plans.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
        <p className="text-sm text-gray-600">Select at least one country to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Countries', value: summary.countryCount.toString() },
          { label: 'Total responses', value: summary.totalResponses.toLocaleString() },
          { label: 'Total estimated cost', value: formatCurrency(summary.totalCost) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium text-gray-500">{label}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200">
        <table className="w-full text-sm" aria-label="Country planning summary">
          <thead className="bg-gray-50">
            <tr>
              {['Country', 'Responses', 'CPI', 'Estimated cost', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => {
              const country = getCountryByCode(plan.countryCode);
              return (
                <tr key={plan.countryCode} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {country?.flag} {country?.label ?? plan.countryCode}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{plan.responses.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(plan.cpi)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(plan.estimatedCost)}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={plan.setupStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Compare markets before configuration. Countries marked &quot;Needs setup&quot; require audience
        configuration in the next step.
      </p>
    </div>
  );
}
