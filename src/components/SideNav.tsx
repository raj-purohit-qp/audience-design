'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { WorkspaceNav } from '@/components/workspace/WorkspaceNav';

const WuSidebarContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarContent })),
  { ssr: false },
);
const WuSidebarFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarFooter })),
  { ssr: false },
);
const WuSidebarGroup = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarGroup })),
  { ssr: false },
);
const WuSidebarItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSidebarItem })),
  { ssr: false },
);

function NavIcon({ name }: { name: string }) {
  return <span className={`${name} text-current`} aria-hidden="true" />;
}

/** Matches Material "build"; offset counters WuSidebarItem `right-1` + overflow clip. */
function PanelSettingsIcon() {
  return (
    <span className="inline-flex translate-x-1 items-center justify-center" aria-hidden="true">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="1em"
        height="1em"
        fill="currentColor"
        className="block shrink-0 overflow-visible"
      >
        <path d="M9 15C7.33333 15 5.91667 14.4167 4.75 13.25C3.58333 12.0833 3 10.6667 3 9C3 8.66667 3.025 8.33333 3.075 8C3.125 7.66667 3.21667 7.35 3.35 7.05C3.43333 6.88333 3.5375 6.75833 3.6625 6.675C3.7875 6.59167 3.925 6.53333 4.075 6.5C4.225 6.46667 4.37917 6.47083 4.5375 6.5125C4.69583 6.55417 4.84167 6.64167 4.975 6.775L7.6 9.4L9.4 7.6L6.775 4.975C6.64167 4.84167 6.55417 4.69583 6.5125 4.5375C6.47083 4.37917 6.46667 4.225 6.5 4.075C6.53333 3.925 6.59167 3.7875 6.675 3.6625C6.75833 3.5375 6.88333 3.43333 7.05 3.35C7.35 3.21667 7.66667 3.125 8 3.075C8.33333 3.025 8.66667 3 9 3C10.6667 3 12.0833 3.58333 13.25 4.75C14.4167 5.91667 15 7.33333 15 9C15 9.38333 14.9667 9.74583 14.9 10.0875C14.8333 10.4292 14.7333 10.7667 14.6 11.1L19.65 16.1C20.1333 16.5833 20.375 17.175 20.375 17.875C20.375 18.575 20.1333 19.1667 19.65 19.65C19.1667 20.1333 18.575 20.375 17.875 20.375C17.175 20.375 16.5833 20.125 16.1 19.625L11.1 14.6C10.7667 14.7333 10.4292 14.8333 10.0875 14.9C9.74583 14.9667 9.38333 15 9 15Z" />
      </svg>
    </span>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { showToast } = useWuShowToast();

  const isHome = pathname === '/home';
  const isSpecializedSample = pathname === '/projects' || pathname.startsWith('/projects/');
  const isPanelSettings = pathname.startsWith('/admin/panel-settings');

  const comingSoon = (label: string) => () =>
    showToast({ message: `${label} coming soon`, variant: 'success' });

  return (
    <>
      <WuSidebarContent>
        <WorkspaceNav />

        <WuSidebarItem Icon={<NavIcon name="wm-edit" />} isActive={isHome}>
          <Link href="/home">Home</Link>
        </WuSidebarItem>

        <WuSidebarGroup label="Audience">
          <WuSidebarItem Icon={<NavIcon name="wm-chat-bubble" />} isActive={isSpecializedSample}>
            <Link href="/projects">Specialized sample</Link>
          </WuSidebarItem>
          <WuSidebarItem Icon={<NavIcon name="wm-forum" />}>
            <button type="button" className="w-full text-left" onClick={comingSoon('Instant answers')}>
              Instant answers
            </button>
          </WuSidebarItem>
        </WuSidebarGroup>

        <WuSidebarGroup label="Data">
          <WuSidebarItem Icon={<NavIcon name="wm-bar-chart" />}>
            <button type="button" className="w-full text-left" onClick={comingSoon('Synthetic data')}>
              Synthetic data
            </button>
          </WuSidebarItem>
        </WuSidebarGroup>
      </WuSidebarContent>

      <WuSidebarFooter>
        <WuSidebarItem Icon={<PanelSettingsIcon />} isActive={isPanelSettings}>
          <Link href="/admin/panel-settings">Panel settings</Link>
        </WuSidebarItem>
        <WuSidebarItem Icon={<NavIcon name="wm-settings" />}>
          <button type="button" className="w-full text-left" onClick={comingSoon('Settings')}>
            Settings
          </button>
        </WuSidebarItem>
      </WuSidebarFooter>
    </>
  );
}
