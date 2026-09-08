import {
  buildWorkspaceSnapshot,
  type DemoWorkspaceScenario,
  type WorkspaceId,
  type WorkspaceSnapshot,
} from '@/data/mock-workspace';

const WORKSPACE_KEY = 'audience-active-workspace';
const DEMO_KEY = 'audience-workspace-demo';
export const WORKSPACE_CHANGE_EVENT = 'audience-workspace-change';

function notifyWorkspaceChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(WORKSPACE_CHANGE_EVENT));
}

function readStoredWorkspaceId(): WorkspaceId {
  if (typeof window === 'undefined') return 'mine';
  return (sessionStorage.getItem(WORKSPACE_KEY) as WorkspaceId | null) ?? 'mine';
}

function readStoredScenario(): DemoWorkspaceScenario {
  if (typeof window === 'undefined') return 'typical';
  const stored = sessionStorage.getItem(DEMO_KEY) as DemoWorkspaceScenario | null;
  if (
    stored === 'typical' ||
    stored === 'empty_mine' ||
    stored === 'no_shared' ||
    stored === 'large' ||
    stored === 'revoked' ||
    stored === 'primary'
  ) {
    return stored;
  }
  return 'typical';
}

export function getActiveWorkspaceId(): WorkspaceId {
  return readStoredWorkspaceId();
}

export function setActiveWorkspaceId(id: WorkspaceId): void {
  if (typeof window === 'undefined') return;
  if (sessionStorage.getItem(WORKSPACE_KEY) === id) return;
  sessionStorage.setItem(WORKSPACE_KEY, id);
  notifyWorkspaceChange();
}

export function getWorkspaceDemoScenario(): DemoWorkspaceScenario {
  return readStoredScenario();
}

export function setWorkspaceDemoScenario(scenario: DemoWorkspaceScenario): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(DEMO_KEY, scenario);
  sessionStorage.setItem(WORKSPACE_KEY, scenario === 'revoked' ? 'user-john' : 'mine');
  notifyWorkspaceChange();
}

export function getWorkspaceSnapshot(): WorkspaceSnapshot {
  return buildWorkspaceSnapshot(readStoredScenario(), readStoredWorkspaceId());
}

export function goToMyWorkspace(): void {
  setActiveWorkspaceId('mine');
}
