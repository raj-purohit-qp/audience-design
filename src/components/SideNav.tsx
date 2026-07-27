'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false },
);
const WuSidebarFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarFooter })),
  { ssr: false },
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false },
);

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { showToast } = useWuShowToast();

  const isProjectsList = pathname === '/projects' || pathname.startsWith('/projects/');
  const isPanelSettings = pathname.startsWith('/admin/panel-settings');
  const isAdminSection = pathname.startsWith('/admin');

  return (
    <>
      <WuSidebarContent>
        <WuSidebarItem Icon={<span className="wm-list" />} isActive={isProjectsList}>
          <Link href="/projects">Projects</Link>
        </WuSidebarItem>
        <WuSidebarItem Icon={<span className="wm-grid-view" />} isActive={false}>
          <button
            type="button"
            className="w-full text-left"
            onClick={() => showToast({ message: 'Grid view coming soon', variant: 'success' })}
          >
            Dashboard
          </button>
        </WuSidebarItem>

        <div className="my-2 px-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8c9baa]">
            Admin settings
          </p>
        </div>
        <WuSidebarItem Icon={<span className="wm-settings" />} isActive={isAdminSection && !isPanelSettings}>
          <button
            type="button"
            className="w-full text-left"
            onClick={() => showToast({ message: 'Admin settings coming soon', variant: 'success' })}
          >
            Admin settings
          </button>
        </WuSidebarItem>
      </WuSidebarContent>

      <WuSidebarFooter>
        <WuSidebarItem Icon={<span className="wm-tune" />} isActive={isPanelSettings}>
          <Link href="/admin/panel-settings">Panel settings</Link>
        </WuSidebarItem>
        <WuSidebarItem Icon={<span className="wm-delete" />}>
          <button type="button" className="w-full text-left" onClick={() => router.push('/projects')}>
            Trash
          </button>
        </WuSidebarItem>
        <WuSidebarItem Icon={<span className="wm-settings" />}>
          <button
            type="button"
            className="w-full text-left"
            onClick={() => showToast({ message: 'Settings coming soon', variant: 'success' })}
          >
            Settings
          </button>
        </WuSidebarItem>
        <WuSidebarItem Icon={<span className="wm-info" />}>
          <button
            type="button"
            className="w-full text-left"
            onClick={() => showToast({ message: 'Help & information', variant: 'success' })}
          >
            Information
          </button>
        </WuSidebarItem>
      </WuSidebarFooter>
    </>
  );
}
