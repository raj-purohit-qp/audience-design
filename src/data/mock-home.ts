import { MOCK_AUDIENCE_PROJECTS, formatCurrency } from '@/data/mock-audience-projects';

export interface HomeProductFeature {
  id: string;
  label: string;
}

export interface HomeColumnAction {
  id: string;
  label: string;
  href?: string;
}

export interface HomeFeatureColumn {
  id: string;
  title?: string;
  features: HomeProductFeature[];
  action: HomeColumnAction;
}

export interface HomeProductCard {
  id: 'audience' | 'synthetic';
  eyebrow: string;
  title: string;
  description: string;
  accent: 'blue' | 'purple';
  icon: string;
  features?: HomeProductFeature[];
  featureColumns?: HomeFeatureColumn[];
  actions?: HomeColumnAction[];
}

const AUDIENCE_BULLETS: HomeProductFeature[] = [
  { id: 'a1', label: 'Up to 2,200 targeting criteria' },
  { id: 'a2', label: '240 country/language combinations' },
  { id: 'a3', label: 'Unrestricted question types' },
  { id: 'a4', label: 'Supports all languages' },
];

/** Empty-state Home chooser (no projects yet). */
export const HOME_PRODUCT_CARDS: HomeProductCard[] = [
  {
    id: 'audience',
    eyebrow: 'Real Responses',
    title: 'Audience',
    description: 'Reach real, verified human respondents from a global panel',
    accent: 'blue',
    icon: 'wm-group',
    featureColumns: [
      {
        id: 'specialized',
        title: 'Specialized sample',
        features: AUDIENCE_BULLETS,
        action: { id: 'specialized', label: 'Specialized sample', href: '/projects' },
      },
      {
        id: 'instant',
        title: 'Instant answers',
        features: AUDIENCE_BULLETS,
        action: { id: 'instant', label: 'Instant answers' },
      },
    ],
  },
  {
    id: 'synthetic',
    eyebrow: 'Synthetic Responses',
    title: 'Synthetic Data',
    description: 'Collect AI-powered synthetic responses from your existing data',
    accent: 'purple',
    icon: 'wm-bolt',
    features: [
      { id: 's1', label: 'Instant results' },
      { id: 's2', label: 'Based on your community data' },
      { id: 's3', label: 'Unlimited test iterations' },
      { id: 's4', label: 'Privacy-safe by design' },
    ],
    actions: [{ id: 'explore', label: 'Explore Synthetic Data' }],
  },
];

export type HomeSolution = 'Specialized' | 'Instant' | 'Synthetic';
export type HomeDashboardStatus = 'Bid' | 'Ready' | 'Live' | 'Soft-launched' | 'Paused' | 'Closed';

export interface HomeEntryCard {
  id: 'audience' | 'synthetic';
  title: string;
  eyebrow: string;
  description: string;
  accent: 'blue' | 'purple';
  icon: string;
  actionLabel: string;
  href?: string;
  statLabel: string;
}

export interface HomeRecentProject {
  id: string;
  name: string;
  kind: 'audience' | 'synthetic';
  href?: string;
}

export interface HomeDashboardRow {
  id: string;
  solution: HomeSolution;
  name: string;
  subtitle: string;
  status: HomeDashboardStatus;
  progressPercent: number;
  completesLabel: string;
  totalCostLabel: string;
  lastActive: string;
  href?: string;
}

/** Returning-user Home entry cards. */
export const HOME_ENTRY_CARDS: HomeEntryCard[] = [
  {
    id: 'audience',
    title: 'Audience',
    eyebrow: 'Real Responses',
    description: 'Survey real, verified respondents from a global panel of 10M+',
    accent: 'blue',
    icon: 'wm-group',
    actionLabel: 'Create project',
    href: '/projects/create',
    statLabel: '10 active projects',
  },
  {
    id: 'synthetic',
    title: 'Synthetic Data',
    eyebrow: 'AI-Powered Responses',
    description: 'Instant insights from AI responses based on your community data',
    accent: 'purple',
    icon: 'wm-bolt',
    actionLabel: 'Explore Synthetic',
    statLabel: '6 datasets ready',
  },
];

export const HOME_RECENT_PROJECTS: HomeRecentProject[] = [
  {
    id: 'recent-1',
    name: 'Audience project 1',
    kind: 'audience',
    href: '/projects/ap-002',
  },
  {
    id: 'recent-2',
    name: 'Synthetic Data community fkasjlka',
    kind: 'synthetic',
  },
  {
    id: 'recent-3',
    name: 'Synthetic Data community fkasjlka',
    kind: 'synthetic',
  },
];

export const HOME_DASHBOARD_AUDIENCE_ROWS: HomeDashboardRow[] = [
  {
    id: 'dash-a1',
    solution: 'Specialized',
    name: 'Test 1',
    subtitle: 'QP-M17764',
    status: 'Bid',
    progressPercent: 0,
    completesLabel: '0 of 100',
    totalCostLabel: formatCurrency(206),
    lastActive: '2 days ago',
    href: '/projects/ap-005',
  },
  {
    id: 'dash-a2',
    solution: 'Instant',
    name: 'Brand Tracker Pulse',
    subtitle: 'QP-M17801',
    status: 'Bid',
    progressPercent: 0,
    completesLabel: '0 of 250',
    totalCostLabel: formatCurrency(412.5),
    lastActive: 'Today',
  },
  {
    id: 'dash-a3',
    solution: 'Specialized',
    name: 'Healthcare Benefits — Decision Makers US',
    subtitle: 'QP-W18874',
    status: 'Live',
    progressPercent: 62,
    completesLabel: '310 of 500',
    totalCostLabel: formatCurrency(2075),
    lastActive: 'Today',
    href: '/projects/ap-002',
  },
  {
    id: 'dash-a4',
    solution: 'Specialized',
    name: 'Streaming Subscribers Brand Tracker Wave 2',
    subtitle: 'QP-W18875',
    status: 'Live',
    progressPercent: 12,
    completesLabel: '96 of 800',
    totalCostLabel: formatCurrency(2736),
    lastActive: 'Yesterday',
    href: '/projects/ap-003',
  },
  {
    id: 'dash-a5',
    solution: 'Instant',
    name: 'Quick Pulse — App Store Ratings',
    subtitle: 'QP-M17822',
    status: 'Ready',
    progressPercent: 100,
    completesLabel: '500 of 500',
    totalCostLabel: formatCurrency(890),
    lastActive: '3 days ago',
  },
];

export const HOME_DASHBOARD_SYNTHETIC_ROWS: HomeDashboardRow[] = [
  {
    id: 'dash-s1',
    solution: 'Synthetic',
    name: 'Synthetic Data community fkasjlka',
    subtitle: 'Synthetic',
    status: 'Ready',
    progressPercent: 100,
    completesLabel: '28,431',
    totalCostLabel: '—',
    lastActive: 'Today',
  },
  {
    id: 'dash-s2',
    solution: 'Synthetic',
    name: 'Synthetic Data community fkasjlka',
    subtitle: 'Synthetic',
    status: 'Ready',
    progressPercent: 72,
    completesLabel: '12,804',
    totalCostLabel: '—',
    lastActive: 'Yesterday',
  },
  {
    id: 'dash-s3',
    solution: 'Synthetic',
    name: 'Community cohort — early adopters',
    subtitle: 'Synthetic',
    status: 'Bid',
    progressPercent: 0,
    completesLabel: '0',
    totalCostLabel: '—',
    lastActive: '5 days ago',
  },
];

const SESSION_CREATED_KEY = 'audience-has-created-project';
/** Set to `1` in sessionStorage to force the empty-state chooser for demos. */
const SESSION_FORCE_EMPTY_KEY = 'audience-empty-home';

/**
 * Dashboard Home when the account has any projects (seed list counts).
 * Force empty chooser: sessionStorage `audience-empty-home=1`.
 */
export function hasCreatedAudienceProjects(): boolean {
  if (typeof window === 'undefined') {
    return MOCK_AUDIENCE_PROJECTS.length > 0;
  }
  if (window.sessionStorage.getItem(SESSION_FORCE_EMPTY_KEY) === '1') {
    return false;
  }
  if (window.sessionStorage.getItem(SESSION_CREATED_KEY) === '1') {
    return true;
  }
  return MOCK_AUDIENCE_PROJECTS.length > 0;
}

/** @deprecated Prefer hasCreatedAudienceProjects */
export function hasLaunchedAudienceProjects(): boolean {
  return hasCreatedAudienceProjects();
}

export function markAudienceProjectLaunched(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(SESSION_CREATED_KEY, '1');
  window.sessionStorage.removeItem(SESSION_FORCE_EMPTY_KEY);
}

export function markAudienceProjectCreated(): void {
  markAudienceProjectLaunched();
}

export function isLaunchedStatus(status: string): boolean {
  return ['Live', 'Soft-launched', 'Paused', 'Closed'].includes(status);
}
