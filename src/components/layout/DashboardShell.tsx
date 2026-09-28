'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { SideNav } from '@/components/SideNav';
import { HeaderBreadcrumb } from '@/components/layout/HeaderBreadcrumb';
import { resolveAudienceProject } from '@/data/audience-project-store';

const WuAppHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeader })),
  { ssr: false }
);
const WuSidebar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebar })),
  { ssr: false }
);
const WuToast = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToast })),
  { ssr: false }
);

function useProjectDetailBreadcrumb(): string | null {
  const pathname = usePathname();
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/projects\/([^/]+)$/);
    if (!match || match[1] === 'create') {
      setProjectName(null);
      return;
    }

    const project = resolveAudienceProject(match[1]);
    setProjectName(project.name);
  }, [pathname]);

  return projectName;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const projectName = useProjectDetailBreadcrumb();

  return (
    <div className="flex min-h-screen flex-col">
      <WuToast />
      <WuAppHeader
        productName="Audience"
        categories={[]}
        user={{
          profile: {
            initials: 'R',
            title: 'QuestionPro Admin',
            companyName: 'QuestionPro',
          },
        }}
      >
        {projectName ? (
          <HeaderBreadcrumb
            parentHref="/projects"
            parentLabel="Specialized sample"
            currentName={projectName}
          />
        ) : null}
      </WuAppHeader>
      <WuSidebar Sidebar={<SideNav />}>
        <main className="flex flex-1 flex-col bg-white">{children}</main>
      </WuSidebar>
    </div>
  );
}
