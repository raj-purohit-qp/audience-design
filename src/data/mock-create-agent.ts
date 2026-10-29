import { addDays, format, isValid, parse, startOfDay } from 'date-fns';
import { publishedSurveys } from '@/data/create-with-ai';
import { MULTI_COUNTRY_CATALOG } from '@/data/mock-multi-country';

export const GUIDED_RESPONSE_COUNTS = [50, 100, 200, 500, 1000, 2000, 5000] as const;

export type GuidedField = 'responses' | 'country' | 'survey' | 'dueDate';
export type GuidedStep = GuidedField | 'intake' | 'confirm' | 'working' | 'done';

export interface GuidedDraft {
  responses?: number;
  countryCodes?: string[];
  surveyId?: string;
  dueDate?: string;
}

export interface GuidedOption {
  id: string;
  label: string;
}

export const AGENT_COPY = {
  greeting: "Hi! I'm your research agent. I can help you set up this project.",
  responses: 'How many responses do you want to collect?',
  country: 'Which countries do you want to field the survey in?',
  survey: 'Which survey do you want to field?',
  dueDate: 'What will be the due date?',
  confirm:
    'Do you want to share anything else before creating the project? Review the details above, then confirm.',
  noted:
    "I'll keep that in mind. Review the details above, then confirm when you're ready to create the project.",
  more: 'Go ahead and share anything else. When you’re ready, review the details and click Create.',
  recents:
    'Or start from a recent project. This fills responses, countries, and due date — you only select the survey.',
  unclear: "I didn't catch that. Choose one of the options, or try a different answer.",
  needDetails: 'Please share the number of responses, country, due date, and the survey.',
  composerIntake:
    'Share your requirements like number of responses, country, due date and the survey.',
};

const MISSING_FIELD_LABELS: Record<GuidedField, string> = {
  responses: 'the number of responses',
  country: 'country',
  survey: 'the survey',
  dueDate: 'due date',
};

export interface RecentProjectTemplate {
  id: string;
  name: string;
  responses: number;
  countryCodes: string[];
  dueDate: string;
}

export function recentProjectTemplates(): RecentProjectTemplate[] {
  const today = startOfDay(new Date());
  return [
    {
      id: 'recent-cx',
      name: 'US Customer Experience Study Q2 2026',
      responses: 500,
      countryCodes: ['US'],
      dueDate: toIsoDate(addDays(today, 21)),
    },
    {
      id: 'recent-health',
      name: 'Healthcare Benefits — Decision Makers US',
      responses: 500,
      countryCodes: ['US'],
      dueDate: toIsoDate(addDays(today, 30)),
    },
    {
      id: 'recent-stream',
      name: 'Streaming Subscribers Brand Tracker Wave 2',
      responses: 800,
      countryCodes: ['US', 'GB'],
      dueDate: toIsoDate(addDays(today, 45)),
    },
    {
      id: 'recent-auto',
      name: 'Auto Insurance Shoppers — National Panel',
      responses: 1000,
      countryCodes: ['US', 'CA'],
      dueDate: toIsoDate(addDays(today, 60)),
    },
  ];
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ['united states', 'united states of america', 'usa', 'u.s.', 'u.s.a.', 'america'],
  CA: ['canada'],
  GB: ['united kingdom', 'great britain', 'britain', 'england', 'uk', 'u.k.'],
  DE: ['germany', 'deutschland'],
  IN: ['india'],
  AU: ['australia'],
  SG: ['singapore'],
  FR: ['france'],
  JP: ['japan'],
};

export function minGuidedDueDate(): Date {
  return addDays(startOfDay(new Date()), 1);
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function isoToDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatGuidedDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return format(new Date(year, month - 1, day), 'MMM d, yyyy');
}

export function guidedResponseOptions(): GuidedOption[] {
  return GUIDED_RESPONSE_COUNTS.map((count) => ({
    id: String(count),
    label: count.toLocaleString(),
  }));
}

export function guidedSurveyOptions(): GuidedOption[] {
  return publishedSurveys().map((survey) => ({
    id: survey.id,
    label: survey.name,
  }));
}

export function guidedDueDateOptions(): GuidedOption[] {
  const start = minGuidedDueDate();
  return [7, 14, 21, 30].map((days) => {
    const date = addDays(startOfDay(new Date()), days);
    const iso = toIsoDate(date < start ? start : date);
    return {
      id: iso,
      label: `${formatGuidedDate(iso)}  ·  ${days} days`,
    };
  });
}

export function missingFields(draft: GuidedDraft): GuidedField[] {
  const missing: GuidedField[] = [];
  if (draft.responses == null) missing.push('responses');
  if (!draft.countryCodes?.length) missing.push('country');
  if (!draft.surveyId) missing.push('survey');
  if (!draft.dueDate) missing.push('dueDate');
  return missing;
}

export function remainingGuidedStep(draft: GuidedDraft): GuidedField | 'ready' {
  return missingFields(draft)[0] ?? 'ready';
}

export function requestMissingCopy(draft: GuidedDraft): string {
  const missing = missingFields(draft);
  if (missing.length === 0) return AGENT_COPY.confirm;
  if (missing.length === 4) return AGENT_COPY.needDetails;
  const labels = missing.map((field) => MISSING_FIELD_LABELS[field]);
  if (labels.length === 1) return `Please share ${labels[0]}.`;
  if (labels.length === 2) return `Please share ${labels[0]} and ${labels[1]}.`;
  return `Please share ${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}.`;
}

export function questionForStep(step: GuidedField): string {
  return AGENT_COPY[step];
}

export function optionsForStep(step: GuidedField): GuidedOption[] {
  if (step === 'responses') return guidedResponseOptions();
  if (step === 'survey') return guidedSurveyOptions();
  if (step === 'dueDate') return guidedDueDateOptions();
  return [];
}

export function optionLayoutForStep(step: GuidedField): 'chips' | 'list' {
  return step === 'survey' ? 'list' : 'chips';
}

export function parseGuidedResponses(text: string): number | null {
  const normalized = text.toLowerCase().replace(/,/g, '');
  const kMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/);
  const fromK = kMatch ? Math.round(Number(kMatch[1]) * 1000) : null;
  const numbers = [...normalized.matchAll(/\d+/g)].map((match) => Number(match[0]));
  if (fromK && fromK >= 1 && fromK <= 20_000) numbers.push(fromK);

  const guidedHit = GUIDED_RESPONSE_COUNTS.filter((count) => numbers.includes(count)).sort(
    (a, b) => b - a,
  )[0];
  if (guidedHit) return guidedHit;

  const custom = numbers.find((value) => value >= 1 && value <= 20_000);
  return custom ?? null;
}

function countryNameRank(): { code: string; name: string }[] {
  const ranked: { code: string; name: string }[] = [];
  for (const country of MULTI_COUNTRY_CATALOG) {
    ranked.push({ code: country.value, name: country.label.toLowerCase() });
    for (const alias of COUNTRY_ALIASES[country.value] ?? []) {
      ranked.push({ code: country.value, name: alias });
    }
    ranked.push({ code: country.value, name: country.value.toLowerCase() });
  }
  return ranked.sort((a, b) => b.name.length - a.name.length);
}

export function parseGuidedCountries(text: string): string[] {
  let remaining = text.toLowerCase();
  const found: string[] = [];
  for (const entry of countryNameRank()) {
    if (found.includes(entry.code)) continue;
    if (entry.name.length <= 2) {
      const bounded = new RegExp(`(?:^|[^a-z])${escapeRegExp(entry.name)}(?:$|[^a-z])`, 'i');
      if (!bounded.test(remaining)) continue;
      found.push(entry.code);
      remaining = remaining.replace(bounded, ' ');
      continue;
    }
    if (!remaining.includes(entry.name)) continue;
    found.push(entry.code);
    remaining = remaining.replace(entry.name, ' ');
  }
  return found;
}

export function parseGuidedSurvey(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return null;
  const surveys = publishedSurveys();
  const exact = surveys.find(
    (survey) =>
      survey.name.toLowerCase() === normalized ||
      survey.code.toLowerCase() === normalized ||
      survey.id.toLowerCase() === normalized,
  );
  if (exact) return exact.id;
  if (normalized.length < 4) return null;

  const partial = surveys
    .filter(
      (survey) =>
        survey.name.toLowerCase().includes(normalized) ||
        normalized.includes(survey.name.toLowerCase()),
    )
    .sort((a, b) => b.name.length - a.name.length);
  return partial[0]?.id ?? null;
}

export function parseGuidedDueDate(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const min = minGuidedDueDate();
  const today = startOfDay(new Date());
  const lower = trimmed.toLowerCase();

  const relative = lower.match(
    /(?:in\s+)?(\d+)\s*(day|days|week|weeks|month|months)\b/,
  );
  if (relative) {
    const amount = Number(relative[1]);
    const unit = relative[2];
    const days = unit.startsWith('week') ? amount * 7 : unit.startsWith('month') ? amount * 30 : amount;
    const date = addDays(today, days);
    return date >= min ? toIsoDate(date) : null;
  }

  const patterns = ['yyyy-MM-dd', 'MM/dd/yyyy', 'M/d/yyyy', 'MMM d, yyyy', 'MMMM d, yyyy', 'MMM d yyyy', 'MMMM d yyyy'];
  for (const pattern of patterns) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed) && startOfDay(parsed) >= min) return toIsoDate(parsed);
  }

  return null;
}

export function applyGuidedText(
  draft: GuidedDraft,
  text: string,
  onlyField?: GuidedField,
): GuidedDraft {
  const next = { ...draft };
  const allow = (field: GuidedField) => !onlyField || onlyField === field;

  if (allow('responses')) {
    const responses = parseGuidedResponses(text);
    if (responses != null && (onlyField === 'responses' || next.responses == null)) {
      next.responses = responses;
    }
  }
  if (allow('country')) {
    const countries = parseGuidedCountries(text);
    if (countries.length && (onlyField === 'country' || !next.countryCodes?.length)) {
      next.countryCodes = countries;
    }
  }
  if (allow('survey')) {
    const survey = parseGuidedSurvey(text);
    if (survey && (onlyField === 'survey' || !next.surveyId)) {
      next.surveyId = survey;
    }
  }
  if (allow('dueDate')) {
    const dueDate = parseGuidedDueDate(text);
    if (dueDate && (onlyField === 'dueDate' || !next.dueDate)) {
      next.dueDate = dueDate;
    }
  }
  return next;
}

export function applyGuidedOption(draft: GuidedDraft, field: GuidedField, optionId: string): GuidedDraft {
  const next = { ...draft };
  if (field === 'responses') next.responses = Number(optionId);
  if (field === 'survey') next.surveyId = optionId;
  if (field === 'dueDate') next.dueDate = optionId;
  return next;
}

export function countryListLabel(codes: string[] | undefined, withFlags = false): string {
  const names = (codes ?? [])
    .map((code) => MULTI_COUNTRY_CATALOG.find((country) => country.value === code))
    .filter((country): country is NonNullable<typeof country> => Boolean(country))
    .map((country) => (withFlags ? `${country.flag}  ${country.label}` : country.label));
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

export function labelForDraftField(field: GuidedField, draft: GuidedDraft): string {
  if (field === 'responses') return draft.responses?.toLocaleString() ?? '';
  if (field === 'country') return countryListLabel(draft.countryCodes, true);
  if (field === 'survey') {
    return publishedSurveys().find((survey) => survey.id === draft.surveyId)?.name ?? '';
  }
  return draft.dueDate ? formatGuidedDate(draft.dueDate) : '';
}

export function draftFromRecentTemplate(template: RecentProjectTemplate): GuidedDraft {
  return {
    responses: template.responses,
    countryCodes: [...template.countryCodes],
    dueDate: template.dueDate,
  };
}

export function analysisSummary(draft: GuidedDraft): string {
  const survey = labelForDraftField('survey', draft);
  const country = countryListLabel(draft.countryCodes);
  const responses = labelForDraftField('responses', draft);
  const dueDate = labelForDraftField('dueDate', draft);
  return `I'll analyze ${survey} for ${responses} responses in ${country}, due ${dueDate}.`;
}

export function reviewDetails(draft: GuidedDraft): string {
  return [
    'Here are the details you shared:',
    `Responses: ${labelForDraftField('responses', draft)}`,
    `Countries: ${countryListLabel(draft.countryCodes, true)}`,
    `Survey: ${labelForDraftField('survey', draft)}`,
    `Due date: ${labelForDraftField('dueDate', draft)}`,
  ].join('\n');
}

export function isConfirmReply(text: string): boolean {
  const normalized = text
    .toLowerCase()
    .replace(/[.!?,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return [
    'no',
    "that's all",
    'thats all',
    'no thats all',
    "no that's all",
    'nothing else',
    'nothing more',
    'looks good',
    'continue',
    'confirm',
    'create',
    'create project',
    "no that's everything",
    'no thats everything',
  ].includes(normalized);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
