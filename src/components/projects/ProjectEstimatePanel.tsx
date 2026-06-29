'use client';

import dynamic from 'next/dynamic';
import { formatEstimateDate, type ProjectEstimate } from '@/data/mock-project-create';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);

interface ProjectEstimatePanelProps {
  responses: number;
  estimate: ProjectEstimate;
  completionDate: Date | undefined;
  onCreateProject: () => void;
  countryCount?: number;
}

export function ProjectEstimatePanel({
  responses,
  estimate,
  completionDate,
  onCreateProject,
  countryCount,
}: ProjectEstimatePanelProps) {
  const isFeasible = estimate.feasibility === 'high';

  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <WuCard rounded className="overflow-hidden border border-gray-200 bg-gray-50 p-0">
        <div className="border-b border-gray-200 bg-white px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">Your estimate</h2>
        </div>

        <dl className="space-y-4 px-5 py-4">
          {countryCount !== undefined && countryCount > 1 && (
            <div className="flex items-center justify-between gap-4">
              <dt className="text-sm text-gray-600">Countries</dt>
              <dd className="text-sm font-medium text-gray-900">{countryCount}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-gray-600">Respondents</dt>
            <dd className="text-sm font-medium text-gray-900">{responses.toLocaleString()}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-gray-600">Cost per completion</dt>
            <dd className="text-sm font-medium text-gray-900">
              ${estimate.costPerInterview.toFixed(2)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-gray-600">Est. completion date</dt>
            <dd className="text-sm font-medium text-gray-900">
              {formatEstimateDate(completionDate)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <dt className="text-sm font-semibold text-gray-900">Total</dt>
            <dd className="text-sm font-semibold text-gray-900">
              ${estimate.totalCost.toFixed(2)} USD
            </dd>
          </div>
        </dl>

        <div className="px-5 pb-4">
          <div className="mb-4 flex items-center gap-2 text-sm text-green-700">
            <span className="wm-check-circle text-base text-green-600" aria-hidden="true" />
            {isFeasible ? 'Your sample is feasible' : 'Sample feasibility may be limited'}
          </div>

          <WuButton className="w-full" onClick={onCreateProject}>
            Create project
          </WuButton>
        </div>

        <div className="flex gap-2 border-t border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
          <span className="wm-info mt-0.5 shrink-0 text-sm" aria-hidden="true" />
          <p>
            Pricing shown is for self-service fielding. Managed service projects may include
            additional fees based on complexity and timeline.
          </p>
        </div>
      </WuCard>
    </aside>
  );
}
