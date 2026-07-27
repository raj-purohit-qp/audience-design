'use client';

import dynamic from 'next/dynamic';
import {
  CUSTOM_VARIABLE_OPTIONS,
  VENDOR_OPTIONS,
  type PanelSettingsSection,
  type SettingsValidationErrors,
  formatCurrencyInput,
  parseCurrencyInput,
} from '@/data/mock-org-panel-settings';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
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
  return <p className="mt-1 text-xs text-[#d93025]" role="alert">{message}</p>;
}

function CompactField({
  children,
  error,
  widthClass = 'w-[7.5rem]',
}: {
  children: React.ReactNode;
  error?: string;
  widthClass?: string;
}) {
  return (
    <div className={`${widthClass} shrink-0`}>
      {children}
      <FieldError message={error} />
    </div>
  );
}

interface PanelSettingsFieldsProps {
  section: PanelSettingsSection;
  vendor?: string;
  showVendor?: boolean;
  readOnly: boolean;
  errors: SettingsValidationErrors;
  onChange: (updates: Partial<PanelSettingsSection & { vendor?: string }>) => void;
}

export function PanelSettingsFields({
  section,
  vendor,
  showVendor = false,
  readOnly,
  errors,
  onChange,
}: PanelSettingsFieldsProps) {
  const inputClass = readOnly ? 'bg-[#f5f6f8]' : '';
  const fieldClass = 'w-full max-w-[7.5rem]';

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-3">
      <CompactField error={errors.baseSellingCpi}>
        <FieldLabel
          label="Selling CPI"
          required
          tooltip="Selling CPI charged to the client for Instant answers."
        />
        <WuInput
          variant="outlined"
          value={formatCurrencyInput(section.baseSellingCpi)}
          disabled={readOnly}
          onChange={(e) =>
            onChange({ baseSellingCpi: parseCurrencyInput(e.target.value) })
          }
          Icon={<span className="text-xs text-[#8c9baa]">$</span>}
          iconPosition="left"
          className={`${fieldClass} ${inputClass}`}
          aria-invalid={!!errors.baseSellingCpi}
        />
      </CompactField>

      <CompactField error={errors.defaultCustomVariable} widthClass="w-[12.5rem]">
        <FieldLabel
          label="Default variable"
          required
          tooltip="Used during panel integration."
        />
        <WuSelect
          data={CUSTOM_VARIABLE_OPTIONS as unknown as Record<string, unknown>[]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={
            CUSTOM_VARIABLE_OPTIONS.find((o) => o.value === section.defaultCustomVariable) as unknown as Record<string, unknown>
          }
          onSelect={(item) =>
            onChange({ defaultCustomVariable: (item as { value: string }).value })
          }
          variant="outlined"
          placeholder="Select variable"
          disabled={readOnly}
          className={`w-full ${inputClass}`}
        />
      </CompactField>

      {showVendor && (
        <CompactField error={errors.vendor} widthClass="w-[11rem]">
          <FieldLabel label="Vendor" required tooltip="Panel vendor used to fulfill projects." />
          <WuSelect
            data={VENDOR_OPTIONS as unknown as Record<string, unknown>[]}
            accessorKey={{ value: 'value', label: 'label' }}
            value={
              VENDOR_OPTIONS.find((o) => o.value === vendor) as unknown as Record<string, unknown>
            }
            onSelect={(item) => onChange({ vendor: (item as { value: string }).value })}
            variant="outlined"
            placeholder="Select vendor"
            disabled={readOnly}
            className={`w-full ${inputClass}`}
          />
        </CompactField>
      )}
    </div>
  );
}
