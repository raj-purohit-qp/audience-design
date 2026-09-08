'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { buildWorkspaceSnapshot, type DemoWorkspaceScenario, type WorkspaceId } from '@/data/mock-workspace';
import {
  getWorkspaceSnapshot,
  goToMyWorkspace,
  setActiveWorkspaceId,
  setWorkspaceDemoScenario,
  WORKSPACE_CHANGE_EVENT,
} from '@/data/workspace-session';

const SSR_SNAPSHOT = buildWorkspaceSnapshot('typical', 'mine');

export function useWorkspaceSession() {
  const router = useRouter();
  const pathname = usePathname();
  const [snapshot, setSnapshot] = useState(SSR_SNAPSHOT);

  useEffect(() => {
    setSnapshot(getWorkspaceSnapshot());
    const onChange = () => setSnapshot(getWorkspaceSnapshot());
    window.addEventListener(WORKSPACE_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(WORKSPACE_CHANGE_EVENT, onChange);
  }, []);

  function selectWorkspace(id: WorkspaceId) {
    setActiveWorkspaceId(id);
    if (pathname !== '/projects') {
      router.push('/projects');
    }
  }

  function setScenario(scenario: DemoWorkspaceScenario) {
    setWorkspaceDemoScenario(scenario);
    if (pathname !== '/projects') {
      router.push('/projects');
    }
  }

  function returnToMyWorkspace() {
    goToMyWorkspace();
    if (pathname !== '/projects') {
      router.push('/projects');
    }
  }

  function openOrganizationAccess() {
    router.push('/admin/organization-access');
  }

  return {
    ...snapshot,
    selectWorkspace,
    setScenario,
    returnToMyWorkspace,
    openOrganizationAccess,
  };
}
