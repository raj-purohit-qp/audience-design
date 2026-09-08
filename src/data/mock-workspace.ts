import {
  getInitials,
  getOrganizationMembers,
  type AccessLevel,
  type DemoOrgSize,
  type OrgMember,
} from '@/data/mock-organization-access';

export type { AccessLevel };

export type WorkspaceId = 'mine' | string;

export type DemoWorkspaceScenario =
  | 'typical'
  | 'empty_mine'
  | 'no_shared'
  | 'large'
  | 'revoked'
  | 'primary';

export interface SharedWorkspace {
  id: string;
  name: string;
  email: string;
  access: AccessLevel;
}

export interface WorkspaceSnapshot {
  scenario: DemoWorkspaceScenario;
  currentUser: OrgMember;
  members: OrgMember[];
  activeId: WorkspaceId;
  isMine: boolean;
  owner: OrgMember;
  access: AccessLevel | 'owner';
  canWrite: boolean;
  canCreate: boolean;
  sharedWorkspaces: SharedWorkspace[];
  hideMyProjects: boolean;
  isRevoked: boolean;
  revokedOwnerName: string;
}

export const LOGGED_IN_USER_ID = 'user-sarah';
export const PRIMARY_USER_ID = 'user-john';
export const REVOKED_WORKSPACE_ID = 'user-john';

export const DEMO_WORKSPACE_OPTIONS: { value: DemoWorkspaceScenario; label: string }[] = [
  { value: 'typical', label: 'Typical' },
  { value: 'primary', label: 'Primary user' },
  { value: 'empty_mine', label: 'Empty mine' },
  { value: 'no_shared', label: 'No shared' },
  { value: 'large', label: 'Large org' },
  { value: 'revoked', label: 'Access revoked' },
];

const PROJECT_OWNER_IDS: Record<string, string> = {
  'ap-001': 'user-sarah',
  'ap-002': 'user-sarah',
  'ap-003': 'user-sarah',
  'ap-004': 'user-sarah',
  'ap-005': 'user-sarah',
  'ap-012': 'user-sarah',
  'mc-parent-001': 'user-sarah',
  'ap-006': 'user-john',
  'ap-008': 'user-john',
  'ap-009': 'user-john',
  'ap-007': 'user-mike',
  'ap-010': 'user-mike',
  'ap-011': 'user-priya',
};

export function getProjectOwnerId(projectId: string): string {
  return PROJECT_OWNER_IDS[projectId] ?? LOGGED_IN_USER_ID;
}

export function possessiveName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "This user's";
  return /s$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}

export function workspaceHeading(isMine: boolean, ownerName: string): string {
  return isMine ? 'My workspace' : `${possessiveName(ownerName)} workspace`;
}

export function loggedInUserIdFor(scenario: DemoWorkspaceScenario): string {
  return scenario === 'primary' ? PRIMARY_USER_ID : LOGGED_IN_USER_ID;
}

export function workspaceDescription(isMine: boolean, ownerName: string): string {
  return isMine ? 'Your projects' : `Projects created by ${ownerName}`;
}

function orgSizeFor(scenario: DemoWorkspaceScenario): DemoOrgSize {
  return scenario === 'large' ? 'large' : 'typical';
}

function membersForScenario(scenario: DemoWorkspaceScenario): OrgMember[] {
  const members = getOrganizationMembers(orgSizeFor(scenario));
  const loggedInId = loggedInUserIdFor(scenario);

  if (scenario === 'no_shared') {
    return members.map((member) =>
      member.id === loggedInId ? { ...member, workspaceAccess: [] } : member,
    );
  }

  if (scenario === 'revoked') {
    return members.map((member) =>
      member.id === loggedInId
        ? {
            ...member,
            workspaceAccess: member.workspaceAccess.filter(
              (grant) => grant.userId !== REVOKED_WORKSPACE_ID,
            ),
          }
        : member,
    );
  }

  return members;
}

export function getSharedWorkspaces(currentUser: OrgMember, members: OrgMember[]): SharedWorkspace[] {
  const byId = new Map(members.map((member) => [member.id, member]));
  return currentUser.workspaceAccess
    .filter((grant) => grant.userId !== currentUser.id)
    .map((grant) => {
      const owner = byId.get(grant.userId);
      if (!owner) return null;
      return {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        access: grant.access,
      };
    })
    .filter((workspace): workspace is SharedWorkspace => Boolean(workspace));
}

export function buildWorkspaceSnapshot(
  scenario: DemoWorkspaceScenario,
  activeId: WorkspaceId,
): WorkspaceSnapshot {
  const members = membersForScenario(scenario);
  const currentUser =
    members.find((member) => member.id === loggedInUserIdFor(scenario)) ?? members[0];
  const sharedWorkspaces = getSharedWorkspaces(currentUser, members);
  const isMine = activeId === 'mine' || activeId === currentUser.id;
  const revokedOwner = members.find((member) => member.id === REVOKED_WORKSPACE_ID);

  if (!isMine) {
    const shared = sharedWorkspaces.find((workspace) => workspace.id === activeId);
    if (!shared) {
      const owner = members.find((member) => member.id === activeId) ?? currentUser;
      return {
        scenario,
        currentUser,
        members,
        activeId,
        isMine: false,
        owner,
        access: 'read',
        canWrite: false,
        canCreate: false,
        sharedWorkspaces,
        hideMyProjects: scenario === 'empty_mine',
        isRevoked: true,
        revokedOwnerName: owner.name,
      };
    }

    const owner = members.find((member) => member.id === shared.id) ?? currentUser;
    return {
      scenario,
      currentUser,
      members,
      activeId,
      isMine: false,
      owner,
      access: shared.access,
      canWrite: shared.access === 'read_write',
      canCreate: false,
      sharedWorkspaces,
      hideMyProjects: false,
      isRevoked: false,
      revokedOwnerName: revokedOwner?.name ?? 'this workspace',
    };
  }

  return {
    scenario,
    currentUser,
    members,
    activeId: 'mine',
    isMine: true,
    owner: currentUser,
    access: 'owner',
    canWrite: true,
    canCreate: currentUser.projectCreation.specializedSample,
    sharedWorkspaces,
    hideMyProjects: scenario === 'empty_mine',
    isRevoked: false,
    revokedOwnerName: revokedOwner?.name ?? 'this workspace',
  };
}

export { getInitials };
