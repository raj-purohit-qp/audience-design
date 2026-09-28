'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  deleteUniqueResponseGroup,
  getAssociatedProjectsForGroup,
  isDuplicateUniqueResponseGroupName,
  loadUniqueResponseGroups,
  removeProjectFromUniqueResponseGroup,
  updateUniqueResponseGroup,
  type UniqueResponseGroup,
  type WaveGroupAssociatedProject,
} from '@/data/mock-unique-responses';
import { truncate } from '@/data/mock-utils';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);

const STATUS_DOT: Record<string, string> = {
  Bid: 'bg-[#1b87e6]',
  Paused: 'bg-[#f9ab00]',
  'Soft-launched': 'bg-[#1b87e6]',
  Live: 'bg-[#188038]',
  Closed: 'bg-[#9aa0a6]',
  Draft: 'bg-[#9aa0a6]',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-[#3c4043]">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status] ?? 'bg-[#9aa0a6]'}`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}

interface WaveGroupRow extends UniqueResponseGroup {
  projectCount: number;
}

export function WaveGroupManageTab({
  open,
  groups,
  onGroupsChange,
}: {
  open: boolean;
  groups: UniqueResponseGroup[];
  onGroupsChange: (groups: UniqueResponseGroup[]) => void;
}) {
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UniqueResponseGroup | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WaveGroupAssociatedProject | null>(null);

  const selectedGroup = groups.find((group) => group.id === selectedId) ?? null;

  useEffect(() => {
    if (open) return;
    setSearch('');
    setSelectedId(null);
    setName('');
    setDescription('');
    setNameError(null);
    setSaving(false);
    setDeleteTarget(null);
    setRemoveTarget(null);
  }, [open]);

  useEffect(() => {
    if (!selectedGroup) return;
    setName(selectedGroup.name);
    setDescription(selectedGroup.description ?? '');
    setNameError(null);
  }, [selectedGroup]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows: WaveGroupRow[] = groups.map((group) => ({
      ...group,
      projectCount: group.projectIds.length,
    }));
    if (!query) return rows;
    return rows.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.description ?? '').toLowerCase().includes(query),
    );
  }, [groups, search]);

  const associatedProjects = useMemo(
    () => (selectedGroup ? getAssociatedProjectsForGroup(selectedGroup) : []),
    [selectedGroup],
  );

  const isDirty =
    Boolean(selectedGroup) &&
    (name.trim() !== selectedGroup?.name ||
      description.trim() !== (selectedGroup.description ?? ''));

  function refreshGroups() {
    onGroupsChange(loadUniqueResponseGroups());
  }

  function handleSave() {
    if (!selectedGroup) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Enter a group name.');
      return;
    }
    if (isDuplicateUniqueResponseGroupName(trimmed, loadUniqueResponseGroups(), selectedGroup.id)) {
      setNameError('A group with this name already exists.');
      return;
    }

    setSaving(true);
    window.setTimeout(() => {
      const updated = updateUniqueResponseGroup(selectedGroup.id, {
        name: trimmed,
        description,
      });
      setSaving(false);
      if (!updated) {
        showToast({ message: 'Wave group could not be updated', variant: 'error' });
        return;
      }
      refreshGroups();
      showToast({ message: 'Wave group updated', variant: 'success' });
    }, 280);
  }

  function handleRemoveProject() {
    if (!selectedGroup || !removeTarget) return;
    const updated = removeProjectFromUniqueResponseGroup(selectedGroup.id, removeTarget.id);
    if (!updated) {
      showToast({ message: 'Project could not be removed', variant: 'error' });
      return;
    }
    refreshGroups();
    showToast({
      message: `${removeTarget.name} removed from this wave group`,
      variant: 'success',
    });
    setRemoveTarget(null);
  }

  function handleDeleteGroup() {
    if (!deleteTarget) return;
    const deleted = deleteUniqueResponseGroup(deleteTarget.id);
    if (!deleted) {
      showToast({ message: 'Wave group could not be deleted', variant: 'error' });
      return;
    }
    if (selectedId === deleteTarget.id) setSelectedId(null);
    refreshGroups();
    showToast({ message: `${deleteTarget.name} deleted`, variant: 'success' });
    setDeleteTarget(null);
  }

  const listColumns = useMemo<IWuTableColumnDef<WaveGroupRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Wave group',
        cell: ({ row }) => (
          <button
            type="button"
            className="block max-w-[16rem] truncate text-left text-sm font-medium text-[#1b87e6] hover:underline"
            title={row.original.name}
            onClick={() => setSelectedId(row.original.id)}
          >
            {row.original.name}
          </button>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
          const value = row.original.description?.trim();
          if (!value) return <span className="text-sm text-[#8c9baa]">—</span>;
          return (
            <span className="block max-w-[18rem] text-sm text-[#54606b]" title={value}>
              {truncate(value, 72)}
            </span>
          );
        },
      },
      {
        accessorKey: 'projectCount',
        header: 'Projects',
        cell: ({ row }) => (
          <span className="text-sm text-[#1a2340]">{row.original.projectCount}</span>
        ),
      },
      {
        accessorKey: 'id',
        id: 'actions',
        header: '',
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <div className="wave-group-row-actions flex items-center justify-end gap-2 opacity-0 transition-opacity duration-150">
            <WuButton
              type="button"
              variant="outlined"
              color="primary"
              size="sm"
              onClick={() => setSelectedId(row.original.id)}
            >
              View
            </WuButton>
            <WuButton
              type="button"
              variant="outlined"
              color="error"
              size="sm"
              onClick={() => setDeleteTarget(row.original)}
            >
              Delete
            </WuButton>
          </div>
        ),
      },
    ],
    [],
  );

  const projectColumns = useMemo<IWuTableColumnDef<WaveGroupAssociatedProject>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Project name',
        cell: ({ row }) => (
          <span className="block max-w-[16rem] truncate text-sm font-medium text-[#1a2340]" title={row.original.name}>
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'projectId',
        header: 'Project ID',
        cell: ({ row }) => (
          <span className="text-sm text-[#54606b]">{row.original.projectId}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'id',
        id: 'actions',
        header: '',
        headerAlign: 'right',
        cellAlign: 'right',
        cell: ({ row }) => (
          <div className="wave-group-project-actions flex justify-end opacity-0 transition-opacity duration-150">
            <WuButton
              type="button"
              variant="outlined"
              color="error"
              size="sm"
              onClick={() => setRemoveTarget(row.original)}
            >
              Remove
            </WuButton>
          </div>
        ),
      },
    ],
    [],
  );

  if (selectedGroup) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-[#1b87e6] hover:underline"
            onClick={() => setSelectedId(null)}
          >
            <span className="wm-arrow-back text-base" aria-hidden="true" />
            All wave groups
          </button>
          <WuButton variant="outlined" color="error" size="sm" onClick={() => setDeleteTarget(selectedGroup)}>
            Delete wave group
          </WuButton>
        </div>

        <div className="space-y-3">
          <WuInput
            Label="Wave group name"
            variant="outlined"
            labelPosition="top"
            value={name}
            invalid={!!nameError}
            className="w-full"
            aria-invalid={!!nameError}
            aria-describedby={nameError ? 'wave-group-name-error' : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
          />
          {nameError && (
            <p id="wave-group-name-error" className="text-xs text-[#d93025]" role="alert">
              {nameError}
            </p>
          )}
          <WuTextarea
            Label="Description"
            variant="outlined"
            labelPosition="top"
            placeholder="Optional. Describe how this wave group is used."
            value={description}
            rows={3}
            className="w-full"
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end">
            <WuButton onClick={handleSave} disabled={!isDirty || saving} loading={saving}>
              Save changes
            </WuButton>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-[#1a2340]">Associated projects</p>
          <p className="mt-0.5 text-xs text-[#8c9baa]">
            Respondents who complete one of these projects cannot take other projects in this wave group.
          </p>
        </div>

        {associatedProjects.length === 0 ? (
          <EmptyState
            icon="wm-work"
            title="No associated projects"
            description="Projects assigned to this wave group will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-md border border-[#e0e4e8] [&_tbody_tr:hover_.wave-group-project-actions]:opacity-100">
            <WuTable
              data={associatedProjects as unknown[]}
              columns={projectColumns as unknown as IWuTableColumnDef<unknown>[]}
            />
          </div>
        )}

        <ConfirmModal
          open={Boolean(removeTarget)}
          onOpenChange={(next) => {
            if (!next) setRemoveTarget(null);
          }}
          title="Remove project"
          description={
            removeTarget
              ? `${removeTarget.name} will no longer be associated with this wave group.`
              : ''
          }
          confirmLabel="Remove project"
          variant="critical"
          onConfirm={handleRemoveProject}
        />

        <ConfirmModal
          open={Boolean(deleteTarget)}
          onOpenChange={(next) => {
            if (!next) setDeleteTarget(null);
          }}
          title="Delete wave group"
          description={
            deleteTarget
              ? `${deleteTarget.name} will be removed and will no longer be available when assigning Unique Responses to a project. Associated projects are not deleted.`
              : ''
          }
          confirmLabel="Delete wave group"
          variant="critical"
          onConfirm={handleDeleteGroup}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Open a wave group to update its name or description, remove a project, or delete the group.
      </p>
      <WuInput
        variant="flat"
        placeholder="Search"
        Icon={<span className="wm-search text-sm" aria-hidden="true" />}
        iconPosition="left"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 w-[160px] !bg-[rgba(0,0,0,0.04)]"
        aria-label="Search wave groups"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon="wm-layers"
          title="No wave groups yet"
          description="Create a wave group on the Create wave group tab."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="wm-search"
          title="No matching wave groups"
          description="Try a different name or description."
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-[#e0e4e8] [&_tbody_tr:hover_.wave-group-row-actions]:opacity-100">
          <WuTable
            data={filtered as unknown[]}
            columns={listColumns as unknown as IWuTableColumnDef<unknown>[]}
          />
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title="Delete wave group"
        description={
          deleteTarget
            ? `${deleteTarget.name} will be removed and will no longer be available when assigning Unique Responses to a project. Associated projects are not deleted.`
            : ''
        }
        confirmLabel="Delete wave group"
        variant="critical"
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
