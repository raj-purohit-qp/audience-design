import type { CountryOption } from './mock-project-create';
import { calculateEstimate, formatEstimateDate } from './mock-project-create';
import type {
  CountryDefinition,
  CountryPlan,
  GlobalCriterion,
  MultiCountryProjectDetail,
} from './mock-multi-country';
import {
  MOCK_MULTI_COUNTRY_PARENT,
  slugifyChildName,
} from './mock-multi-country';
import { MOCK_AUDIENCE_PROJECTS } from './mock-audience-projects';

export type AudienceProjectDetailStatus = 'Draft' | 'Live' | 'Paused' | 'Closed';

export interface AudienceProjectDemographics {
  ageGroups: string[];
  gender: string[];
  education: string[];
  income: string[];
}

export type AudienceProjectDetail = SingleCountryProjectDetail | MultiCountryProjectDetail;

export interface SingleCountryProjectDetail {
  id: string;
  projectId: string;
  name: string;
  isMultiCountry?: false;
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
  /** Consecutive pushes at the current CPI (max 2 before Same CPI is locked) */
  sameCpiPushCount?: number;
  demographics: AudienceProjectDemographics;
  qualificationNote: string;
  uniqueResponseGroupId?: string;
  uniqueResponseGroupName?: string;
}

export function isMultiCountryProject(
  project: AudienceProjectDetail,
): project is MultiCountryProjectDetail {
  return project.isMultiCountry === true;
}

// Re-export for convenience
export type { MultiCountryProjectDetail };

export const DEFAULT_DEMOGRAPHICS: AudienceProjectDemographics = {
  ageGroups: ['18–24', '25–34', '35–44', '45–54', '55–65'],
  gender: ['Male', 'Female', 'Non-binary / other'],
  education: ['High school', 'Some college', "Bachelor's degree", 'Graduate degree'],
  income: ['Under $35K', '$35K–$75K', '$75K–$150K', 'Over $150K'],
};

export const MOCK_PROJECT_DETAIL: SingleCountryProjectDetail = {
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
  sameCpiPushCount: 0,
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

export function buildAudienceProjectDetail(payload: CreateProjectPayload): SingleCountryProjectDetail {
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
const MULTI_STORAGE_PREFIX = 'multi-country-project:';

export interface CreateMultiCountryPayload {
  name: string;
  countries: CountryDefinition[];
  plans: CountryPlan[];
  globalCriteria: GlobalCriterion[];
  incidenceRate: number;
  surveyLengthMinutes: number;
  completionDate?: Date;
  uniqueResponseGroupId?: string;
  uniqueResponseGroupName?: string;
}

export function buildMultiCountryProject(payload: CreateMultiCountryPayload): MultiCountryProjectDetail {
  const name =
    payload.name.trim() ||
    `Multi-Country Study ${new Date().getFullYear()}`;
  const parentId = generateProjectSlugId();

  return {
    id: parentId,
    projectId: generateProjectId(),
    name,
    isMultiCountry: true,
    status: 'Draft',
    client: 'Horizon Consumer Brands',
    dueDate: formatEstimateDate(payload.completionDate) || 'Aug 15, 2026',
    incidenceRate: payload.incidenceRate,
    surveyLengthMinutes: payload.surveyLengthMinutes,
    uniqueResponseGroupId: payload.uniqueResponseGroupId,
    uniqueResponseGroupName: payload.uniqueResponseGroupName,
    globalCriteria: payload.globalCriteria,
    countries: payload.plans,
    children: payload.plans.map((plan) => ({
      id: `${parentId}-${plan.countryCode.toLowerCase()}`,
      parentId,
      countryCode: plan.countryCode,
      name: slugifyChildName(name, plan.countryCode),
      projectId: `${generateProjectId()}-${plan.countryCode}`,
      status: 'Draft' as const,
      responses: plan.responses,
      collected: 0,
      cpi: plan.cpi,
      totalCost: plan.estimatedCost,
      currentIr: payload.incidenceRate,
      feasibility: plan.feasibility,
      audienceSummary: payload.globalCriteria.slice(0, 3).map((c) => c.label).join(', '),
    })),
  };
}

export function saveAudienceProject(project: SingleCountryProjectDetail): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${STORAGE_PREFIX}${project.id}`, JSON.stringify(project));
}

export function saveMultiCountryProject(project: MultiCountryProjectDetail): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${MULTI_STORAGE_PREFIX}${project.id}`, JSON.stringify(project));
}

export function getAudienceProject(id: string): SingleCountryProjectDetail | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SingleCountryProjectDetail;
  } catch {
    return null;
  }
}

export function getMultiCountryProject(id: string): MultiCountryProjectDetail | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${MULTI_STORAGE_PREFIX}${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MultiCountryProjectDetail;
  } catch {
    return null;
  }
}

export function resolveAudienceProject(id: string): SingleCountryProjectDetail {
  const stored = getAudienceProject(id);
  if (stored) return stored;

  const listProject = MOCK_AUDIENCE_PROJECTS.find((p) => p.id === id);
  if (!listProject) {
    return { ...MOCK_PROJECT_DETAIL, id };
  }

  const statusMap: Record<string, AudienceProjectDetailStatus> = {
    Bid: 'Draft',
    'Soft-launched': 'Live',
    Live: 'Live',
    Paused: 'Paused',
    Closed: 'Closed',
  };
  const status = statusMap[listProject.status] ?? 'Draft';
  const isLiveLike = status === 'Live' || status === 'Paused';

  return {
    ...MOCK_PROJECT_DETAIL,
    id: listProject.id,
    projectId: listProject.projectId,
    name: listProject.name,
    status,
    responses: listProject.completesTarget,
    collected: listProject.completesCurrent,
    costPerInterview: listProject.costPerComplete,
    totalCost: listProject.projectCost,
    sameCpiPushCount: listProject.sameCpiPushCount ?? 0,
    ...(isLiveLike
      ? {
          launchDate: 'Jun 2, 2026',
          etcDate: 'Jun 26, 2026',
          daysElapsed: 8,
          velocityPerHour: 5,
          realtimeIR: listProject.currentIr || 42,
          realtimeLOI: 6.8,
        }
      : {}),
  };
}

export function resolveProject(id: string): AudienceProjectDetail {
  const multi = getMultiCountryProject(id);
  if (multi) return multi;
  if (id === MOCK_MULTI_COUNTRY_PARENT.id) return MOCK_MULTI_COUNTRY_PARENT;
  return resolveAudienceProject(id);
}

export function saveProject(project: AudienceProjectDetail): void {
  if (isMultiCountryProject(project)) {
    saveMultiCountryProject(project);
  } else {
    saveAudienceProject(project);
  }
}
