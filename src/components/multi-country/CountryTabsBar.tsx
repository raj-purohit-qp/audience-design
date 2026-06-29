'use client';

import dynamic from 'next/dynamic';
import type { CountryDefinition } from '@/data/mock-multi-country';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false },
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false },
);

interface CountryTabsBarProps {
  countries: CountryDefinition[];
  activeCode: string;
  onSelect: (code: string) => void;
  onRemove: (code: string) => void;
  availableToAdd: CountryDefinition[];
  onAdd: (country: CountryDefinition) => void;
}

export function CountryTabsBar({
  countries,
  activeCode,
  onSelect,
  onRemove,
  availableToAdd,
  onAdd,
}: CountryTabsBarProps) {
  if (countries.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
        <p className="text-sm text-gray-600">Select at least one country to continue.</p>
        {availableToAdd.length > 0 && (
          <WuMenu
            Trigger={
              <WuButton variant="link" size="sm" className="mt-2">
                <span className="wm-add" aria-hidden="true" /> Add country
              </WuButton>
            }
            align="center"
          >
            {availableToAdd.map((country) => (
              <WuMenuItem key={country.value} onSelect={() => onAdd(country)}>
                {country.flag} {country.label}
              </WuMenuItem>
            ))}
          </WuMenu>
        )}
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200">
      <div className="flex flex-wrap items-end gap-1" role="tablist" aria-label="Selected countries">
        {countries.map((country) => {
          const isActive = country.value === activeCode;
          return (
            <div key={country.value} className="relative">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(country.value)}
                className={`relative min-w-[120px] rounded-t-lg border border-b-0 px-4 pb-2.5 pt-7 text-left text-sm transition-colors ${
                  isActive
                    ? 'border-gray-200 bg-white font-medium text-gray-900'
                    : 'border-transparent bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="block truncate">
                  {country.flag} {country.label}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${country.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(country.value);
                }}
                className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <span className="wm-close text-[14px] leading-none" aria-hidden="true" />
              </button>
            </div>
          );
        })}

        <WuMenu
          Trigger={
            <button
              type="button"
              disabled={availableToAdd.length === 0}
              className="mb-0.5 flex items-center gap-1 rounded-md px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-400"
            >
              <span className="wm-add text-base" aria-hidden="true" />
              Add country
            </button>
          }
          align="start"
        >
          {availableToAdd.map((country) => (
            <WuMenuItem key={country.value} onSelect={() => onAdd(country)}>
              {country.flag} {country.label}
            </WuMenuItem>
          ))}
        </WuMenu>
      </div>
    </div>
  );
}
