'use client';

import { useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  getLaunchedProjectOptions,
  type UniqueResponseProjectOption,
} from '@/data/mock-unique-responses';

interface UniqueResponsesFieldProps {
  value: UniqueResponseProjectOption[];
  onChange: (projects: UniqueResponseProjectOption[]) => void;
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-medium text-[#54606b]">{children}</span>;
}

const UniqueResponsesFieldInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const { WuSelect, WuInput, WuChip, WuTooltip } = lib;

      return function UniqueResponsesFieldInner({ value, onChange }: UniqueResponsesFieldProps) {
        const [query, setQuery] = useState('');
        const allProjects = useMemo(() => getLaunchedProjectOptions(), []);
        const selectedIds = new Set(value.map((project) => project.value));
        const filteredProjects = allProjects.filter((project) => {
          const matches = project.label.toLowerCase().includes(query.trim().toLowerCase());
          return matches || selectedIds.has(project.value);
        });

        return (
          <div className="unique-responses-field w-full">
            <div className="survey-fielding-label">
              <FieldLabel>Unique responses</FieldLabel>
              <WuTooltip content="Respondents who took any of the selected projects cannot take this project.">
                <span
                  className="wm-info cursor-help text-sm text-[#8c9baa]"
                  aria-label="Unique responses help"
                />
              </WuTooltip>
            </div>
            <div className="survey-fielding-control">
              <WuSelect
                multiple
                data={filteredProjects}
                accessorKey={{ value: 'value', label: 'label' }}
                value={value}
                onSelect={(next) => onChange((next as UniqueResponseProjectOption[]) ?? [])}
                placeholder="Select launched projects"
                variant="outlined"
                className="w-full"
                maxHeight={280}
                maxContentWidth="var(--radix-dropdown-menu-trigger-width)"
                aria-label="Unique responses"
                Header={
                  <WuInput
                    variant="flat"
                    placeholder="Search"
                    Icon={<span className="wm-search text-sm" aria-hidden="true" />}
                    iconPosition="left"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-8 w-full !bg-[rgba(0,0,0,0.04)]"
                    aria-label="Search launched projects"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                }
              />
            </div>
            {allProjects.length === 0 && (
              <p className="mt-1.5 text-xs text-[#8c9baa]">No launched projects yet.</p>
            )}
            {value.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {value.map((project) => (
                  <WuChip
                    key={project.value}
                    size="sm"
                    shape="rounded"
                    onClose={() =>
                      onChange(value.filter((item) => item.value !== project.value))
                    }
                  >
                    {project.label}
                  </WuChip>
                ))}
              </div>
            )}
          </div>
        );
      };
    }),
  { ssr: false },
);

export function UniqueResponsesField(props: UniqueResponsesFieldProps) {
  return <UniqueResponsesFieldInner {...props} />;
}
