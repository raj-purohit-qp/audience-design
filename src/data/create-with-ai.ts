import { RESPONSE_PRESETS, MOCK_SURVEYS } from '@/data/mock-project-create';
import { getCountryByCode } from '@/data/mock-multi-country';

export type AiStageId = 'survey' | 'criteria' | 'balancing' | 'feasibility';

export interface AiStage {
  id: AiStageId;
  title: string;
  detail: string;
  status: string;
}

export const AI_STAGES: AiStage[] = [
  {
    id: 'survey',
    title: 'Analyzing Survey',
    detail: 'Inspecting the survey structure, screeners, and eligibility requirements.',
    status: "Reviewing your survey's screening questions…",
  },
  {
    id: 'criteria',
    title: 'Matching Audience Criteria',
    detail: 'Comparing survey requirements with qualification criteria available in each country.',
    status: 'Matching survey requirements to available audience criteria…',
  },
  {
    id: 'balancing',
    title: 'Configuring Audience and Balancing',
    detail: 'Applying the closest criteria and deciding whether balancing is needed.',
    status: 'Preparing the audience configuration…',
  },
  {
    id: 'feasibility',
    title: 'Checking Feasibility',
    detail: 'Evaluating whether the requested responses can be delivered by the due date.',
    status: 'Evaluating delivery feasibility for your target date…',
  },
];

export const STAGE_MS = 1700;

export interface EligibleSurvey {
  id: string;
  name: string;
  code: string;
  status: 'Published' | 'Draft';
  eligible: boolean;
  questionCount: number;
}

const SURVEY_META: Record<string, { code: string; status: 'Published' | 'Draft' }> = {
  'svy-ev-001': { code: 'QP-SVY-18821', status: 'Published' },
  'svy-001': { code: 'QP-SVY-18840', status: 'Published' },
  'svy-002': { code: 'QP-SVY-19002', status: 'Published' },
  'svy-003': { code: 'QP-SVY-19110', status: 'Published' },
  'svy-004': { code: 'QP-SVY-19188', status: 'Published' },
  'svy-005': { code: 'QP-SVY-19240', status: 'Published' },
  'svy-006': { code: 'QP-SVY-19301', status: 'Published' },
  'svy-007': { code: 'QP-SVY-19355', status: 'Published' },
  'svy-008': { code: 'QP-SVY-19402', status: 'Draft' },
  'svy-009': { code: 'QP-SVY-19480', status: 'Published' },
  'svy-010': { code: 'QP-SVY-19512', status: 'Published' },
};

export const ELIGIBLE_SURVEYS: EligibleSurvey[] = MOCK_SURVEYS.flatMap((survey) => {
  const meta = SURVEY_META[survey.id];
  if (!meta) return [];
  return [
    {
      id: survey.id,
      name: survey.name,
      code: meta.code,
      status: meta.status,
      eligible: meta.status === 'Published',
      questionCount: survey.questionCount ?? 10,
    },
  ];
});

export function publishedSurveys(): EligibleSurvey[] {
  return ELIGIBLE_SURVEYS.filter((survey) => survey.eligible);
}

export interface AiFormInput {
  surveyId: string;
  responses: number;
  countryCodes: string[];
  /** YYYY-MM-DD */
  dueDate: string;
}

export interface AiCriterion {
  id: string;
  name: string;
  value: string;
  countryCodes: string[];
  approximate: boolean;
  approximationNote?: string;
}

export interface AiCountryFeasibility {
  countryCode: string;
  label: string;
  flag: string;
  status: 'feasible' | 'limited' | 'infeasible';
  requested: number;
  achievable: number;
  note: string;
}

export type AiFeasibility = 'feasible' | 'partial' | 'infeasible';

export interface AiAnalysisResult {
  surveyId: string;
  surveyName: string;
  surveyCode: string;
  responses: number;
  /** Value placed in the existing response control, which uses fielding presets. */
  fieldResponses: number;
  countryCodes: string[];
  dueDate: string;
  criteria: AiCriterion[];
  balancingApplied: boolean;
  balancingSummary: string;
  templateId: string | null;
  incidenceRate: number;
  surveyLength: number;
  feasibility: AiFeasibility;
  feasibilitySummary: string;
  countries: AiCountryFeasibility[];
}

export type AiView = 'closed' | 'form' | 'processing' | 'complete' | 'failed' | 'no-criteria' | 'handed-off';

export interface AiJob {
  view: AiView;
  minimized: boolean;
  status: 'idle' | 'running' | 'complete' | 'failed';
  stageIndex: number;
  failedAtStage: number | null;
  error: string | null;
  form: AiFormInput | null;
  result: AiAnalysisResult | null;
  noCriteriaMessage: string | null;
}

const STORAGE_KEY = 'audience-create-with-ai';

let job: AiJob | null = null;
let loaded = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emptyJob(): AiJob {
  return {
    view: 'closed',
    minimized: false,
    status: 'idle',
    stageIndex: 0,
    failedAtStage: null,
    error: null,
    form: null,
    result: null,
    noCriteriaMessage: null,
  };
}

function emit() {
  if (typeof window !== 'undefined') {
    if (job && job.view !== 'closed') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
  listeners.forEach((listener) => listener());
}

export function subscribeCreateWithAi(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCreateWithAiJob(): AiJob | null {
  return job;
}

export function resumeCreateWithAi() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as AiJob;
    job = parsed;
    if (job.status === 'running') scheduleAdvance();
    emit();
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function scheduleAdvance() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    advanceStage();
  }, STAGE_MS);
}

function advanceStage() {
  if (!job || job.status !== 'running' || !job.form) return;
  const next = job.stageIndex + 1;
  if (next < AI_STAGES.length) {
    const resolution = resolveAnalysis(job.form);
    if (resolution.kind === 'failed' && next >= resolution.failedAtStage) {
      job = {
        ...job,
        status: 'failed',
        view: 'failed',
        failedAtStage: resolution.failedAtStage,
        stageIndex: resolution.failedAtStage,
        error: resolution.message,
      };
      emit();
      return;
    }
    job = { ...job, stageIndex: next };
    emit();
    scheduleAdvance();
    return;
  }

  const resolution = resolveAnalysis(job.form);
  if (resolution.kind === 'failed') {
    job = {
      ...job,
      status: 'failed',
      view: 'failed',
      failedAtStage: resolution.failedAtStage,
      stageIndex: resolution.failedAtStage,
      error: resolution.message,
    };
    emit();
    return;
  }
  if (resolution.kind === 'no-criteria') {
    job = {
      ...job,
      status: 'complete',
      view: 'no-criteria',
      stageIndex: AI_STAGES.length,
      noCriteriaMessage: resolution.message,
      result: null,
    };
    emit();
    return;
  }
  job = {
    ...job,
    status: 'complete',
    view: 'complete',
    stageIndex: AI_STAGES.length,
    result: resolution.result,
    error: null,
  };
  emit();
}

export function openCreateWithAi() {
  if (!job) job = emptyJob();
  if (job.status === 'running') {
    job = { ...job, minimized: false, view: 'processing' };
    emit();
    return;
  }
  if (job.view === 'complete' || job.view === 'failed' || job.view === 'no-criteria') {
    job = { ...job, minimized: false };
    emit();
    return;
  }
  job = {
    ...emptyJob(),
    view: 'form',
    form: job.form,
  };
  emit();
}

export function closeCreateWithAi() {
  if (!job) return;
  if (job.status === 'running') {
    job = { ...job, minimized: true };
    emit();
    return;
  }
  if (job.view === 'form') {
    job = { ...job, view: 'closed', minimized: false };
    emit();
    return;
  }
  job = emptyJob();
  emit();
}

export function minimizeCreateWithAi() {
  if (!job) return;
  if (job.view === 'form' || job.view === 'closed' || job.view === 'handed-off') return;
  job = { ...job, minimized: true };
  emit();
}

export function restoreCreateWithAi() {
  if (!job) return;
  const view = job.status === 'running' ? 'processing' : job.view === 'handed-off' ? 'complete' : job.view;
  job = { ...job, minimized: false, view: view === 'closed' ? 'processing' : view };
  emit();
}

export function editCreateWithAiInputs() {
  if (!job) return;
  if (timer) clearTimeout(timer);
  job = {
    ...job,
    view: 'form',
    minimized: false,
    status: 'idle',
    stageIndex: 0,
    failedAtStage: null,
    error: null,
    result: null,
    noCriteriaMessage: null,
  };
  emit();
}

export function startCreateWithAi(form: AiFormInput) {
  if (job?.status === 'running') return;
  if (timer) clearTimeout(timer);
  job = {
    view: 'processing',
    minimized: false,
    status: 'running',
    stageIndex: 0,
    failedAtStage: null,
    error: null,
    form,
    result: null,
    noCriteriaMessage: null,
  };
  emit();
  scheduleAdvance();
}

export function retryCreateWithAi() {
  if (!job?.form || job.status === 'running') return;
  startCreateWithAi(job.form);
}

export function handOffCreateWithAi() {
  if (!job?.result) return;
  job = { ...job, view: 'handed-off', minimized: false };
  emit();
}

export function clearCreateWithAi() {
  if (timer) clearTimeout(timer);
  job = emptyJob();
  emit();
}

export function nearestFieldResponses(responses: number): number {
  return RESPONSE_PRESETS.reduce((prev, curr) =>
    Math.abs(curr - responses) < Math.abs(prev - responses) ? curr : prev,
  );
}

export function formatAiDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function parseAiDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function daysUntil(iso: string): number {
  const target = parseAiDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

type Resolution =
  | { kind: 'failed'; failedAtStage: number; message: string }
  | { kind: 'no-criteria'; message: string }
  | { kind: 'ready'; result: AiAnalysisResult };

function resolveAnalysis(input: AiFormInput): Resolution {
  const survey = publishedSurveys().find((item) => item.id === input.surveyId);
  const surveyName = survey?.name ?? 'Selected survey';
  if (input.surveyId === 'svy-006') {
    return {
      kind: 'failed',
      failedAtStage: 1,
      message: `We couldn't finish analyzing ${surveyName}. Your inputs are saved — try the analysis again.`,
    };
  }
  if (input.surveyId === 'svy-010') {
    return {
      kind: 'no-criteria',
      message: `AI could not find audience criteria that reliably match ${surveyName}. No criteria were applied. Adjust the survey or countries and try again.`,
    };
  }

  const countries = input.countryCodes
    .map((code) => getCountryByCode(code))
    .filter((country): country is NonNullable<typeof country> => Boolean(country));
  const fieldResponses = nearestFieldResponses(input.responses);
  const tightDeadline = daysUntil(input.dueDate) <= 7 && input.responses >= 500;
  const partialBrand = input.surveyId === 'svy-007' && countries.length > 1 && !tightDeadline;
  const balancingApplied = input.surveyId !== 'svy-004';
  const templateId = input.surveyId === 'svy-005' ? 'def-2' : input.surveyId === 'svy-003' ? 'def-3' : 'def-1';

  const criteria: AiCriterion[] = [
    {
      id: 'age',
      name: 'Age range',
      value: input.surveyId === 'svy-002' ? '25–54' : '18–65',
      countryCodes: countries.map((country) => country.value),
      approximate: false,
    },
    {
      id: 'gender',
      name: 'Gender',
      value: 'Male / Female',
      countryCodes: countries.map((country) => country.value),
      approximate: false,
    },
  ];

  if (input.surveyId === 'svy-002') {
    criteria.push({
      id: 'income',
      name: 'Household income',
      value: 'Mid to high',
      countryCodes: countries.map((country) => country.value),
      approximate: countries.some((country) => country.value === 'DE'),
      approximationNote: countries.some((country) => country.value === 'DE')
        ? 'Germany has no exact income screener for this survey. Mid to high is the closest supported band.'
        : undefined,
    });
  } else if (input.surveyId === 'svy-ev-001' || input.surveyId === 'svy-001') {
    const carCountries = countries.filter((country) => !country.unavailableQualificationIds.includes('car_ownership'));
    const missing = countries.filter((country) => country.unavailableQualificationIds.includes('car_ownership'));
    if (carCountries.length > 0) {
      criteria.push({
        id: 'car_ownership',
        name: 'Car ownership',
        value: 'Yes',
        countryCodes: carCountries.map((country) => country.value),
        approximate: false,
      });
    }
    if (missing.length > 0) {
      criteria.push({
        id: 'car_ownership_approx',
        name: 'Vehicle access',
        value: 'Household has a vehicle',
        countryCodes: missing.map((country) => country.value),
        approximate: true,
        approximationNote: `Car ownership is not available in ${missing.map((country) => country.label).join(', ')}. Household vehicle access is the closest supported match.`,
      });
    }
  }

  const feasibility: AiFeasibility = tightDeadline ? 'infeasible' : partialBrand ? 'partial' : 'feasible';
  const countryRows: AiCountryFeasibility[] = countries.map((country, index) => {
    const limited = partialBrand && index === countries.length - 1;
    const infeasible = tightDeadline;
    const status = infeasible ? 'infeasible' : limited ? 'limited' : 'feasible';
    const achievable = infeasible
      ? Math.max(25, Math.round(fieldResponses * 0.35))
      : limited
        ? Math.max(25, Math.round(fieldResponses * 0.6))
        : fieldResponses;
    const note = infeasible
      ? `Supply cannot reach ${fieldResponses.toLocaleString()} completes by ${formatAiDate(input.dueDate)}.`
      : limited
        ? 'Delivery is possible, but not for the full request by the selected date.'
        : 'The requested completes can be delivered by the selected date.';
    return {
      countryCode: country.value,
      label: country.label,
      flag: country.flag,
      status,
      requested: fieldResponses,
      achievable,
      note,
    };
  });

  const feasibilitySummary = tightDeadline
    ? `The requested ${fieldResponses.toLocaleString()} responses do not look deliverable by ${formatAiDate(input.dueDate)}. The due date was not changed.`
    : partialBrand
      ? 'Some countries can meet the request by the due date. Others are limited.'
      : `${fieldResponses.toLocaleString()} responses look deliverable by ${formatAiDate(input.dueDate)}.`;

  return {
    kind: 'ready',
    result: {
      surveyId: input.surveyId,
      surveyName,
      surveyCode: survey?.code ?? '',
      responses: input.responses,
      fieldResponses,
      countryCodes: input.countryCodes,
      dueDate: input.dueDate,
      criteria,
      balancingApplied,
      balancingSummary: balancingApplied
        ? 'Gender balancing is set to an even Male / Female split.'
        : 'Balancing is not required for this survey, so no quota split was added.',
      templateId,
      incidenceRate: tightDeadline ? 16 : 42,
      surveyLength: Math.min(30, Math.max(8, Math.round((survey?.questionCount ?? 20) / 2))),
      feasibility,
      feasibilitySummary,
      countries: countryRows,
    },
  };
}
