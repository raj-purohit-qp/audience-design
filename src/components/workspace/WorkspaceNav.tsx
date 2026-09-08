'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';

function CheckIcon({ visible }: { visible: boolean }) {
  return (
    <span
      className={`wm-check workspace-switcher-check ${visible ? 'is-on' : ''}`}
      aria-hidden="true"
    />
  );
}

export function WorkspaceNav() {
  const pathname = usePathname();
  const {
    isMine,
    owner,
    currentUser,
    sharedWorkspaces,
    activeId,
    selectWorkspace,
    openOrganizationAccess,
  } = useWorkspaceSession();

  const onOrgAccess = pathname.startsWith('/admin/organization-access');
  const isPrimaryUser = currentUser.isPrimaryUser;
  const [open, setOpen] = useState(false);
  const [menuBox, setMenuBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const trigger = useMemo(() => {
    if (onOrgAccess) {
      return { title: 'Organization access', subtext: 'Admin' };
    }
    if (isMine) {
      return { title: 'My workspace', subtext: 'Private' };
    }
    return { title: 'Shared workspace', subtext: owner.name };
  }, [onOrgAccess, isMine, owner.name]);

  function updateMenuBox() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuBox({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }

  useEffect(() => {
    if (!open) return;
    updateMenuBox();
    const onReposition = () => updateMenuBox();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if ((event.target as HTMLElement).closest('.workspace-switcher-menu')) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function chooseMine() {
    selectWorkspace('mine');
    setOpen(false);
  }

  function chooseShared(id: string) {
    selectWorkspace(id);
    setOpen(false);
  }

  function chooseOrgAccess() {
    openOrganizationAccess();
    setOpen(false);
  }

  const menu = open && menuBox
    ? createPortal(
        <div
          className="workspace-switcher-menu"
          role="menu"
          aria-label="Workspace"
          style={{ top: menuBox.top, left: menuBox.left, width: menuBox.width }}
        >
          <button
            type="button"
            role="menuitem"
            className="workspace-switcher-item"
            onClick={chooseMine}
          >
            <CheckIcon visible={!onOrgAccess && isMine} />
            <span>My workspace</span>
          </button>

          <div className="workspace-switcher-divider" role="separator" />

          <div className="workspace-switcher-item is-section" role="presentation">
            <CheckIcon visible={false} />
            <span>Shared workspace</span>
          </div>
          {sharedWorkspaces.length === 0 ? (
            <div className="workspace-switcher-item is-muted" role="menuitem" aria-disabled="true">
              <CheckIcon visible={false} />
              <span>No shared workspaces</span>
            </div>
          ) : (
            sharedWorkspaces.map((workspace) => (
              <button
                key={workspace.id}
                type="button"
                role="menuitem"
                className="workspace-switcher-item"
                title={workspace.name}
                onClick={() => chooseShared(workspace.id)}
              >
                <CheckIcon visible={!onOrgAccess && !isMine && activeId === workspace.id} />
                <span className="min-w-0 truncate">{workspace.name}</span>
              </button>
            ))
          )}

          {isPrimaryUser ? (
            <>
              <div className="workspace-switcher-divider" role="separator" />
              <button
                type="button"
                role="menuitem"
                className="workspace-switcher-item"
                onClick={chooseOrgAccess}
              >
                <CheckIcon visible={onOrgAccess} />
                <span>Organization access</span>
              </button>
            </>
          ) : null}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="px-2 pb-2 pt-1" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className="workspace-switcher"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${trigger.title}. ${trigger.subtext}`}
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          updateMenuBox();
          setOpen(true);
        }}
      >
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-[#1a2340]">{trigger.title}</span>
          <span className="mt-0.5 block truncate text-xs text-[#8c9baa]" title={trigger.subtext}>
            {trigger.subtext}
          </span>
        </span>
        <span
          className={`wm-expand-more shrink-0 text-base text-[#8c9baa] ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {menu}
    </div>
  );
}
