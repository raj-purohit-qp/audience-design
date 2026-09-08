'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { SettingsCard } from '@/components/admin/panel-settings/SettingsCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  ACCESS_LEVEL_LABEL,
  CREATION_PRODUCTS,
  getInitials,
  getWorkspaceOptions,
  permissionsEqual,
  type AccessLevel,
  type OrgMember,
  type ProjectCreationPermissions,
  type WorkspaceGrant,
  type WorkspaceOption,
} from '@/data/mock-organization-access';

const WuDrawer = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDrawer })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false },
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false },
);
const WuSwitcher = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSwitcher })),
  { ssr: false },
);
const WuAlert = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAlert })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);
const WuAvatar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAvatar })),
  { ssr: false },
);

const ACCESS_SWITCH_OPTIONS: [{ value: AccessLevel; label: string }, { value: AccessLevel; label: string }] = [
  { value: 'read', label: 'Read' },
  { value: 'read_write', label: 'Read & write' },
];

interface UserPermissionsDrawerProps {
  open: boolean;
  member: OrgMember | null;
  orgMembers: OrgMember[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (next: Pick<OrgMember, 'projectCreation' | 'workspaceAccess'>) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

interface PendingConfirm {
  title: string;
  description: string;
  confirmLabel: string;
  variant: 'action' | 'critical';
  apply: () => void;
}

function memberNameById(members: OrgMember[], id: string): string {
  return members.find((m) => m.id === id)?.name ?? 'this workspace';
}

export function UserPermissionsDrawer({
  open,
  member,
  orgMembers,
  saving,
  onOpenChange,
  onSave,
  onDirtyChange,
}: UserPermissionsDrawerProps) {
  const readOnly = Boolean(member?.isPrimaryUser);
  const [draftCreation, setDraftCreation] = useState<ProjectCreationPermissions | null>(
    () => (member ? { ...member.projectCreation } : null),
  );
  const [draftAccess, setDraftAccess] = useState<WorkspaceGrant[] | null>(
    () => (member ? member.workspaceAccess.map((grant) => ({ ...grant })) : null),
  );
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const baseline = member;
  const creation = draftCreation ?? member?.projectCreation ?? null;
  const access = useMemo<WorkspaceGrant[]>(
    () => draftAccess ?? member?.workspaceAccess ?? [],
    [draftAccess, member],
  );

  const workspaceOptions = useMemo(() => getWorkspaceOptions(orgMembers), [orgMembers]);

  const selectedOptions = useMemo(
    () => workspaceOptions.filter((option) => access.some((grant) => grant.userId === option.value)),
    [workspaceOptions, access],
  );

  const isDirty = useMemo(() => {
    if (!baseline || !creation) return false;
    return !permissionsEqual(
      { projectCreation: creation, workspaceAccess: access },
      { projectCreation: baseline.projectCreation, workspaceAccess: baseline.workspaceAccess },
    );
  }, [baseline, creation, access]);

  useEffect(() => {
    onDirtyChange?.(Boolean(isDirty && !readOnly && open));
  }, [isDirty, readOnly, open, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange?.(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function syncFromMember(next: OrgMember | null) {
    if (!next) {
      setDraftCreation(null);
      setDraftAccess(null);
      return;
    }
    setDraftCreation({ ...next.projectCreation });
    setDraftAccess(next.workspaceAccess.map((grant) => ({ ...grant })));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      syncFromMember(member);
      onOpenChange(true);
      return;
    }

    if (isDirty && !readOnly) {
      setLeaveOpen(true);
      return;
    }

    setDraftCreation(null);
    setDraftAccess(null);
    onOpenChange(false);
  }

  function handleCancel() {
    handleOpenChange(false);
  }

  function applyWorkspaceSelection(nextSelected: WorkspaceOption[]) {
    const nextIds = new Set(nextSelected.map((option) => option.value));
    const kept = access.filter((grant) => nextIds.has(grant.userId));
    const keptIds = new Set(kept.map((grant) => grant.userId));
    const added = nextSelected
      .filter((option) => !keptIds.has(option.value))
      .map((option) => ({ userId: option.value, access: 'read_write' as AccessLevel }));
    setDraftAccess([...kept, ...added]);
  }

  function requestWorkspaceSelection(nextSelected: WorkspaceOption[]) {
    if (readOnly) return;

    const previousIds = new Set(access.map((grant) => grant.userId));
    const nextIds = new Set(nextSelected.map((option) => option.value));
    const removed = [...previousIds].filter((id) => !nextIds.has(id));

    if (removed.length === 0) {
      applyWorkspaceSelection(nextSelected);
      return;
    }

    const description =
      removed.length === 1
        ? `${member?.name ?? 'This user'} will no longer be able to access ${memberNameById(orgMembers, removed[0])}'s workspace.`
        : `${member?.name ?? 'This user'} will no longer be able to access ${removed.length} workspaces.`;

    setPendingConfirm({
      title: removed.length === 1 ? 'Remove workspace access?' : 'Remove workspace access?',
      description,
      confirmLabel: 'Remove access',
      variant: 'critical',
      apply: () => applyWorkspaceSelection(nextSelected),
    });
  }

  function requestAccessChange(userId: string, nextAccess: AccessLevel) {
    if (readOnly) return;
    const current = access.find((grant) => grant.userId === userId);
    if (!current || current.access === nextAccess) return;

    if (current.access === 'read_write' && nextAccess === 'read') {
      setPendingConfirm({
        title: 'Change to read access?',
        description: `${member?.name ?? 'This user'} will lose the ability to modify projects in ${memberNameById(orgMembers, userId)}'s workspace.`,
        confirmLabel: 'Change to read',
        variant: 'action',
        apply: () => {
          setDraftAccess(
            access.map((grant) => (grant.userId === userId ? { ...grant, access: 'read' } : grant)),
          );
        },
      });
      return;
    }

    setDraftAccess(
      access.map((grant) => (grant.userId === userId ? { ...grant, access: nextAccess } : grant)),
    );
  }

  function requestApplyAllAccess(nextAccess: AccessLevel) {
    if (readOnly || access.length === 0) return;
    const hasDowngrade = nextAccess === 'read' && access.some((grant) => grant.access === 'read_write');

    const apply = () => {
      setDraftAccess(access.map((grant) => ({ ...grant, access: nextAccess })));
    };

    if (hasDowngrade) {
      setPendingConfirm({
        title: 'Change all workspaces to read?',
        description: `${member?.name ?? 'This user'} will lose the ability to modify projects in every selected workspace.`,
        confirmLabel: 'Change to read',
        variant: 'action',
        apply,
      });
      return;
    }

    apply();
  }

  const orderedAccess = useMemo(() => {
    const byId = new Map(access.map((grant) => [grant.userId, grant]));
    return orgMembers
      .map((orgMember) => byId.get(orgMember.id))
      .filter((grant): grant is WorkspaceGrant => Boolean(grant));
  }, [access, orgMembers]);

  if (!member || !creation) {
    return null;
  }

  return (
    <>
      <WuDrawer
        open={open}
        onOpenChange={handleOpenChange}
        side="right"
        preventClickOutside={isDirty && !readOnly}
        className="organization-access-drawer flex flex-col"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="organization-access-user-header">
            <div className="px-6 pr-14 pb-4 pt-6">
              <div className="flex items-start gap-3">
                <WuAvatar size="lg" fallback={getInitials(member.name)} alt={member.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <WuHeading size="sm" className="truncate text-[#1a2340]">
                      {member.name}
                    </WuHeading>
                    {member.isPrimaryUser && (
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium text-[#1b87e6] bg-[#e8f0fe]">
                        Primary user
                      </span>
                    )}
                  </div>
                  <WuSubtext size="sm" className="mt-0.5 truncate">
                    {member.email}
                  </WuSubtext>
                </div>
              </div>
            </div>
            <div className="organization-access-user-divider" aria-hidden="true" />
          </div>
          {(readOnly || (isDirty && !readOnly)) && (
            <div className="px-6 pt-4">
              {readOnly && (
                <WuAlert variant="info" Icon={<span className="wm-info" aria-hidden="true" />}>
                  Administrative access cannot be changed. The primary user always retains full
                  organization administration.
                </WuAlert>
              )}
              {isDirty && !readOnly && (
                <p className="text-xs font-medium text-[#b06000]">Unsaved changes</p>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-6">
            <SettingsCard
              title="Project creation"
              subtitle="Choose which Audience products this user can create."
            >
              <div className="space-y-3">
                {CREATION_PRODUCTS.map((product) => (
                  <div
                    key={product.key}
                    className="flex items-start justify-between gap-6 rounded-md border border-[#e0e4e8] bg-white px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1a2340]">{product.label}</p>
                      <p className="mt-1 text-xs text-[#8c9baa]">{product.description}</p>
                    </div>
                    <WuToggle
                      checked={creation[product.key]}
                      disabled={readOnly}
                      Label={creation[product.key] ? 'On' : 'Off'}
                      labelPosition="right"
                      onChange={(checked) =>
                        setDraftCreation({ ...creation, [product.key]: checked })
                      }
                      aria-label={product.label}
                    />
                  </div>
                ))}
              </div>
            </SettingsCard>

            <SettingsCard
              title="Workspace access"
              subtitle="Choose which users' workspaces this user can access."
            >
              <div>
                <WuCombobox
                  data={workspaceOptions}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedOptions}
                  onSelect={(value) => {
                    const next = (Array.isArray(value) ? value : value ? [value] : []) as WorkspaceOption[];
                    requestWorkspaceSelection(next);
                  }}
                  multiple
                  enableSearch
                  selectAll={{ enable: true, label: 'Select all' }}
                  Label="Accessible workspaces"
                  labelPosition="top"
                  placeholder="Select workspaces"
                  variant="outlined"
                  disabled={readOnly}
                  maxHeight={280}
                  virtualizedThreshold={12}
                />
                <p className="mt-2 text-xs text-[#8c9baa]">
                  {selectedOptions.length === workspaceOptions.length
                    ? 'All organization workspaces are selected.'
                    : `${selectedOptions.length} of ${workspaceOptions.length} workspaces selected.`}
                </p>
              </div>

              {access.length === 0 ? (
                <div className="mt-4">
                  <WuAlert variant="warning" Icon={<span className="wm-warning" aria-hidden="true" />}>
                    This user will not be able to access any workspaces.
                  </WuAlert>
                </div>
              ) : (
                <div className="mt-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#1a2340]">Access level</p>
                      <p className="mt-0.5 text-xs text-[#8c9baa]">
                        Read lets this user view projects and reports. Read & write also lets them
                        edit projects. Ownership does not change.
                      </p>
                    </div>
                    {access.length > 1 && !readOnly && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#8c9baa]">Apply to all</span>
                        <WuButton
                          size="sm"
                          variant="outlined"
                          onClick={() => requestApplyAllAccess('read')}
                        >
                          Read
                        </WuButton>
                        <WuButton
                          size="sm"
                          variant="outlined"
                          onClick={() => requestApplyAllAccess('read_write')}
                        >
                          Read & write
                        </WuButton>
                      </div>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-md border border-[#e0e4e8]">
                    <div className="grid grid-cols-[minmax(0,1fr)_11rem] border-b border-[#e0e4e8] bg-[#f5f5f5] px-3 py-2 text-xs font-medium text-[#54606b]">
                      <span>Workspace</span>
                      <span>Access</span>
                    </div>
                    <ul className="max-h-[22rem] divide-y divide-[#eef0f3] overflow-y-auto">
                      {orderedAccess.map((grant) => {
                        const workspaceMember = orgMembers.find((item) => item.id === grant.userId);
                        if (!workspaceMember) return null;
                        return (
                          <li
                            key={grant.userId}
                            className="grid grid-cols-[minmax(0,1fr)_11rem] items-center gap-3 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm text-[#1a2340]" title={workspaceMember.name}>
                                {workspaceMember.name}
                              </p>
                              {workspaceMember.isPrimaryUser && (
                                <p className="text-xs text-[#1b87e6]">Primary user</p>
                              )}
                            </div>
                            {readOnly ? (
                              <span className="text-sm text-[#54606b]">
                                {ACCESS_LEVEL_LABEL[grant.access]}
                              </span>
                            ) : (
                              <WuSwitcher
                                type="toggle"
                                size="sm"
                                value={grant.access}
                                options={ACCESS_SWITCH_OPTIONS}
                                onChange={(value) =>
                                  requestAccessChange(grant.userId, value as AccessLevel)
                                }
                              />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </SettingsCard>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-[#e0e4e8] bg-white px-6 py-4">
            {readOnly ? (
              <WuButton variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </WuButton>
            ) : (
              <>
                <WuButton variant="secondary" onClick={handleCancel} disabled={saving}>
                  Cancel
                </WuButton>
                <WuButton
                  variant="primary"
                  onClick={() => onSave({ projectCreation: creation, workspaceAccess: access })}
                  disabled={!isDirty || saving}
                  loading={saving}
                >
                  Update permissions
                </WuButton>
              </>
            )}
          </div>
        </div>
      </WuDrawer>

      <ConfirmModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        title="Unsaved changes"
        description="Your permission changes have not been saved. Leave without saving?"
        confirmLabel="Leave"
        variant="action"
        onConfirm={() => {
          setDraftCreation(null);
          setDraftAccess(null);
          setLeaveOpen(false);
          onOpenChange(false);
        }}
      />

      <ConfirmModal
        open={pendingConfirm !== null}
        onOpenChange={(next) => {
          if (!next) setPendingConfirm(null);
        }}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description ?? ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        variant={pendingConfirm?.variant ?? 'action'}
        onConfirm={() => {
          pendingConfirm?.apply();
          setPendingConfirm(null);
        }}
      />
    </>
  );
}
