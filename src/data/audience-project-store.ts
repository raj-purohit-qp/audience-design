import type { CountryOption } from './mock-project-create';
import { calculateEstimate, formatEstimateDate } from './mock-project-create';

export type AudienceProjectDetailStatus = 'Draft' | 'Live' | 'Paused' | 'Closed';

export interface AudienceProjectDemographics {
  ageGroups: string[];
  gender: string[];
  education: string[];
  income: string[];
}

export interface AudienceProjectDetail {
  id: string;
  projectId: string;
  name: string;
  status: AudienceProjectDetailStatus;
  scopeTag: string;
  client: string;
  dueDate: string;
  launchDate?: string;
  etcDate?: string;
  daysElapsed?: number;
  velocityPerHour?: number;
  country: string;
  regions: string[];
  responses: number;
  collected: number;
  incidenceRate: number;
  realtimeIR?: number;
  surveyLengthMinutes: number;
  realtimeLOI?: number;
  totalCost: number;
  costPerInterview: number;
  demographics: AudienceProjectDemographics;
  qualificationNote: string;
}

export const DEFAULT_DEMOGRAPHICS: AudienceProjectDemographics = {
  ageGroups: ['18–24', '25–34', '35–44', '45–54', '55–65'],
  gender: ['Male', 'Female', 'Non-binary / other'],
  education: ['High school', 'Some college', "Bachelor's degree", 'Graduate degree'],
  income: ['Under $35K', '$35K–$75K', '$75K–$150K', 'Over $150K'],
};

export const MOCK_PROJECT_DETAIL: AudienceProjectDetail = {
  id: 'demo-project',
  projectId: 'QP-M6548',
  name: 'US Customer Experience Study Q2 2026',
  status: 'Draft',
  scopeTag: 'United States only',
  client: 'Apex Retail — Consumer Insights',
  dueDate: 'Jun 30, 2026',
  launchDate: 'Jun 2, 2026',
  etcDate: 'Jun 26, 2026',
  daysElapsed: 8,
  velocityPerHour: 5,
  country: 'United States',
  regions: ['Northeast', 'South', 'Midwest', 'West'],
  responses: 1500,
  collected: 0,
  incidenceRate: 72,
  surveyLengthMinutes: 8,
  totalCost: 1800,
  costPerInterview: 1.2,
  demographics: DEFAULT_DEMOGRAPHICS,
  qualificationNote:
    'All panelists matching the demographic profile are eligible to respond.',
};

export interface CreateProjectPayload {
  name: string;
  country: CountryOption;
  responses: number;
  incidenceRate: number;
  surveyLengthMinutes: number;
  completionDate?: Date;
  templateName?: string;
}

function generateProjectId(): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `QP-M${suffix}`;
}

function generateProjectSlugId(): string {
  return `proj-${Date.now()}`;
}

export function buildAudienceProjectDetail(payload: CreateProjectPayload): AudienceProjectDetail {
  const estimate = calculateEstimate(
    payload.responses,
    payload.incidenceRate,
    payload.surveyLengthMinutes
  );

  const name =
    payload.name.trim() ||
    `${payload.country.label} Audience Study ${new Date().getFullYear()}`;

  const scopeTag =
    payload.country.value === 'US' ? 'United States only' : `${payload.country.label} only`;

  return {
    id: generateProjectSlugId(),
    projectId: generateProjectId(),
    name,
    status: 'Draft',
    scopeTag,
    client: 'Apex Retail — Consumer Insights',
    dueDate: formatEstimateDate(payload.completionDate) || 'Jun 30, 2026',
    country: payload.country.label,
    regions: ['Northeast', 'South', 'Midwest', 'West'],
    responses: payload.responses,
    collected: 0,
    incidenceRate: payload.incidenceRate,
    surveyLengthMinutes: payload.surveyLengthMinutes,
    totalCost: Math.round(estimate.totalCost),
    costPerInterview: estimate.costPerInterview,
    demographics: DEFAULT_DEMOGRAPHICS,
    qualificationNote: MOCK_PROJECT_DETAIL.qualificationNote,
  };
}

const STORAGE_PREFIX = 'audience-project:';

export function saveAudienceProject(project: AudienceProjectDetail): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${STORAGE_PREFIX}${project.id}`, JSON.stringify(project));
}

export function getAudienceProject(id: string): AudienceProjectDetail | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AudienceProjectDetail;
  } catch {
    return null;
  }
}

export function resolveAudienceProject(id: string): AudienceProjectDetail {
  return getAudienceProject(id) ?? { ...MOCK_PROJECT_DETAIL, id };
}
