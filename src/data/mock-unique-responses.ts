import { getLaunchedAudienceProjects, type AudienceProject } from './mock-audience-projects';

export interface UniqueResponseGroup {
  id: string;
  name: string;
  projectIds: string[];
}

export interface UniqueResponseProjectOption {
  value: string;
  label: string;
  status: AudienceProject['status'];
}

export const NONE_UNIQUE_RESPONSE_VALUE = 'none';
export const CREATE_UNIQUE_RESPONSE_VALUE = '__create__';
export const EMPTY_UNIQUE_RESPONSE_VALUE = '__empty__';

const STORAGE_KEY = 'audience-unique-response-groups';

export const DEFAULT_UNIQUE_RESPONSE_GROUPS: UniqueResponseGroup[] = [
  { id: 'urg-1', name: 'Brand Tracking 2026', projectIds: ['ap-003'] },
  { id: 'urg-2', name: 'Concept Testing Q4', projectIds: [] },
  { id: 'urg-3', name: 'Product Research', projectIds: ['ap-004'] },
  { id: 'urg-4', name: 'Customer Experience', projectIds: ['ap-001', 'ap-007'] },
  {
    id: 'urg-5',
    name: 'North America Automotive Concept Screening Wave 2 — 2026',
    projectIds: [],
  },
];

function normalizeGroup(group: UniqueResponseGroup): UniqueResponseGroup | null {
  if (typeof group?.id !== 'string' || typeof group?.name !== 'string' || group.name.trim().length === 0) {
    return null;
  }
  return {
    id: group.id,
    name: group.name,
    projectIds: Array.isArray(group.projectIds)
      ? group.projectIds.filter((id): id is string => typeof id === 'string')
      : [],
  };
}

export function loadUniqueResponseGroups(): UniqueResponseGroup[] {
  if (typeof window === 'undefined') return DEFAULT_UNIQUE_RESPONSE_GROUPS;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_UNIQUE_RESPONSE_GROUPS;
  try {
    const parsed = JSON.parse(raw) as UniqueResponseGroup[];
    if (!Array.isArray(parsed)) return DEFAULT_UNIQUE_RESPONSE_GROUPS;
    const groups = parsed.map(normalizeGroup).filter((group): group is UniqueResponseGroup => Boolean(group));
    return groups.length > 0 ? groups : DEFAULT_UNIQUE_RESPONSE_GROUPS;
  } catch {
    return DEFAULT_UNIQUE_RESPONSE_GROUPS;
  }
}

export function saveUniqueResponseGroups(groups: UniqueResponseGroup[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function isDuplicateUniqueResponseGroupName(
  name: string,
  groups: UniqueResponseGroup[],
): boolean {
  const normalized = name.trim().toLowerCase();
  return groups.some((group) => group.name.trim().toLowerCase() === normalized);
}

export function getLaunchedProjectOptions(): UniqueResponseProjectOption[] {
  return getLaunchedAudienceProjects().map((project) => ({
    value: project.id,
    label: project.name,
    status: project.status,
  }));
}

export function createUniqueResponseGroup(
  name: string,
  existing: UniqueResponseGroup[],
  projectIds: string[] = [],
): UniqueResponseGroup {
  const group: UniqueResponseGroup = {
    id: `urg-${Date.now()}`,
    name: name.trim(),
    projectIds: [...new Set(projectIds)],
  };
  saveUniqueResponseGroups([...existing, group]);
  return group;
}
