'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { NO_SURVEY_OPTION, type SurveyOption } from '@/data/mock-project-create';
import {
  IR_AI_CRITERIA_CHIP_LIMIT,
  buildIrAiEstimate,
  getIrAiDemoVariant,
  validateManualIr,
  type IrAiCriteriaAnswer,
  type IrAiCriterion,
  type IrAiEstimateResult,
  type IrAiStep2View,
  type IrAiWorkflowStep,
} from '@/data/mock-ir-ai';
import { IrAiErrorStep, IrAiResultStep } from '@/components/projects/IrAiResultStep';
import { AiIcon } from '@/components/projects/AiIcon';
import { SelectSurveyModal } from '@/components/projects/SelectSurveyModal';

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

interface IrAiWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: SurveyOption;
  onSurveyChange: (survey: SurveyOption) => void;
  appliedCriteria: IrAiCriterion[];
  hasCriteriaAdded: boolean;
  onEditCriteria: () => void;
  onAddCriteria: () => void;
  onApplyIr: (rate: number, fromAi: boolean) => void;
}

function CriteriaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-[#e0e4e8] bg-[#f5f6f8] px-2.5 py-0.5 text-xs text-[#54606b]">
      {children}
    </span>
  );
}

const IR_AI_MODAL_STEPS = [
  { n: 1, label: 'Confirm inputs', icon: 'wm-fact-check' as const, useAiIcon: false },
  { n: 2, label: 'AI estimate', useAiIcon: true },
] as const;

function IrAiModalStepFooter({
  current,
  step1Complete,
  canNext,
  nextLabel = 'Next',
  showNext = true,
  onBack,
  onNext,
  secondaryAction,
}: {
  current: IrAiWorkflowStep;
  step1Complete?: boolean;
  canNext: boolean;
  nextLabel?: string;
  showNext?: boolean;
  onBack: () => void;
  onNext: () => void;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-4 border-t border-[#e0e4e8] bg-white px-8 py-3.5">
      <div className="flex min-w-0 items-center gap-2" aria-label="IR by AI progress">
        {IR_AI_MODAL_STEPS.map((s, i) => {
          const done = s.n < current || (step1Complete && s.n === 1);
          const active = s.n === current && !done;
          const color = done || active ? '#1b3a8a' : '#c4cdd5';

          return (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {s.useAiIcon ? (
                  <AiIcon
                    className="h-5 w-5 shrink-0 transition-colors"
                    style={{ color }}
                    aria-hidden
                  />
                ) : (
                  <span
                    className={`${s.icon} text-[20px] transition-colors`}
                    style={{ color }}
                    aria-hidden="true"
                  />
                )}
                <span
                  className="whitespace-nowrap text-[13px] transition-colors"
                  style={{
                    color: done || active ? '#1a2340' : '#c4cdd5',
                    fontWeight: active ? 600 : 400,
                  }}
                  aria-current={active ? 'step' : undefined}
                >
                  {s.n}. {s.label}
                </span>
              </div>
              {i < IR_AI_MODAL_STEPS.length - 1 && (
                <span
                  className="wm-arrow-forward mx-1 text-[18px] transition-colors"
                  style={{ color: done ? '#1b3a8a' : '#c4cdd5' }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-3">
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
        {secondaryAction}
        {showNext && (
          <WuButton
            color="primary"
            disabled={!canNext}
            className="whitespace-nowrap"
            Icon={<span className="wm-arrow-forward" aria-hidden="true" />}
            iconPosition="right"
            onClick={onNext}
          >
            {nextLabel}
          </WuButton>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ number, title }: { number: number; title: string }) {
  return (
    <h3 className="border-b border-[#e0e4e8] pb-2 text-base font-bold text-[#1a2340]">
      {number}. {title}
    </h3>
  );
}

function CheckSectionBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-[#e0e4e8] bg-[#fafbfc] p-5">
      {children}
    </div>
  );
}

function RadioChoiceOption({
  name,
  value,
  checked,
  title,
  onSelect,
}: {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-md border px-4 py-3.5 transition-colors ${
        checked
          ? 'border-[#1b87e6] bg-[#e8f0fe] ring-1 ring-[#1b87e6]'
          : 'border-[#e0e4e8] bg-white hover:border-[#1b87e6]'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onSelect}
        className="ir-ai-criteria-radio-input mt-0.5"
      />
      <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-[#1a2340]">{title}</span>
    </label>
  );
}

function SurveyConfirmationCard({
  survey,
  onChangeSurvey,
}: {
  survey: SurveyOption;
  onChangeSurvey: () => void;
}) {
  return (
    <div className="rounded-md border border-[#e0e4e8] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
            {survey.name}
          </WuText>
          {survey.questionCount !== undefined && (
            <WuSubtext size="sm" as="p" className="mt-1 text-[#8c9baa]">
              {survey.questionCount} questions
            </WuSubtext>
          )}
        </div>
        <WuButton variant="outlined" color="primary" size="sm" onClick={onChangeSurvey}>
          Change survey
        </WuButton>
      </div>
    </div>
  );
}

function AppliedCriteriaList({
  criteria,
  onEditCriteria,
}: {
  criteria: IrAiCriterion[];
  onEditCriteria: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible =
    expanded || criteria.length <= IR_AI_CRITERIA_CHIP_LIMIT
      ? criteria
      : criteria.slice(0, IR_AI_CRITERIA_CHIP_LIMIT);
  const hiddenCount = criteria.length - IR_AI_CRITERIA_CHIP_LIMIT;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-[#54606b]">Applied criteria</p>
        <WuButton variant="link" color="primary" size="sm" onClick={onEditCriteria}>
          Edit criteria
        </WuButton>
      </div>
      <div className="flex flex-wrap gap-2">
        {visible.map((criterion) => (
          <CriteriaChip key={criterion.id}>{criterion.label}</CriteriaChip>
        ))}
      </div>
      {!expanded && hiddenCount > 0 && (
        <WuButton variant="link" color="primary" size="sm" onClick={() => setExpanded(true)}>
          Show more ({hiddenCount})
        </WuButton>
      )}
    </div>
  );
}

const IrAiWorkflowModalInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = lib;

      return function IrAiWorkflowModalInner({
        open,
        onOpenChange,
        survey,
        onSurveyChange,
        appliedCriteria,
        hasCriteriaAdded,
        onEditCriteria,
        onAddCriteria,
        onApplyIr,
      }: IrAiWorkflowModalProps) {
        const [step, setStep] = useState<IrAiWorkflowStep>(1);
        const [step2View, setStep2View] = useState<IrAiStep2View>('processing');
        const [estimateResult, setEstimateResult] = useState<IrAiEstimateResult | null>(null);
        const [manualMode, setManualMode] = useState(false);
        const [manualIr, setManualIr] = useState('');
        const [manualIrError, setManualIrError] = useState<string | null>(null);
        const [criteriaAnswer, setCriteriaAnswer] = useState<IrAiCriteriaAnswer>(null);
        const [continueWithoutCriteria, setContinueWithoutCriteria] = useState(false);
        const [surveyError, setSurveyError] = useState(false);
        const [criteriaError, setCriteriaError] = useState(false);
        const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
        const [processingPhase, setProcessingPhase] = useState(0);

        const hasSurvey = survey.id !== NO_SURVEY_OPTION.id;

        const resetWorkflow = useCallback(() => {
          setStep(1);
          setStep2View('processing');
          setEstimateResult(null);
          setManualMode(false);
          setManualIr('');
          setManualIrError(null);
          setCriteriaAnswer(hasCriteriaAdded ? 'yes' : null);
          setContinueWithoutCriteria(false);
          setSurveyError(false);
          setCriteriaError(false);
          setProcessingPhase(0);
        }, [hasCriteriaAdded]);

        useEffect(() => {
          if (open) {
            resetWorkflow();
          }
        }, [open, resetWorkflow]);

        useEffect(() => {
          if (criteriaAnswer !== null && !hasSurvey) {
            setSurveyError(true);
          }
        }, [criteriaAnswer, hasSurvey]);

        useEffect(() => {
          if (step !== 2 || step2View !== 'processing' || processingPhase < 4) return;

          const timer = window.setTimeout(() => {
            const estimate = buildIrAiEstimate(hasCriteriaAdded, getIrAiDemoVariant());
            if (!estimate) {
              setStep2View('error');
              return;
            }
            setEstimateResult(estimate);
            setStep2View('result');
          }, 800);

          return () => window.clearTimeout(timer);
        }, [step, step2View, processingPhase, hasCriteriaAdded]);

        const canProceed =
          hasSurvey &&
          criteriaAnswer !== null &&
          (criteriaAnswer === 'yes'
            ? hasCriteriaAdded && appliedCriteria.length > 0
            : continueWithoutCriteria);

        function handleOpenChange(next: boolean) {
          if (!next) {
            resetWorkflow();
          }
          onOpenChange(next);
        }

        function handleBack() {
          if (step === 2) {
            if (manualMode) {
              if (!estimateResult) {
                setManualMode(false);
                setStep2View('error');
                setManualIrError(null);
                return;
              }
              setManualMode(false);
              setManualIrError(null);
              return;
            }
            if (step2View === 'result' || step2View === 'error') {
              setStep(1);
              setStep2View('processing');
              setProcessingPhase(0);
              setEstimateResult(null);
              return;
            }
            setStep(1);
            setProcessingPhase(0);
            setStep2View('processing');
            return;
          }
          handleOpenChange(false);
        }

        function startProcessing() {
          setStep(2);
          setStep2View('processing');
          setProcessingPhase(0);
          setManualMode(false);
          setEstimateResult(null);

          [1, 2, 3, 4].forEach((phase, index) => {
            window.setTimeout(() => setProcessingPhase(phase), (index + 1) * 1200);
          });
        }

        function handleNext() {
          let valid = true;

          if (!hasSurvey) {
            setSurveyError(true);
            valid = false;
          } else {
            setSurveyError(false);
          }

          if (criteriaAnswer === null) {
            setCriteriaError(true);
            valid = false;
          } else {
            setCriteriaError(false);
          }

          if (criteriaAnswer === 'yes' && (!hasCriteriaAdded || appliedCriteria.length === 0)) {
            valid = false;
          }

          if (criteriaAnswer === 'no' && !continueWithoutCriteria) {
            valid = false;
          }

          if (!valid) return;

          startProcessing();
        }

        function handleApplyAiIr() {
          if (!estimateResult) return;
          onApplyIr(estimateResult.estimatedIr, true);
          handleOpenChange(false);
        }

        function handleApplyManualIr() {
          const error = validateManualIr(manualIr);
          if (error) {
            setManualIrError(error);
            return;
          }
          onApplyIr(Math.round(Number(manualIr)), false);
          handleOpenChange(false);
        }

        function handleTryAgain() {
          startProcessing();
        }

        function handleEnterManuallyFromError() {
          setStep2View('result');
          setManualMode(true);
          setManualIr('');
          setManualIrError(null);
        }

        function handleEditCriteria() {
          handleOpenChange(false);
          onEditCriteria();
        }

        function handleAddCriteria() {
          handleOpenChange(false);
          onAddCriteria();
        }

        const processingSteps = [
          'Reading selected survey',
          'Analyzing screener questions',
          'Comparing survey requirements with audience qualifications',
          'Preparing incidence rate estimate',
        ];

        return (
          <>
            <WuModal
              open={open}
              onOpenChange={handleOpenChange}
              size="lg"
              maxWidth="800px"
              preventClickOutside={step === 2}
            >
              <WuModalHeader className="ir-ai-modal-header">
                {step === 2 && step2View === 'result' && estimateResult && !manualMode ? (
                  'Your AI estimated IR'
                ) : step === 2 && manualMode ? (
                  'Enter your assumed IR'
                ) : step === 2 && step2View === 'error' ? (
                  "We couldn't estimate your IR"
                ) : (
                  'Check IR with AI'
                )}
              </WuModalHeader>

              <WuModalContent
                className={
                  step === 2 && (step2View === 'result' || manualMode)
                    ? 'ir-ai-modal-content ir-ai-modal-content--scroll space-y-6'
                    : 'space-y-6'
                }
              >
                {step === 1 ? (
                  <div className="space-y-4">
                    <CheckSectionBox>
                      <section className="space-y-3">
                        <SectionHeading number={1} title="Survey check" />

                      {hasSurvey ? (
                        <SurveyConfirmationCard
                          survey={survey}
                          onChangeSurvey={() => setIsSurveyModalOpen(true)}
                        />
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-semibold text-[#1a2340]">Select a survey</p>
                            <p className="mt-1 text-sm text-[#54606b]">
                              Select the survey you plan to field. AI will use the survey questions and
                              answer options to understand the audience you need to reach.
                            </p>
                          </div>
                          <WuButton
                            variant="outlined"
                            color="primary"
                            Icon={<span className="wm-add" aria-hidden="true" />}
                            iconPosition="left"
                            onClick={() => setIsSurveyModalOpen(true)}
                          >
                            Select survey
                          </WuButton>
                        </div>
                      )}

                      {surveyError && (
                        <p className="text-sm text-[#d93025]" role="alert">
                          Select a survey to continue.
                        </p>
                      )}
                      </section>
                    </CheckSectionBox>

                    <CheckSectionBox>
                      <section className="space-y-3">
                        <div>
                          <SectionHeading number={2} title="Criteria check" />
                        <p className="mt-1 text-sm text-[#54606b]">
                          Have you added audience qualifications to target respondents?
                        </p>
                      </div>

                      <div
                        className="ir-ai-criteria-options"
                        role="radiogroup"
                        aria-label="Audience criteria added"
                      >
                        <RadioChoiceOption
                          name="ir-ai-criteria"
                          value="yes"
                          checked={criteriaAnswer === 'yes'}
                          title="Yes, I have added criteria"
                          onSelect={() => {
                            setCriteriaAnswer('yes');
                            setContinueWithoutCriteria(false);
                            setCriteriaError(false);
                          }}
                        />
                        <RadioChoiceOption
                          name="ir-ai-criteria"
                          value="no"
                          checked={criteriaAnswer === 'no'}
                          title="No, I haven't added criteria"
                          onSelect={() => {
                            setCriteriaAnswer('no');
                            setCriteriaError(false);
                          }}
                        />
                      </div>

                      {criteriaError && (
                        <p className="text-sm text-[#d93025]" role="alert">
                          Tell us whether you have added audience criteria.
                        </p>
                      )}

                      {criteriaAnswer === 'yes' && hasCriteriaAdded && appliedCriteria.length > 0 && (
                        <AppliedCriteriaList
                          criteria={appliedCriteria}
                          onEditCriteria={handleEditCriteria}
                        />
                      )}

                      {criteriaAnswer === 'yes' && !hasCriteriaAdded && (
                        <div className="rounded-md border border-[#e0e4e8] bg-[#fafbfc] p-4">
                          <p className="text-sm text-[#54606b]">
                            No audience criteria are applied to this project yet.
                          </p>
                          <div className="mt-3">
                            <WuButton variant="outlined" color="primary" size="sm" onClick={handleAddCriteria}>
                              Add criteria
                            </WuButton>
                          </div>
                        </div>
                      )}

                      {criteriaAnswer === 'no' && (
                        <div className="rounded-md border border-[#f0e6c8] bg-[#fffbf0] p-4">
                          <WuText size="md" as="p" className="font-medium text-[#1a2340]">
                            No audience criteria have been added yet.
                          </WuText>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            <li>
                              <WuSubtext size="sm" as="span" className="text-[#54606b]">
                                AI can estimate IR using the survey requirements.
                              </WuSubtext>
                            </li>
                            <li>
                              <WuSubtext size="sm" as="span" className="text-[#54606b]">
                                Adding available audience criteria can improve the targeting and
                                feasibility estimate.
                              </WuSubtext>
                            </li>
                          </ul>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <WuButton color="primary" size="sm" onClick={handleAddCriteria}>
                              Add criteria
                            </WuButton>
                            <WuButton
                              variant="outlined"
                              color="primary"
                              size="sm"
                              onClick={() => {
                                setContinueWithoutCriteria(true);
                                setCriteriaError(false);
                              }}
                            >
                              Continue without criteria
                            </WuButton>
                          </div>
                          {continueWithoutCriteria && (
                            <p className="mt-3 text-xs text-[#54606b]">
                              You can proceed without audience criteria. AI will estimate IR from survey
                              requirements only.
                            </p>
                          )}
                        </div>
                      )}
                      </section>
                    </CheckSectionBox>
                  </div>
                ) : step2View === 'processing' ? (
                  <div className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="ir-ai-processing-icon-wrap" aria-hidden="true">
                        <AiIcon className="ir-ai-icon--analyzing h-8 w-8 text-[#1b87e6]" />
                      </div>
                      <p className="text-sm font-medium text-[#1a2340]">Analyzing your inputs</p>
                      <p className="max-w-sm text-sm text-[#54606b]">
                        AI is reading your survey and comparing requirements with your audience
                        qualifications.
                      </p>
                    </div>

                    <ul className="space-y-3" aria-live="polite">
                      {processingSteps.map((label, index) => {
                        const phase = index + 1;
                        const isComplete = processingPhase >= phase;
                        const isActive =
                          processingPhase === phase - 1 || (processingPhase === 0 && phase === 1);

                        return (
                          <li
                            key={label}
                            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                              isComplete
                                ? 'border-[#1b87e6] bg-[#e8f0fe] text-[#1a2340]'
                                : isActive
                                  ? 'border-[#1b87e6] bg-white text-[#1a2340]'
                                  : 'border-[#e0e4e8] bg-[#fafbfc] text-[#8c9baa]'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                                isComplete
                                  ? 'bg-[#1b87e6] text-white'
                                  : isActive
                                    ? 'border-2 border-[#1b87e6] text-[#1b87e6]'
                                    : 'border border-[#e0e4e8] text-[#8c9baa]'
                              }`}
                              aria-hidden="true"
                            >
                              {isComplete ? '✓' : phase}
                            </span>
                            {label}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : step2View === 'error' ? (
                  <IrAiErrorStep
                    onTryAgain={handleTryAgain}
                    onEnterManually={handleEnterManuallyFromError}
                  />
                ) : estimateResult || manualMode ? (
                  <IrAiResultStep
                    result={estimateResult}
                    manualMode={manualMode}
                    manualIr={manualIr}
                    manualIrError={manualIrError}
                    onManualIrChange={(value) => {
                      setManualIr(value);
                      setManualIrError(null);
                    }}
                  />
                ) : null}
              </WuModalContent>

              <WuModalFooter className="ir-ai-modal-footer block overflow-hidden rounded-b-[inherit] p-0">
                {step === 1 ? (
                  <IrAiModalStepFooter
                    current={step}
                    canNext={canProceed}
                    onBack={handleBack}
                    onNext={handleNext}
                  />
                ) : step2View === 'processing' ? (
                  <IrAiModalStepFooter
                    current={step}
                    step1Complete
                    canNext={false}
                    showNext={false}
                    onBack={handleBack}
                    onNext={() => undefined}
                  />
                ) : step2View === 'error' ? (
                  <IrAiModalStepFooter
                    current={step}
                    step1Complete
                    canNext={false}
                    showNext={false}
                    onBack={handleBack}
                    onNext={() => undefined}
                  />
                ) : manualMode ? (
                  <IrAiModalStepFooter
                    current={step}
                    step1Complete
                    canNext
                    nextLabel="Apply my IR"
                    onBack={handleBack}
                    onNext={handleApplyManualIr}
                    secondaryAction={
                      estimateResult ? (
                        <WuButton
                          variant="outlined"
                          color="primary"
                          onClick={() => setManualMode(false)}
                        >
                          Back to AI estimate
                        </WuButton>
                      ) : undefined
                    }
                  />
                ) : (
                  <IrAiModalStepFooter
                    current={step}
                    step1Complete
                    canNext
                    nextLabel="Apply AI estimated IR"
                    onBack={handleBack}
                    onNext={handleApplyAiIr}
                    secondaryAction={
                      <WuButton variant="outlined" color="primary" onClick={() => setManualMode(true)}>
                        Use my own IR
                      </WuButton>
                    }
                  />
                )}
              </WuModalFooter>
            </WuModal>

            <SelectSurveyModal
              open={isSurveyModalOpen}
              onOpenChange={setIsSurveyModalOpen}
              selectedSurveyId={survey.id}
              onSelect={(next) => {
                onSurveyChange(next);
                setSurveyError(false);
              }}
            />
          </>
        );
      };
    }),
  { ssr: false },
);

export function IrAiWorkflowModal(props: IrAiWorkflowModalProps) {
  return <IrAiWorkflowModalInner {...props} />;
}
