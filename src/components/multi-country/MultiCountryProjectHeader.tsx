'use client';

import dynamic from 'next/dynamic';
import type { MultiCountryProjectDetail } from '@/data/mock-multi-country';
import { detailPageGutter } from '@/components/ui/page-layout';
import { ProjectHeaderAnalyticsActions } from '@/components/projects/ProjectHeaderAnalyticsActions';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
);

function statusChipColor(
  status: MultiCountryProjectDetail['status'],
): 'success' | 'warning' | 'danger' | undefined {
  if (status === 'Live') return 'success';
  if (status === 'Paused') return 'warning';
  if (status === 'Closed') return 'danger';
  return undefined;
}

interface MultiCountryProjectHeaderProps {
  project: MultiCountryProjectDetail;
  onLaunch: () => void;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
  onTopUp?: () => void;
  readOnly?: boolean;
}

export function MultiCountryProjectHeader({
  project,
  onLaunch,
  onPause,
  onResume,
  onClose,
  onTopUp,
  readOnly = false,
}: MultiCountryProjectHeaderProps) {
  const isDraft = project.status === 'Draft' || project.status === 'Bid';
  const showAnalytics = !isDraft;

  const metaItems: { icon: string; text: string; href?: string }[] = isDraft
    ? [
        { icon: 'wm-tag', text: `# ${project.projectId}` },
        { icon: 'wm-public', text: `${project.countries.length} countries` },
        { icon: 'wm-person', text: project.client },
        { icon: 'wm-event', text: `Due ${project.dueDate}` },
      ]
    : [
        { icon: 'wm-tag', text: `# ${project.projectId}` },
        {
          icon: 'wm-open-in-new',
          text: `Survey: ${project.name}`,
          href: '#',
        },
        { icon: 'wm-rocket-launch', text: `Launched ${project.launchDate ?? '—'}` },
        { icon: 'wm-event', text: `Due ${project.dueDate}` },
        { icon: 'wm-public', text: `${project.countries.length} countries` },
      ];

  if (project.uniqueResponseProjects && project.uniqueResponseProjects.length > 0) {
    const names = project.uniqueResponseProjects.map((item) => item.name);
    metaItems.push({
      icon: 'wm-group',
      text:
        names.length === 1
          ? `Unique responses: ${names[0]}`
          : `Unique responses: ${names.length} projects`,
    });
  }

  return (
    <header className="border-b border-[#e0e4e8] bg-white">
      <div className={`${detailPageGutter} flex flex-wrap items-start justify-between gap-4 py-5`}>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <WuHeading size="lg">{project.name}</WuHeading>
            <WuChip size="sm" shape="rounded" color={statusChipColor(project.status)}>
              {project.status}
            </WuChip>
            <WuChip size="sm" variant="secondary">
              Multi-country
            </WuChip>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {metaItems.map((item) =>
              item.href ? (
                <a
                  key={item.text}
                  href={item.href}
                  className="inline-flex items-center gap-1 text-sm text-[#54606b] hover:text-[#1b87e6]"
                  onClick={(e) => e.preventDefault()}
                >
                  <span className={`${item.icon} text-[15px]`} aria-hidden="true" />
                  <span className="max-w-[280px] truncate">{item.text}</span>
                </a>
              ) : (
                <WuSubtext key={item.text} size="sm" className="inline-flex items-center gap-1">
                  <span className={`${item.icon} text-[15px]`} aria-hidden="true" />
                  {item.text}
                </WuSubtext>
              ),
            )}
          </div>
        </div>

        {(!readOnly || showAnalytics) && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!readOnly && project.status === 'Draft' && (
            <WuButton Icon={<span className="wm-rocket-launch" />} iconPosition="left" onClick={onLaunch}>
              Launch survey
            </WuButton>
          )}
          {!readOnly && project.status === 'Live' && (
            <>
              <WuButton variant="outlined" color="primary" Icon={<span className="wm-pause" />} iconPosition="left" onClick={onPause}>
                Pause survey
              </WuButton>
              <WuButton variant="outlined" color="error" Icon={<span className="wm-cancel" />} iconPosition="left" onClick={onClose}>
                Close survey
              </WuButton>
            </>
          )}
          {!readOnly && project.status === 'Paused' && (
            <WuButton variant="outlined" color="primary" Icon={<span className="wm-play-arrow" />} iconPosition="left" onClick={onResume}>
              Resume survey
            </WuButton>
          )}
          {!readOnly && onTopUp && (
            <WuTooltip content="Collect additional responses for this country." position="top" showArrow>
              <WuButton
                variant="outlined"
                color="primary"
                Icon={<span className="wm-add" />}
                iconPosition="left"
                onClick={onTopUp}
              >
                Top-up
              </WuButton>
            </WuTooltip>
          )}
          {showAnalytics && <ProjectHeaderAnalyticsActions />}
        </div>
        )}
      </div>
    </header>
  );
}
