'use client';



import dynamic from 'next/dynamic';

import type { SingleCountryProjectDetail } from '@/data/audience-project-store';

import { detailPageGutter } from '@/components/ui/page-layout';



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



function statusChipColor(

  status: SingleCountryProjectDetail['status'],

): 'success' | 'warning' | 'danger' | undefined {

  if (status === 'Live') return 'success';

  if (status === 'Paused') return 'warning';

  if (status === 'Closed') return 'danger';

  return undefined;

}



interface ProjectDetailHeaderProps {

  project: SingleCountryProjectDetail;

  onEdit: () => void;

  onLaunch: () => void;

  onPause: () => void;

  onResume: () => void;

  onClose: () => void;

}



export function ProjectDetailHeader({

  project,

  onEdit,

  onLaunch,

  onPause,

  onResume,

  onClose,

}: ProjectDetailHeaderProps) {

  const isDraft = project.status === 'Draft';



  const metaItems: { icon: string; text: string }[] = isDraft

    ? [

        { icon: 'wm-tag', text: `#${project.projectId}` },

        { icon: 'wm-person', text: project.client },

        { icon: 'wm-event', text: `Due ${project.dueDate}` },

      ]

    : [

        { icon: 'wm-tag', text: `#${project.projectId}` },

        { icon: 'wm-person', text: project.client },

        { icon: 'wm-rocket-launch', text: `Launched ${project.launchDate ?? '—'}` },

        { icon: 'wm-event', text: `Due ${project.dueDate}` },

      ];



  return (

    <header className="border-b border-[#e0e4e8] bg-white">

      <div className={`${detailPageGutter} flex flex-wrap items-start justify-between gap-4 py-5`}>

        <div className="space-y-2">

          <div className="flex flex-wrap items-center gap-2.5">

            <WuHeading size="lg">{project.name}</WuHeading>

            <WuChip size="sm" shape="rounded" color={statusChipColor(project.status)}>
              {project.status}
            </WuChip>

            <WuChip size="sm" variant="secondary">

              {project.scopeTag}

            </WuChip>

          </div>

          <div className="flex flex-wrap items-center gap-4">

            {metaItems.map((item) => (

              <WuSubtext key={item.text} size="sm" className="inline-flex items-center gap-1">

                <span className={`${item.icon} text-[15px]`} aria-hidden="true" />

                {item.text}

              </WuSubtext>

            ))}

          </div>

        </div>



        <div className="flex shrink-0 items-center gap-2">

          {isDraft && (

            <>

              <WuButton variant="outline" color="primary" Icon={<span className="wm-edit" />} iconPosition="left" onClick={onEdit}>

                Edit

              </WuButton>

              <WuButton Icon={<span className="wm-rocket-launch" />} iconPosition="left" onClick={onLaunch}>

                Launch survey

              </WuButton>

            </>

          )}

          {project.status === 'Closed' && (

            <WuButton variant="outline" disabled Icon={<span className="wm-cancel" />} iconPosition="left">

              Closed

            </WuButton>

          )}

          {project.status === 'Live' && (

            <WuButton variant="outline" color="primary" Icon={<span className="wm-pause" />} iconPosition="left" onClick={onPause}>

              Pause survey

            </WuButton>

          )}

          {project.status === 'Paused' && (

            <WuButton variant="outline" color="primary" Icon={<span className="wm-play-arrow" />} iconPosition="left" onClick={onResume}>

              Resume survey

            </WuButton>

          )}

          {(project.status === 'Live' || project.status === 'Paused') && (

            <WuButton variant="outline" color="error" Icon={<span className="wm-cancel" />} iconPosition="left" onClick={onClose}>

              Close survey

            </WuButton>

          )}

        </div>

      </div>

    </header>

  );

}



export function ReconciliationTabTrigger({ disabled }: { disabled?: boolean }) {

  const content = (

    <>

      <span className="wm-assignment-return text-base" aria-hidden="true" />

      Reconciliation

    </>

  );



  if (disabled) {

    return (

      <span

        className="flex cursor-not-allowed items-center gap-1.5 opacity-45"

        title="Available when the project is closed"

        aria-disabled="true"

      >

        {content}

      </span>

    );

  }



  return <span className="flex items-center gap-1.5">{content}</span>;

}


