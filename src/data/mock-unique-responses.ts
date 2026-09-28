import {
  getLaunchedAudienceProjects,
  MOCK_AUDIENCE_PROJECTS,
} from './mock-audience-projects';
import { MOCK_MULTI_COUNTRY_PARENT } from './mock-multi-country';

export interface UniqueResponseGroup {
  id: string;
  name: string;
  description?: string;
  projectIds: string[];
}

export interface UniqueResponseProjectOption {
  value: string;
  label: string;
  status: string;
}

export interface WaveGroupAssociatedProject {
  id: string;
  projectId: string;
  name: string;
  status: string;
  href: string;
}

export const NONE_UNIQUE_RESPONSE_VALUE = 'none';
export const CREATE_UNIQUE_RESPONSE_VALUE = '__create__';
export const EMPTY_UNIQUE_RESPONSE_VALUE = '__empty__';

const STORAGE_KEY = 'audience-wave-groups-v1';
const AUDIENCE_PROJECT_STORAGE_PREFIX = 'audience-project:';
const MULTI_COUNTRY_PROJECT_STORAGE_PREFIX = 'multi-country-project:';

export const DEFAULT_UNIQUE_RESPONSE_GROUPS: UniqueResponseGroup[] = [
  {
    id: 'urg-1',
    name: 'Brand Tracking 2026',
    description: 'Ongoing brand-health waves. Respondents who complete one wave cannot enter another in this group.',
    projectIds: ['ap-003', 'mc-parent-001'],
  },
  {
    id: 'urg-2',
    name: 'Concept Testing Q4',
    description: 'Concept screens for Q4 product launches. No projects assigned yet.',
    projectIds: [],
  },
  {
    id: 'urg-3',
    name: 'Product Research',
    description: 'Core product research studies that must not share respondents.',
    projectIds: ['ap-004'],
  },
  {
    id: 'urg-4',
    name: 'Customer Experience',
    description: 'CX and retail banking studies run as unique-respondent waves.',
    projectIds: ['ap-001', 'ap-007'],
  },
  {
    id: 'urg-5',
    name: 'North America Automotive Concept Screening Wave 2 — 2026',
    projectIds: [],
  },
  {
    id: 'urg-6',
    name: 'Healthcare Decision Makers',
    description: 'Benefits and telehealth studies among US healthcare decision makers.',
    projectIds: ['ap-002'],
  },
  {
    id: 'urg-7',
    name: 'Travel Loyalty Insights',
    description: 'Loyalty program satisfaction waves for travel brands.',
    projectIds: ['ap-010'],
  },
  {
    id: 'urg-8',
    name: 'Enterprise Security Panel',
    description: 'IT security decision-maker studies. Keep respondents unique across security topics.',
    projectIds: ['ap-009'],
  },
  {
    id: 'urg-9',
    name: 'Telehealth Wave 1',
    description:
      'Medicare telehealth adoption and related healthcare access studies. Use this group when a later wave should exclude anyone who already completed Wave 1 or the companion UK gaming closed study.',
    projectIds: ['ap-011', 'ap-006'],
  },
  {
    id: 'urg-10',
    name: 'CPG Snacking Habits',
    description: 'Gen Z snacking studies reserved for unique-respondent fieldwork.',
    projectIds: [],
  },
];

function normalizeGroup(group: UniqueResponseGroup): UniqueResponseGroup | null {
  if (typeof group?.id !== 'string' || typeof group?.name !== 'string' || group.name.trim().length === 0) {
    return null;
  }
  const description =
    typeof group.description === 'string' ? group.description.trim() : undefined;
  return {
    id: group.id,
    name: group.name,
    ...(description ? { description } : {}),
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

export function getUniqueResponseGroupById(
  id: string,
  groups: UniqueResponseGroup[] = loadUniqueResponseGroups(),
): UniqueResponseGroup | undefined {
  return groups.find((group) => group.id === id);
}

export function isDuplicateUniqueResponseGroupName(
  name: string,
  groups: UniqueResponseGroup[],
  excludeId?: string,
): boolean {
  const normalized = name.trim().toLowerCase();
  return groups.some(
    (group) => group.id !== excludeId && group.name.trim().toLowerCase() === normalized,
  );
}

export function getLaunchedProjectOptions(): UniqueResponseProjectOption[] {
  return getLaunchedAudienceProjects().map((project) => ({
    value: project.id,
    label: project.name,
    status: project.status,
  }));
}

function exclusiveProjectIds(
  groups: UniqueResponseGroup[],
  groupId: string,
  projectIds: string[],
): UniqueResponseGroup[] {
  const exclusive = [...new Set(projectIds)];
  return groups.map((group) => {
    const withoutMoved = group.projectIds.filter((id) => !exclusive.includes(id));
    if (group.id !== groupId) {
      return { ...group, projectIds: withoutMoved };
    }
    return { ...group, projectIds: [...new Set([...withoutMoved, ...exclusive])] };
  });
}

function rewriteStoredProjects(
  mutate: (project: Record<string, unknown>) => Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (
      !key ||
      (!key.startsWith(AUDIENCE_PROJECT_STORAGE_PREFIX) &&
        !key.startsWith(MULTI_COUNTRY_PROJECT_STORAGE_PREFIX))
    ) {
      continue;
    }
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      sessionStorage.setItem(key, JSON.stringify(mutate(parsed)));
    } catch {
      // Ignore malformed prototype records.
    }
  }
}

function syncStoredProjectsForGroup(
  groupId: string,
  next: { name: string } | null,
  removedProjectIds: string[] = [],
): void {
  rewriteStoredProjects((project) => {
    const projectId = typeof project.id === 'string' ? project.id : '';
    const currentGroupId =
      typeof project.uniqueResponseGroupId === 'string' ? project.uniqueResponseGroupId : undefined;

    if (removedProjectIds.includes(projectId) && currentGroupId === groupId) {
      const { uniqueResponseGroupId: _id, uniqueResponseGroupName: _name, ...rest } = project;
      return rest;
    }

    if (currentGroupId === groupId) {
      if (!next) {
        const { uniqueResponseGroupId: _id, uniqueResponseGroupName: _name, ...rest } = project;
        return rest;
      }
      return { ...project, uniqueResponseGroupName: next.name };
    }

    return project;
  });
}

export function createUniqueResponseGroup(
  name: string,
  existing: UniqueResponseGroup[],
  projectIds: string[] = [],
  description?: string,
): UniqueResponseGroup {
  const trimmedDescription = description?.trim();
  const group: UniqueResponseGroup = {
    id: `urg-${Date.now()}`,
    name: name.trim(),
    ...(trimmedDescription ? { description: trimmedDescription } : {}),
    projectIds: [...new Set(projectIds)],
  };
  const next = exclusiveProjectIds([...existing, group], group.id, group.projectIds);
  saveUniqueResponseGroups(next);
  return next.find((item) => item.id === group.id) ?? group;
}

export function updateUniqueResponseGroup(
  groupId: string,
  updates: { name: string; description?: string },
): UniqueResponseGroup | null {
  const groups = loadUniqueResponseGroups();
  const current = groups.find((group) => group.id === groupId);
  if (!current) return null;

  const trimmedName = updates.name.trim();
  const trimmedDescription = updates.description?.trim();
  const nextGroups = groups.map((group) =>
    group.id === groupId
      ? {
          ...group,
          name: trimmedName,
          ...(trimmedDescription ? { description: trimmedDescription } : { description: undefined }),
        }
      : group,
  );
  saveUniqueResponseGroups(nextGroups);
  syncStoredProjectsForGroup(groupId, { name: trimmedName });
  return nextGroups.find((group) => group.id === groupId) ?? null;
}

export function removeProjectFromUniqueResponseGroup(
  groupId: string,
  projectId: string,
): UniqueResponseGroup | null {
  const groups = loadUniqueResponseGroups();
  if (!groups.some((group) => group.id === groupId)) return null;

  const nextGroups = groups.map((group) =>
    group.id === groupId
      ? { ...group, projectIds: group.projectIds.filter((id) => id !== projectId) }
      : group,
  );
  saveUniqueResponseGroups(nextGroups);
  syncStoredProjectsForGroup(groupId, { name: nextGroups.find((g) => g.id === groupId)?.name ?? '' }, [
    projectId,
  ]);
  return nextGroups.find((group) => group.id === groupId) ?? null;
}

export function deleteUniqueResponseGroup(groupId: string): boolean {
  const groups = loadUniqueResponseGroups();
  if (!groups.some((group) => group.id === groupId)) return false;
  saveUniqueResponseGroups(groups.filter((group) => group.id !== groupId));
  syncStoredProjectsForGroup(groupId, null);
  return true;
}

export function addProjectToUniqueResponseGroup(groupId: string, projectId: string): UniqueResponseGroup | null {
  const groups = loadUniqueResponseGroups();
  if (!groups.some((group) => group.id === groupId)) return null;
  const next = exclusiveProjectIds(groups, groupId, [projectId]);
  saveUniqueResponseGroups(next);
  const group = next.find((item) => item.id === groupId) ?? null;
  if (group) {
    rewriteStoredProjects((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        uniqueResponseGroupId: group.id,
        uniqueResponseGroupName: group.name,
      };
    });
  }
  return group;
}

export function withLiveUniqueResponseGroup<
  T extends { id: string; uniqueResponseGroupId?: string; uniqueResponseGroupName?: string },
>(project: T): T {
  if (typeof window === 'undefined') return project;
  const groups = loadUniqueResponseGroups();
  const group = groups.find((item) => item.projectIds.includes(project.id));
  if (group) {
    return { ...project, uniqueResponseGroupId: group.id, uniqueResponseGroupName: group.name };
  }
  if (!project.uniqueResponseGroupId && !project.uniqueResponseGroupName) return project;
  return { ...project, uniqueResponseGroupId: undefined, uniqueResponseGroupName: undefined };
}

function buildProjectCatalog(): Map<string, WaveGroupAssociatedProject> {
  const map = new Map<string, WaveGroupAssociatedProject>();

  for (const project of MOCK_AUDIENCE_PROJECTS) {
    map.set(project.id, {
      id: project.id,
      projectId: project.projectId,
      name: project.name,
      status: project.status,
      href: `/projects/${project.id}`,
    });
  }

  map.set(MOCK_MULTI_COUNTRY_PARENT.id, {
    id: MOCK_MULTI_COUNTRY_PARENT.id,
    projectId: MOCK_MULTI_COUNTRY_PARENT.projectId,
    name: MOCK_MULTI_COUNTRY_PARENT.name,
    status: MOCK_MULTI_COUNTRY_PARENT.status,
    href: `/projects/${MOCK_MULTI_COUNTRY_PARENT.id}`,
  });

  if (typeof window === 'undefined') return map;

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (
      !key ||
      (!key.startsWith(AUDIENCE_PROJECT_STORAGE_PREFIX) &&
        !key.startsWith(MULTI_COUNTRY_PROJECT_STORAGE_PREFIX))
    ) {
      continue;
    }
    const raw = sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const project = JSON.parse(raw) as {
        id?: string;
        projectId?: string;
        name?: string;
        status?: string;
      };
      if (!project.id) continue;
      map.set(project.id, {
        id: project.id,
        projectId: project.projectId ?? project.id,
        name: project.name ?? 'Untitled project',
        status: project.status ?? '—',
        href: `/projects/${project.id}`,
      });
    } catch {
      // Ignore malformed prototype records.
    }
  }

  return map;
}

export function getAssociatedProjectsForGroup(
  group: UniqueResponseGroup,
): WaveGroupAssociatedProject[] {
  const catalog = buildProjectCatalog();
  return group.projectIds.map(
    (id) =>
      catalog.get(id) ?? {
        id,
        projectId: id,
        name: 'Unknown project',
        status: '—',
        href: `/projects/${id}`,
      },
  );
}
