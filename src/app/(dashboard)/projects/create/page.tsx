'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CompactNumericInput } from '@/components/ui/CompactNumericInput';
import { AudienceTemplateCard } from '@/components/projects/AudienceTemplateCard';
import { CheckWithAiButton } from '@/components/projects/CheckWithAiButton';
import { IrAiEstimateModal } from '@/components/projects/IrAiEstimateModal';
import { ProjectEstimatePanel } from '@/components/projects/ProjectEstimatePanel';
import {
  DEFAULT_AUDIENCE_TEMPLATES,
  MOCK_COUNTRIES,
  MOCK_LANGUAGES,
  MOCK_SURVEYS,
  MY_AUDIENCE_TEMPLATES,
  NO_SURVEY_OPTION,
  RESPONSE_PRESETS,
  calculateEstimate,
  type CountryOption,
  type LanguageOption,
  type SurveyOption,
} from '@/data/mock-project-create';
import {
  buildAudienceProjectDetail,
  saveAudienceProject,
} from '@/data/audience-project-store';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false }
);

const PROJECT_NAME_MAX = 100;

function nearestPreset(value: number): number {
  return RESPONSE_PRESETS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-gray-900">{children}</h2>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-xs font-medium text-gray-600">{children}</span>;
}

function TemplateSectionLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-xs font-normal text-gray-500">{children}</span>;
}

export default function CreateProjectPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  const [projectName, setProjectName] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyOption>(NO_SURVEY_OPTION);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(MOCK_COUNTRIES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>(MOCK_LANGUAGES[0]);
  const [responses, setResponses] = useState<number>(RESPONSE_PRESETS[0]);
  const [incidenceRate, setIncidenceRate] = useState('50');
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    new Date('2026-06-24')
  );
  const [surveyLength, setSurveyLength] = useState('10');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('def-3');
  const [isIrModalOpen, setIsIrModalOpen] = useState(false);

  const parsedIr = Number.parseFloat(incidenceRate) || 0;
  const surveyLengthMinutes = Number.parseInt(surveyLength, 10) || 10;
  const presetIndex = RESPONSE_PRESETS.indexOf(
    responses as (typeof RESPONSE_PRESETS)[number]
  );

  const estimate = useMemo(
    () => calculateEstimate(responses, parsedIr, surveyLengthMinutes),
    [responses, parsedIr, surveyLengthMinutes]
  );

  const surveySelectData = MOCK_SURVEYS.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  function handleResponsesChange(value: number) {
    setResponses(nearestPreset(Math.max(RESPONSE_PRESETS[0], Math.min(RESPONSE_PRESETS.at(-1)!, value))));
  }

  function handleCreateProject() {
    const allTemplates = [...MY_AUDIENCE_TEMPLATES, ...DEFAULT_AUDIENCE_TEMPLATES];
    const template = allTemplates.find((item) => item.id === selectedTemplateId);

    const project = buildAudienceProjectDetail({
      name: projectName,
      country: selectedCountry,
      responses,
      incidenceRate: parsedIr,
      surveyLengthMinutes,
      completionDate,
      templateName: template?.name,
    });

    saveAudienceProject(project);
    showToast({ message: 'Audience project created', variant: 'success' });
    router.push(`/projects/${project.id}`);
  }

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="flex flex-1 flex-col gap-6 px-6 py-5 lg:flex-row lg:gap-8 lg:pr-6">
        <div className="min-w-0 flex-1 space-y-8">
          <div>
            <WuButton
              variant="secondary"
              className="mb-3"
              Icon={<span className="wm-arrow-back" aria-hidden="true" />}
              iconPosition="left"
              onClick={() => router.push('/projects')}
            >
              Back
            </WuButton>
            <div className="mb-1 flex justify-end">
              <span className="text-xs text-gray-400">
                {projectName.length}/{PROJECT_NAME_MAX}
              </span>
            </div>
            <WuInput
              variant="title"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) =>
                setProjectName(e.target.value.slice(0, PROJECT_NAME_MAX))
              }
              maxLength={PROJECT_NAME_MAX}
              aria-label="Project name"
            />
          </div>

          <section className="space-y-4">
            <SectionHeading>Source</SectionHeading>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <WuSelect
                data={surveySelectData}
                accessorKey={{ value: 'value', label: 'label' }}
                value={{ value: selectedSurvey.id, label: selectedSurvey.name }}
                onSelect={(v) => {
                  const item = v as { value: string; label: string };
                  const survey =
                    MOCK_SURVEYS.find((s) => s.id === item.value) ?? NO_SURVEY_OPTION;
                  setSelectedSurvey(survey);
                }}
                Label="Survey"
                variant="outlined"
              />
              <WuSelect
                data={MOCK_COUNTRIES.map((c) => ({
                  value: c.value,
                  label: `${c.flag} ${c.label}`,
                }))}
                accessorKey={{ value: 'value', label: 'label' }}
                value={{
                  value: selectedCountry.value,
                  label: `${selectedCountry.flag} ${selectedCountry.label}`,
                }}
                onSelect={(v) => {
                  const item = v as { value: string; label: string };
                  const country =
                    MOCK_COUNTRIES.find((c) => c.value === item.value) ?? MOCK_COUNTRIES[0];
                  setSelectedCountry(country);
                }}
                Label="Country"
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
            <SectionHeading>How many responses do you need?</SectionHeading>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <CompactNumericInput
                type="number"
                min={RESPONSE_PRESETS[0]}
                max={RESPONSE_PRESETS.at(-1)}
                value={String(responses)}
                onChange={(e) => handleResponsesChange(Number(e.target.value) || RESPONSE_PRESETS[0])}
                aria-label="Number of responses"
              />
              <div className="min-w-0 flex-1">
                <input
                  type="range"
                  min={0}
                  max={RESPONSE_PRESETS.length - 1}
                  step={1}
                  value={presetIndex >= 0 ? presetIndex : 0}
                  onChange={(e) =>
                    setResponses(RESPONSE_PRESETS[Number(e.target.value)] ?? RESPONSE_PRESETS[0])
                  }
                  className="h-1.5 w-full cursor-pointer accent-blue-600"
                  aria-label="Responses slider"
                  aria-valuemin={RESPONSE_PRESETS[0]}
                  aria-valuemax={RESPONSE_PRESETS.at(-1)!}
                  aria-valuenow={responses}
                />
                <div className="mt-2 flex justify-between text-xs text-gray-500">
                  {RESPONSE_PRESETS.map((preset) => (
                    <span key={preset}>{preset.toLocaleString()}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeading>What are the key parameters for survey fielding?</SectionHeading>
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
                  <CheckWithAiButton onAnalysisComplete={() => setIsIrModalOpen(true)} />
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

          <section className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeading>Select your audience</SectionHeading>
              <WuButton
                variant="outline"
                color="primary"
                onClick={() =>
                  showToast({ message: 'Custom audience builder coming soon', variant: 'success' })
                }
              >
                <span className="wm-add" aria-hidden="true" /> Custom audience
              </WuButton>
            </div>

            <div>
              <TemplateSectionLabel>My templates</TemplateSectionLabel>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {MY_AUDIENCE_TEMPLATES.map((template) => (
                  <AudienceTemplateCard
                    key={template.id}
                    template={template}
                    variant="compact"
                    selected={selectedTemplateId === template.id}
                    onSelect={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <TemplateSectionLabel>Default templates</TemplateSectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {DEFAULT_AUDIENCE_TEMPLATES.map((template) => (
                  <AudienceTemplateCard
                    key={template.id}
                    template={template}
                    variant="featured"
                    selected={selectedTemplateId === template.id}
                    onSelect={() => setSelectedTemplateId(template.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="lg:sticky lg:top-5 lg:self-start">
          <ProjectEstimatePanel
            responses={responses}
            estimate={estimate}
            completionDate={completionDate}
            onCreateProject={handleCreateProject}
          />
        </div>
      </div>

      <IrAiEstimateModal open={isIrModalOpen} onOpenChange={setIsIrModalOpen} />
    </div>
  );
}
