'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const ANALYSIS_MIN_MS = 2000;
const ANALYSIS_MAX_MS = 5000;

interface CheckWithAiButtonProps {
  onAnalysisComplete: () => void;
  disabled?: boolean;
}

function TooltipContent() {
  return (
    <div className="max-w-[260px] space-y-1 py-0.5">
      <p className="text-sm font-semibold leading-snug">Estimate Incidence Rate with AI</p>
      <p className="text-xs leading-relaxed opacity-90">
        Analyze survey screeners and audience targeting to predict qualification rates and
        improve feasibility estimates.
      </p>
    </div>
  );
}

export function CheckWithAiButton({ onAnalysisComplete, disabled }: CheckWithAiButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleClick = useCallback(() => {
    if (isAnalyzing || disabled) return;

    setIsAnalyzing(true);
    const duration =
      ANALYSIS_MIN_MS + Math.random() * (ANALYSIS_MAX_MS - ANALYSIS_MIN_MS);

    window.setTimeout(() => {
      setIsAnalyzing(false);
      onAnalysisComplete();
    }, duration);
  }, [disabled, isAnalyzing, onAnalysisComplete]);

  return (
    <div className="relative shrink-0">
      <WuTooltip content={<TooltipContent />} position="top" showArrow>
        <WuButton
          type="button"
          variant="outline"
          color="primary"
          size="md"
          Icon={!isAnalyzing ? <span className="wm-auto-awesome text-base" aria-hidden="true" /> : undefined}
          iconPosition="left"
          loading={isAnalyzing}
          disabled={isAnalyzing || disabled}
          onClick={handleClick}
          className="min-h-10 min-w-[140px] focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label={
            isAnalyzing
              ? 'Analyzing incidence rate with AI'
              : 'Check with AI — Estimate Incidence Rate'
          }
          aria-busy={isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Check with AI'}
        </WuButton>
      </WuTooltip>
    </div>
  );
}
