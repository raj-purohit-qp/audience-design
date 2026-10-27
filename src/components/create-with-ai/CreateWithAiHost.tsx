'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AiIcon } from '@/components/projects/AiIcon';
import { CreateWithAiStepFooter } from '@/components/create-with-ai/CreateWithAiStepFooter';
import { SelectSurveyModal } from '@/components/projects/SelectSurveyModal';
import {
  AI_STAGES,
  closeCreateWithAi,
  editCreateWithAiInputs,
  formatAiDate,
  getCreateWithAiJob,
  handOffCreateWithAi,
  minimizeCreateWithAi,
  publishedSurveys,
  restoreCreateWithAi,
  resumeCreateWithAi,
  retryCreateWithAi,
  startCreateWithAi,
  subscribeCreateWithAi,
  type AiFormInput,
  type AiJob,
} from '@/data/create-with-ai';
import { MULTI_COUNTRY_CATALOG, type CountryDefinition } from '@/data/mock-multi-country';
import { NO_SURVEY_OPTION, type SurveyOption } from '@/data/mock-project-create';

const ELIGIBLE_SURVEY_IDS = publishedSurveys().map((survey) => survey.id);

const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false },
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false },
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false },
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false },
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-medium text-[#54606b]">{children}</span>;
}

function CountryNameWithCode({ label, code }: { label: string; code: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="leading-none">{label}</span>
      <span className="text-[11px] leading-none text-[#8c9baa]">{code}</span>
    </span>
  );
}

type CountrySelectOption = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

const COUNTRY_SELECT_OPTIONS: CountrySelectOption[] = MULTI_COUNTRY_CATALOG.map((country) => ({
  value: country.value,
  label: '',
  icon: <CountryNameWithCode label={country.label} code={country.value} />,
}));

function tomorrow(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 1);
  return date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function useAiJob(): AiJob | null {
  const [job, setJob] = useState<AiJob | null>(null);
  useEffect(() => {
    resumeCreateWithAi();
    setJob(getCreateWithAiJob());
    return subscribeCreateWithAi(() => setJob(getCreateWithAiJob()));
  }, []);
  return job;
}

function ProcessingChecklist({ job }: { job: AiJob }) {
  const activeStage = AI_STAGES[Math.min(job.stageIndex, AI_STAGES.length - 1)];
  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="ir-ai-processing-icon-wrap" aria-hidden="true">
          <AiIcon className="ir-ai-icon--analyzing h-8 w-8 text-[#1b87e6]" />
        </div>
        <p className="text-sm font-medium text-[#1a2340]">
          {job.status === 'failed' ? 'Analysis stopped' : 'Analyzing your inputs'}
        </p>
        <p className="max-w-sm text-sm text-[#54606b]">
          {job.status === 'failed'
            ? job.error
            : activeStage?.status ?? 'AI is preparing your audience configuration.'}
        </p>
      </div>
      <ul className="space-y-3" aria-live="polite">
        {AI_STAGES.map((stage, index) => {
          const failedHere = job.status === 'failed' && job.failedAtStage === index;
          const isComplete = !failedHere && (job.status === 'complete' || job.stageIndex > index);
          const isActive = job.status === 'running' && job.stageIndex === index;
          return (
            <li
              key={stage.id}
              className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${
                failedHere
                  ? 'border-[#d93025] bg-[#fce8e6] text-[#1a2340]'
                  : isComplete
                    ? 'border-[#1b87e6] bg-[#e8f0fe] text-[#1a2340]'
                    : isActive
                      ? 'border-[#1b87e6] bg-white text-[#1a2340]'
                      : 'border-[#e0e4e8] bg-[#fafbfc] text-[#8c9baa]'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  failedHere
                    ? 'bg-[#d93025] text-white'
                    : isComplete
                      ? 'bg-[#1b87e6] text-white'
                      : isActive
                        ? 'border-2 border-[#1b87e6] text-[#1b87e6]'
                        : 'border border-[#e0e4e8] text-[#8c9baa]'
                }`}
                aria-hidden="true"
              >
                {failedHere ? '!' : isComplete ? '✓' : index + 1}
              </span>
              {stage.title}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RequestSummary({ form }: { form: AiFormInput }) {
  const survey = publishedSurveys().find((item) => item.id === form.surveyId);
  const countries = form.countryCodes
    .map((code) => MULTI_COUNTRY_CATALOG.find((country) => country.value === code))
    .filter((country): country is CountryDefinition => Boolean(country));
  return (
    <dl className="grid gap-3 rounded-md border border-[#e0e4e8] bg-[#f8fafc] p-3 sm:grid-cols-2">
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[#8c9baa]">Survey</dt>
        <dd className="mt-0.5 text-sm text-[#1a2340]">{survey?.name ?? 'Selected survey'}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[#8c9baa]">Responses</dt>
        <dd className="mt-0.5 text-sm text-[#1a2340]">{form.responses.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[#8c9baa]">Countries</dt>
        <dd className="mt-0.5 text-sm text-[#1a2340]">
          {countries.map((country) => country.label).join(', ')}
        </dd>
      </div>
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[#8c9baa]">Completion date</dt>
        <dd className="mt-0.5 text-sm text-[#1a2340]">{formatAiDate(form.dueDate)}</dd>
      </div>
    </dl>
  );
}

function CreateWithAiInputs({
  job,
  step,
  onCreateProject,
}: {
  job: AiJob;
  step: 1 | 2;
  onCreateProject: (input: Omit<AiFormInput, 'surveyId'>) => void;
}) {
  const saved = job.form;
  const [responses, setResponses] = useState(saved ? String(saved.responses) : '');
  const [countryCodes, setCountryCodes] = useState<string[]>(saved?.countryCodes ?? []);
  const [dueDate, setDueDate] = useState<Date | undefined>(
    saved ? new Date(saved.dueDate + 'T12:00:00') : undefined,
  );

  const hasSurveys = ELIGIBLE_SURVEY_IDS.length > 0;
  const parsedResponses = Number(responses.replace(/[^0-9]/g, ''));
  const responsesValid = Number.isInteger(parsedResponses) && parsedResponses >= 1 && parsedResponses <= 10000;
  const responsesError = !responses.trim()
    ? 'Enter the number of responses.'
    : !responsesValid
      ? 'Enter a whole number from 1 to 10,000.'
      : '';
  const minDate = tomorrow();
  const dateError = !dueDate
    ? 'Choose a completion date.'
    : dueDate < minDate
      ? 'Choose a date from tomorrow onward.'
      : '';
  const canContinue = hasSurveys && responsesValid && countryCodes.length > 0 && !dateError;

  const selectedCountryOptions = COUNTRY_SELECT_OPTIONS.filter((country) =>
    countryCodes.includes(country.value),
  );
  const selectedCountryDefs = countryCodes
    .map((code) => MULTI_COUNTRY_CATALOG.find((country) => country.value === code))
    .filter((country): country is CountryDefinition => Boolean(country));
  const countrySelectTrigger = (
    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs">
      {selectedCountryDefs.length === 0
        ? 'Select countries'
        : selectedCountryDefs.map((country, index) => (
            <span key={country.value}>
              {index > 0 ? ', ' : ''}
              <CountryNameWithCode label={country.label} code={country.value} />
            </span>
          ))}
    </span>
  );

  function handleCreateProject() {
    if (!canContinue || !dueDate) return;
    onCreateProject({
      responses: parsedResponses,
      countryCodes,
      dueDate: toIsoDate(dueDate),
    });
  }

  return (
    <>
      <WuModalContent className="overflow-visible">
        {hasSurveys ? (
          <div className="space-y-4">
            <div className="ai-create-fields">
              <div className="ai-create-responses">
                <div className="survey-fielding-label">
                  <FieldLabel>Number of Responses</FieldLabel>
                </div>
                <div className="survey-fielding-control">
                  <WuInput
                    variant="outlined"
                    inputMode="numeric"
                    maxLength={5}
                    value={responses}
                    onChange={(event) => setResponses(event.target.value.replace(/[^0-9]/g, '').slice(0, 5))}
                    invalid={Boolean(responses.trim() && responsesError)}
                    aria-invalid={Boolean(responses.trim() && responsesError)}
                    aria-label="Number of Responses"
                    placeholder="500"
                  />
                </div>
                {responses.trim() && responsesError ? (
                  <p className="mt-1 text-xs text-[#d93025]">{responsesError}</p>
                ) : null}
              </div>

              <div className="ai-create-country">
                <div className="survey-fielding-label">
                  <FieldLabel>Target Countries</FieldLabel>
                </div>
                <div className="survey-fielding-control">
                  <WuSelect
                    multiple
                    data={COUNTRY_SELECT_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedCountryOptions}
                    onSelect={(value) => {
                      const items = (Array.isArray(value) ? value : value ? [value] : []) as CountrySelectOption[];
                      setCountryCodes(items.map((item) => item.value));
                    }}
                    variant="outlined"
                    className="w-full"
                    maxContentWidth="var(--radix-dropdown-menu-trigger-width)"
                    selectAll={{ enable: true }}
                    CustomTrigger={countrySelectTrigger}
                    aria-label="Target Countries"
                  />
                </div>
                {countryCodes.length === 0 ? (
                  <p className="mt-1 text-xs text-[#8c9baa]">Select one or more countries.</p>
                ) : null}
              </div>

              <div className="ai-create-date">
                <div className="survey-fielding-label">
                  <FieldLabel>Completion date</FieldLabel>
                </div>
                <div className="survey-fielding-control">
                  <WuDatePicker
                    variant="outlined"
                    value={dueDate}
                    onChange={setDueDate}
                    minDate={minDate}
                    required
                    aria-label="Completion date"
                    slotProps={{
                      positioner: {
                        className: 'z-[80]',
                        style: { zIndex: 80, pointerEvents: 'auto' },
                      },
                    }}
                  />
                </div>
                {dueDate && dateError ? (
                  <p className="mt-1 text-xs text-[#d93025]">{dateError}</p>
                ) : null}
              </div>
            </div>

            <p className="text-sm leading-relaxed text-[#54606b]">
              AI will analyze your survey, identify the closest available audience criteria for your target countries, and check whether your response goal can be achieved by your due date.
            </p>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm font-medium text-[#1a2340]">No eligible surveys</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#54606b]">
              Publish a survey before creating an Audience project with AI. Draft surveys are not available here.
            </p>
          </div>
        )}
      </WuModalContent>
      <WuModalFooter className="block overflow-hidden rounded-b-[inherit] p-0">
        <CreateWithAiStepFooter
          current={step}
          onBack={() => closeCreateWithAi()}
          primaryLabel="Select survey"
          onPrimary={handleCreateProject}
          primaryDisabled={!canContinue}
          showPrimary={hasSurveys}
        />
      </WuModalFooter>
    </>
  );
}

function CreateWithAiHostInner() {
  const router = useRouter();
  const job = useAiJob();
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [pendingInput, setPendingInput] = useState<Omit<AiFormInput, 'surveyId'> | null>(null);
  const handedOff = useRef(false);

  const showModal = Boolean(
    job &&
      !job.minimized &&
      (job.view === 'form' ||
        job.view === 'processing' ||
        job.view === 'complete' ||
        job.view === 'failed' ||
        job.view === 'no-criteria'),
  );
  const showDock = Boolean(
    job &&
      job.minimized &&
      (job.status === 'running' || job.view === 'failed' || job.view === 'no-criteria'),
  );

  const dockTitle = useMemo(() => {
    if (!job) return '';
    if (job.status === 'running') return 'AI analysis in progress';
    if (job.view === 'failed') return 'AI analysis failed';
    if (job.view === 'no-criteria') return 'Audience could not be configured';
    return 'Your audience is ready to review';
  }, [job]);

  const dockDetail = useMemo(() => {
    if (!job) return '';
    if (job.status === 'running') return AI_STAGES[job.stageIndex]?.title ?? 'Analyzing';
    if (job.view === 'failed') return 'Open to retry. Your inputs are saved.';
    if (job.view === 'no-criteria') return 'Open to review what AI could not match.';
    return 'Opening Create project with the applied settings.';
  }, [job]);

  useEffect(() => {
    if (job?.view === 'form' || job?.view === 'processing') {
      handedOff.current = false;
    }
  }, [job?.view]);

  useEffect(() => {
    if (handedOff.current || job?.view !== 'complete' || !job.result) return;
    handedOff.current = true;
    handOffCreateWithAi();
    router.push('/projects/create?fromAi=1');
  }, [job?.view, job?.result, router]);

  function handleSurveySelect(survey: SurveyOption) {
    if (!pendingInput || survey.id === NO_SURVEY_OPTION.id) return;
    if (!ELIGIBLE_SURVEY_IDS.includes(survey.id)) return;
    startCreateWithAi({ ...pendingInput, surveyId: survey.id });
    setSurveyOpen(false);
  }

  const inputStep: 1 | 2 = surveyOpen ? 2 : 1;

  return (
    <>
      <WuModal
        open={showModal}
        onOpenChange={(open) => {
          if (!open) closeCreateWithAi();
        }}
        size="md"
        maxWidth="720px"
        allowExternalPortals
        preventClickOutside={job?.status === 'running' || job?.view === 'form'}
      >
        <WuModalHeader>
          {job?.view === 'failed'
            ? 'Analysis failed'
            : job?.view === 'no-criteria'
              ? 'No suitable audience criteria'
              : 'Create project'}
        </WuModalHeader>
        {job?.view === 'form' && (
          <CreateWithAiInputs
            key={job.form ? `${job.form.surveyId}-${job.form.dueDate}-${job.form.responses}` : 'new'}
            job={job}
            step={inputStep}
            onCreateProject={(input) => {
              setPendingInput(input);
              setSurveyOpen(true);
            }}
          />
        )}
        {job && job.view !== 'form' && job.form && (
          <>
            <WuModalContent>
              {job.view === 'processing' || job.view === 'complete' || job.view === 'failed' ? (
                <ProcessingChecklist job={job} />
              ) : (
                <div className="space-y-4">
                  <RequestSummary form={job.form} />
                  {job.view === 'no-criteria' && (
                    <p className="text-sm leading-relaxed text-[#54606b]">{job.noCriteriaMessage}</p>
                  )}
                </div>
              )}
            </WuModalContent>
            <WuModalFooter className="block overflow-hidden rounded-b-[inherit] p-0">
              {job.view === 'processing' || job.view === 'complete' ? (
                <CreateWithAiStepFooter
                  current={3}
                  onBack={() => editCreateWithAiInputs()}
                  showPrimary={false}
                  secondary={
                    job.view === 'processing' ? (
                      <WuButton variant="secondary" onClick={() => minimizeCreateWithAi()}>
                        Minimize
                      </WuButton>
                    ) : undefined
                  }
                />
              ) : job.view === 'failed' ? (
                <CreateWithAiStepFooter
                  current={3}
                  onBack={() => editCreateWithAiInputs()}
                  primaryLabel="Retry"
                  onPrimary={() => retryCreateWithAi()}
                />
              ) : (
                <CreateWithAiStepFooter current={3} onBack={() => editCreateWithAiInputs()} showPrimary={false} />
              )}
            </WuModalFooter>
          </>
        )}
      </WuModal>

      <SelectSurveyModal
        open={surveyOpen && job?.view === 'form'}
        onOpenChange={setSurveyOpen}
        selectedSurveyId={job?.form?.surveyId || NO_SURVEY_OPTION.id}
        allowedSurveyIds={ELIGIBLE_SURVEY_IDS}
        hideNoSurvey
        confirmLabel="Create project"
        showWizardFooter
        onSelect={handleSurveySelect}
      />

      {showDock && job && (
        <div className="fixed bottom-20 right-4 z-40 w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-[#e0e4e8] bg-white p-3 shadow-lg">
          <div className="flex items-start gap-3">
            {job.status === 'running' ? (
              <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#1b87e6] border-t-transparent" />
            ) : (
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  job.view === 'failed' || job.view === 'no-criteria'
                    ? 'bg-[#fce8e6] text-[#d93025]'
                    : 'bg-[#e6f4ea] text-[#188038]'
                }`}
              >
                {job.view === 'failed' || job.view === 'no-criteria' ? '!' : '✓'}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#1a2340]">{dockTitle}</p>
              <p className="mt-0.5 text-xs text-[#54606b]">{dockDetail}</p>
              <div className="mt-2 flex gap-2">
                <WuButton
                  size="sm"
                  variant={job.status === 'running' ? 'secondary' : 'primary'}
                  color={job.status === 'running' ? undefined : 'primary'}
                  onClick={() => restoreCreateWithAi()}
                >
                  {job.status === 'running' ? 'View progress' : 'Open'}
                </WuButton>
                {job.status !== 'running' && (
                  <WuButton size="sm" variant="secondary" onClick={() => closeCreateWithAi()}>
                    Dismiss
                  </WuButton>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function CreateWithAiHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <CreateWithAiHostInner />;
}
