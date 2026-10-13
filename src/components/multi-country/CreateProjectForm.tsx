'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuSliderMark, IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { AudienceTemplateCard } from '@/components/projects/AudienceTemplateCard';
import { CheckWithAiButton } from '@/components/projects/CheckWithAiButton';
import { IrAiWorkflowModal } from '@/components/projects/IrAiWorkflowModal';
import { SelectSurveyModal } from '@/components/projects/SelectSurveyModal';
import { UniqueResponsesField } from '@/components/projects/UniqueResponsesField';
import { TopUpCriteriaEditor } from '@/components/projects/TopUpCriteriaEditor';
import {
  ProjectEstimatePanel,
  type CountryCostBreakdownRow,
} from '@/components/projects/ProjectEstimatePanel';
import {
  DEFAULT_AUDIENCE_TEMPLATES,
  MOCK_LANGUAGES,
  MY_AUDIENCE_TEMPLATES,
  MOCK_SURVEYS,
  NO_SURVEY_OPTION,
  RESPONSE_PRESETS,
  calculateEstimate,
  templateDisplayName,
  type LanguageOption,
  type SurveyOption,
} from '@/data/mock-project-create';
import {
  GLOBAL_CRITERIA,
  MULTI_COUNTRY_CATALOG,
  buildInitialCountryPlans,
  detectQualificationIssues,
  getCountryByCode,
  type CountryDefinition,
} from '@/data/mock-multi-country';
import {
  attachMultiCountryTopUp,
  attachTopUpChild,
  buildAudienceProjectDetail,
  buildMultiCountryProject,
  countryOriginalRequired,
  DEFAULT_DEMOGRAPHICS,
  demographicsFromGlobalCriteria,
  isMultiCountryProject,
  nextTopUpProjectName,
  saveMultiCountryProject,
  type AudienceProjectDemographics,
  type AudienceProjectDetail,
} from '@/data/audience-project-store';
import { defaultTopUpQuantity } from '@/data/mock-audience-projects';
import { markAudienceProjectLaunched } from '@/data/mock-home';
import { US_APPLIED_CRITERIA, US_EV_SURVEY } from '@/data/mock-ir-ai';
import type { UniqueResponseProjectOption } from '@/data/mock-unique-responses';

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
const WuStepper = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuStepper })),
  { ssr: false },
);
const WuSlider = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSlider })),
  { ssr: false },
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false },
);
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
);

const PROJECT_NAME_MAX = 100;
const DEFAULT_COUNTRY = MULTI_COUNTRY_CATALOG.find((c) => c.value === 'US') ?? MULTI_COUNTRY_CATALOG[0];
const DEFAULT_SURVEY =
  MOCK_SURVEYS.find((survey) => survey.id === US_EV_SURVEY.id) ?? US_EV_SURVEY;

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
  icon?: ReactNode;
};

const COUNTRY_SELECT_OPTIONS: CountrySelectOption[] = MULTI_COUNTRY_CATALOG.map((c) => ({
  value: c.value,
  // WuSelect stringifies `label` in options; put styled name+code in `icon` (rendered as a node).
  label: '',
  icon: <CountryNameWithCode label={c.label} code={c.value} />,
}));

function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="text-base font-semibold text-[#1a2340]">{children}</h2>;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-[#54606b]">{children}</span>;
}

function nearestPreset(value: number): number {
  return RESPONSE_PRESETS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

const RESPONSE_SLIDER_MARKS: IWuSliderMark[] = RESPONSE_PRESETS.map((preset, idx) => ({
  value: idx,
  label: preset.toLocaleString(),
}));

function ResponsesSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const activeIndex = RESPONSE_PRESETS.indexOf(value as (typeof RESPONSE_PRESETS)[number]);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;

  return (
    <div className="w-full pt-1 pb-1">
      <WuSlider
        min={0}
        max={RESPONSE_PRESETS.length - 1}
        step={1}
        value={safeIndex}
        onValueChange={(next) => {
          const idx = Array.isArray(next) ? next[0] : next;
          onChange(RESPONSE_PRESETS[idx] ?? RESPONSE_PRESETS[0]);
        }}
        marks={RESPONSE_SLIDER_MARKS}
        formatValue={(idx) => RESPONSE_PRESETS[idx]?.toLocaleString() ?? String(idx)}
        color="primary"
        size="md"
        aria-label="Responses slider"
      />
    </div>
  );
}

function parseDueDate(label: string): Date | undefined {
  const parsed = new Date(label);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function CreateProjectForm({
  topUpSource,
  topUpCountryCode,
}: {
  topUpSource?: AudienceProjectDetail;
  topUpCountryCode?: string;
}) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const audienceSectionRef = useRef<HTMLDivElement>(null);
  const isTopUp = Boolean(topUpSource);

  const [projectName, setProjectName] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyOption>(DEFAULT_SURVEY);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(MOCK_LANGUAGES[0]);
  const [selectedCountries, setSelectedCountries] = useState<CountryDefinition[]>([DEFAULT_COUNTRY]);
  const [activeCountryCode, setActiveCountryCode] = useState(DEFAULT_COUNTRY.value);
  const [responses, setResponses] = useState<number>(RESPONSE_PRESETS[0]);
  const [incidenceRate, setIncidenceRate] = useState(50);
  const [incidenceRateFromAi, setIncidenceRateFromAi] = useState(false);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(new Date('2026-08-05'));
  const [surveyLength, setSurveyLength] = useState(10);
  const [uniqueResponseProjects, setUniqueResponseProjects] = useState<UniqueResponseProjectOption[]>([]);
  const [templatesByCountry, setTemplatesByCountry] = useState<Record<string, string | null>>({
    [DEFAULT_COUNTRY.value]: 'def-1',
  });
  const [isIrModalOpen, setIsIrModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [demographics, setDemographics] = useState<AudienceProjectDemographics>(DEFAULT_DEMOGRAPHICS);
  const [genderQuotas, setGenderQuotas] = useState<Record<string, number>>({});
  const [hydratedTopUpId, setHydratedTopUpId] = useState<string | null>(null);

  const estimate = useMemo(() => {
    const base = calculateEstimate(responses, incidenceRate, surveyLength);
    const totalCost = selectedCountries.reduce((sum, c) => sum + c.cpi * responses, 0);
    const avgCpi =
      selectedCountries.length > 0
        ? totalCost / (responses * selectedCountries.length)
        : base.costPerInterview;
    return {
      ...base,
      costPerInterview: Number(avgCpi.toFixed(2)),
      totalCost: Number(totalCost.toFixed(2)),
    };
  }, [responses, incidenceRate, surveyLength, selectedCountries]);

  useEffect(() => {
    const hydrateKey = topUpSource
      ? `${topUpSource.id}:${topUpCountryCode ?? ''}`
      : null;
    if (!topUpSource || hydratedTopUpId === hydrateKey) return;

    setProjectName(nextTopUpProjectName(topUpSource.name, topUpCountryCode));
    setIncidenceRate(topUpSource.incidenceRate);
    setSurveyLength(topUpSource.surveyLengthMinutes);
    setCompletionDate(parseDueDate(topUpSource.dueDate) ?? new Date('2026-08-05'));
    setUniqueResponseProjects(
      (topUpSource.uniqueResponseProjects ?? []).map((project) => ({
        value: project.id,
        label: project.name,
        status: 'Closed',
      })),
    );

    if (isMultiCountryProject(topUpSource)) {
      const country =
        (topUpCountryCode ? getCountryByCode(topUpCountryCode) : undefined) ??
        getCountryByCode(topUpSource.countries[0]?.countryCode) ??
        DEFAULT_COUNTRY;
      setSelectedCountries([country]);
      setActiveCountryCode(country.value);
      setTemplatesByCountry({ [country.value]: 'def-1' });
      setResponses(
        defaultTopUpQuantity(
          countryOriginalRequired(topUpSource, country.value),
          topUpSource.reconciledResponses ?? 0,
        ),
      );
      setDemographics(demographicsFromGlobalCriteria(topUpSource.globalCriteria));
      setGenderQuotas({});
    } else {
      const sourceCountry =
        MULTI_COUNTRY_CATALOG.find((country) => country.label === topUpSource.country) ??
        DEFAULT_COUNTRY;
      setSelectedCountries([sourceCountry]);
      setActiveCountryCode(sourceCountry.value);
      setTemplatesByCountry({ [sourceCountry.value]: 'def-1' });
      setResponses(
        defaultTopUpQuantity(
          topUpSource.originalRequiredResponses ?? topUpSource.responses,
          topUpSource.reconciledResponses ?? 0,
        ),
      );
      setDemographics(topUpSource.demographics);
      setGenderQuotas(topUpSource.genderQuotas ?? {});
    }

    setHydratedTopUpId(hydrateKey);
  }, [topUpSource, topUpCountryCode, hydratedTopUpId]);

  const totalResponses = responses * selectedCountries.length;

  const countryBreakdown: CountryCostBreakdownRow[] = selectedCountries.map((country) => ({
    code: country.value,
    flag: country.flag,
    label: country.label,
    responses,
    cpi: country.cpi,
    total: Number((country.cpi * responses).toFixed(2)),
  }));

  const selectedCountryOptions = useMemo(
    () =>
      selectedCountries.map((c) => ({
        value: c.value,
        label: '',
        icon: <CountryNameWithCode label={c.label} code={c.value} />,
      })),
    [selectedCountries],
  );

  const countrySelectTrigger = (
    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs">
      {selectedCountries.map((country, index) => (
        <span key={country.value}>
          {index > 0 ? ', ' : ''}
          <CountryNameWithCode label={country.label} code={country.value} />
        </span>
      ))}
    </span>
  );

  function handleResponsesChange(value: number) {
    const clamped = Math.max(1, Math.min(RESPONSE_PRESETS.at(-1)!, Math.round(value) || 1));
    setResponses(isTopUp ? clamped : nearestPreset(Math.max(RESPONSE_PRESETS[0], clamped)));
  }

  function handleCountrySelectionChange(codes: string[]) {
    const countries = codes
      .map((code) => getCountryByCode(code))
      .filter((c): c is CountryDefinition => Boolean(c));

    if (countries.length === 0) {
      showToast({ message: 'At least one country is required', variant: 'error' });
      return;
    }

    setSelectedCountries(countries);
    setTemplatesByCountry((prev) => {
      const next: Record<string, string | null> = {};
      countries.forEach((c) => {
        next[c.value] = prev[c.value] ?? 'def-1';
      });
      return next;
    });
    if (!countries.some((c) => c.value === activeCountryCode)) {
      setActiveCountryCode(countries[0].value);
    }
  }

  function removeCountry(code: string) {
    if (selectedCountries.length <= 1) {
      showToast({ message: 'At least one country is required', variant: 'error' });
      return;
    }
    const next = selectedCountries.filter((c) => c.value !== code);
    setSelectedCountries(next);
    setTemplatesByCountry((prev) => {
      const copy = { ...prev };
      delete copy[code];
      return copy;
    });
    if (activeCountryCode === code) {
      setActiveCountryCode(next[0].value);
    }
    showToast({ message: `${getCountryByCode(code)?.label ?? code} removed`, variant: 'success' });
  }

  function setTemplateForCountry(countryCode: string, templateId: string | null) {
    setTemplatesByCountry((prev) => ({ ...prev, [countryCode]: templateId }));
  }

  function renderAudienceTemplates(country: CountryDefinition) {
    const templateId = templatesByCountry[country.value] ?? null;
    return (
      <>
        <div>
          <p className="mb-2 text-xs font-medium text-[#8c9baa]">My templates</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {MY_AUDIENCE_TEMPLATES.map((template) => (
              <AudienceTemplateCard
                key={template.id}
                template={template}
                variant="compact"
                selected={templateId === template.id}
                onSelect={() => setTemplateForCountry(country.value, template.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[#8c9baa]">Default templates</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DEFAULT_AUDIENCE_TEMPLATES.map((template) => (
              <AudienceTemplateCard
                key={template.id}
                template={template}
                displayName={templateDisplayName(template, country.label)}
                variant="featured"
                selected={templateId === template.id}
                onSelect={() => setTemplateForCountry(country.value, template.id)}
              />
            ))}
          </div>
        </div>
      </>
    );
  }

  function scrollToAudienceSection() {
    audienceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const hasAudienceCriteria = useMemo(
    () => selectedCountries.some((country) => Boolean(templatesByCountry[country.value])),
    [selectedCountries, templatesByCountry],
  );

  const appliedCriteria = isTopUp
    ? [
        { id: 'gender', label: demographics.gender.join(' / ') || 'Gender' },
        { id: 'age', label: demographics.ageGroups.join(', ') || 'Age groups' },
      ]
    : hasAudienceCriteria
      ? US_APPLIED_CRITERIA
      : [];

  function handleCreateProject() {
    if (selectedCountries.length === 0) {
      showToast({ message: 'Select at least one country', variant: 'error' });
      return;
    }

    if (topUpSource) {
      if (demographics.gender.length === 0) {
        showToast({ message: 'Select at least one gender', variant: 'error' });
        return;
      }
      const quotaTotal = Object.values(genderQuotas).reduce((sum, qty) => sum + qty, 0);
      if (quotaTotal > responses) {
        showToast({
          message: 'Balancing quotas cannot exceed the number of responses',
          variant: 'error',
        });
        return;
      }

      if (isMultiCountryProject(topUpSource)) {
        const country = selectedCountries[0];
        const parent = attachMultiCountryTopUp(topUpSource, {
          name: projectName,
          countryCode: country.value,
          responses,
          incidenceRate,
          surveyLengthMinutes: surveyLength,
          demographics,
        });
        markAudienceProjectLaunched();
        showToast({
          message: `Top-up launched — collecting ${responses.toLocaleString()} additional responses in ${country.label}.`,
          variant: 'success',
        });
        router.push(`/projects/${parent.id}?country=${country.value}`);
        return;
      }

      const sourceCountry = selectedCountries[0];
      const child = buildAudienceProjectDetail({
        name: projectName,
        country: sourceCountry,
        responses,
        incidenceRate,
        surveyLengthMinutes: surveyLength,
        completionDate,
        demographics,
        genderQuotas: Object.keys(genderQuotas).length > 0 ? genderQuotas : undefined,
        uniqueResponseProjects: uniqueResponseProjects.map((item) => ({
          id: item.value,
          name: item.label,
        })),
        status: 'Live',
      });
      const { parent } = attachTopUpChild(topUpSource, {
        ...child,
        costPerInterview: sourceCountry.cpi,
        totalCost: Number((sourceCountry.cpi * responses).toFixed(2)),
      });
      markAudienceProjectLaunched();
      showToast({
        message: `Top-up launched — collecting ${responses.toLocaleString()} additional responses.`,
        variant: 'success',
      });
      router.push(`/projects/${parent.id}`);
      return;
    }

    const plans = buildInitialCountryPlans(
      selectedCountries.map((c) => c.value),
      responses,
    ).map((plan) => ({
      ...plan,
      configured: Boolean(templatesByCountry[plan.countryCode]),
      setupStatus: templatesByCountry[plan.countryCode] ? ('ready' as const) : ('needs_setup' as const),
      unresolvedIssues: detectQualificationIssues(plan.countryCode, GLOBAL_CRITERIA),
    }));

    const project = buildMultiCountryProject({
      name: projectName,
      countries: selectedCountries,
      plans,
      globalCriteria: GLOBAL_CRITERIA,
      incidenceRate,
      surveyLengthMinutes: surveyLength,
      completionDate,
      uniqueResponseProjects: uniqueResponseProjects.map((project) => ({
        id: project.value,
        name: project.label,
      })),
    });

    saveMultiCountryProject(project);
    markAudienceProjectLaunched();
    showToast({ message: 'Audience project created', variant: 'success' });
    router.push(`/projects/${project.id}`);
  }

  const showCountryTabs = selectedCountries.length > 1;

  const countryTabItems: IWuTabItem[] = selectedCountries.map((country) => ({
    value: country.value,
    Trigger: (
      <span className="flex items-center gap-1.5">
        <span>
          <CountryNameWithCode label={country.label} code={country.value} />
        </span>
        <span
          role="button"
          tabIndex={0}
          aria-label={`Remove ${country.label}`}
          className="wm-close flex h-4 w-4 items-center justify-center rounded-full text-xs text-[#8c9baa] hover:bg-[#eef0f3] hover:text-[#1a2340]"
          onClick={(e) => {
            e.stopPropagation();
            removeCountry(country.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              removeCountry(country.value);
            }
          }}
        />
      </span>
    ),
    Content: (
      <div className="space-y-5 p-5 pt-4 sm:p-6 sm:pt-4">
        {renderAudienceTemplates(country)}
      </div>
    ),
  }));

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex flex-1 flex-col gap-6 px-6 py-5 lg:flex-row lg:items-start lg:gap-8">
        <div className="min-w-0 flex-1 space-y-5">
          <WuCard rounded className="overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
            <div className="space-y-8 p-5 sm:p-6">
              <div className="space-y-1">
                <WuInput
                  variant="title"
                  placeholder="Enter project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.slice(0, PROJECT_NAME_MAX))}
                  maxLength={PROJECT_NAME_MAX}
                  aria-label="Project name"
                  className="w-full"
                />
                <div className="flex justify-end">
                  <span className="text-xs text-[#8c9baa]">
                    {projectName.length}/{PROJECT_NAME_MAX}
                  </span>
                </div>
              </div>

              {/* Source */}
              <section className="space-y-3">
                <SectionHeading>Source</SectionHeading>
                {isTopUp && selectedCountries.length === 1 && (
                  <p className="text-xs text-[#8c9baa]">
                    Targeting edits apply to {selectedCountries[0].label} only.
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  <div className="w-full sm:w-52">
                    <WuSelect
                      multiple
                      data={COUNTRY_SELECT_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedCountryOptions}
                      onSelect={(v) => {
                        const items = v as CountrySelectOption[];
                        const codes = items.map((item) => item.value);
                        queueMicrotask(() => handleCountrySelectionChange(codes));
                      }}
                      Label="Country"
                      variant="outlined"
                      className="w-full"
                      maxContentWidth="13rem"
                      selectAll={{ enable: true }}
                      CustomTrigger={countrySelectTrigger}
                      disabled={isTopUp}
                    />
                  </div>
                  <div className="w-full sm:w-52">
                    <WuSelect
                      data={MOCK_LANGUAGES}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedLanguage}
                      onSelect={(v) => setSelectedLanguage(v as LanguageOption)}
                      Label="Language"
                      variant="outlined"
                      className="w-full"
                      maxContentWidth="13rem"
                      disabled={isTopUp}
                    />
                  </div>
                  <div className="w-full sm:w-52">
                    <div className="mb-1.5">
                      <FieldLabel>Survey</FieldLabel>
                    </div>
                    <WuButton
                      variant="outlined"
                      color="primary"
                      className="w-full justify-start"
                      Icon={<span className="wm-add" aria-hidden="true" />}
                      iconPosition="left"
                      disabled={isTopUp}
                      onClick={() => {
                        if (isTopUp) return;
                        setIsSurveyModalOpen(true);
                      }}
                    >
                      <span className="min-w-0 truncate">
                        {selectedSurvey.id === NO_SURVEY_OPTION.id
                          ? 'Select survey'
                          : selectedSurvey.name}
                      </span>
                    </WuButton>
                    {isTopUp && (
                      <p className="mt-1 text-xs text-[#8c9baa]">
                        Survey cannot be changed for a top-up.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Responses */}
              <section className="space-y-3">
                <SectionHeading>How many responses do you need?</SectionHeading>
                <div className="flex items-start gap-4">
                  <div className="audience-responses-input audience-no-spinner shrink-0">
                    <WuInput
                      type="number"
                      variant="outlined"
                      min={RESPONSE_PRESETS[0]}
                      max={RESPONSE_PRESETS.at(-1)}
                      value={responses}
                      onChange={(e) => handleResponsesChange(Number(e.target.value) || RESPONSE_PRESETS[0])}
                      aria-label="Number of responses per country"
                    />
                  </div>
                  <div className="min-w-0 flex-1 pt-2.5">
                    <ResponsesSlider value={responses} onChange={setResponses} />
                  </div>
                </div>
              </section>

              {/* Fielding parameters */}
              <section className="space-y-3">
                <SectionHeading>What are the key parameters for survey fielding?</SectionHeading>
                <div className="survey-fielding-fields">
                  <div className="survey-fielding-col survey-fielding-col--auto">
                    <div className="survey-fielding-label">
                      <span className="text-xs font-medium text-[#54606b]">Incidence rate</span>
                      <WuTooltip content="Expected percentage of panelists who qualify for your survey">
                        <span
                          className="wm-info cursor-help text-sm text-[#8c9baa]"
                          aria-label="Incidence rate help"
                        />
                      </WuTooltip>
                    </div>
                    <div className="survey-fielding-control gap-2.5">
                      <WuStepper
                        min={1}
                        max={100}
                        step={1}
                        value={incidenceRate}
                        onChange={(value) => {
                          setIncidenceRate(value);
                          setIncidenceRateFromAi(false);
                        }}
                        aria-label="Incidence rate"
                      />
                      <span className="text-sm text-[#8c9baa]">%</span>
                      <CheckWithAiButton
                        aiEstimated={incidenceRateFromAi}
                        onClick={() => setIsIrModalOpen(true)}
                      />
                    </div>
                  </div>

                  <div className="survey-fielding-col survey-fielding-col--fixed">
                    <div className="survey-fielding-label">
                      <FieldLabel>Completion date</FieldLabel>
                    </div>
                    <div className="survey-fielding-control">
                      <WuDatePicker
                        variant="outlined"
                        value={completionDate}
                        onChange={setCompletionDate}
                        minDate={new Date()}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="survey-fielding-col survey-fielding-col--auto">
                    <div className="survey-fielding-label">
                      <FieldLabel>Survey length</FieldLabel>
                    </div>
                    <div className="survey-fielding-control gap-2">
                      <WuStepper
                        min={1}
                        max={60}
                        step={1}
                        value={surveyLength}
                        onChange={setSurveyLength}
                        aria-label="Survey length in minutes"
                      />
                      <span className="text-sm text-[#8c9baa]">min</span>
                    </div>
                  </div>

                  <div className="survey-fielding-col survey-fielding-col--fixed">
                    <UniqueResponsesField
                      value={uniqueResponseProjects}
                      onChange={setUniqueResponseProjects}
                    />
                  </div>
                </div>
              </section>
            </div>
          </WuCard>

          {/* Section 2: Select your audience */}
          <div ref={audienceSectionRef}>
          <WuCard rounded className="overflow-hidden border border-[#e0e4e8] p-0 shadow-none">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0 sm:p-6 sm:pb-0">
              <SectionHeading>
                {isTopUp ? 'Edit targeting criteria' : 'Select your audience'}
              </SectionHeading>
              {!isTopUp && (
                <WuButton
                  variant="outlined"
                  color="primary"
                  Icon={<span className="wm-add" aria-hidden="true" />}
                  iconPosition="left"
                  onClick={() =>
                    showToast({
                      message: 'Custom audience builder coming soon',
                      variant: 'success',
                    })
                  }
                >
                  Custom audience
                </WuButton>
              )}
            </div>

            {isTopUp ? (
              <div className="p-5 pt-4 sm:p-6 sm:pt-4">
                <TopUpCriteriaEditor
                  value={demographics}
                  onChange={setDemographics}
                  genderQuotas={genderQuotas}
                  onGenderQuotasChange={setGenderQuotas}
                />
              </div>
            ) : showCountryTabs ? (
              <WuTab
                items={countryTabItems}
                value={activeCountryCode}
                onValueChange={setActiveCountryCode}
                className="w-full"
              />
            ) : (
              <div className="space-y-5 p-5 pt-4 sm:p-6 sm:pt-4">
                {renderAudienceTemplates(selectedCountries[0] ?? DEFAULT_COUNTRY)}
              </div>
            )}
          </WuCard>
          </div>
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <ProjectEstimatePanel
            responses={totalResponses}
            estimate={estimate}
            completionDate={completionDate}
            onCreateProject={handleCreateProject}
            countryCount={selectedCountries.length}
            countryBreakdown={countryBreakdown}
            actionLabel={isTopUp ? 'Launch' : 'Create project'}
          />
        </div>
      </div>

      <IrAiWorkflowModal
        open={isIrModalOpen}
        onOpenChange={setIsIrModalOpen}
        survey={selectedSurvey}
        onSurveyChange={setSelectedSurvey}
        appliedCriteria={appliedCriteria}
        hasCriteriaAdded={isTopUp || hasAudienceCriteria}
        onEditCriteria={() => {
          scrollToAudienceSection();
          showToast({ message: 'Update audience criteria below', variant: 'success' });
        }}
        onAddCriteria={() => {
          scrollToAudienceSection();
          showToast({ message: 'Add audience criteria below', variant: 'success' });
        }}
        onApplyIr={(rate, fromAi) => {
          setIncidenceRate(Math.max(0, Math.min(100, Math.round(rate))));
          setIncidenceRateFromAi(fromAi);
          setIsIrModalOpen(false);
          showToast({
            message: fromAi ? 'AI estimated IR applied' : 'Incidence rate updated',
            variant: 'success',
          });
        }}
      />
      <SelectSurveyModal
        open={isSurveyModalOpen}
        onOpenChange={setIsSurveyModalOpen}
        selectedSurveyId={selectedSurvey.id}
        onSelect={setSelectedSurvey}
      />
    </div>
  );
}
