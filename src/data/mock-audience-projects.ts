export type AudienceProjectStatus = 'Closed' | 'Bid' | 'Live' | 'Draft';

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
  totalCost: number;
}

export const CREDIT_BALANCE = 11017;

export const MOCK_AUDIENCE_PROJECTS: AudienceProject[] = [
  {
    id: 'ap-001',
    projectId: 'QP-W18873',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-002',
    projectId: 'QP-W18874',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-003',
    projectId: 'QP-W18875',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-004',
    projectId: 'QP-W18876',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-005',
    projectId: 'QP-W18877',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-006',
    projectId: 'QP-W18878',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-007',
    projectId: 'QP-W18879',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Closed',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-008',
    projectId: 'QP-W18880',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-009',
    projectId: 'QP-W18881',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-010',
    projectId: 'QP-W18882',
    name: 'Gamers - Xbox UK',
    type: 'audience',
    status: 'Bid',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 50,
    costPerComplete: 2.78,
    totalCost: 139.0,
  },
  {
    id: 'ap-011',
    projectId: 'QP-W18883',
    name: 'Healthcare Benefits — Decision Makers US',
    type: 'audience',
    status: 'Live',
    progressPercent: 62,
    completesCurrent: 310,
    completesTarget: 500,
    costPerComplete: 4.15,
    totalCost: 2075.0,
  },
  {
    id: 'ap-012',
    projectId: 'QP-W18884',
    name: 'Streaming Subscribers Brand Tracker Wave 2 with Extended Demographic Quotas',
    type: 'audience',
    status: 'Draft',
    progressPercent: 0,
    completesCurrent: 0,
    completesTarget: 800,
    costPerComplete: 3.42,
    totalCost: 2736.0,
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
