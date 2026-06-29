'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { CollectionProgressSection } from '@/components/projects/CollectionProgressSection';
import { MetricCard, MetricIconBadge } from '@/components/ui/MetricCard';
import { DetailPageContent } from '@/components/ui/page-layout';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false }
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);

/* ─────────────────────────────────────────
   Shared primitives
───────────────────────────────────────── */

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
  return (
    <div className="mb-1.5 text-[11px] font-medium text-[#8c9baa]">
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Deviation helpers
───────────────────────────────────────── */

function deviationValueColor(realtime: number, assumed: number): string {
  const pct = Math.abs(realtime - assumed) / assumed * 100;
  if (pct <= 5)  return 'text-[#188038]'; // green
  if (pct <= 10) return 'text-[#b06d00]'; // amber
  if (pct <= 20) return 'text-[#d04a02]'; // orange
  return 'text-[#d93025]';                // red
}

function DeviationBadge({ realtime, assumed, unit }: { realtime: number; assumed: number; unit: string }) {
  const diff   = realtime - assumed;
  const above  = diff >= 0;
  const label  = `${above ? '+' : ''}${diff % 1 === 0 ? diff.toFixed(0) : diff.toFixed(1)}${unit} vs assumed`;
  const colors = above
    ? 'bg-[#e8f5e9] text-[#188038]'
    : 'bg-[#fce8e6] text-[#d93025]';
  return (
    <span className={`mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${colors}`}>
      {label}
    </span>
  );
}


/* ─────────────────────────────────────────
   KPI card — split left / right (Live)
   leftDeviation: pass { realtime, assumed, unit } to show trend badge
───────────────────────────────────────── */

interface SplitKpiCardProps {
  label: string; icon: string; iconBg: string; iconFg: string;
  leftLabel: string; leftValue: string;
  rightLabel: string; rightValue: string;
  leftDeviation?: { realtime: number; assumed: number; unit: string };
}

function SplitKpiCard({ label, icon, iconBg, iconFg, leftLabel, leftValue, rightLabel, rightValue, leftDeviation }: SplitKpiCardProps) {
  const [hov, setHov] = useState(false);
  const valueColor = leftDeviation
    ? deviationValueColor(leftDeviation.realtime, leftDeviation.assumed)
    : 'text-[#1a2340]';

  return (
    <WuCard
      rounded
      className={`flex h-full flex-col overflow-hidden p-0 transition-all duration-150 ${
        hov ? 'border-[#1b87e6] shadow-md' : 'shadow-sm'
      }`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <WuCardHeader className="flex items-center gap-2">
        <MetricIconBadge icon={icon} bg={iconBg} fg={iconFg} />
        {label}
      </WuCardHeader>
      <div className="grid flex-1 grid-cols-2">
        {/* Left — real-time / collected */}
        <div className="flex flex-col gap-0.5 px-4 py-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">{leftLabel}</p>
          <p className={`text-[24px] font-normal leading-tight ${valueColor}`}>{leftValue}</p>
          {leftDeviation && (
            <DeviationBadge
              realtime={leftDeviation.realtime}
              assumed={leftDeviation.assumed}
              unit={leftDeviation.unit}
            />
          )}
        </div>
        {/* Right — assumed / required */}
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <p className="text-[11px] font-medium text-[#8c9baa]">{rightLabel}</p>
          <p className="text-[24px] font-normal leading-tight text-[#1a2340]">{rightValue}</p>
        </div>
      </div>
    </WuCard>
  );
}

/* ─────────────────────────────────────────
   Total cost card
───────────────────────────────────────── */

function TotalCostCard({ budget, cpi, spent, isLaunched }: {
  budget: number; cpi: number; spent: number; isLaunched: boolean;
}) {
  const [hov, setHov] = useState(false);
  const pct = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0;

  return (
    <WuCard
      rounded
      className={`flex h-full flex-col overflow-hidden p-0 transition-all duration-150 ${
        hov ? 'border-[#1b87e6] shadow-md' : 'shadow-sm'
      }`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <WuCardHeader className="flex items-center gap-2">
        <MetricIconBadge icon="wm-account-balance-wallet" bg="bg-[#fce8e6]" fg="text-[#d93025]" />
        Total cost
      </WuCardHeader>

      <div className="grid flex-1 grid-cols-2">
        {/* Budget */}
        <div className="flex flex-col gap-0.5 px-4 py-3" style={{ borderRight: '1px solid #e0e4e8' }}>
          <p className="text-[11px] font-medium text-[#8c9baa]">Budget</p>
          <p className="text-[24px] font-normal leading-tight text-[#1a2340]">
            ${budget.toLocaleString()}
          </p>
          {isLaunched && (
            <p className="text-[11px] text-[#8c9baa]">
              ${spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} spent
            </p>
          )}
        </div>
        {/* CPI */}
        <div className="flex flex-col gap-0.5 px-4 py-3">
          <p className="text-[11px] font-medium text-[#8c9baa]">CPI</p>
          <p className="text-[24px] font-normal leading-tight text-[#1a2340]">
            ${cpi.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#8c9baa]">Per interview</p>
        </div>
      </div>

      {isLaunched && (
        <div className="px-4 pb-3">
          <div className="h-[3px] overflow-hidden rounded-full bg-[#eef0f3]">
            <div
              className="h-full rounded-full bg-[#d93025] transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </WuCard>
  );
}

/* ─────────────────────────────────────────
   Criteria collapsible card
───────────────────────────────────────── */

function CriteriaCard({ title, icon, iconBg, iconFg, children }: {
  title: string; icon: string; iconBg: string; iconFg: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [hov, setHov]   = useState(false);

  return (
    <WuCard rounded className="overflow-hidden p-0 shadow-sm">
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

/* ─────────────────────────────────────────
   Main dashboard
───────────────────────────────────────── */

interface ProjectDashboardProps {
  project: import('@/data/audience-project-store').SingleCountryProjectDetail;
}

export function ProjectDashboard({ project }: ProjectDashboardProps) {
  const isLaunched   = project.status !== 'Draft';
  const showProgress = isLaunched && project.status !== 'Closed';
  const spent        = project.collected * project.costPerInterview;
  const remaining    = Math.max(0, project.responses - project.collected);

  return (
    <DetailPageContent>
        {/* Metric cards */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {isLaunched ? (
            <SplitKpiCard
              label="Responses"
              icon="wm-flag" iconBg="bg-[#f5f6f8]" iconFg="text-[#54606b]"
              leftLabel="Collected" leftValue={project.collected.toLocaleString()}
              rightLabel="Required"  rightValue={project.responses.toLocaleString()}
            />
          ) : (
            <MetricCard
              label="Responses"
              value={project.responses.toLocaleString()} sub="Target"
              icon="wm-flag" iconBg="bg-[#f5f6f8]" iconFg="text-[#54606b]"
              hoverable
            />
          )}

          {isLaunched ? (
            <SplitKpiCard
              label="Incidence rate"
              icon="wm-tune" iconBg="bg-[#e8f0fe]" iconFg="text-[#1b87e6]"
              leftLabel="Real-time IR" leftValue={`${project.realtimeIR ?? '–'}%`}
              rightLabel="Estimated IR" rightValue={`${project.incidenceRate}%`}
              leftDeviation={project.realtimeIR != null
                ? { realtime: project.realtimeIR, assumed: project.incidenceRate, unit: 'pp' }
                : undefined}
            />
          ) : (
            <MetricCard
              label="Incidence rate"
              value={`${project.incidenceRate}%`} sub="Assumed IR"
              icon="wm-tune" iconBg="bg-[#e8f0fe]" iconFg="text-[#1b87e6]"
              hoverable
            />
          )}

          {isLaunched ? (
            <SplitKpiCard
              label="Length of interview"
              icon="wm-schedule" iconBg="bg-[#fff8e1]" iconFg="text-[#b06d00]"
              leftLabel="Real-time LOI" leftValue={`${project.realtimeLOI ?? '–'} min`}
              rightLabel="Estimated LOI" rightValue={`${project.surveyLengthMinutes} min`}
              leftDeviation={project.realtimeLOI != null
                ? { realtime: project.realtimeLOI, assumed: project.surveyLengthMinutes, unit: ' min' }
                : undefined}
            />
          ) : (
            <MetricCard
              label="Length of interview"
              value={`${project.surveyLengthMinutes} min`} sub="Assumed LOI"
              icon="wm-schedule" iconBg="bg-[#fff8e1]" iconFg="text-[#b06d00]"
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

        {/* Collection progress (live / paused only) */}
        {showProgress && (
          <CollectionProgressSection
            collected={project.collected}
            required={project.responses}
            velocity={project.velocityPerHour ?? 5}
            etcDate={project.etcDate ?? project.dueDate}
            daysElapsed={project.daysElapsed ?? 0}
          />
        )}

        {/* Launch criteria */}
        <section>
          <WuHeading size="md" className="mb-4">
            Launch criteria &amp; audience configuration
          </WuHeading>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">

            <CriteriaCard title="Geography" icon="wm-public" iconBg="bg-[#e8f0fe]" iconFg="text-[#1b87e6]">
              <div className="space-y-4">
                <div>
                  <FieldLabel>Country</FieldLabel>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#1a2340]">{project.country}</span>
                    <Chip blue>Single country</Chip>
                  </div>
                </div>
                <div>
                  <FieldLabel>Regions</FieldLabel>
                  <div className="flex flex-wrap gap-1.5">
                    {project.regions.map((r) => <Chip key={r}>{r}</Chip>)}
                  </div>
                </div>
                <div>
                  <FieldLabel>Scope</FieldLabel>
                  <span className="text-sm text-[#54606b]">All 50 states</span>
                </div>
              </div>
            </CriteriaCard>

            <CriteriaCard title="Demographics" icon="wm-people" iconBg="bg-[#e8f5e9]" iconFg="text-[#188038]">
              <div className="space-y-3.5">
                {[
                  { label: 'Age groups', tags: project.demographics.ageGroups },
                  { label: 'Gender',     tags: project.demographics.gender },
                  { label: 'Education',  tags: project.demographics.education },
                  { label: 'Income',     tags: project.demographics.income },
                ].map(({ label, tags }) => (
                  <div key={label}>
                    <FieldLabel>{label}</FieldLabel>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => <Chip key={t}>{t}</Chip>)}
                    </div>
                  </div>
                ))}
              </div>
            </CriteriaCard>

            <CriteriaCard title="Qualification criteria" icon="wm-verified" iconBg="bg-[#f5f6f8]" iconFg="text-[#54606b]">
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
