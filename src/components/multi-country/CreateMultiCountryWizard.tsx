'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CompactNumericInput } from '@/components/ui/CompactNumericInput';
import { CheckWithAiButton } from '@/components/projects/CheckWithAiButton';
import { IrAiWorkflowModal } from '@/components/projects/IrAiWorkflowModal';
import { CountryMultiSelect } from '@/components/multi-country/CountryMultiSelect';
import { CountryPlanningStep } from '@/components/multi-country/CountryPlanningStep';
import { AudienceConfigStep } from '@/components/multi-country/AudienceConfigStep';
import { ReviewLaunchStep } from '@/components/multi-country/ReviewLaunchStep';
import { ProjectSummaryPanel } from '@/components/multi-country/ProjectSummaryPanel';
import {
  MOCK_LANGUAGES,
  MOCK_SURVEYS,
  NO_SURVEY_OPTION,
  RESPONSE_PRESETS,
  type LanguageOption,
  type SurveyOption,
} from '@/data/mock-project-create';
import {
  GLOBAL_CRITERIA,
  MULTI_COUNTRY_CATALOG,
  buildInitialCountryPlans,
  canLaunch,
  type CountryDefinition,
  type CountryPlan,
} from '@/data/mock-multi-country';
import { buildMultiCountryProject, saveMultiCountryProject } from '@/data/audience-project-store';
import { markAudienceProjectLaunched } from '@/data/mock-home';

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

const PROJECT_NAME_MAX = 100;
const STEPS = ['Project setup', 'Country planning', 'Audience configuration', 'Review & launch'] as const;

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-gray-600">{children}</span>;
}

function nearestPreset(value: number): number {
  return RESPONSE_PRESETS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

export function CreateMultiCountryWizard() {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyOption>(NO_SURVEY_OPTION);
  const [selectedCountries, setSelectedCountries] = useState<CountryDefinition[]>([
    MULTI_COUNTRY_CATALOG[0],
    MULTI_COUNTRY_CATALOG[2],
    MULTI_COUNTRY_CATALOG[3],
  ]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(MOCK_LANGUAGES[0]);
  const [responsesPerCountry, setResponsesPerCountry] = useState<number>(500);
  const [incidenceRate, setIncidenceRate] = useState('50');
  const [completionDate, setCompletionDate] = useState<Date | undefined>(new Date('2026-08-15'));
  const [surveyLength, setSurveyLength] = useState('12');
  const [countryPlans, setCountryPlans] = useState<CountryPlan[]>(() =>
    buildInitialCountryPlans(['US', 'GB', 'DE'], 500),
  );
  const [isIrModalOpen, setIsIrModalOpen] = useState(false);

  const parsedIr = Number.parseFloat(incidenceRate) || 0;
  const surveyLengthMinutes = Number.parseInt(surveyLength, 10) || 10;
  const presetIndex = RESPONSE_PRESETS.indexOf(responsesPerCountry as (typeof RESPONSE_PRESETS)[number]);

  const surveySelectData = MOCK_SURVEYS.map((s) => ({ value: s.id, label: s.name }));

  function syncPlans(countries: CountryDefinition[], responses: number) {
    setCountryPlans(buildInitialCountryPlans(countries.map((c) => c.value), responses));
  }

  function handleCountriesChange(countries: CountryDefinition[]) {
    setSelectedCountries(countries);
    syncPlans(countries, responsesPerCountry);
  }

  function handleResponsesChange(value: number) {
    const next = nearestPreset(Math.max(RESPONSE_PRESETS[0], Math.min(RESPONSE_PRESETS.at(-1)!, value)));
    setResponsesPerCountry(next);
    syncPlans(selectedCountries, next);
  }

  const step1Valid = projectName.trim().length > 0 && selectedCountries.length > 0;
  const launchReady = canLaunch(countryPlans);

  const footerAction = useMemo(() => {
    if (step === 0) return { label: 'Continue to planning', disabled: !step1Valid };
    if (step === 1) return { label: 'Configure audience', disabled: countryPlans.length === 0 };
    if (step === 2) return { label: 'Review & launch', disabled: false };
    return { label: 'Launch project', disabled: !launchReady };
  }, [step, step1Valid, countryPlans.length, launchReady]);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    handleLaunch();
  }

  function handleLaunch() {
    const project = buildMultiCountryProject({
      name: projectName,
      countries: selectedCountries,
      plans: countryPlans,
      globalCriteria: GLOBAL_CRITERIA,
      incidenceRate: parsedIr,
      surveyLengthMinutes,
      completionDate,
    });
    saveMultiCountryProject(project);
    markAudienceProjectLaunched();
    showToast({ message: 'Multi-country project launched!', variant: 'success' });
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      {/* Step indicator */}
      <div className="border-b border-gray-200 px-6 py-4">
        <ol className="flex flex-wrap gap-2 sm:gap-4">
          {STEPS.map((label, i) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  i === step
                    ? 'bg-blue-600 text-white'
                    : i < step
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </span>
              <span className={`text-sm ${i === step ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && <span className="hidden text-gray-300 sm:inline">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-1 flex-col gap-6 px-6 py-5 lg:flex-row lg:gap-8 lg:pr-6">
        <div className="min-w-0 flex-1 space-y-8">
          <div>
            <WuButton
              variant="secondary"
              className="mb-3"
              Icon={<span className="wm-arrow-back" aria-hidden="true" />}
              iconPosition="left"
              onClick={() => (step > 0 ? setStep(step - 1) : router.push('/projects'))}
            >
              Back
            </WuButton>
            {step === 0 && (
              <>
                <div className="mb-1 flex justify-end">
                  <span className="text-xs text-gray-400">
                    {projectName.length}/{PROJECT_NAME_MAX}
                  </span>
                </div>
                <WuInput
                  variant="title"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.slice(0, PROJECT_NAME_MAX))}
                  maxLength={PROJECT_NAME_MAX}
                  aria-label="Project name"
                />
              </>
            )}
            {step > 0 && (
              <h1 className="text-xl font-normal text-gray-900">
                {projectName.trim() || 'Untitled project'}
              </h1>
            )}
          </div>

          {step === 0 && (
            <>
              <section className="space-y-4">
                <SectionHeading>Source</SectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <WuSelect
                    data={surveySelectData}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={{ value: selectedSurvey.id, label: selectedSurvey.name }}
                    onSelect={(v) => {
                      const item = v as { value: string; label: string };
                      setSelectedSurvey(MOCK_SURVEYS.find((s) => s.id === item.value) ?? NO_SURVEY_OPTION);
                    }}
                    Label="Survey"
                    variant="outlined"
                  />
                  <WuSelect
                    data={MOCK_LANGUAGES}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedLanguage}
                    onSelect={(v) => setSelectedLanguage(v as LanguageOption)}
                    Label="Language"
                    variant="outlined"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <SectionHeading>Countries</SectionHeading>
                <CountryMultiSelect
                  catalog={MULTI_COUNTRY_CATALOG}
                  selected={selectedCountries}
                  onChange={handleCountriesChange}
                />
              </section>

              <section className="space-y-4">
                <SectionHeading>Responses required (per country)</SectionHeading>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <CompactNumericInput
                    type="number"
                    min={RESPONSE_PRESETS[0]}
                    max={RESPONSE_PRESETS.at(-1)}
                    value={String(responsesPerCountry)}
                    onChange={(e) => handleResponsesChange(Number(e.target.value) || RESPONSE_PRESETS[0])}
                    aria-label="Responses per country"
                  />
                  <div className="min-w-0 flex-1">
                    <input
                      type="range"
                      min={0}
                      max={RESPONSE_PRESETS.length - 1}
                      step={1}
                      value={presetIndex >= 0 ? presetIndex : 0}
                      onChange={(e) =>
                        handleResponsesChange(RESPONSE_PRESETS[Number(e.target.value)] ?? RESPONSE_PRESETS[0])
                      }
                      className="h-1.5 w-full cursor-pointer accent-blue-600"
                      aria-label="Responses slider"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <SectionHeading>Survey fielding parameters</SectionHeading>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <FieldLabel>Incidence rate</FieldLabel>
                    <div className="flex items-end gap-2">
                      <CompactNumericInput
                        type="number"
                        min={1}
                        max={100}
                        value={incidenceRate}
                        onChange={(e) => setIncidenceRate(e.target.value)}
                        aria-label="Incidence rate"
                      />
                      <span className="pb-2.5 text-sm text-gray-500">%</span>
                      <CheckWithAiButton onClick={() => setIsIrModalOpen(true)} />
                    </div>
                  </div>
                  <WuDatePicker
                    Label="Completion date"
                    labelPosition="top"
                    variant="outlined"
                    value={completionDate}
                    onChange={setCompletionDate}
                    minDate={new Date()}
                    formatString="MM/dd/yyyy"
                  />
                  <div>
                    <FieldLabel>Survey length</FieldLabel>
                    <div className="flex items-center gap-2">
                      <CompactNumericInput
                        type="number"
                        min={1}
                        max={60}
                        value={surveyLength}
                        onChange={(e) => setSurveyLength(e.target.value)}
                        aria-label="Survey length in minutes"
                      />
                      <span className="text-sm text-gray-500">min</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {step === 1 && <CountryPlanningStep plans={countryPlans} />}
          {step === 2 && (
            <AudienceConfigStep
              plans={countryPlans}
              globalCriteria={GLOBAL_CRITERIA}
              onPlansChange={setCountryPlans}
            />
          )}
          {step === 3 && (
            <ReviewLaunchStep
              projectName={projectName}
              plans={countryPlans}
              globalCriteria={GLOBAL_CRITERIA}
            />
          )}
        </div>

        <ProjectSummaryPanel
          plans={countryPlans}
          launchDisabled={footerAction.disabled}
          actionLabel={footerAction.label}
          onAction={handleNext}
        />
      </div>

      <IrAiWorkflowModal
        open={isIrModalOpen}
        onOpenChange={setIsIrModalOpen}
        survey={selectedSurvey}
        onSurveyChange={setSelectedSurvey}
        appliedCriteria={[]}
        hasCriteriaAdded={false}
        onEditCriteria={() => undefined}
        onAddCriteria={() => undefined}
        onApplyIr={() => undefined}
      />
    </div>
  );
}
