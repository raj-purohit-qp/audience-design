export interface SurveyOption {
  id: string;
  name: string;
  questionCount?: number;
}

export interface CountryOption {
  value: string;
  label: string;
  flag: string;
}

export interface LanguageOption {
  value: string;
  label: string;
}

export interface AudienceTemplate {
  id: string;
  name: string;
  description?: string;
  attributes?: string;
  category: 'my' | 'default';
  illustration?: 'census' | 'employees' | 'gamers';
}

export const NO_SURVEY_OPTION: SurveyOption = {
  id: 'none',
  name: "I don't have a survey yet",
};

export const MOCK_SURVEYS: SurveyOption[] = [
  NO_SURVEY_OPTION,
  { id: 'svy-001', name: 'Consumer Electronics Purchase Intent 2025', questionCount: 24 },
  { id: 'svy-002', name: 'Healthcare Benefits Satisfaction Study', questionCount: 18 },
  { id: 'svy-003', name: 'Streaming Service Brand Tracker — Wave 3', questionCount: 32 },
];

export const MOCK_COUNTRIES: CountryOption[] = [
  { value: 'US', label: 'United States', flag: '🇺🇸' },
  { value: 'CA', label: 'Canada', flag: '🇨🇦' },
  { value: 'GB', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'DE', label: 'Germany', flag: '🇩🇪' },
  { value: 'AU', label: 'Australia', flag: '🇦🇺' },
];

export const MOCK_LANGUAGES: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
];

export const RESPONSE_PRESETS = [50, 100, 250, 500, 1000, 3000, 5000] as const;

export const MY_AUDIENCE_TEMPLATES: AudienceTemplate[] = [
  {
    id: 'my-1',
    name: 'Finance Decisions',
    attributes: 'Gender, Age Range, HH Income, State...',
    category: 'my',
  },
  {
    id: 'my-2',
    name: 'Travelers from Northeast',
    attributes: 'Gender, Age Range, Region, Travel frequency...',
    category: 'my',
  },
  {
    id: 'my-3',
    name: 'Dog owners',
    attributes: 'Gender, Age Range, Pet type, Household size...',
    category: 'my',
  },
];

export const DEFAULT_AUDIENCE_TEMPLATES: AudienceTemplate[] = [
  {
    id: 'def-1',
    name: 'US census',
    description:
      'This template targets a sample of 18+ US census representative respondents using gender, age, household income, state and ethnicity quotas based on the latest census data.',
    category: 'default',
    illustration: 'census',
  },
  {
    id: 'def-2',
    name: 'Full time employees',
    description:
      "This template targets a sample of full-time employees across the United States. It's designed for conducting research on workplace topics, benefits, and employment trends.",
    category: 'default',
    illustration: 'employees',
  },
  {
    id: 'def-3',
    name: 'Gamers',
    description:
      'This template targets a sample of gamers, defined as individuals who spend at least five hours per week playing video games. It includes platform and genre quotas.',
    category: 'default',
    illustration: 'gamers',
  },
];

export interface ProjectEstimate {
  costPerInterview: number;
  totalCost: number;
  feasibility: 'high' | 'medium' | 'low';
}

export function calculateEstimate(
  responses: number,
  incidenceRate: number,
  surveyLengthMinutes: number
): ProjectEstimate {
  const irFactor = Math.max(incidenceRate, 5) / 100;
  const lengthFactor = 1 + (surveyLengthMinutes - 5) * 0.04;
  const costPerInterview = Number((1.2 * lengthFactor / irFactor).toFixed(2));
  const totalCost = Number((costPerInterview * responses).toFixed(2));

  let feasibility: ProjectEstimate['feasibility'] = 'high';
  if (incidenceRate < 20) feasibility = 'medium';
  if (incidenceRate < 10) feasibility = 'low';

  return { costPerInterview, totalCost, feasibility };
}

export function formatEstimateDate(date: Date | undefined): string {
  if (!date) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
