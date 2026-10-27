'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateProjectForm } from '@/components/multi-country/CreateProjectForm';
import {
  getCreateWithAiJob,
  resumeCreateWithAi,
  type AiAnalysisResult,
} from '@/data/create-with-ai';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import { setActiveWorkspaceId } from '@/data/workspace-session';
import {
  isMultiCountryProject,
  resolveProject,
  type AudienceProjectDetail,
} from '@/data/audience-project-store';

function CreateProjectPageInner() {
  const { currentUser, isMine } = useWorkspaceSession();
  const canCreate = currentUser.projectCreation.specializedSample;
  const searchParams = useSearchParams();
  const topUpFrom = searchParams.get('topUpFrom');
  const topUpCountry = searchParams.get('country') ?? undefined;
  const fromAi = searchParams.get('fromAi') === '1';
  const [topUpSource, setTopUpSource] = useState<AudienceProjectDetail | undefined>(undefined);
  const [aiDraft, setAiDraft] = useState<AiAnalysisResult | null>(null);

  useEffect(() => {
    if (!isMine) setActiveWorkspaceId('mine');
  }, [isMine]);

  useEffect(() => {
    if (!topUpFrom) {
      setTopUpSource(undefined);
      return;
    }
    const project = resolveProject(topUpFrom);
    if (!project || project.status !== 'Closed') {
      setTopUpSource(undefined);
      return;
    }
    if (!isMultiCountryProject(project) && project.topUpOfProjectId) {
      setTopUpSource(undefined);
      return;
    }
    setTopUpSource(project);
  }, [topUpFrom]);

  useEffect(() => {
    if (!fromAi) {
      setAiDraft(null);
      return;
    }
    resumeCreateWithAi();
    const result = getCreateWithAiJob()?.result ?? null;
    setAiDraft(result);
  }, [fromAi]);

  if (!canCreate) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <EmptyState
          icon="wm-lock"
          title="You can't create Specialized sample projects"
          description="Ask the primary user if you need project creation access."
        />
      </div>
    );
  }

  return (
    <CreateProjectForm
      topUpSource={topUpSource}
      topUpCountryCode={topUpCountry}
      aiDraft={aiDraft ?? undefined}
    />
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={null}>
      <CreateProjectPageInner />
    </Suspense>
  );
}
