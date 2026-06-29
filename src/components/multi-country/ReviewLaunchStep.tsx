'use client';

import dynamic from 'next/dynamic';
import type { CountryPlan, GlobalCriterion } from '@/data/mock-multi-country';
import {
  getCountryByCode,
  getFeasibilityLabel,
  slugifyChildName,
  summarizeProjectCost,
} from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);

interface ReviewLaunchStepProps {
  projectName: string;
  plans: CountryPlan[];
  globalCriteria: GlobalCriterion[];
}

export function ReviewLaunchStep({ projectName, plans, globalCriteria }: ReviewLaunchStepProps) {
  const summary = summarizeProjectCost(plans);
  const name = projectName.trim() || 'Untitled project';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900">Review &amp; launch</h3>
        <p className="mt-1 text-sm text-gray-500">
          Confirm your multi-country setup before launch. Each country becomes a child project.
        </p>
      </div>

      <WuCard rounded className="border border-gray-200 p-5">
        <p className="text-xs font-medium text-gray-500">Parent project</p>
        <p className="text-lg font-semibold text-gray-900">{name}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>{summary.countryCount} countries</span>
          <span>{summary.totalResponses.toLocaleString()} responses</span>
          <span>{formatCurrency(summary.totalCost)} estimated</span>
        </div>
      </WuCard>

      <div>
        <p className="mb-3 text-sm font-medium text-gray-900">Child projects</p>
        <div className="space-y-3">
          {plans.map((plan) => {
            const country = getCountryByCode(plan.countryCode);
            const childName = slugifyChildName(name, plan.countryCode);
            const criteriaSummary = globalCriteria
              .slice(0, 3)
              .map((c) => c.label)
              .join(', ');

            return (
              <WuCard key={plan.countryCode} rounded className="border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {country?.flag} {childName}
                    </p>
                    <p className="text-xs text-gray-500">{country?.label}</p>
                  </div>
                  <WuChip size="sm" color="success">Ready</WuChip>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-gray-500">CPI</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(plan.cpi)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Responses</dt>
                    <dd className="font-medium text-gray-900">{plan.responses.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Est. cost</dt>
                    <dd className="font-medium text-gray-900">{formatCurrency(plan.estimatedCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500">Feasibility</dt>
                    <dd className="font-medium text-gray-900">{getFeasibilityLabel(plan.feasibility)}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-gray-500">Audience: {criteriaSummary}…</p>
              </WuCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}
