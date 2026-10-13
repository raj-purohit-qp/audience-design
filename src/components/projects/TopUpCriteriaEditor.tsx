'use client';

import dynamic from 'next/dynamic';
import type { AudienceProjectDemographics } from '@/data/audience-project-store';
import { DEFAULT_DEMOGRAPHICS } from '@/data/audience-project-store';

interface TopUpCriteriaEditorProps {
  value: AudienceProjectDemographics;
  onChange: (next: AudienceProjectDemographics) => void;
  genderQuotas: Record<string, number>;
  onGenderQuotasChange: (next: Record<string, number>) => void;
}

const DIMENSIONS: {
  key: keyof AudienceProjectDemographics;
  label: string;
  allowQuotas?: boolean;
}[] = [
  { key: 'gender', label: 'Gender', allowQuotas: true },
  { key: 'ageGroups', label: 'Age groups' },
  { key: 'education', label: 'Education' },
  { key: 'income', label: 'Income' },
];

function toggleValue(list: string[], option: string): string[] {
  return list.includes(option) ? list.filter((item) => item !== option) : [...list, option];
}

const TopUpCriteriaEditorInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const { WuInput } = lib;

      return function TopUpCriteriaEditorInner({
        value,
        onChange,
        genderQuotas,
        onGenderQuotasChange,
      }: TopUpCriteriaEditorProps) {
        return (
          <div className="space-y-5">
            <p className="text-sm text-[#54606b]">
              Previously used criteria are applied. Turn options off to narrow this top-up, or set a
              balancing quota for a specific group.
            </p>
            {DIMENSIONS.map((dimension) => {
              const selected = value[dimension.key];
              const catalog = DEFAULT_DEMOGRAPHICS[dimension.key];
              return (
                <div key={dimension.key}>
                  <span className="mb-1.5 block text-xs font-medium text-[#54606b]">
                    {dimension.label}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {catalog.map((option) => {
                      const isOn = selected.includes(option);
                      return (
                        <span
                          key={option}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isOn}
                          onClick={() => {
                            const nextList = toggleValue(selected, option);
                            onChange({ ...value, [dimension.key]: nextList });
                            if (dimension.allowQuotas && !nextList.includes(option)) {
                              const nextQuotas = { ...genderQuotas };
                              delete nextQuotas[option];
                              onGenderQuotasChange(nextQuotas);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              (e.currentTarget as HTMLSpanElement).click();
                            }
                          }}
                          className="inline-flex cursor-pointer items-center rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            border: `1px solid ${isOn ? '#1b87e6' : '#d5dbe0'}`,
                            background: isOn ? '#e8f3fc' : '#ffffff',
                            color: isOn ? '#1a2340' : '#8c9baa',
                          }}
                        >
                          {option}
                        </span>
                      );
                    })}
                  </div>
                  {dimension.allowQuotas && selected.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <span className="block text-xs font-medium text-[#54606b]">
                        Balancing quotas
                      </span>
                      <p className="text-xs text-[#8c9baa]">
                        Optional. Use this to field a specific number for a selected group — for
                        example 40 males.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {selected.map((option) => (
                          <WuInput
                            key={option}
                            Label={option}
                            labelPosition="top"
                            variant="outlined"
                            inputMode="numeric"
                            placeholder="No quota"
                            value={genderQuotas[option] ? String(genderQuotas[option]) : ''}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/[^0-9]/g, '');
                              const next = { ...genderQuotas };
                              if (!raw) delete next[option];
                              else next[option] = parseInt(raw, 10);
                              onGenderQuotasChange(next);
                            }}
                            className="w-full"
                            aria-label={`${option} balancing quota`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      };
    }),
  { ssr: false },
);

export function TopUpCriteriaEditor(props: TopUpCriteriaEditorProps) {
  return <TopUpCriteriaEditorInner {...props} />;
}
