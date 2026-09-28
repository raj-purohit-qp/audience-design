'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateUniqueResponseGroupModal } from '@/components/projects/CreateUniqueResponseGroupModal';
import {
  createUniqueResponseGroup,
  DEFAULT_UNIQUE_RESPONSE_GROUPS,
  loadUniqueResponseGroups,
  NONE_UNIQUE_RESPONSE_VALUE,
  type UniqueResponseGroup,
} from '@/data/mock-unique-responses';

interface UniqueResponsesFieldProps {
  value: UniqueResponseGroup | null;
  onChange: (group: UniqueResponseGroup | null) => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-[#54606b]">{children}</span>;
}

const UniqueResponsesFieldInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const { WuMenu, WuMenuItem, WuMenuSeparatorItem, WuTooltip } = lib;

      return function UniqueResponsesFieldInner({
        value,
        onChange,
        groups,
        onCreateNew,
      }: UniqueResponsesFieldProps & {
        groups: UniqueResponseGroup[];
        onCreateNew: () => void;
      }) {
        const selectedId = value?.id ?? NONE_UNIQUE_RESPONSE_VALUE;
        const selectedLabel = value?.name ?? 'None';
        const showFullNameTooltip = selectedLabel.length > 24;

        function selectGroup(nextId: string) {
          if (nextId === NONE_UNIQUE_RESPONSE_VALUE) {
            onChange(null);
            return;
          }
          onChange(groups.find((group) => group.id === nextId) ?? null);
        }

        const options = [
          { id: NONE_UNIQUE_RESPONSE_VALUE, label: 'None' },
          ...groups.map((group) => ({ id: group.id, label: group.name })),
        ];
        const longestLabel = [
          ...options.map((option) => option.label),
          'Create wave group',
          ...(groups.length === 0 ? ['No groups created yet'] : []),
        ].reduce((longest, label) => (label.length > longest.length ? label : longest), 'None');

        return (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5">
              <FieldLabel>Unique responses</FieldLabel>
              <WuTooltip content="Respondents who take one project in this group cannot take other projects in the same group.">
                <span
                  className="wm-info cursor-help text-sm text-[#8c9baa]"
                  aria-label="Unique responses help"
                />
              </WuTooltip>
            </div>
            <div className="inline-block max-w-full">
              <span
                className="invisible float-left h-0 overflow-hidden whitespace-nowrap px-2 pe-8 text-xs"
                aria-hidden="true"
              >
                {longestLabel}
              </span>
              <div className="w-1/2 min-w-[8rem] max-w-full">
                <WuMenu
                  variant="outlined"
                  className="w-full"
                  aria-label="Unique responses"
                  title={showFullNameTooltip ? selectedLabel : undefined}
                  slots={{ popup: { width: 'var(--anchor-width)' } }}
                  Placeholder={
                    <span className="block min-w-0 max-w-full truncate">{selectedLabel}</span>
                  }
                >
                  {options.map((option) => {
                    const selected = option.id === selectedId;
                    return (
                      <WuMenuItem
                        key={option.id}
                        onClick={() => selectGroup(option.id)}
                        aria-current={selected ? 'true' : undefined}
                        className={selected ? 'wu-bg-gray-10' : undefined}
                      >
                        <span className="block truncate" title={option.label}>
                          {option.label}
                        </span>
                      </WuMenuItem>
                    );
                  })}
                  <WuMenuSeparatorItem />
                  {groups.length === 0 && (
                    <>
                      <WuMenuItem disabled>No groups created yet</WuMenuItem>
                      <WuMenuSeparatorItem />
                    </>
                  )}
                  <WuMenuItem
                    onClick={onCreateNew}
                    Icon={<span className="wm-add text-sm" aria-hidden="true" />}
                    iconPosition="left"
                  >
                    Create wave group
                  </WuMenuItem>
                </WuMenu>
              </div>
            </div>
          </div>
        );
      };
    }),
  { ssr: false },
);

export function UniqueResponsesField({ value, onChange }: UniqueResponsesFieldProps) {
  const { showToast } = useWuShowToast();
  const [groups, setGroups] = useState<UniqueResponseGroup[]>(DEFAULT_UNIQUE_RESPONSE_GROUPS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setGroups(loadUniqueResponseGroups());
  }, []);

  function handleGroupsChange(next: UniqueResponseGroup[]) {
    setGroups(next);
    if (!value) return;
    const stillAssigned = next.find((group) => group.id === value.id);
    onChange(stillAssigned ?? null);
  }

  function handleCreate(name: string, projectIds: string[], description: string) {
    const group = createUniqueResponseGroup(name, groups, projectIds, description);
    setGroups(loadUniqueResponseGroups());
    onChange(group);
    const addedCount = projectIds.length;
    showToast({
      message:
        addedCount > 0
          ? `Unique response group created with ${addedCount} launched ${addedCount === 1 ? 'project' : 'projects'}`
          : 'Unique response group created',
      variant: 'success',
    });
  }

  return (
    <>
      <UniqueResponsesFieldInner
        value={value}
        onChange={onChange}
        groups={groups}
        onCreateNew={() => setIsCreateOpen(true)}
      />
      <CreateUniqueResponseGroupModal
        open={isCreateOpen}
        groups={groups}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
        onGroupsChange={handleGroupsChange}
      />
    </>
  );
}
