import type { CountryOption } from './mock-project-create';
import { calculateEstimate, formatEstimateDate } from './mock-project-create';
import type {
  ChildCountryProject,
  CountryDefinition,
  CountryPlan,
  GlobalCriterion,
  MultiCountryProjectDetail,
} from './mock-multi-country';
import {
  MOCK_MULTI_COUNTRY_PARENT,
  slugifyChildName,
} from './mock-multi-country';
import { getSeededReconciledResponses, MOCK_AUDIENCE_PROJECTS } from './mock-audience-projects';
import type { UniqueResponseProjectRef } from './mock-unique-responses';

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
  /** Required responses when the project first closed — used for the 20% Top-up default */
  originalRequiredResponses?: number;
  /** Approved/submitted reconciled response count — takes priority for Top-up default */
  reconciledResponses?: number;
  uniqueResponseProjects?: UniqueResponseProjectRef[];
  demographics: AudienceProjectDemographics;
  /** Optional balancing quotas for selected gender values */
  genderQuotas?: Record<string, number>;
  topUpOfProjectId?: string;
  topUpOfProjectName?: string;
  /** Child top-up projects launched from this parent */
  topUpChildren?: TopUpChildRef[];
  qualificationNote: string;
}

export interface TopUpChildRef {
  id: string;
  name: string;
  projectId: string;
  status: AudienceProjectDetailStatus;
  responses: number;
  collected: number;
  costPerInterview: number;
  totalCost: number;
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
  originalRequiredResponses: 1500,
  reconciledResponses: 0,
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
  demographics?: AudienceProjectDemographics;
  genderQuotas?: Record<string, number>;
  uniqueResponseProjects?: UniqueResponseProjectRef[];
  topUpOfProjectId?: string;
  topUpOfProjectName?: string;
  status?: AudienceProjectDetailStatus;
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
    originalRequiredResponses: payload.responses,
    reconciledResponses: 0,
    demographics: payload.demographics ?? DEFAULT_DEMOGRAPHICS,
    genderQuotas: payload.genderQuotas,
    uniqueResponseProjects: payload.uniqueResponseProjects,
    topUpOfProjectId: payload.topUpOfProjectId,
    topUpOfProjectName: payload.topUpOfProjectName,
    qualificationNote: MOCK_PROJECT_DETAIL.qualificationNote,
    ...(payload.status === 'Live'
      ? {
          status: 'Live' as const,
          launchDate: formatEstimateDate(payload.completionDate) || 'Jun 2, 2026',
          etcDate: formatEstimateDate(payload.completionDate) || 'Jun 26, 2026',
          daysElapsed: 0,
          velocityPerHour: 5,
          realtimeIR: payload.incidenceRate,
          realtimeLOI: payload.surveyLengthMinutes,
        }
      : {}),
  };
}

const STORAGE_PREFIX = 'audience-project:';
const MULTI_STORAGE_PREFIX = 'multi-country-project:';
const TOP_UP_NAME_SUFFIX = / Topup(\d+)$/;

export function listStoredAudienceProjects(): SingleCountryProjectDetail[] {
  if (typeof window === 'undefined') return [];
  const items: SingleCountryProjectDetail[] = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(STORAGE_PREFIX)) continue;
    try {
      items.push(JSON.parse(sessionStorage.getItem(key) ?? '') as SingleCountryProjectDetail);
    } catch {
      /* ignore malformed entries */
    }
  }
  return items;
}

function listStoredProjectNames(): string[] {
  if (typeof window === 'undefined') return [];
  const names = listStoredAudienceProjects().map((project) => project.name);
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (!key?.startsWith(MULTI_STORAGE_PREFIX)) continue;
    try {
      const parsed = JSON.parse(sessionStorage.getItem(key) ?? '') as MultiCountryProjectDetail;
      if (parsed.name) names.push(parsed.name);
      parsed.children?.forEach((child) => names.push(child.name));
    } catch {
      /* ignore malformed entries */
    }
  }
  MOCK_MULTI_COUNTRY_PARENT.children.forEach((child) => names.push(child.name));
  return names;
}

function topUpNameIsTaken(
  candidate: string,
  taken: Set<string>,
  countryCode?: string,
): boolean {
  if (taken.has(candidate)) return true;
  const slugBase = candidate.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  const suffix = countryCode ? `_${countryCode}` : '_';
  for (const name of taken) {
    if (name.startsWith(`${slugBase}${suffix}`)) return true;
  }
  return false;
}

/** `{original} Topup1`, then Topup2 if that name is already used. */
export function nextTopUpProjectName(sourceName: string, countryCode?: string): string {
  const base = sourceName.replace(TOP_UP_NAME_SUFFIX, '');
  const taken = new Set<string>([
    ...MOCK_AUDIENCE_PROJECTS.map((project) => project.name),
    ...listStoredProjectNames(),
  ]);
  let index = 1;
  let candidate = `${base} Topup${index}`;
  while (topUpNameIsTaken(candidate, taken, countryCode)) {
    index += 1;
    candidate = `${base} Topup${index}`;
  }
  return candidate;
}

export interface CreateMultiCountryPayload {
  name: string;
  countries: CountryDefinition[];
  plans: CountryPlan[];
  globalCriteria: GlobalCriterion[];
  incidenceRate: number;
  surveyLengthMinutes: number;
  completionDate?: Date;
  uniqueResponseProjects?: UniqueResponseProjectRef[];
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
    uniqueResponseProjects: payload.uniqueResponseProjects,
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
  const isLiveLike = status === 'Live' || status === 'Paused' || status === 'Closed';

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
    originalRequiredResponses: listProject.completesTarget,
    reconciledResponses: getSeededReconciledResponses(listProject.id),
    ...(listProject.id === 'ap-001'
      ? {
          demographics: {
            ...DEFAULT_DEMOGRAPHICS,
            gender: ['Male', 'Female'],
          },
        }
      : {}),
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

/** Attach a launched top-up as a child of the original project and increase the parent target. */
export function attachTopUpChild(
  parent: SingleCountryProjectDetail,
  child: SingleCountryProjectDetail,
): { parent: SingleCountryProjectDetail; child: SingleCountryProjectDetail } {
  const linkedChild: SingleCountryProjectDetail = {
    ...child,
    status: 'Live',
    topUpOfProjectId: parent.id,
    topUpOfProjectName: parent.name,
  };
  const childRef: TopUpChildRef = {
    id: linkedChild.id,
    name: linkedChild.name,
    projectId: linkedChild.projectId,
    status: linkedChild.status,
    responses: linkedChild.responses,
    collected: linkedChild.collected,
    costPerInterview: linkedChild.costPerInterview,
    totalCost: linkedChild.totalCost,
  };
  const nextParent: SingleCountryProjectDetail = {
    ...parent,
    status: 'Closed',
    originalRequiredResponses: parent.originalRequiredResponses ?? parent.responses,
    responses: parent.responses + linkedChild.responses,
    totalCost: Number((parent.totalCost + linkedChild.totalCost).toFixed(2)),
    topUpChildren: [...(parent.topUpChildren ?? []), childRef],
  };
  saveAudienceProject(nextParent);
  saveAudienceProject(linkedChild);
  return { parent: nextParent, child: linkedChild };
}

function audienceSummaryFromDemographics(demographics: AudienceProjectDemographics): string {
  const gender = demographics.gender.join('/');
  const age =
    demographics.ageGroups.length > 0
      ? `${demographics.ageGroups[0]}–${demographics.ageGroups[demographics.ageGroups.length - 1]}`
      : '';
  return [age, gender].filter(Boolean).join(', ');
}

export function demographicsFromGlobalCriteria(
  criteria: GlobalCriterion[],
): AudienceProjectDemographics {
  const genderValue = criteria.find((item) => item.id === 'gender')?.value ?? 'Male / Female';
  const gender = genderValue
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    ...DEFAULT_DEMOGRAPHICS,
    gender: gender.length > 0 ? gender : DEFAULT_DEMOGRAPHICS.gender,
  };
}

export function perCountryRequiredResponses(project: MultiCountryProjectDetail): number {
  if (project.originalRequiredResponses && project.originalRequiredResponses > 0) {
    return project.originalRequiredResponses;
  }
  if (project.countries.length > 0) {
    return Math.round(
      project.countries.reduce((sum, plan) => sum + plan.responses, 0) / project.countries.length,
    );
  }
  if (project.children.length === 0) return 0;
  return Math.round(
    project.children.reduce((sum, child) => sum + child.responses, 0) / project.children.length,
  );
}

export function countryOriginalRequired(
  project: MultiCountryProjectDetail,
  countryCode: string,
): number {
  const original = project.children.find(
    (child) => child.countryCode === countryCode && !child.id.includes('-topup-'),
  );
  if (original) return original.responses;
  const plan = project.countries.find((item) => item.countryCode === countryCode);
  return plan?.responses ?? perCountryRequiredResponses(project);
}

/** Add a Live top-up child for one country under a closed multi-country parent. */
export function attachMultiCountryTopUp(
  parent: MultiCountryProjectDetail,
  payload: {
    name: string;
    countryCode: string;
    responses: number;
    incidenceRate: number;
    surveyLengthMinutes: number;
    demographics?: AudienceProjectDemographics;
  },
): MultiCountryProjectDetail {
  const plan = parent.countries.find((item) => item.countryCode === payload.countryCode);
  if (!plan) return parent;

  const originalChild = parent.children.find(
    (child) => child.countryCode === payload.countryCode && !child.id.includes('-topup-'),
  );
  const summary = payload.demographics
    ? audienceSummaryFromDemographics(payload.demographics)
    : originalChild?.audienceSummary ??
      parent.globalCriteria.slice(0, 3).map((c) => c.label).join(', ');

  const newChild: ChildCountryProject = {
    id: `${parent.id}-topup-${Date.now()}-${plan.countryCode.toLowerCase()}`,
    parentId: parent.id,
    countryCode: plan.countryCode,
    name: slugifyChildName(payload.name, plan.countryCode),
    projectId: `QP-MC${Math.floor(1000 + Math.random() * 9000)}-${plan.countryCode}`,
    status: 'Live',
    responses: payload.responses,
    collected: 0,
    cpi: plan.cpi,
    totalCost: Number((plan.cpi * payload.responses).toFixed(2)),
    currentIr: payload.incidenceRate,
    feasibility: plan.feasibility,
    audienceSummary: summary,
  };

  const nextParent: MultiCountryProjectDetail = {
    ...parent,
    status: 'Closed',
    originalRequiredResponses: parent.originalRequiredResponses ?? perCountryRequiredResponses(parent),
    children: [...parent.children, newChild],
  };
  saveMultiCountryProject(nextParent);
  return nextParent;
}
