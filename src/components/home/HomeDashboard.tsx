'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import { AudienceFooter } from '@/components/audience/AudienceFooter';
import {
  HOME_DASHBOARD_AUDIENCE_ROWS,
  HOME_DASHBOARD_SYNTHETIC_ROWS,
  HOME_ENTRY_CARDS,
  HOME_RECENT_PROJECTS,
  type HomeDashboardRow,
  type HomeDashboardStatus,
  type HomeEntryCard,
  type HomeRecentProject,
  type HomeSolution,
} from '@/data/mock-home';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
);
const WuProgress = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuProgress })),
  { ssr: false },
);

const ENTRY_ACCENT = {
  blue: {
    border: 'border-l-[3px] border-l-[rgb(var(--wu-blue-p))]',
    iconWrap: 'bg-[#e8f1fc]',
    icon: 'text-[rgb(var(--wu-blue-p))]',
    eyebrow: 'text-[rgb(var(--wu-blue-p))]',
    chip: '!border-0 !bg-[#e8f1fc] !text-[rgb(var(--wu-blue-p))]',
    button: undefined as string | undefined,
  },
  purple: {
    border: 'border-l-[3px] border-l-[#7c5cbf]',
    iconWrap: 'bg-[#f3eefc]',
    icon: 'text-[#7c5cbf]',
    eyebrow: 'text-[#7c5cbf]',
    chip: '!border-0 !bg-[#f3eefc] !text-[#7c5cbf]',
    button: '!border-[#7c5cbf] !bg-[#7c5cbf] hover:!bg-[#6b4eab]',
  },
} as const;

const SOLUTION_CHIP: Record<HomeSolution, string> = {
  Specialized: '!border-0 !bg-[#e8f1fc] !text-[rgb(var(--wu-blue-p))]',
  Instant: '!border-0 !bg-[#f3eefc] !text-[#7c5cbf]',
  Synthetic: '!border-0 !bg-[#f3eefc] !text-[#7c5cbf]',
};

function statusClass(status: HomeDashboardStatus): string {
  if (status === 'Ready') return 'text-[#137333]';
  if (status === 'Live' || status === 'Soft-launched') return 'text-[rgb(var(--wu-blue-p))]';
  return 'text-[#3c4043]';
}

function EntryCard({ card }: { card: HomeEntryCard }) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const accent = ENTRY_ACCENT[card.accent];

  function handleAction() {
    if (card.href) {
      router.push(card.href);
      return;
    }
    showToast({ message: `${card.actionLabel} coming soon`, variant: 'success' });
  }

  return (
    <WuCard
      rounded
      className={`flex h-full flex-col overflow-hidden border border-[#e0e4e8] bg-white p-0 shadow-sm ${accent.border}`}
    >
      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${accent.iconWrap}`}
            aria-hidden="true"
          >
            <span className={`${card.icon} text-xl ${accent.icon}`} />
          </span>
          <div className="min-w-0 flex-1">
            <WuHeading size="md">{card.title}</WuHeading>
            <p className={`mt-0.5 text-sm font-medium ${accent.eyebrow}`}>{card.eyebrow}</p>
            <WuText size="sm" className="mt-2 text-[#54606b]">
              {card.description}
            </WuText>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#eef0f3] px-5 py-4">
        <WuButton
          color="primary"
          Icon={
            card.id === 'audience' ? (
              <span className="wm-add" aria-hidden="true" />
            ) : undefined
          }
          iconPosition="left"
          className={accent.button}
          onClick={handleAction}
        >
          {card.actionLabel}
        </WuButton>
        <WuChip size="sm" shape="rounded" className={accent.chip}>
          {card.statLabel}
        </WuChip>
      </div>
    </WuCard>
  );
}

function RecentProjectCard({ project }: { project: HomeRecentProject }) {
  const { showToast } = useWuShowToast();
  const isAudience = project.kind === 'audience';
  const content = (
    <WuCard
      rounded
      className="flex cursor-pointer items-center gap-3 border border-[#e0e4e8] bg-white px-4 py-3 shadow-sm transition-colors hover:bg-[#f8f9fa]"
    >
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isAudience ? 'bg-[#e8f1fc]' : 'bg-[#f3eefc]'
        }`}
        aria-hidden="true"
      >
        <span
          className={`${isAudience ? 'wm-group text-[rgb(var(--wu-blue-p))]' : 'wm-bolt text-[#7c5cbf]'} text-lg`}
        />
      </span>
      <WuText size="sm" className="truncate font-medium text-[#1a2340]">
        {project.name}
      </WuText>
    </WuCard>
  );

  if (project.href) {
    return (
      <Link href={project.href} className="block min-w-0 no-underline">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="min-w-0 text-left"
      onClick={() =>
        showToast({ message: `${project.name} coming soon`, variant: 'success' })
      }
    >
      {content}
    </button>
  );
}

function ProjectsTable({ rows }: { rows: HomeDashboardRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[#e0e4e8] bg-white">
      <table className="min-w-[960px] w-full border-collapse text-sm" aria-label="Projects">
        <thead>
          <tr className="bg-[#EEEEEE] text-left text-[#545E6B]">
            <th className="px-4 py-3 font-medium">Solution</th>
            <th className="px-4 py-3 font-medium">Project name</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Completes</th>
            <th className="px-4 py-3 font-medium">Total cost</th>
            <th className="px-4 py-3 font-medium">Last active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[#eef0f3] hover:bg-[#f8f9fa]">
              <td className="px-4 py-3 align-middle">
                <WuChip size="sm" shape="rounded" className={SOLUTION_CHIP[row.solution]}>
                  {row.solution}
                </WuChip>
              </td>
              <td className="px-4 py-3 align-middle">
                {row.href ? (
                  <Link
                    href={row.href}
                    className="font-medium text-[rgb(var(--wu-blue-p))] hover:underline"
                  >
                    {row.name}
                  </Link>
                ) : (
                  <span className="font-medium text-[rgb(var(--wu-blue-p))]">{row.name}</span>
                )}
                <span className="mt-0.5 block text-xs text-[#80868b]">{row.subtitle}</span>
              </td>
              <td className={`px-4 py-3 align-middle font-medium ${statusClass(row.status)}`}>
                {row.status}
              </td>
              <td className="w-40 px-4 py-3 align-middle">
                <WuProgress
                  value={row.progressPercent}
                  size="sm"
                  color={row.solution === 'Specialized' ? 'primary' : 'primary'}
                  className={
                    row.solution !== 'Specialized' && row.progressPercent > 0
                      ? '[&_[data-slot=indicator]]:!bg-[#7c5cbf]'
                      : undefined
                  }
                />
              </td>
              <td className="px-4 py-3 align-middle tabular-nums text-[#3c4043]">
                {row.completesLabel}
              </td>
              <td className="px-4 py-3 align-middle tabular-nums text-[#3c4043]">
                {row.totalCostLabel}
              </td>
              <td className="px-4 py-3 align-middle text-[#54606b]">{row.lastActive}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function HomeDashboard() {
  const [tab, setTab] = useState('audience');

  const tabItems: IWuTabItem[] = useMemo(
    () => [
      {
        value: 'audience',
        Trigger: 'Audience · Real Responses',
        Content: <ProjectsTable rows={HOME_DASHBOARD_AUDIENCE_ROWS} />,
      },
      {
        value: 'synthetic',
        Trigger: 'Synthetic Data',
        Content: <ProjectsTable rows={HOME_DASHBOARD_SYNTHETIC_ROWS} />,
      },
    ],
    [],
  );

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex-1 space-y-8 px-6 pb-8 pt-4">
        <PageHeader
          title="Audience"
          description="Your research hub — real respondents & synthetic data in one place"
        />

        <div className="grid gap-5 md:grid-cols-2">
          {HOME_ENTRY_CARDS.map((card) => (
            <EntryCard key={card.id} card={card} />
          ))}
        </div>

        <section className="space-y-3">
          <WuHeading size="md">Recent Projects</WuHeading>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_RECENT_PROJECTS.map((project) => (
              <RecentProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>

        <section>
          <WuTab
            items={tabItems}
            value={tab}
            onValueChange={(value) => setTab(String(value))}
          />
        </section>
      </div>

      <AudienceFooter />
    </div>
  );
}
