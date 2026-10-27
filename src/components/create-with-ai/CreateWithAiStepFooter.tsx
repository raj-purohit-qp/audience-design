'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AiIcon } from '@/components/projects/AiIcon';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

export const CREATE_WITH_AI_STEPS = [
  { n: 1, label: 'Inputs', icon: 'wm-fact-check' as const, useAiIcon: false },
  { n: 2, label: 'Survey', icon: 'wm-assignment' as const, useAiIcon: false },
  { n: 3, label: 'Create project', useAiIcon: true },
] as const;

export function CreateWithAiStepFooter({
  current,
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  showPrimary = true,
  secondary,
}: {
  current: 1 | 2 | 3;
  onBack: () => void;
  primaryLabel?: string;
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  showPrimary?: boolean;
  secondary?: ReactNode;
}) {
  return (
    <div className="flex w-full flex-nowrap items-center justify-between gap-3 border-t border-[#e0e4e8] bg-white px-6 py-3">
      <div className="flex shrink-0 items-center gap-1.5" aria-label="Create project progress">
        {CREATE_WITH_AI_STEPS.map((step, index) => {
          const done = step.n < current;
          const active = step.n === current;
          const color = done || active ? '#1b3a8a' : '#c4cdd5';
          return (
            <div key={step.n} className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {step.useAiIcon ? (
                  <AiIcon className="h-[18px] w-[18px] shrink-0" style={{ color }} />
                ) : (
                  <span className={`${step.icon} text-[18px]`} style={{ color }} aria-hidden="true" />
                )}
                <span
                  className="whitespace-nowrap text-[13px]"
                  style={{
                    color: done || active ? '#1a2340' : '#c4cdd5',
                    fontWeight: active ? 600 : 400,
                  }}
                  aria-current={active ? 'step' : undefined}
                >
                  {step.n}. {step.label}
                </span>
              </div>
              {index < CREATE_WITH_AI_STEPS.length - 1 && (
                <span
                  className="wm-arrow-forward text-[16px]"
                  style={{ color: done ? '#1b3a8a' : '#c4cdd5' }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <WuButton
          variant="link"
          color="primary"
          className="whitespace-nowrap"
          Icon={<span className="wm-arrow-back" aria-hidden="true" />}
          iconPosition="left"
          onClick={onBack}
        >
          Back
        </WuButton>
        {secondary}
        {showPrimary && primaryLabel && onPrimary && (
          <WuButton color="primary" disabled={primaryDisabled} className="whitespace-nowrap" onClick={onPrimary}>
            {primaryLabel}
          </WuButton>
        )}
      </div>
    </div>
  );
}
