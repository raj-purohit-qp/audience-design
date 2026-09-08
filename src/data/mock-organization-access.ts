// ─────────────────────────────────────────────────────────────
//  Organization Access — permission administration mock data
// ─────────────────────────────────────────────────────────────

export type DemoAccessRole = 'primary' | 'member';
export type DemoOrgSize = 'typical' | 'solo' | 'large';
export type DemoSaveOutcome = 'success' | 'failure';
export type AccessLevel = 'read' | 'read_write';

export interface ProjectCreationPermissions {
  specializedSample: boolean;
  instantAnswers: boolean;
  syntheticData: boolean;
}

export interface WorkspaceGrant {
  userId: string;
  access: AccessLevel;
}

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  isPrimaryUser: boolean;
  lastUpdated: string | null;
  projectCreation: ProjectCreationPermissions;
  workspaceAccess: WorkspaceGrant[];
}

export interface WorkspaceOption {
  value: string;
  label: string;
  isPrimaryUser: boolean;
}

export const CREATION_PRODUCTS: {
  key: keyof ProjectCreationPermissions;
  label: string;
  description: string;
}[] = [
  {
    key: 'specializedSample',
    label: 'Specialized sample',
    description: 'Panel projects with demographic targeting.',
  },
  {
    key: 'instantAnswers',
    label: 'Instant answers',
    description: 'Lightweight surveys without demographic targeting.',
  },
  {
    key: 'syntheticData',
    label: 'Synthetic',
    description: 'AI-generated responses from panel profiles.',
  },
];

export const ACCESS_LEVEL_LABEL: Record<AccessLevel, string> = {
  read: 'Read',
  read_write: 'Read & write',
};

export const DEMO_ROLE_OPTIONS: { value: DemoAccessRole; label: string }[] = [
  { value: 'primary', label: 'Primary user' },
  { value: 'member', label: 'Regular user' },
];

export const DEMO_ORG_OPTIONS: { value: DemoOrgSize; label: string }[] = [
  { value: 'typical', label: 'Typical' },
  { value: 'solo', label: 'Solo' },
  { value: 'large', label: 'Large' },
];

export const DEMO_SAVE_OPTIONS: { value: DemoSaveOutcome; label: string }[] = [
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
];

const ALL_CREATION: ProjectCreationPermissions = {
  specializedSample: true,
  instantAnswers: true,
  syntheticData: true,
};

function cloneMembers(members: OrgMember[]): OrgMember[] {
  return JSON.parse(JSON.stringify(members)) as OrgMember[];
}

function grantsFor(
  memberIds: string[],
  access: AccessLevel | ((userId: string) => AccessLevel),
): WorkspaceGrant[] {
  return memberIds.map((userId) => ({
    userId,
    access: typeof access === 'function' ? access(userId) : access,
  }));
}

function member(
  partial: Omit<OrgMember, 'projectCreation' | 'workspaceAccess'> & {
    projectCreation?: Partial<ProjectCreationPermissions>;
    workspaceAccess?: WorkspaceGrant[];
  },
  allIds: string[],
): OrgMember {
  return {
    id: partial.id,
    name: partial.name,
    email: partial.email,
    isPrimaryUser: partial.isPrimaryUser,
    lastUpdated: partial.lastUpdated,
    projectCreation: { ...ALL_CREATION, ...partial.projectCreation },
    workspaceAccess: partial.workspaceAccess ?? grantsFor(allIds, 'read_write'),
  };
}

const TYPICAL_IDS = [
  'user-john',
  'user-sarah',
  'user-mike',
  'user-priya',
  'user-daniel',
  'user-elena',
  'user-james',
  'user-aisha',
  'user-tom',
  'user-lisa',
  'user-chen',
  'user-olivia',
] as const;

function buildTypicalMembers(): OrgMember[] {
  const allIds = [...TYPICAL_IDS];

  return [
    member(
      {
        id: 'user-john',
        name: 'John Smith',
        email: 'john.smith@northstar-insights.com',
        isPrimaryUser: true,
        lastUpdated: null,
      },
      allIds,
    ),
    member(
      {
        id: 'user-sarah',
        name: 'Sarah Chen',
        email: 'sarah.chen@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-09-02T14:10:00.000Z',
        projectCreation: { specializedSample: true, instantAnswers: false, syntheticData: true },
        workspaceAccess: grantsFor(allIds, (id) =>
          id === 'user-john' || id === 'user-mike' ? 'read_write' : 'read',
        ),
      },
      allIds,
    ),
    member(
      {
        id: 'user-mike',
        name: 'Mike Torres',
        email: 'mike.torres@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-08-21T09:00:00.000Z',
      },
      allIds,
    ),
    member(
      {
        id: 'user-priya',
        name: 'Priya Nair',
        email: 'priya.nair@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-09-04T16:45:00.000Z',
        projectCreation: { specializedSample: true, instantAnswers: true, syntheticData: false },
        workspaceAccess: grantsFor(
          ['user-john', 'user-sarah', 'user-priya', 'user-lisa'],
          (id) => (id === 'user-john' ? 'read_write' : 'read'),
        ),
      },
      allIds,
    ),
    member(
      {
        id: 'user-daniel',
        name: 'Daniel Okonkwo',
        email: 'daniel.okonkwo@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-07-18T11:20:00.000Z',
        projectCreation: { specializedSample: false, instantAnswers: true, syntheticData: false },
        workspaceAccess: grantsFor(['user-john', 'user-sarah'], 'read'),
      },
      allIds,
    ),
    member(
      {
        id: 'user-elena',
        name: 'Elena Vasquez',
        email: 'elena.vasquez@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-09-01T08:15:00.000Z',
      },
      allIds,
    ),
    member(
      {
        id: 'user-james',
        name: 'James Whitfield-Harrington III',
        email: 'james.whitfield-harrington@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-08-12T13:30:00.000Z',
      },
      allIds,
    ),
    member(
      {
        id: 'user-aisha',
        name: 'Aisha Rahman',
        email: 'aisha.rahman@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-06-29T10:05:00.000Z',
        projectCreation: { specializedSample: false, instantAnswers: false, syntheticData: false },
        workspaceAccess: grantsFor(['user-john', 'user-aisha', 'user-olivia'], 'read_write'),
      },
      allIds,
    ),
    member(
      {
        id: 'user-tom',
        name: 'Tom Becker',
        email: 'tom.becker@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-09-06T17:40:00.000Z',
        projectCreation: { specializedSample: true, instantAnswers: false, syntheticData: false },
        workspaceAccess: [],
      },
      allIds,
    ),
    member(
      {
        id: 'user-lisa',
        name: 'Lisa Park',
        email: 'lisa.park@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-08-30T12:00:00.000Z',
        workspaceAccess: grantsFor(allIds, 'read'),
      },
      allIds,
    ),
    member(
      {
        id: 'user-chen',
        name: 'Chen Wei',
        email: 'chen.wei@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: '2026-07-02T15:55:00.000Z',
        projectCreation: { specializedSample: false, instantAnswers: false, syntheticData: true },
        workspaceAccess: grantsFor(
          ['user-john', 'user-mike', 'user-chen', 'user-elena'],
          'read_write',
        ),
      },
      allIds,
    ),
    member(
      {
        id: 'user-olivia',
        name: 'Olivia Brooks',
        email: 'olivia.brooks@northstar-insights.com',
        isPrimaryUser: false,
        lastUpdated: null,
      },
      allIds,
    ),
  ];
}

const EXTRA_LARGE_MEMBERS: { id: string; name: string; email: string }[] = [
  { id: 'user-noah', name: 'Noah Patel', email: 'noah.patel@northstar-insights.com' },
  { id: 'user-amelia', name: 'Amelia Brooks', email: 'amelia.brooks@northstar-insights.com' },
  { id: 'user-lucas', name: 'Lucas Nguyen', email: 'lucas.nguyen@northstar-insights.com' },
  { id: 'user-maya', name: 'Maya Singh', email: 'maya.singh@northstar-insights.com' },
  { id: 'user-henrik', name: 'Henrik Larsen', email: 'henrik.larsen@northstar-insights.com' },
  { id: 'user-sofia', name: 'Sofia Almeida', email: 'sofia.almeida@northstar-insights.com' },
  { id: 'user-owen', name: 'Owen Gallagher', email: 'owen.gallagher@northstar-insights.com' },
  { id: 'user-hana', name: 'Hana Kobayashi', email: 'hana.kobayashi@northstar-insights.com' },
  { id: 'user-marcus', name: 'Marcus Reid', email: 'marcus.reid@northstar-insights.com' },
  { id: 'user-isla', name: 'Isla McKenzie', email: 'isla.mckenzie@northstar-insights.com' },
  { id: 'user-diego', name: 'Diego Morales', email: 'diego.morales@northstar-insights.com' },
  { id: 'user-freya', name: 'Freya Bergstrom', email: 'freya.bergstrom@northstar-insights.com' },
  { id: 'user-kai', name: 'Kai Nakamura', email: 'kai.nakamura@northstar-insights.com' },
  { id: 'user-leila', name: 'Leila Haddad', email: 'leila.haddad@northstar-insights.com' },
  { id: 'user-sebastian', name: 'Sebastian Crowe', email: 'sebastian.crowe@northstar-insights.com' },
  { id: 'user-nina', name: 'Nina Petrova', email: 'nina.petrova@northstar-insights.com' },
  { id: 'user-adrian', name: 'Adrian Flores', email: 'adrian.flores@northstar-insights.com' },
  { id: 'user-yara', name: 'Yara El-Sayed', email: 'yara.elsayed@northstar-insights.com' },
  { id: 'user-colin', name: 'Colin Murphy', email: 'colin.murphy@northstar-insights.com' },
  { id: 'user-zara', name: 'Zara Ahmed', email: 'zara.ahmed@northstar-insights.com' },
  { id: 'user-felix', name: 'Felix Moreau', email: 'felix.moreau@northstar-insights.com' },
  { id: 'user-ruby', name: 'Ruby Santos', email: 'ruby.santos@northstar-insights.com' },
  { id: 'user-theo', name: 'Theo Papadopoulos', email: 'theo.papadopoulos@northstar-insights.com' },
  { id: 'user-meera', name: 'Meera Iyer', email: 'meera.iyer@northstar-insights.com' },
  { id: 'user-jonas', name: 'Jonas Klein', email: 'jonas.klein@northstar-insights.com' },
  { id: 'user-camille', name: 'Camille Dubois', email: 'camille.dubois@northstar-insights.com' },
  { id: 'user-ravi', name: 'Ravi Kapoor', email: 'ravi.kapoor@northstar-insights.com' },
  { id: 'user-emma-long', name: 'Emma Catherine Montgomery-Walsh', email: 'emma.montgomery-walsh@northstar-insights.com' },
];

function buildLargeMembers(): OrgMember[] {
  const typical = buildTypicalMembers();
  const allIds = [...typical.map((m) => m.id), ...EXTRA_LARGE_MEMBERS.map((m) => m.id)];

  const expandedTypical = typical.map((m) => {
    const existingIds = new Set(m.workspaceAccess.map((g) => g.userId));
    const extraGrants =
      m.workspaceAccess.length === 0
        ? []
        : allIds
            .filter((id) => !existingIds.has(id))
            .map((userId) => ({
              userId,
              access: m.workspaceAccess[0]?.access ?? ('read_write' as AccessLevel),
            }));

    if (m.id === 'user-lisa') {
      return { ...m, workspaceAccess: grantsFor(allIds, 'read') };
    }

    if (m.id === 'user-sarah') {
      return {
        ...m,
        workspaceAccess: grantsFor(allIds, (id) =>
          id === 'user-john' || id === 'user-mike' ? 'read_write' : 'read',
        ),
      };
    }

    if (m.workspaceAccess.length === typical.length) {
      return { ...m, workspaceAccess: grantsFor(allIds, 'read_write') };
    }

    return {
      ...m,
      workspaceAccess: [...m.workspaceAccess, ...extraGrants],
    };
  });

  const extras = EXTRA_LARGE_MEMBERS.map((extra) =>
    member(
      {
        ...extra,
        isPrimaryUser: false,
        lastUpdated: null,
      },
      allIds,
    ),
  );

  return [...expandedTypical, ...extras];
}

function buildSoloMembers(): OrgMember[] {
  return [
    member(
      {
        id: 'user-john',
        name: 'John Smith',
        email: 'john.smith@northstar-insights.com',
        isPrimaryUser: true,
        lastUpdated: null,
      },
      ['user-john'],
    ),
  ];
}

const SEEDS: Record<DemoOrgSize, OrgMember[]> = {
  typical: buildTypicalMembers(),
  solo: buildSoloMembers(),
  large: buildLargeMembers(),
};

const stores: Record<DemoOrgSize, OrgMember[]> = {
  typical: cloneMembers(SEEDS.typical),
  solo: cloneMembers(SEEDS.solo),
  large: cloneMembers(SEEDS.large),
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getOrganizationMembers(size: DemoOrgSize): OrgMember[] {
  return cloneMembers(stores[size]);
}

export function getWorkspaceOptions(members: OrgMember[]): WorkspaceOption[] {
  return members.map((m) => ({
    value: m.id,
    label: m.isPrimaryUser ? `${m.name} (Primary user)` : m.name,
    isPrimaryUser: m.isPrimaryUser,
  }));
}

export function defaultPermissions(memberIds: string[]): {
  projectCreation: ProjectCreationPermissions;
  workspaceAccess: WorkspaceGrant[];
} {
  return {
    projectCreation: { ...ALL_CREATION },
    workspaceAccess: grantsFor(memberIds, 'read_write'),
  };
}

export function permissionsEqual(
  a: Pick<OrgMember, 'projectCreation' | 'workspaceAccess'>,
  b: Pick<OrgMember, 'projectCreation' | 'workspaceAccess'>,
): boolean {
  const sortGrants = (grants: WorkspaceGrant[]) =>
    [...grants].sort((left, right) => left.userId.localeCompare(right.userId));

  return (
    JSON.stringify(a.projectCreation) === JSON.stringify(b.projectCreation) &&
    JSON.stringify(sortGrants(a.workspaceAccess)) === JSON.stringify(sortGrants(b.workspaceAccess))
  );
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function creationSummary(creation: ProjectCreationPermissions): string[] {
  return CREATION_PRODUCTS.filter((product) => creation[product.key]).map((product) => product.label);
}

export function workspaceAccessSummary(
  member: OrgMember,
  orgSize: number,
): { label: string; isEmpty: boolean; isAll: boolean } {
  const count = member.workspaceAccess.length;
  if (count === 0) {
    return { label: 'No workspaces', isEmpty: true, isAll: false };
  }
  if (count === orgSize) {
    return { label: 'All workspaces', isEmpty: false, isAll: true };
  }
  return {
    label: `${count} of ${orgSize} workspaces`,
    isEmpty: false,
    isAll: false,
  };
}

export async function updateMemberPermissions(
  size: DemoOrgSize,
  userId: string,
  next: Pick<OrgMember, 'projectCreation' | 'workspaceAccess'>,
  outcome: DemoSaveOutcome,
): Promise<OrgMember> {
  await delay(650);

  if (outcome === 'failure') {
    throw new Error('save_failed');
  }

  const list = stores[size];
  const index = list.findIndex((m) => m.id === userId);
  if (index < 0) {
    throw new Error('not_found');
  }

  const current = list[index];
  if (current.isPrimaryUser) {
    throw new Error('primary_locked');
  }

  const updated: OrgMember = {
    ...current,
    projectCreation: { ...next.projectCreation },
    workspaceAccess: JSON.parse(JSON.stringify(next.workspaceAccess)) as WorkspaceGrant[],
    lastUpdated: new Date().toISOString(),
  };

  list[index] = updated;
  return JSON.parse(JSON.stringify(updated)) as OrgMember;
}

export function resetOrganizationAccessStore(): void {
  stores.typical = cloneMembers(SEEDS.typical);
  stores.solo = cloneMembers(SEEDS.solo);
  stores.large = cloneMembers(SEEDS.large);
}
