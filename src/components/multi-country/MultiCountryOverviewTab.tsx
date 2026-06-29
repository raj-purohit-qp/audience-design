'use client';

import dynamic from 'next/dynamic';
import type { MultiCountryProjectDetail } from '@/data/mock-multi-country';
import { summarizeProjectCost } from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';
import { MetricCard } from '@/components/ui/MetricCard';
import { DetailPageContent } from '@/components/ui/page-layout';

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

interface MultiCountryOverviewTabProps {
  project: MultiCountryProjectDetail;
}

export function MultiCountryOverviewTab({ project }: MultiCountryOverviewTabProps) {
  const summary = summarizeProjectCost(project.countries);
  const totalCollected = project.children.reduce((s, c) => s + c.collected, 0);
  const completionPct = summary.totalResponses > 0
    ? Math.round((totalCollected / summary.totalResponses) * 100)
    : 0;

  const cards = [
    { label: 'Countries', value: summary.countryCount.toString(), icon: 'wm-public', iconBg: 'bg-[#e8f0fe]', iconFg: 'text-[#1b87e6]' },
    { label: 'Responses', value: summary.totalResponses.toLocaleString(), icon: 'wm-groups', iconBg: 'bg-[#f5f6f8]', iconFg: 'text-[#54606b]' },
    { label: 'Completion', value: `${completionPct}%`, icon: 'wm-trending-up', iconBg: 'bg-[#e8f5e9]', iconFg: 'text-[#188038]' },
    { label: 'Cost', value: formatCurrency(summary.totalCost), icon: 'wm-payments', iconBg: 'bg-[#fff8e1]', iconFg: 'text-[#b06d00]' },
  ];

  return (
    <DetailPageContent className="space-y-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon, iconBg, iconFg }) => (
          <MetricCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            iconBg={iconBg}
            iconFg={iconFg}
          />
        ))}
      </div>

      <WuCard rounded className="overflow-hidden p-0">
        <WuCardHeader>
          <WuHeading size="sm">Global criteria</WuHeading>
        </WuCardHeader>
        <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.globalCriteria.map((c) => (
            <div key={c.id} className="rounded-md bg-[#f5f6f8] px-3 py-2">
              <p className="text-xs text-[#8c9baa]">{c.label}</p>
              <p className="text-sm text-[#1a2340]">{c.value}</p>
            </div>
          ))}
        </div>
      </WuCard>

      <WuCard rounded className="overflow-hidden p-0">
        <WuCardHeader>
          <WuHeading size="sm">Country cost breakdown</WuHeading>
        </WuCardHeader>
        <ul className="space-y-2 px-4 py-4">
          {project.countries.map((plan) => (
            <li key={plan.countryCode} className="flex justify-between text-sm text-[#54606b]">
              <span>{plan.countryCode}</span>
              <span>{formatCurrency(plan.estimatedCost)}</span>
            </li>
          ))}
        </ul>
      </WuCard>
    </DetailPageContent>
  );
}
