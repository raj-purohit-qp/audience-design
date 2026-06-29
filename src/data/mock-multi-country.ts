import type { CountryOption } from './mock-project-create';

// ─────────────────────────────────────────────────────────────
//  Multi-Country Launch — mock data & helpers
// ─────────────────────────────────────────────────────────────

export type CountrySetupStatus = 'ready' | 'needs_setup' | 'missing_criteria';
export type FeasibilityLevel = 'high' | 'medium' | 'low' | 'failed';

export interface CountryDefinition extends CountryOption {
  region: string;
  cpi: number;
  qualificationCategories: string[];
  /** Qualification IDs not available in this country */
  unavailableQualificationIds: string[];
}

export interface GlobalCriterion {
  id: string;
  label: string;
  value: string;
  category: string;
}

export interface CountryOverride {
  criterionId: string;
  value: string;
}

export interface QualificationIssue {
  criterionId: string;
  criterionLabel: string;
  type: 'unavailable' | 'feasibility';
  message: string;
}

export interface CountryPlan {
  countryCode: string;
  responses: number;
  cpi: number;
  estimatedCost: number;
  setupStatus: CountrySetupStatus;
  feasibility: FeasibilityLevel;
  configured: boolean;
  overrides: CountryOverride[];
  unresolvedIssues: QualificationIssue[];
}

export interface ChildCountryProject {
  id: string;
  parentId: string;
  countryCode: string;
  name: string;
  projectId: string;
  status: 'Draft' | 'Live' | 'Paused' | 'Closed';
  responses: number;
  collected: number;
  cpi: number;
  totalCost: number;
  feasibility: FeasibilityLevel;
  audienceSummary: string;
}

export interface MultiCountryProjectDetail {
  id: string;
  projectId: string;
  name: string;
  isMultiCountry: true;
  status: 'Draft' | 'Live' | 'Paused' | 'Closed';
  client: string;
  dueDate: string;
  launchDate?: string;
  incidenceRate: number;
  surveyLengthMinutes: number;
  globalCriteria: GlobalCriterion[];
  countries: CountryPlan[];
  children: ChildCountryProject[];
}

export const GLOBAL_CRITERIA: GlobalCriterion[] = [
  { id: 'age', label: 'Age range', value: '18–65', category: 'Demographics' },
  { id: 'gender', label: 'Gender', value: 'Male / Female', category: 'Demographics' },
  { id: 'car_ownership', label: 'Car ownership', value: 'Yes', category: 'Automotive' },
  { id: 'political', label: 'Political affiliation', value: 'All parties', category: 'Demographics' },
  { id: 'employment', label: 'Employment status', value: 'Full-time employed', category: 'B2B' },
];

export const MULTI_COUNTRY_CATALOG: CountryDefinition[] = [
  {
    value: 'US',
    label: 'United States',
    flag: '🇺🇸',
    region: 'North America',
    cpi: 3.2,
    qualificationCategories: ['Demographics', 'Political Affiliation', 'Healthcare', 'Financial Services', 'Automotive'],
    unavailableQualificationIds: [],
  },
  {
    value: 'CA',
    label: 'Canada',
    flag: '🇨🇦',
    region: 'North America',
    cpi: 3.45,
    qualificationCategories: ['Demographics', 'Healthcare', 'Financial Services', 'Automotive'],
    unavailableQualificationIds: ['political'],
  },
  {
    value: 'GB',
    label: 'United Kingdom',
    flag: '🇬🇧',
    region: 'Europe',
    cpi: 4.1,
    qualificationCategories: ['Demographics', 'B2B', 'Healthcare', 'Financial Services'],
    unavailableQualificationIds: ['political'],
  },
  {
    value: 'DE',
    label: 'Germany',
    flag: '🇩🇪',
    region: 'Europe',
    cpi: 5.5,
    qualificationCategories: ['Demographics', 'B2B', 'Automotive', 'Healthcare'],
    unavailableQualificationIds: ['political'],
  },
  {
    value: 'IN',
    label: 'India',
    flag: '🇮🇳',
    region: 'APAC',
    cpi: 1.66,
    qualificationCategories: ['Demographics', 'Education', 'Mobile Usage', 'Household Income'],
    unavailableQualificationIds: ['political', 'car_ownership'],
  },
  {
    value: 'AU',
    label: 'Australia',
    flag: '🇦🇺',
    region: 'APAC',
    cpi: 3.85,
    qualificationCategories: ['Demographics', 'Healthcare', 'Financial Services'],
    unavailableQualificationIds: ['political'],
  },
  {
    value: 'FR',
    label: 'France',
    flag: '🇫🇷',
    region: 'Europe',
    cpi: 4.75,
    qualificationCategories: ['Demographics', 'B2B', 'Automotive', 'Healthcare'],
    unavailableQualificationIds: ['political'],
  },
  {
    value: 'JP',
    label: 'Japan',
    flag: '🇯🇵',
    region: 'APAC',
    cpi: 5.2,
    qualificationCategories: ['Demographics', 'B2B', 'Technology', 'Healthcare'],
    unavailableQualificationIds: ['political'],
  },
];

export function getCountryByCode(code: string): CountryDefinition | undefined {
  return MULTI_COUNTRY_CATALOG.find((c) => c.value === code);
}

export function calculateCountryCost(responses: number, cpi: number): number {
  return Number((responses * cpi).toFixed(2));
}

export function buildInitialCountryPlans(
  countryCodes: string[],
  responsesPerCountry: number,
): CountryPlan[] {
  return countryCodes.map((code) => {
    const country = getCountryByCode(code)!;
    const issues = detectQualificationIssues(code, GLOBAL_CRITERIA);
    const hasIssues = issues.length > 0;
    return {
      countryCode: code,
      responses: responsesPerCountry,
      cpi: country.cpi,
      estimatedCost: calculateCountryCost(responsesPerCountry, country.cpi),
      setupStatus: hasIssues ? 'missing_criteria' : 'needs_setup',
      feasibility: 'high' as FeasibilityLevel,
      configured: false,
      overrides: [],
      unresolvedIssues: issues,
    };
  });
}

export function detectQualificationIssues(
  countryCode: string,
  criteria: GlobalCriterion[],
): QualificationIssue[] {
  const country = getCountryByCode(countryCode);
  if (!country) return [];

  return criteria
    .filter((c) => country.unavailableQualificationIds.includes(c.id))
    .map((c) => ({
      criterionId: c.id,
      criterionLabel: c.label,
      type: 'unavailable' as const,
      message: `${c.label} is not available in ${country.label}.`,
    }));
}

export function getSetupStatusLabel(status: CountrySetupStatus): string {
  const map: Record<CountrySetupStatus, string> = {
    ready: 'Ready',
    needs_setup: 'Needs setup',
    missing_criteria: 'Missing criteria',
  };
  return map[status];
}

export function getFeasibilityLabel(level: FeasibilityLevel): string {
  const map: Record<FeasibilityLevel, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    failed: 'Failed',
  };
  return map[level];
}

export function summarizeProjectCost(plans: CountryPlan[]): {
  totalResponses: number;
  totalCost: number;
  countryCount: number;
} {
  return {
    totalResponses: plans.reduce((s, p) => s + p.responses, 0),
    totalCost: plans.reduce((s, p) => s + p.estimatedCost, 0),
    countryCount: plans.length,
  };
}

export function canLaunch(plans: CountryPlan[]): boolean {
  return (
    plans.length > 0 &&
    plans.every(
      (p) =>
        p.configured &&
        p.setupStatus === 'ready' &&
        p.unresolvedIssues.length === 0 &&
        p.feasibility !== 'failed',
    )
  );
}

export function slugifyChildName(parentName: string, countryCode: string): string {
  const base = parentName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  return `${base}_${countryCode}`;
}

/** Demo parent project for dashboard grouped view */
export const MOCK_MULTI_COUNTRY_PARENT: MultiCountryProjectDetail = {
  id: 'mc-parent-001',
  projectId: 'QP-MC2401',
  name: 'Brand Tracker 2026',
  isMultiCountry: true,
  status: 'Live',
  client: 'Horizon Consumer Brands',
  dueDate: 'Aug 15, 2026',
  launchDate: 'Jun 1, 2026',
  incidenceRate: 45,
  surveyLengthMinutes: 12,
  globalCriteria: GLOBAL_CRITERIA,
  countries: [
    { countryCode: 'US', responses: 500, cpi: 3.2, estimatedCost: 1600, setupStatus: 'ready', feasibility: 'high', configured: true, overrides: [], unresolvedIssues: [] },
    { countryCode: 'GB', responses: 500, cpi: 4.1, estimatedCost: 2050, setupStatus: 'ready', feasibility: 'high', configured: true, overrides: [], unresolvedIssues: [] },
    { countryCode: 'DE', responses: 500, cpi: 5.5, estimatedCost: 2750, setupStatus: 'ready', feasibility: 'high', configured: true, overrides: [{ criterionId: 'age', value: '25–65' }], unresolvedIssues: [] },
    { countryCode: 'IN', responses: 500, cpi: 1.66, estimatedCost: 830, setupStatus: 'ready', feasibility: 'high', configured: true, overrides: [], unresolvedIssues: [] },
  ],
  children: [
    { id: 'mc-child-us', parentId: 'mc-parent-001', countryCode: 'US', name: 'BrandTracker_US', projectId: 'QP-MC2401-US', status: 'Live', responses: 500, collected: 340, cpi: 3.2, totalCost: 1600, feasibility: 'high', audienceSummary: 'Age 18–65, Male/Female, Car owners' },
    { id: 'mc-child-gb', parentId: 'mc-parent-001', countryCode: 'GB', name: 'BrandTracker_UK', projectId: 'QP-MC2401-UK', status: 'Live', responses: 500, collected: 312, cpi: 4.1, totalCost: 2050, feasibility: 'high', audienceSummary: 'Age 18–65, Male/Female, Car owners' },
    { id: 'mc-child-de', parentId: 'mc-parent-001', countryCode: 'DE', name: 'BrandTracker_DE', projectId: 'QP-MC2401-DE', status: 'Live', responses: 500, collected: 298, cpi: 5.5, totalCost: 2750, feasibility: 'high', audienceSummary: 'Age 25–65 override, Male/Female, Car owners' },
    { id: 'mc-child-in', parentId: 'mc-parent-001', countryCode: 'IN', name: 'BrandTracker_IN', projectId: 'QP-MC2401-IN', status: 'Live', responses: 500, collected: 276, cpi: 1.66, totalCost: 830, feasibility: 'high', audienceSummary: 'Age 18–65, Male/Female' },
  ],
};

export const DASHBOARD_REGIONS = ['All regions', 'North America', 'Europe', 'APAC'] as const;
