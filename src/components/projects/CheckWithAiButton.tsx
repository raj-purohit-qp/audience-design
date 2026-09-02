'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AiIcon } from '@/components/projects/AiIcon';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
);

interface CheckWithAiButtonProps {
  onClick: () => void;
  disabled?: boolean;
  /** When true, shows a clickable "AI estimated" badge instead of the Check with AI button. */
  aiEstimated?: boolean;
}

function CheckTooltipContent() {
  return (
    <div className="max-w-[260px] space-y-1 py-0.5">
      <p className="text-sm font-semibold leading-snug">Estimate Incidence Rate with AI</p>
      <p className="text-xs leading-relaxed opacity-90">
        Analyze survey screeners and audience targeting to predict qualification rates and improve
        feasibility estimates.
      </p>
    </div>
  );
}

function AiEstimatedTooltipContent() {
  return (
    <div className="max-w-[220px] py-0.5">
      <p className="text-xs leading-relaxed">
        View or update your AI estimated incidence rate.
      </p>
    </div>
  );
}

function AiActionShell({ children }: { children: ReactNode }) {
  return <div className="ir-ai-action inline-flex shrink-0 items-center overflow-visible">{children}</div>;
}

function AiEstimatedButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="ir-ai-estimated-wrap">
      <div className="ir-ai-estimated-badge-host">
        <WuButton
          type="button"
          variant="secondary"
          color="primary"
          size="sm"
          disabled={disabled}
          onClick={onClick}
          className="ir-ai-estimated-badge"
          Icon={<AiIcon className="ir-ai-estimated-badge__icon" />}
          iconPosition="left"
          aria-label="AI estimated — view or update incidence rate"
        >
          AI estimated
        </WuButton>
        <span className="ir-ai-estimated-badge__shine" aria-hidden="true">
          <span className="ir-ai-estimated-badge__shine-band" />
        </span>
      </div>
    </div>
  );
}

export function CheckWithAiButton({ onClick, disabled, aiEstimated = false }: CheckWithAiButtonProps) {
  if (aiEstimated) {
    return (
      <AiActionShell>
        <WuTooltip content={<AiEstimatedTooltipContent />} position="top" showArrow>
          <AiEstimatedButton onClick={onClick} disabled={disabled} />
        </WuTooltip>
      </AiActionShell>
    );
  }

  return (
    <AiActionShell>
      <WuTooltip content={<CheckTooltipContent />} position="top" showArrow>
        <WuButton
          type="button"
          variant="outlined"
          color="primary"
          size="sm"
          Icon={<AiIcon />}
          iconPosition="left"
          disabled={disabled}
          onClick={onClick}
          className="ir-ai-check-button"
          aria-label="Check with AI — Estimate Incidence Rate"
        >
          Check with AI
        </WuButton>
      </WuTooltip>
    </AiActionShell>
  );
}
