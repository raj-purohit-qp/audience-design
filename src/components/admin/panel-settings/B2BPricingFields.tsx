'use client';

import dynamic from 'next/dynamic';
import {
  type B2BPricingSettings,
  type SettingsValidationErrors,
  formatCurrencyInput,
  parseCurrencyInput,
} from '@/data/mock-org-panel-settings';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

function FieldLabel({
  label,
  required,
  tooltip,
}: {
  label: string;
  required?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="mb-1 flex min-h-5 items-center gap-1.5 whitespace-nowrap">
      <label className="text-xs font-medium text-[#54606b]">
        {label}
        {required && <span className="text-[#d93025]"> *</span>}
      </label>
      {tooltip && (
        <span className="wm-info text-sm text-[#8c9baa]" title={tooltip} aria-label={tooltip} />
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-[#d93025]" role="alert">
      {message}
    </p>
  );
}

function CompactField({
  children,
  error,
}: {
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="w-[7.5rem] shrink-0">
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function B2BPricingFields({
  section,
  readOnly,
  errors,
  onChange,
}: {
  section: B2BPricingSettings;
  readOnly: boolean;
  errors: SettingsValidationErrors;
  onChange: (updates: Partial<B2BPricingSettings>) => void;
}) {
  const inputClass = readOnly ? 'bg-[#f5f6f8]' : '';
  const fieldClass = 'w-full max-w-[7.5rem]';

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3">
      <CompactField error={errors.baseCpi}>
        <FieldLabel
          label="Base CPI"
          required
          tooltip="Minimum Selling CPI for B2B project requirements on this account."
        />
        <WuInput
          variant="outlined"
          value={formatCurrencyInput(section.baseCpi)}
          disabled={readOnly}
          onChange={(e) => onChange({ baseCpi: parseCurrencyInput(e.target.value) })}
          Icon={<span className="text-xs text-[#8c9baa]">$</span>}
          iconPosition="left"
          className={`${fieldClass} ${inputClass}`}
          aria-invalid={!!errors.baseCpi}
        />
      </CompactField>

      <CompactField error={errors.margin}>
        <FieldLabel
          label="Margin"
          required
          tooltip="Margin % applied to B2B Base CPI for this account."
        />
        <WuInput
          variant="outlined"
          value={String(section.margin)}
          disabled={readOnly}
          onChange={(e) => {
            const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
            onChange({ margin: Number.isFinite(val) ? val : 0 });
          }}
          Icon={<span className="text-xs text-[#8c9baa]">%</span>}
          iconPosition="right"
          className={`${fieldClass} ${inputClass}`}
          aria-invalid={!!errors.margin}
        />
      </CompactField>
    </div>
  );
}
