'use client';

import { useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type {
  ChildCountryProject,
  MultiCountryProjectDetail,
} from '@/data/mock-multi-country';
import { getCountryByCode } from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';
import { CollectionProgressSection } from '@/components/projects/CollectionProgressSection';
import { CountriesProgressSection } from '@/components/multi-country/CountriesProgressSection';
import { MetricCard, MetricIconBadge } from '@/components/ui/MetricCard';
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);

type CountryView = 'all' | string;

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-[#e0e4e8] bg-[#f5f6f8] px-2.5 py-0.5 text-xs text-[#54606b]">
      {children}
    </span>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <div className="mb-1.5 text-[11px] font-medium text-[#8c9baa]">{children}</div>;
}

function formatMoney(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-[#e8eaed]">
      <div
        className="h-full rounded-full bg-[#1b87e6] transition-all duration-1000"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

function cardShell(): string {
  return 'flex h-full flex-col overflow-hidden border border-[#e0e4e8] p-0 shadow-none';
}

function ResponsesCard({ collected, required }: { collected: number; required: number }) {
  const pct = required > 0 ? (collected / required) * 100 : 0;
  const remaining = Math.max(0, required - collected);

  return (
    <WuCard rounded className={cardShell()}>
      <WuCardHeader className="flex items-center gap-2 border-b-0 pb-0">
        <MetricIconBadge icon="wm-group" bg="bg-[#f5f6f8]" fg="text-[#54606b]" />
        Responses
      </WuCardHeader>
      <div className="grid flex-1 grid-cols-2 px-4 pt-2">
        <div className="flex flex-col gap-0.5 pr-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">Collected</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
            {collected.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#8c9baa]">{pct.toFixed(1)}% of target</p>
        </div>
        <div className="flex flex-col gap-0.5 pl-3">
          <p className="text-[11px] font-medium text-[#8c9baa]">Required</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
            {required.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#8c9baa]">
            {remaining.toLocaleString()} remaining responses
          </p>
        </div>
      </div>
      <div className="px-4 pb-3 pt-3">
        <ProgressBar pct={pct} />
      </div>
    </WuCard>
  );
}

function ActualAssumedCard({
  label,
  icon,
  iconBg,
  iconFg,
  actualLabel,
  actualValue,
  assumedLabel,
  assumedValue,
}: {
  label: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  actualLabel: string;
  actualValue: string;
  assumedLabel: string;
  assumedValue: string;
}) {
  return (
    <WuCard rounded className={cardShell()}>
      <WuCardHeader className="flex items-center gap-2 border-b-0 pb-0">
        <MetricIconBadge icon={icon} bg={iconBg} fg={iconFg} />
        {label}
      </WuCardHeader>
      <div className="grid flex-1 grid-cols-2 px-4 pb-4 pt-2">
        <div className="flex flex-col gap-0.5 pr-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">{actualLabel}</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#188038]">
            {actualValue}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 pl-3">
          <p className="text-[11px] font-medium text-[#8c9baa]">{assumedLabel}</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
            {assumedValue}
          </p>
          <p className="text-[11px] text-[#8c9baa]">Set at launch</p>
        </div>
      </div>
    </WuCard>
  );
}

function TotalCostCard({
  budget,
  cpi,
  spent,
}: {
  budget: number;
  cpi: number;
  spent: number;
}) {
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  return (
    <WuCard rounded className={cardShell()}>
      <WuCardHeader className="flex items-center gap-2 border-b-0 pb-0">
        <MetricIconBadge icon="wm-calculate" bg="bg-[#fce8e6]" fg="text-[#d93025]" />
        Total cost
      </WuCardHeader>
      <div className="grid flex-1 grid-cols-2 px-4 pt-2">
        <div className="flex flex-col gap-0.5 pr-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">Current spend</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
            {formatMoney(spent)}
          </p>
          <p className="text-[11px] text-[#8c9baa]">
            {pct.toFixed(1)}% of {formatMoney(budget)}
          </p>
        </div>
        <div className="flex flex-col gap-0.5 pl-3">
          <p className="text-[11px] font-medium text-[#8c9baa]">CPI</p>
          <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
            {formatCurrency(cpi)}
          </p>
          <p className="text-[11px] text-[#8c9baa]">Per interview</p>
        </div>
      </div>
      <div className="px-4 pb-3 pt-3">
        <ProgressBar pct={pct} />
      </div>
    </WuCard>
  );
}

function CriteriaCard({
  title,
  icon,
  iconBg,
  iconFg,
  children,
}: {
  title: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <WuCard rounded className="overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
      <WuCardHeader
        className={`flex cursor-pointer items-center justify-between border-b px-4 py-3.5 ${
          open ? 'border-[#eef0f3]' : 'border-transparent'
        }`}
        onClick={() => setOpen((v) => !v)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2.5">
          <MetricIconBadge icon={icon} bg={iconBg} fg={iconFg} />
          <span className="text-[15px] font-medium text-[#1a2340]">{title}</span>
        </span>
        <span
          className={`${open ? 'wm-expand-less' : 'wm-expand-more'} text-xl text-[#8c9baa]`}
          aria-hidden="true"
        />
      </WuCardHeader>
      {open && <div className="px-4 py-4">{children}</div>}
    </WuCard>
  );
}

function aggregateMetrics(project: MultiCountryProjectDetail) {
  const collected = project.children.reduce((s, c) => s + c.collected, 0);
  const required = project.children.reduce((s, c) => s + c.responses, 0);
  const budget = project.children.reduce((s, c) => s + c.totalCost, 0);
  const spent = project.children.reduce(
    (s, c) => s + Number((c.collected * c.cpi).toFixed(2)),
    0,
  );
  const avgCpi =
    project.children.length > 0
      ? project.children.reduce((s, c) => s + c.cpi, 0) / project.children.length
      : 0;
  const avgIr =
    project.children.length > 0
      ? Math.round(
          project.children.reduce((s, c) => s + c.currentIr, 0) / project.children.length,
        )
      : project.incidenceRate;

  return { collected, required, budget, spent, avgCpi, avgIr };
}

function countryMetrics(child: ChildCountryProject) {
  return {
    collected: child.collected,
    required: child.responses,
    budget: child.totalCost,
    spent: Number((child.collected * child.cpi).toFixed(2)),
    avgCpi: child.cpi,
    avgIr: child.currentIr,
  };
}

interface MultiCountryOverviewTabProps {
  project: MultiCountryProjectDetail;
}

export function MultiCountryOverviewTab({ project }: MultiCountryOverviewTabProps) {
  const [countryView, setCountryView] = useState<CountryView>('all');

  const selectOptions = useMemo(
    () => [
      { value: 'all', label: 'All' },
      ...project.children.map((c) => {
        const country = getCountryByCode(c.countryCode);
        return {
          value: c.countryCode,
          label: `${country?.flag ?? ''} ${country?.label ?? c.countryCode}`.trim(),
        };
      }),
    ],
    [project.children],
  );

  const selectedChild =
    countryView === 'all'
      ? null
      : (project.children.find((c) => c.countryCode === countryView) ?? null);

  const isAll = countryView === 'all';
  const metrics = selectedChild
    ? countryMetrics(selectedChild)
    : aggregateMetrics(project);

  const isLaunched = project.status !== 'Draft' && project.status !== 'Bid';
  const showProgress = isLaunched && project.status !== 'Closed';
  const selectedLabel =
    selectOptions.find((o) => o.value === countryView)?.label ?? 'All';

  const geographyChips = isAll
    ? project.children.map((c) => {
        const country = getCountryByCode(c.countryCode);
        return `${country?.flag ?? ''} ${country?.label ?? c.countryCode}`.trim();
      })
    : [
        `${getCountryByCode(selectedChild?.countryCode ?? '')?.flag ?? ''} ${
          getCountryByCode(selectedChild?.countryCode ?? '')?.label ??
          selectedChild?.countryCode ??
          ''
        }`.trim(),
      ];

  const audienceSummary = selectedChild?.audienceSummary
    ?? 'All panelists matching the global criteria across launched countries are eligible to respond.';

  return (
    <DetailPageContent>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <WuHeading size="md">Overview</WuHeading>
          <p className="mt-0.5 text-sm text-[#8c9baa]">
            {isAll
              ? 'Aggregate metrics across all countries'
              : `Metrics for ${selectedLabel}`}
          </p>
        </div>
        <WuSelect
          data={selectOptions}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: countryView, label: selectedLabel }}
          onSelect={(v) => setCountryView((v as { value: string }).value)}
          Label="Country"
          variant="outlined"
          className="min-w-[200px]"
          aria-label="Switch country view"
        />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLaunched ? (
          <ResponsesCard collected={metrics.collected} required={metrics.required} />
        ) : (
          <MetricCard
            label="Responses"
            value={metrics.required.toLocaleString()}
            sub="Target"
            icon="wm-group"
            iconBg="bg-[#f5f6f8]"
            iconFg="text-[#54606b]"
          />
        )}

        {isLaunched ? (
          <ActualAssumedCard
            label="Incidence rate"
            icon="wm-tag"
            iconBg="bg-[#e8f0fe]"
            iconFg="text-[#1b87e6]"
            actualLabel={isAll ? 'Avg. actual IR' : 'Actual IR'}
            actualValue={`${metrics.avgIr}%`}
            assumedLabel="Assumed IR"
            assumedValue={`${project.incidenceRate}%`}
          />
        ) : (
          <MetricCard
            label="Incidence rate"
            value={`${project.incidenceRate}%`}
            sub="Assumed IR"
            icon="wm-tag"
            iconBg="bg-[#e8f0fe]"
            iconFg="text-[#1b87e6]"
          />
        )}

        {isLaunched ? (
          <ActualAssumedCard
            label="Length of interview"
            icon="wm-schedule"
            iconBg="bg-[#fff8e1]"
            iconFg="text-[#b06d00]"
            actualLabel="Actual LOI"
            actualValue={`${project.surveyLengthMinutes} min`}
            assumedLabel="Assumed LOI"
            assumedValue={`${project.surveyLengthMinutes} min`}
          />
        ) : (
          <MetricCard
            label="Length of interview"
            value={`${project.surveyLengthMinutes} min`}
            sub="Assumed LOI"
            icon="wm-schedule"
            iconBg="bg-[#fff8e1]"
            iconFg="text-[#b06d00]"
          />
        )}

        {isLaunched ? (
          <TotalCostCard
            budget={metrics.budget}
            cpi={Number(metrics.avgCpi.toFixed(2))}
            spent={metrics.spent}
          />
        ) : (
          <MetricCard
            label="Total cost"
            value={formatCurrency(metrics.budget)}
            sub={`CPI ${formatCurrency(metrics.avgCpi)}`}
            icon="wm-calculate"
            iconBg="bg-[#fce8e6]"
            iconFg="text-[#d93025]"
          />
        )}
      </div>

      {showProgress && (
        <CollectionProgressSection
          collected={metrics.collected}
          required={metrics.required}
          velocity={isAll ? 18 : 5}
          etcDate={project.dueDate}
          daysElapsed={28}
        />
      )}

      {isAll && project.children.length > 0 && (
        <CountriesProgressSection countries={project.children} />
      )}

      <section>
        <WuHeading size="md" className="mb-4">
          Launch criteria &amp; audience configuration
        </WuHeading>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <CriteriaCard
            title="Geography"
            icon="wm-public"
            iconBg="bg-[#e8f0fe]"
            iconFg="text-[#1b87e6]"
          >
            <div>
              <FieldLabel>{isAll ? 'Countries' : 'Country'}</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {geographyChips.map((chip) => (
                  <Chip key={chip}>{chip}</Chip>
                ))}
              </div>
            </div>
          </CriteriaCard>

          <CriteriaCard
            title="Demographics"
            icon="wm-people"
            iconBg="bg-[#e8f5e9]"
            iconFg="text-[#188038]"
          >
            <div className="space-y-3">
              {project.globalCriteria
                .filter((c) => c.category === 'Demographics')
                .map((c) => {
                  const override = selectedChild
                    ? project.countries
                        .find((p) => p.countryCode === selectedChild.countryCode)
                        ?.overrides.find((o) => o.criterionId === c.id)
                    : undefined;
                  return (
                    <div key={c.id}>
                      <FieldLabel>{c.label}</FieldLabel>
                      <Chip>{override?.value ?? c.value}</Chip>
                    </div>
                  );
                })}
            </div>
          </CriteriaCard>

          <CriteriaCard
            title="Qualification criteria"
            icon="wm-list-alt"
            iconBg="bg-[#f5f6f8]"
            iconFg="text-[#54606b]"
          >
            <div className="space-y-3">
              {project.globalCriteria
                .filter((c) => c.category !== 'Demographics')
                .map((c) => (
                  <div key={c.id}>
                    <FieldLabel>{c.label}</FieldLabel>
                    <Chip>{c.value}</Chip>
                  </div>
                ))}
              <div>
                <FieldLabel>Unique Responses</FieldLabel>
                <Chip>{project.uniqueResponseGroupName ?? 'None'}</Chip>
              </div>
              <p className="pt-1 text-[13px] leading-relaxed text-[#8c9baa]">
                {audienceSummary}
              </p>
            </div>
          </CriteriaCard>
        </div>
      </section>
    </DetailPageContent>
  );
}
