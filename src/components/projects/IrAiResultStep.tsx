'use client';

import type { ReactNode } from 'react';
import { AiIcon } from '@/components/projects/AiIcon';
import dynamic from 'next/dynamic';
import {
  IR_AI_CONFIDENCE_DESCRIPTIONS,
  IR_AI_CONFIDENCE_LABELS,
  type IrAiEstimateResult,
} from '@/data/mock-ir-ai';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

function ConfidenceChip({ level }: { level: IrAiEstimateResult['confidence'] }) {
  const color = level === 'high' ? 'success' : level === 'medium' ? 'warning' : 'danger';
  return (
    <WuChip size="sm" color={color}>
      {IR_AI_CONFIDENCE_LABELS[level]}
    </WuChip>
  );
}

function TargetingComparisonBoxes({ rows }: { rows: IrAiEstimateResult['targetingComparison'] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="overflow-hidden rounded-md border border-[#e0e4e8] bg-white">
        <div className="border-b border-[#e0e4e8] bg-[#fafbfc] px-4 py-2.5">
          <WuSubtext size="sm" as="p" className="font-medium text-[#54606b]">
            Survey requirement
          </WuSubtext>
        </div>
        <ul className="divide-y divide-[#e0e4e8]">
          {rows.map((row) => (
            <li
              key={row.surveyRequirement}
              className="flex min-h-[44px] items-center px-4 py-3 text-sm text-[#1a2340]"
            >
              {row.surveyRequirement}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-md border border-[#e0e4e8] bg-white">
        <div className="border-b border-[#e0e4e8] bg-[#fafbfc] px-4 py-2.5">
          <WuSubtext size="sm" as="p" className="font-medium text-[#54606b]">
            Audience targeting
          </WuSubtext>
        </div>
        <ul className="divide-y divide-[#e0e4e8]">
          {rows.map((row) => (
            <li
              key={`${row.surveyRequirement}-targeting`}
              className="flex min-h-[44px] items-center px-4 py-3 text-sm text-[#54606b]"
            >
              {row.audienceTargeting}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface IrAiResultStepProps {
  result: IrAiEstimateResult | null;
  manualMode: boolean;
  manualIr: string;
  manualIrError: string | null;
  onManualIrChange: (value: string) => void;
}

export function IrAiResultStep({
  result,
  manualMode,
  manualIr,
  manualIrError,
  onManualIrChange,
}: IrAiResultStepProps) {
  if (manualMode) {
    return (
      <div className="space-y-5 opacity-100 transition-opacity duration-300">
        <div className="rounded-md border border-[#e0e4e8] bg-[#fafbfc] p-5">
          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
            Enter your assumed IR
          </WuText>
          <div className="mt-4 flex items-end gap-2">
            <div className="w-24">
              <WuInput
                type="number"
                variant="outlined"
                min={0}
                max={100}
                value={manualIr}
                onChange={(e) => onManualIrChange(e.target.value)}
                aria-label="Manual incidence rate"
                aria-invalid={Boolean(manualIrError)}
              />
            </div>
            <span className="pb-2 text-sm text-[#8c9baa]">%</span>
          </div>
          {manualIrError && (
            <p className="mt-2 text-sm text-[#d93025]" role="alert">
              {manualIrError}
            </p>
          )}
          <WuSubtext size="sm" as="p" className="mt-3 text-[#54606b]">
            You can use your own IR assumption instead of the AI estimate.
          </WuSubtext>
          {result && (
            <WuSubtext size="sm" as="p" className="mt-2 text-[#8c9baa]">
              AI estimated IR: {result.estimatedIr}%
            </WuSubtext>
          )}
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-4 opacity-100 transition-opacity duration-300">
      <WuSubtext size="sm" as="p" className="text-[#54606b]">
        Based on your survey requirements and audience targeting, AI estimates the following
        incidence rate.
      </WuSubtext>

      <div className="rounded-md border border-[#e0e4e8] bg-[#fafbfc] p-5 text-center">
        <WuSubtext size="sm" as="p" className="font-medium text-[#54606b]">
          Estimated incidence rate
        </WuSubtext>
        <div className="mt-2 flex flex-col items-center gap-2">
          <span className="text-4xl font-semibold tracking-tight text-[#1a2340]">
            {result.estimatedIr}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#1b87e6] bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1b87e6]">
            <AiIcon className="h-3.5 w-3.5" />
            AI estimated
          </span>
        </div>
        <div className="mt-4 flex flex-col items-center gap-2">
          <ConfidenceChip level={result.confidence} />
          <WuSubtext size="sm" as="p" className="max-w-md text-[#54606b]">
            {IR_AI_CONFIDENCE_DESCRIPTIONS[result.confidence]}
          </WuSubtext>
        </div>
      </div>

      {result.lowConfidenceWarning && (
        <div className="rounded-md border border-[#f0e6c8] bg-[#fffbf0] p-4">
          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
            {IR_AI_CONFIDENCE_LABELS.low}
          </WuText>
          <WuSubtext size="sm" as="p" className="mt-1 text-[#54606b]">
            {result.lowConfidenceWarning}
          </WuSubtext>
        </div>
      )}

      <ResultSection title="Why AI estimated this IR">
        <blockquote className="border-l-2 border-[#1b87e6] pl-4">
          <WuText size="md" as="p" className="text-[#54606b]">
            {result.reasoning}
          </WuText>
        </blockquote>
      </ResultSection>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#1a2340]">Targeting</h3>
        <TargetingComparisonBoxes rows={result.targetingComparison} />
        {result.targetingGap && (
          <WuSubtext size="sm" as="p" className="font-medium text-[#1a2340]">
            {result.targetingGap}
          </WuSubtext>
        )}
      </div>

      {result.strongMatch && result.strongMatchMessage ? (
        <div className="rounded-md border border-[#c8e6c9] bg-[#f1f8f1] p-4">
          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
            Strong targeting match
          </WuText>
          <WuSubtext size="sm" as="p" className="mt-1 text-[#54606b]">
            {result.strongMatchMessage}
          </WuSubtext>
        </div>
      ) : result.targetingGapDetail ? (
        <div className="rounded-md border border-[#f0e6c8] bg-[#fffbf0] p-4">
          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
            Targeting limitation
          </WuText>
          <WuSubtext size="sm" as="p" className="mt-1 text-[#54606b]">
            {result.targetingGapDetail}
          </WuSubtext>
          <WuSubtext size="sm" as="p" className="mt-2 text-[#54606b]">
            Respondents will be targeted using the closest available audience criteria and screened
            further within the survey.
          </WuSubtext>
        </div>
      ) : null}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-[#e0e4e8] bg-[#fafbfc] p-5">
      <h3 className="mb-3 text-sm font-semibold text-[#1a2340]">{title}</h3>
      {children}
    </div>
  );
}

export function IrAiErrorStep({
  onTryAgain,
  onEnterManually,
}: {
  onTryAgain: () => void;
  onEnterManually: () => void;
}) {
  return (
    <div className="space-y-5 py-4 opacity-100 transition-opacity duration-300">
      <div className="text-center">
        <WuText size="md" as="p" className="font-semibold text-[#1a2340]">
          We couldn&apos;t estimate your IR
        </WuText>
        <WuSubtext size="sm" as="p" className="mx-auto mt-2 max-w-md text-[#54606b]">
          AI wasn&apos;t able to generate a reliable incidence rate from the available survey and
          audience information.
        </WuSubtext>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <WuButton variant="outlined" color="primary" onClick={onTryAgain}>
          Try again
        </WuButton>
        <WuButton color="primary" onClick={onEnterManually}>
          Enter IR manually
        </WuButton>
      </div>
    </div>
  );
}
