'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

interface CreateUniqueResponseGroupModalProps {
  open: boolean;
  existingNames: string[];
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}

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
      } = lib;

      return function CreateUniqueResponseGroupModalInner({
        open,
        existingNames,
        onOpenChange,
        onCreate,
      }: CreateUniqueResponseGroupModalProps) {
        const [name, setName] = useState('');
        const [error, setError] = useState<string | null>(null);
        const [creating, setCreating] = useState(false);
        const createTimerRef = useRef<number | null>(null);

        useEffect(() => {
          if (open) return;
          setName('');
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
          const duplicate = existingNames.some(
            (existing) => existing.trim().toLowerCase() === trimmed.toLowerCase(),
          );
          if (duplicate) return 'A group with this name already exists.';
          return null;
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
            onCreate(name.trim());
            setCreating(false);
            onOpenChange(false);
          }, 450);
        }

        function handleOpenChange(next: boolean) {
          if (creating && !next) return;
          onOpenChange(next);
        }

        return (
          <WuModal open={open} onOpenChange={handleOpenChange} variant="action" size="sm">
            <WuModalHeader>Create Unique Response Group</WuModalHeader>
            <WuModalContent>
              <p className="mb-4 text-sm text-gray-600">
                Create a group to ensure respondents who participate in one project cannot participate
                in other projects within the same group.
              </p>
              <WuInput
                Label="Group Name"
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
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary" disabled={creating}>
                Cancel
              </WuModalClose>
              <WuButton color="primary" onClick={handleCreate} disabled={creating} loading={creating}>
                Create Group
              </WuButton>
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
