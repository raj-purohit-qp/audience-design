export type AudienceProjectStatus =
  | 'Bid'
  | 'Paused'
  | 'Soft-launched'
  | 'Live'
  | 'Closed';

export type AudienceProjectType = 'audience' | 'tracker';

export interface AudienceProject {
  id: string;
  projectId: string;
  name: string;
  type: AudienceProjectType;
  status: AudienceProjectStatus;
  progressPercent: number;
  completesCurrent: number;
  completesTarget: number;
  costPerComplete: number;
  currentIr: number;
  currentCost: number;
  projectCost: number;
  /** Consecutive pushes at the current CPI (max 2 before Same CPI is locked) */
  sameCpiPushCount?: number;
}

/** Minimum CPI when pushing at a higher rate (current CPI + 10%) */
export function minHigherPushCpi(currentCpi: number): number {
  return Number((currentCpi * 1.1).toFixed(2));
}

export function canPushAtSameCpi(sameCpiPushCount = 0): boolean {
  return sameCpiPushCount < 2;
}

/** Closed projects that already have reconciled responses (Case B default). */
export const SEEDED_RECONCILED_RESPONSES: Record<string, number> = {
  'ap-001': 50,
};

export function getSeededReconciledResponses(projectId: string): number {
  return SEEDED_RECONCILED_RESPONSES[projectId] ?? 0;
}

/**
 * Default Top-up quantity for a Closed project.
 * Reconciled responses take priority over 20% of original required.
 */
export function defaultTopUpQuantity(
  originalRequiredResponses: number,
  reconciledResponses = 0,
): number {
  if (reconciledResponses > 0) return reconciledResponses;
  return Math.round(originalRequiredResponses * 0.2);
}

export function topUpDefaultHelperText(
  originalRequiredResponses: number,
  reconciledResponses = 0,
): string {
  if (reconciledResponses > 0) {
    return `Default matches reconciled responses (${reconciledResponses.toLocaleString()}). Reconciled count takes priority over the 20% rule.`;
  }
  const qty = defaultTopUpQuantity(originalRequiredResponses, 0);
  return `Default is 20% of original required responses (${originalRequiredResponses.toLocaleString()} × 20% = ${qty.toLocaleString()}). You can edit this value.`;
}

export type PushCpiMode = 'same' | 'higher';

export interface PushProjectResult {
  mode: PushCpiMode;
  cpi: number;
}

export const CREDIT_BALANCE = 11017;

export const MOCK_AUDIENCE_PROJECTS: AudienceProject[] = [
  {
    id: 'ap-001',
    projectId: 'QP-W18873',
    name: 'US Customer Experience Study Q2 2026',
    type: 'audience',
    status: 'Closed',
    progressPercent: 100,
    completesCurrent: 500,
    completesTarget: 500,
    costPerComplete: 3.5,
    currentIr: 42,
    currentCost: 1750.0,
    projectCost: 1750.0,
  },
  {
    id: 'ap-002',
    projectId: 'QP-W18874',
    name: 'Healthcare Benefits — Decision Makers US',
    type: 'audience',
    status: 'Live',
    progressPercent: 62,
    completesCurrent: 310,
    completesTarget: 500,
    costPerComplete: 4.15,
    currentIr: 38,
    currentCost: 1286.5,
    projectCost: 2075.0,
    sameCpiPushCount: 0,
  },
  {
    id: 'ap-003',
    projectId: 'QP-W18875',
    name: 'Streaming Subscribers Brand Tracker Wave 2',
    type: 'audience',
    status: 'Soft-launched',
    progressPercent: 12,
    completesCurrent: 96,
    completesTarget: 800,
    costPerComplete: 3.42,
    currentIr: 51,
    currentCost: 328.32,
    projectCost: 2736.0,
  },
  {
    id: 'ap-004',
    projectId: 'QP-W18876',
    name: 'Auto Insurance Shoppers — National Panel',
    type: 'audience',
    status: 'Paused',
    progressPercent: 34,
    completesCurrent: 170,
    completesTarget: 500,
    costPerComplete: 5.2,
    currentIr: 29,
    currentCost: 884.0,
    projectCost: 2600.0,
  },
  {
    id: 'ap-005',
    projectId: 'QP-W18877',
    name: 'SMB Payroll Software Evaluation',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 350,
    costPerComplete: 6.75,
    currentIr: 0,
    currentCost: 0,
    projectCost: 2362.5,
  },
  {
    id: 'ap-006',
    projectId: 'QP-W18878',
    name: 'Gamers — Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 100,
    completesCurrent: 50,
    completesTarget: 50,
    costPerComplete: 2.78,
    currentIr: 55,
    currentCost: 139.0,
    projectCost: 139.0,
  },
  {
    id: 'ap-007',
    projectId: 'QP-W18879',
    name: 'Retail Banking Mobile App UX',
    type: 'audience',
    status: 'Live',
    progressPercent: 78,
    completesCurrent: 390,
    completesTarget: 500,
    costPerComplete: 3.9,
    currentIr: 44,
    currentCost: 1521.0,
    projectCost: 1950.0,
    sameCpiPushCount: 2,
  },
  {
    id: 'ap-008',
    projectId: 'QP-W18880',
    name: 'CPG Snacking Habits — Gen Z',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 600,
    costPerComplete: 2.95,
    currentIr: 0,
    currentCost: 0,
    projectCost: 1770.0,
  },
  {
    id: 'ap-009',
    projectId: 'QP-W18881',
    name: 'Enterprise IT Security Decision Makers',
    type: 'audience',
    status: 'Soft-launched',
    progressPercent: 8,
    completesCurrent: 40,
    completesTarget: 500,
    costPerComplete: 8.5,
    currentIr: 22,
    currentCost: 340.0,
    projectCost: 4250.0,
  },
  {
    id: 'ap-010',
    projectId: 'QP-W18882',
    name: 'Travel Loyalty Program Satisfaction',
    type: 'audience',
    status: 'Paused',
    progressPercent: 45,
    completesCurrent: 225,
    completesTarget: 500,
    costPerComplete: 4.6,
    currentIr: 36,
    currentCost: 1035.0,
    projectCost: 2300.0,
  },
  {
    id: 'ap-011',
    projectId: 'QP-W18883',
    name: 'Telehealth Adoption — Medicare Beneficiaries',
    type: 'audience',
    status: 'Live',
    progressPercent: 91,
    completesCurrent: 455,
    completesTarget: 500,
    costPerComplete: 5.85,
    currentIr: 47,
    currentCost: 2661.75,
    projectCost: 2925.0,
    sameCpiPushCount: 1,
  },
  {
    id: 'ap-012',
    projectId: 'QP-W18884',
    name: 'EV Purchase Intent — California Households with Very Long Project Title for Truncation Testing',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 400,
    costPerComplete: 4.25,
    currentIr: 0,
    currentCost: 0,
    projectCost: 1700.0,
  },
];

export function formatCurrency(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return `${value}%`;
}

/** Projects that have already been launched (not still in Bid). */
export function isLaunchedAudienceProject(project: AudienceProject): boolean {
  return project.status !== 'Bid';
}

export function getLaunchedAudienceProjects(): AudienceProject[] {
  return MOCK_AUDIENCE_PROJECTS.filter(isLaunchedAudienceProject);
}
