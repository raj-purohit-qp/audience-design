'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { WaveGroupManageTab } from '@/components/wave-groups/WaveGroupManageTab';
import {
  getLaunchedProjectOptions,
  type UniqueResponseGroup,
  type UniqueResponseProjectOption,
} from '@/data/mock-unique-responses';

interface CreateUniqueResponseGroupModalProps {
  open: boolean;
  groups: UniqueResponseGroup[];
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string, projectIds: string[], description: string) => void;
  onGroupsChange: (groups: UniqueResponseGroup[]) => void;
}

const LAUNCHED_PROJECT_OPTIONS = getLaunchedProjectOptions();

const CreateUniqueResponseGroupModalInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const {
        WuModal,
        WuModalHeader,
        WuModalContent,
        WuModalFooter,
        WuModalClose,
        WuButton,
        WuInput,
        WuTextarea,
        WuSelect,
        WuChip,
        WuTab,
      } = lib;

      return function CreateUniqueResponseGroupModalInner({
        open,
        groups,
        onOpenChange,
        onCreate,
        onGroupsChange,
      }: CreateUniqueResponseGroupModalProps) {
        const [tab, setTab] = useState('create');
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [selectedProjects, setSelectedProjects] = useState<UniqueResponseProjectOption[]>([]);
        const [error, setError] = useState<string | null>(null);
        const [creating, setCreating] = useState(false);
        const createTimerRef = useRef<number | null>(null);

        useEffect(() => {
          if (open) return;
          setTab('create');
          setName('');
          setDescription('');
          setSelectedProjects([]);
          setError(null);
          setCreating(false);
          if (createTimerRef.current !== null) {
            window.clearTimeout(createTimerRef.current);
            createTimerRef.current = null;
          }
        }, [open]);

        useEffect(() => {
          return () => {
            if (createTimerRef.current !== null) {
              window.clearTimeout(createTimerRef.current);
            }
          };
        }, []);

        function validate(raw: string): string | null {
          const trimmed = raw.trim();
          if (!trimmed) return 'Enter a group name.';
          const duplicate = groups.some(
            (existing) => existing.name.trim().toLowerCase() === trimmed.toLowerCase(),
          );
          if (duplicate) return 'A group with this name already exists.';
          return null;
        }

        function removeProject(projectId: string) {
          setSelectedProjects((prev) => prev.filter((project) => project.value !== projectId));
        }

        function handleCreate() {
          const nextError = validate(name);
          if (nextError) {
            setError(nextError);
            return;
          }

          setCreating(true);
          createTimerRef.current = window.setTimeout(() => {
            createTimerRef.current = null;
            onCreate(
              name.trim(),
              selectedProjects.map((project) => project.value),
              description.trim(),
            );
            setCreating(false);
            onOpenChange(false);
          }, 450);
        }

        function handleOpenChange(next: boolean) {
          if (creating && !next) return;
          onOpenChange(next);
        }

        const tabItems: IWuTabItem[] = [
          {
            value: 'create',
            Trigger: 'Create wave group',
            Content: (
              <div className="space-y-4 pt-4">
                <p className="text-sm text-gray-600">
                  Create a group to ensure respondents who participate in one project cannot participate
                  in other projects within the same group.
                </p>
                <WuInput
                  Label="Group name"
                  variant="outlined"
                  labelPosition="top"
                  placeholder="Enter group name"
                  value={name}
                  invalid={!!error}
                  disabled={creating}
                  autoFocus
                  className="w-full"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'unique-response-group-name-error' : undefined}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!creating) handleCreate();
                    }
                  }}
                />
                {error && (
                  <p
                    id="unique-response-group-name-error"
                    className="mt-1 text-xs text-[#d93025]"
                    role="alert"
                  >
                    {error}
                  </p>
                )}

                <WuTextarea
                  Label="Description"
                  variant="outlined"
                  labelPosition="top"
                  placeholder="Optional. Describe how this wave group is used."
                  value={description}
                  disabled={creating}
                  rows={3}
                  className="w-full"
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div>
                  <WuSelect
                    multiple
                    data={LAUNCHED_PROJECT_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedProjects}
                    onSelect={(next) =>
                      setSelectedProjects((next as UniqueResponseProjectOption[]) ?? [])
                    }
                    Label="Launched projects"
                    placeholder="Select launched projects"
                    variant="outlined"
                    className="w-full"
                    disabled={creating || LAUNCHED_PROJECT_OPTIONS.length === 0}
                    aria-label="Launched projects"
                  />
                  <p className="mt-1.5 text-xs text-[#8c9baa]">
                    Optional. Add projects that have already launched so their respondents cannot take
                    other projects in this group.
                  </p>
                  {LAUNCHED_PROJECT_OPTIONS.length === 0 && (
                    <p className="mt-1.5 text-xs text-[#8c9baa]">No launched projects yet.</p>
                  )}
                  {selectedProjects.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {selectedProjects.map((project) => (
                        <WuChip
                          key={project.value}
                          size="sm"
                          shape="rounded"
                          onClose={creating ? undefined : () => removeProject(project.value)}
                        >
                          {project.label}
                        </WuChip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            value: 'manage',
            Trigger: 'Manage wave group',
            Content: (
              <div className="pt-4">
                <WaveGroupManageTab open={open} groups={groups} onGroupsChange={onGroupsChange} />
              </div>
            ),
          },
        ];

        return (
          <WuModal
            open={open}
            onOpenChange={handleOpenChange}
            variant="action"
            size={tab === 'create' ? 'md' : 'lg'}
            preventClickOutside
            maxHeight="80vh"
          >
            <WuModalHeader>Wave groups</WuModalHeader>
            <WuModalContent>
              <WuTab
                items={tabItems}
                value={tab}
                onValueChange={(next) => setTab(String(next))}
                className="w-full"
              />
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary" disabled={creating}>
                {tab === 'create' ? 'Cancel' : 'Close'}
              </WuModalClose>
              {tab === 'create' && (
                <WuButton color="primary" onClick={handleCreate} disabled={creating} loading={creating}>
                  Create group
                </WuButton>
              )}
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false },
);

export function CreateUniqueResponseGroupModal(props: CreateUniqueResponseGroupModalProps) {
  return <CreateUniqueResponseGroupModalInner {...props} />;
}
