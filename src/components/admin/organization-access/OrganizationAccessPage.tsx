'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { detailPageGutter } from '@/components/ui/page-layout';
import { UserPermissionsDrawer } from '@/components/admin/organization-access/UserPermissionsDrawer';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import {
  DEMO_ORG_OPTIONS,
  DEMO_ROLE_OPTIONS,
  DEMO_SAVE_OPTIONS,
  creationSummary,
  getInitials,
  getOrganizationMembers,
  updateMemberPermissions,
  workspaceAccessSummary,
  type DemoAccessRole,
  type DemoOrgSize,
  type DemoSaveOutcome,
  type OrgMember,
} from '@/data/mock-organization-access';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);
const WuAvatar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAvatar })),
  { ssr: false },
);
const WuAlert = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAlert })),
  { ssr: false },
);

const compactSelectClass =
  'w-[8.75rem] shrink-0 [&_button]:!h-8 [&_button]:!min-h-8 [&_button]:!px-2 [&_button]:!text-xs';

export function OrganizationAccessPage() {
  const { showToast } = useWuShowToast();
  const { currentUser } = useWorkspaceSession();
  const [role, setRole] = useState<DemoAccessRole>('primary');
  const [orgSize, setOrgSize] = useState<DemoOrgSize>('typical');
  const [saveOutcome, setSaveOutcome] = useState<DemoSaveOutcome>('success');
  const [members, setMembers] = useState<OrgMember[]>(() => getOrganizationMembers('typical'));
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingSwitch, setPendingSwitch] = useState<(() => void) | null>(null);
  const [leaveListOpen, setLeaveListOpen] = useState(false);

  const isPrimaryUser = currentUser.isPrimaryUser && role === 'primary';
  const selectedMember = members.find((member) => member.id === selectedId) ?? null;
  const manageableCount = members.filter((member) => !member.isPrimaryUser).length;

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setHasUnsavedChanges(dirty);
  }, []);

  const reloadMembers = useCallback((size: DemoOrgSize) => {
    setMembers(getOrganizationMembers(size));
    setSearch('');
    setSelectedId(null);
    setDrawerOpen(false);
    setHasUnsavedChanges(false);
  }, []);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = query
      ? members.filter(
          (member) =>
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query),
        )
      : members;

    return [...list].sort((a, b) => {
      if (a.isPrimaryUser !== b.isPrimaryUser) return a.isPrimaryUser ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [members, search]);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges]);

  const openMember = useCallback((member: OrgMember) => {
    setSelectedId(member.id);
    setDrawerOpen(true);
  }, []);

  const requestOpenMember = useCallback(
    (member: OrgMember) => {
      if (hasUnsavedChanges && selectedId && member.id !== selectedId) {
        setPendingSwitch(() => () => openMember(member));
        setLeaveListOpen(true);
        return;
      }
      openMember(member);
    },
    [hasUnsavedChanges, selectedId, openMember],
  );

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) {
      setSelectedId(null);
      setHasUnsavedChanges(false);
    }
  }

  async function handleSave(next: Pick<OrgMember, 'projectCreation' | 'workspaceAccess'>) {
    if (!selectedMember || selectedMember.isPrimaryUser) return;

    setSaving(true);
    try {
      const updated = await updateMemberPermissions(
        orgSize,
        selectedMember.id,
        next,
        saveOutcome,
      );
      setMembers(getOrganizationMembers(orgSize).map((member) =>
        member.id === updated.id ? updated : member,
      ));
      showToast({ message: 'Permissions updated successfully.', variant: 'success' });
      setHasUnsavedChanges(false);
      setDrawerOpen(false);
      setSelectedId(null);
    } catch {
      showToast({
        message: 'Unable to update permissions. Please try again.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  function requestOrgChange(nextSize: DemoOrgSize) {
    if (nextSize === orgSize) return;
    const apply = () => {
      setOrgSize(nextSize);
      reloadMembers(nextSize);
    };
    if (hasUnsavedChanges) {
      setPendingSwitch(() => apply);
      setLeaveListOpen(true);
      return;
    }
    apply();
  }

  function requestRoleChange(nextRole: DemoAccessRole) {
    if (nextRole === role) return;
    const apply = () => {
      setRole(nextRole);
      setDrawerOpen(false);
      setSelectedId(null);
    };
    if (hasUnsavedChanges) {
      setPendingSwitch(() => apply);
      setLeaveListOpen(true);
      return;
    }
    apply();
  }

  const columns = useMemo<IWuTableColumnDef<OrgMember>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        enableSorting: true,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex w-max items-center gap-3">
              <WuAvatar size="sm" fallback={getInitials(user.name)} alt={user.name} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="max-w-[18rem] truncate text-left text-sm font-medium text-[#1a2340] hover:text-[#1b87e6]"
                    title={user.name}
                    onClick={() => requestOpenMember(user)}
                  >
                    {user.name}
                  </button>
                  {user.isPrimaryUser && (
                    <span className="inline-flex shrink-0 items-center rounded px-2 py-0.5 text-[11px] font-medium text-[#1b87e6] bg-[#e8f0fe]">
                      Primary user
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-[#8c9baa]" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'projectCreation',
        header: 'Project creation',
        enableSorting: true,
        accessorFn: (row) => creationSummary(row.projectCreation).join(', ') || 'None',
        cell: ({ row }) => {
          const labels = creationSummary(row.original.projectCreation);
          if (labels.length === 0) {
            return <span className="text-sm text-[#8c9baa]">None</span>;
          }
          return (
            <div className="flex w-max flex-nowrap items-center gap-1.5">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex shrink-0 items-center whitespace-nowrap rounded px-2 py-0.5 text-xs text-[#1b87e6] bg-[#e8f0fe]"
                >
                  {label}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'workspaceAccess',
        header: 'Workspace access',
        enableSorting: true,
        accessorFn: (row) => row.workspaceAccess.length,
        cell: ({ row }) => {
          const summary = workspaceAccessSummary(row.original, members.length);
          return (
            <span
              className={`inline-block w-max text-sm ${summary.isEmpty ? 'text-[#b06000]' : 'text-[#1a2340]'}`}
            >
              {summary.label}
            </span>
          );
        },
      },
      {
        accessorKey: 'id',
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => {
          const user = row.original;
          if (user.isPrimaryUser) {
            return (
              <WuButton size="sm" variant="outlined" onClick={() => requestOpenMember(user)}>
                View access
              </WuButton>
            );
          }
          return (
            <WuButton size="sm" variant="outlined" color="primary" onClick={() => requestOpenMember(user)}>
              Manage
            </WuButton>
          );
        },
      },
    ],
    [members.length, requestOpenMember],
  );

  return (
    <div className="pb-8">
      <div className={`${detailPageGutter} pt-6`}>
        <PageHeader
          title="Organization access"
          description="Manage what members of your organization can create and which workspaces they can access."
          divider
          action={
            <div className="flex flex-wrap items-center justify-end gap-3">
              <WuSelect
                data={DEMO_ROLE_OPTIONS as unknown as Record<string, unknown>[]}
                accessorKey={{ value: 'value', label: 'label' }}
                value={DEMO_ROLE_OPTIONS.find((option) => option.value === role) as unknown as Record<string, unknown>}
                onSelect={(item) =>
                  requestRoleChange((item as { value: DemoAccessRole }).value)
                }
                variant="outlined"
                labelPosition="left"
                Label={<span className="whitespace-nowrap text-xs font-medium text-[#8c9baa]">Demo role</span>}
                className={compactSelectClass}
              />
              <WuSelect
                data={DEMO_ORG_OPTIONS as unknown as Record<string, unknown>[]}
                accessorKey={{ value: 'value', label: 'label' }}
                value={DEMO_ORG_OPTIONS.find((option) => option.value === orgSize) as unknown as Record<string, unknown>}
                onSelect={(item) =>
                  requestOrgChange((item as { value: DemoOrgSize }).value)
                }
                variant="outlined"
                labelPosition="left"
                Label={<span className="whitespace-nowrap text-xs font-medium text-[#8c9baa]">Demo org</span>}
                className="w-[7.5rem] shrink-0 [&_button]:!h-8 [&_button]:!min-h-8 [&_button]:!px-2 [&_button]:!text-xs"
              />
              <WuSelect
                data={DEMO_SAVE_OPTIONS as unknown as Record<string, unknown>[]}
                accessorKey={{ value: 'value', label: 'label' }}
                value={DEMO_SAVE_OPTIONS.find((option) => option.value === saveOutcome) as unknown as Record<string, unknown>}
                onSelect={(item) =>
                  setSaveOutcome((item as { value: DemoSaveOutcome }).value)
                }
                variant="outlined"
                labelPosition="left"
                Label={<span className="whitespace-nowrap text-xs font-medium text-[#8c9baa]">Demo save</span>}
                className="w-[7.75rem] shrink-0 [&_button]:!h-8 [&_button]:!min-h-8 [&_button]:!px-2 [&_button]:!text-xs"
              />
            </div>
          }
        />

        {!isPrimaryUser ? (
          <div className="rounded-lg border border-[#e0e4e8] bg-white shadow-sm">
            <EmptyState
              icon="wm-lock"
              title={"You don't have access to Organization access."}
              description="Only the primary user can manage what members can create and which workspaces they can access."
            />
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#e0e4e8] bg-white shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#eef0f3] px-5 py-4">
              <div>
                <p className="text-base font-semibold text-[#1a2340]">Organization users</p>
                <p className="mt-0.5 text-sm text-[#8c9baa]">
                  {members.length} {members.length === 1 ? 'member' : 'members'}
                  {manageableCount === 0
                    ? ' · No other members to manage'
                    : ` · ${manageableCount} can be configured`}
                </p>
              </div>
              <div className="w-full max-w-xs">
                <WuInput
                  placeholder="Search members"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  variant="outlined"
                  Icon={<span className="wm-search" aria-hidden="true" />}
                  iconPosition="left"
                  aria-label="Search members"
                />
              </div>
            </div>

            {orgSize === 'solo' && (
              <div className="px-5 pt-4">
                <WuAlert variant="info" Icon={<span className="wm-info" aria-hidden="true" />}>
                  You are the only member of this organization. When teammates join, you can manage
                  what they can create and which workspaces they can access.
                </WuAlert>
              </div>
            )}

            {filteredMembers.length === 0 ? (
              <EmptyState
                icon="wm-search"
                title="No members match your search."
                description="Try a different name or email, or clear the search to see everyone in the organization."
              />
            ) : (
              <div className="organization-access-table px-2 py-2 [&_thead_tr]:bg-[#f5f5f5] [&_th]:text-[#54606b]">
                <WuTable
                  data={filteredMembers as unknown[]}
                  columns={columns as unknown as IWuTableColumnDef<unknown>[]}
                  variant="unstyled"
                  tableLayout="auto"
                  sort={{ enabled: true }}
                  NoDataContent={
                    <EmptyState
                      title="No members match your search."
                      description="Try a different name or email."
                    />
                  }
                />
              </div>
            )}
          </div>
        )}
      </div>

      <UserPermissionsDrawer
        key={selectedMember?.id ?? 'closed'}
        open={drawerOpen}
        member={selectedMember}
        orgMembers={members}
        saving={saving}
        onOpenChange={handleDrawerOpenChange}
        onSave={handleSave}
        onDirtyChange={handleDirtyChange}
      />

      <ConfirmModal
        open={leaveListOpen}
        onOpenChange={(open) => {
          setLeaveListOpen(open);
          if (!open) setPendingSwitch(null);
        }}
        title="Unsaved changes"
        description="Your permission changes have not been saved. Leave without saving?"
        confirmLabel="Leave"
        variant="action"
        onConfirm={() => {
          pendingSwitch?.();
          setPendingSwitch(null);
          setLeaveListOpen(false);
        }}
      />
    </div>
  );
}
