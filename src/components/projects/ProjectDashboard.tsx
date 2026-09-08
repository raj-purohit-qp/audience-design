'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CollectionProgressSection } from '@/components/projects/CollectionProgressSection';
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

function Chip({ children, blue }: { children: ReactNode; blue?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded px-2.5 py-0.5 text-xs ${
        blue
          ? 'border border-transparent bg-[#e8f0fe] text-[#1b87e6]'
          : 'border border-[#e0e4e8] bg-[#f5f6f8] text-[#54606b]'
      }`}
    >
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

function cardShell(hov: boolean): string {
  return `flex h-full flex-col overflow-hidden border border-[#e0e4e8] p-0 shadow-none transition-colors duration-150 ${
    hov ? 'border-[#1b87e6]' : ''
  }`;
}

/* ── Responses (Live) ── */

function ResponsesCard({ collected, required }: { collected: number; required: number }) {
  const [hov, setHov] = useState(false);
  const pct = required > 0 ? (collected / required) * 100 : 0;
  const remaining = Math.max(0, required - collected);

  return (
    <WuCard
      rounded
      className={cardShell(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
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

/* ── IR / LOI split cards ── */

function ActualAssumedCard({
  label,
  icon,
  iconBg,
  iconFg,
  actualLabel,
  actualValue,
  assumedLabel,
  assumedValue,
  actualColor,
}: {
  label: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  actualLabel: string;
  actualValue: string;
  assumedLabel: string;
  assumedValue: string;
  actualColor: string;
}) {
  const [hov, setHov] = useState(false);

  return (
    <WuCard
      rounded
      className={cardShell(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <WuCardHeader className="flex items-center gap-2 border-b-0 pb-0">
        <MetricIconBadge icon={icon} bg={iconBg} fg={iconFg} />
        {label}
      </WuCardHeader>
      <div className="grid flex-1 grid-cols-2 px-4 pb-4 pt-2">
        <div className="flex flex-col gap-0.5 pr-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">{actualLabel}</p>
          <p className={`text-[24px] font-normal leading-tight tabular-nums ${actualColor}`}>
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

function actualValueColor(realtime: number, assumed: number): string {
  if (assumed <= 0) return 'text-[#1a2340]';
  const pct = (Math.abs(realtime - assumed) / assumed) * 100;
  if (pct <= 5) return 'text-[#188038]';
  if (pct <= 10) return 'text-[#b06d00]';
  if (pct <= 20) return 'text-[#d04a02]';
  return 'text-[#d93025]';
}

/* ── Total cost ── */

function TotalCostCard({
  budget,
  cpi,
  spent,
  isLaunched,
}: {
  budget: number;
  cpi: number;
  spent: number;
  isLaunched: boolean;
}) {
  const [hov, setHov] = useState(false);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  return (
    <WuCard
      rounded
      className={cardShell(hov)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <WuCardHeader className="flex items-center gap-2 border-b-0 pb-0">
        <MetricIconBadge
          icon="wm-calculate"
          bg="bg-[#fce8e6]"
          fg="text-[#d93025]"
        />
        Total cost
      </WuCardHeader>

      {isLaunched ? (
        <>
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
                ${cpi.toFixed(2)}
              </p>
              <p className="text-[11px] text-[#8c9baa]">Per interview</p>
            </div>
          </div>
          <div className="px-4 pb-3 pt-3">
            <ProgressBar pct={pct} />
          </div>
        </>
      ) : (
        <div className="grid flex-1 grid-cols-2 px-4 pb-4 pt-2">
          <div className="flex flex-col gap-0.5 pr-3" style={{ borderRight: '1px solid #e0e4e8' }}>
            <p className="text-[11px] font-medium text-[#8c9baa]">Budget</p>
            <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
              {formatMoney(budget)}
            </p>
          </div>
          <div className="flex flex-col gap-0.5 pl-3">
            <p className="text-[11px] font-medium text-[#8c9baa]">CPI</p>
            <p className="text-[24px] font-normal leading-tight tabular-nums text-[#1a2340]">
              ${cpi.toFixed(2)}
            </p>
            <p className="text-[11px] text-[#8c9baa]">Per interview</p>
          </div>
        </div>
      )}
    </WuCard>
  );
}

/* ── Criteria collapsible card ── */

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
  const [hov, setHov] = useState(false);

  return (
    <WuCard rounded className="overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
      <WuCardHeader
        className={`flex cursor-pointer items-center justify-between border-b px-4 py-3.5 transition-colors ${
          open ? 'border-[#eef0f3]' : 'border-transparent'
        } ${hov ? 'bg-[#f5f6f8]' : 'bg-white'}`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
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

/* ── Main dashboard ── */

interface ProjectDashboardProps {
  project: import('@/data/audience-project-store').SingleCountryProjectDetail;
  onPush?: () => void;
}

export function ProjectDashboard({ project, onPush }: ProjectDashboardProps) {
  const isLaunched = project.status !== 'Draft';
  const showProgress = isLaunched && project.status !== 'Closed';
  const spent = Number((project.collected * project.costPerInterview).toFixed(2));
  const actualIr = project.realtimeIR ?? project.incidenceRate;
  const actualLoi = project.realtimeLOI ?? project.surveyLengthMinutes;

  return (
    <DetailPageContent>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {isLaunched ? (
          <ResponsesCard collected={project.collected} required={project.responses} />
        ) : (
          <MetricCard
            label="Responses"
            value={project.responses.toLocaleString()}
            sub="Target"
            icon="wm-group"
            iconBg="bg-[#f5f6f8]"
            iconFg="text-[#54606b]"
            hoverable
          />
        )}

        {isLaunched ? (
          <ActualAssumedCard
            label="Incidence rate"
            icon="wm-tag"
            iconBg="bg-[#e8f0fe]"
            iconFg="text-[#1b87e6]"
            actualLabel="Actual IR"
            actualValue={`${actualIr}%`}
            assumedLabel="Assumed IR"
            assumedValue={`${project.incidenceRate}%`}
            actualColor={actualValueColor(actualIr, project.incidenceRate)}
          />
        ) : (
          <MetricCard
            label="Incidence rate"
            value={`${project.incidenceRate}%`}
            sub="Assumed IR"
            icon="wm-tag"
            iconBg="bg-[#e8f0fe]"
            iconFg="text-[#1b87e6]"
            hoverable
          />
        )}

        {isLaunched ? (
          <ActualAssumedCard
            label="Length of interview"
            icon="wm-schedule"
            iconBg="bg-[#fff8e1]"
            iconFg="text-[#b06d00]"
            actualLabel="Actual LOI"
            actualValue={`${actualLoi % 1 === 0 ? actualLoi : actualLoi.toFixed(1)} min`}
            assumedLabel="Assumed LOI"
            assumedValue={`${project.surveyLengthMinutes} min`}
            actualColor={actualValueColor(actualLoi, project.surveyLengthMinutes)}
          />
        ) : (
          <MetricCard
            label="Length of interview"
            value={`${project.surveyLengthMinutes} min`}
            sub="Assumed LOI"
            icon="wm-schedule"
            iconBg="bg-[#fff8e1]"
            iconFg="text-[#b06d00]"
            hoverable
          />
        )}

        <TotalCostCard
          budget={project.totalCost}
          cpi={project.costPerInterview}
          spent={spent}
          isLaunched={isLaunched}
        />
      </div>

      {showProgress && (
        <CollectionProgressSection
          collected={project.collected}
          required={project.responses}
          velocity={project.velocityPerHour ?? 5}
          etcDate={project.etcDate ?? project.dueDate}
          daysElapsed={project.daysElapsed ?? 0}
          showPush={project.status === 'Live' && Boolean(onPush)}
          onPush={onPush}
        />
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
            <div className="space-y-4">
              <div>
                <FieldLabel>Country</FieldLabel>
                <div className="flex flex-wrap gap-1.5">
                  <Chip>{project.scopeTag}</Chip>
                </div>
              </div>
              {project.regions.length > 0 && (
                <div>
                  <FieldLabel>Regions</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {project.regions.map((r) => (
                      <Chip key={r}>{r}</Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CriteriaCard>

          <CriteriaCard
            title="Demographics"
            icon="wm-people"
            iconBg="bg-[#e8f5e9]"
            iconFg="text-[#188038]"
          >
            <div className="space-y-3.5">
              {[
                { label: 'Gender', tags: project.demographics.gender },
                { label: 'Age groups', tags: project.demographics.ageGroups },
                { label: 'Education', tags: project.demographics.education },
                { label: 'Income', tags: project.demographics.income },
              ].map(({ label, tags }) => (
                <div key={label}>
                  <FieldLabel>{label}</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <Chip key={t}>{t}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CriteriaCard>

          <CriteriaCard
            title="Qualification criteria"
            icon="wm-list-alt"
            iconBg="bg-[#f5f6f8]"
            iconFg="text-[#54606b]"
          >
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-[#e0e4e8] bg-[#f5f6f8]">
                <span className="wm-rule text-[22px] text-[#c4cdd5]" aria-hidden="true" />
              </div>
              <p className="max-w-[260px] text-[13px] leading-relaxed text-[#8c9baa]">
                {project.qualificationNote}
              </p>
            </div>
          </CriteriaCard>
        </div>
      </section>
    </DetailPageContent>
  );
}
