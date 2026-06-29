'use client';

import dynamic from 'next/dynamic';
import type { CountryDefinition } from '@/data/mock-multi-country';

const WuListbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuListbox })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

interface CountryMultiSelectProps {
  catalog: CountryDefinition[];
  selected: CountryDefinition[];
  onChange: (countries: CountryDefinition[]) => void;
  disabledCodes?: string[];
}

export function CountryMultiSelect({
  catalog,
  selected,
  onChange,
  disabledCodes = [],
}: CountryMultiSelectProps) {
  const available = catalog.filter((c) => !disabledCodes.includes(c.value));
  const listData = available.map((c) => ({
    value: c.value,
    label: `${c.flag} ${c.label}`,
    country: c,
  }));

  const selectedItems = selected.map((c) => ({
    value: c.value,
    label: `${c.flag} ${c.label}`,
    country: c,
  }));

  return (
    <div className="space-y-3">
      <WuListbox
        data={listData}
        accessorKey={{ value: 'value', label: 'label' }}
        value={selectedItems}
        onSelect={(v) => {
          const items = v as { value: string; label: string; country: CountryDefinition }[];
          onChange(items.map((i) => i.country));
        }}
        multiple
        searchable
        Label="Countries"
        placeholder="Search and select countries…"
        variant="outlined"
        Chip={({ value, unselect }) => (
          <WuChip size="sm" onClose={() => unselect?.(value)}>
            {(value as { label: string }).label}
          </WuChip>
        )}
      />

      {selected.length === 0 && (
        <p className="text-sm text-amber-700">
          <span className="wm-warning mr-1" aria-hidden="true" />
          Select at least one country to continue.
        </p>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((c) => (
            <WuChip
              key={c.value}
              size="sm"
              onClose={() => onChange(selected.filter((x) => x.value !== c.value))}
            >
              {c.flag} {c.label}
            </WuChip>
          ))}
        </div>
      )}

      <WuButton
        variant="link"
        size="sm"
        onClick={() => {
          if (available.length > selected.length) {
            const next = available.find((c) => !selected.some((s) => s.value === c.value));
            if (next) onChange([...selected, next]);
          }
        }}
      >
        <span className="wm-add" aria-hidden="true" /> Add country
      </WuButton>
    </div>
  );
}
