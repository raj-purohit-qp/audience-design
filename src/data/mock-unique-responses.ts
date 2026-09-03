export interface UniqueResponseGroup {
  id: string;
  name: string;
}

export const NONE_UNIQUE_RESPONSE_VALUE = 'none';
export const CREATE_UNIQUE_RESPONSE_VALUE = '__create__';
export const EMPTY_UNIQUE_RESPONSE_VALUE = '__empty__';

const STORAGE_KEY = 'audience-unique-response-groups';

export const DEFAULT_UNIQUE_RESPONSE_GROUPS: UniqueResponseGroup[] = [
  { id: 'urg-1', name: 'Brand Tracking 2026' },
  { id: 'urg-2', name: 'Concept Testing Q4' },
  { id: 'urg-3', name: 'Product Research' },
  { id: 'urg-4', name: 'Customer Experience' },
  {
    id: 'urg-5',
    name: 'North America Automotive Concept Screening Wave 2 — 2026',
  },
];

export function loadUniqueResponseGroups(): UniqueResponseGroup[] {
  if (typeof window === 'undefined') return DEFAULT_UNIQUE_RESPONSE_GROUPS;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_UNIQUE_RESPONSE_GROUPS;
  try {
    const parsed = JSON.parse(raw) as UniqueResponseGroup[];
    if (!Array.isArray(parsed)) return DEFAULT_UNIQUE_RESPONSE_GROUPS;
    return parsed.filter(
      (group) =>
        typeof group?.id === 'string' &&
        typeof group?.name === 'string' &&
        group.name.trim().length > 0,
    );
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

export function createUniqueResponseGroup(
  name: string,
  existing: UniqueResponseGroup[],
): UniqueResponseGroup {
  const group: UniqueResponseGroup = {
    id: `urg-${Date.now()}`,
    name: name.trim(),
  };
  saveUniqueResponseGroups([...existing, group]);
  return group;
}
