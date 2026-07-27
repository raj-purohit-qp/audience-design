'use client';

import { useMemo, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import {
  CUSTOM_VARIABLE_OPTIONS,
  PRICING_MODE_OPTIONS,
  RATE_CARD_IR_BANDS,
  RATE_CARD_LOI_BANDS,
  VENDOR_OPTIONS,
  buildDefaultRateCardRows,
  buyingFromSelling,
  formatCurrencyInput,
  parseCurrencyInput,
  type RateCardRow,
  type SettingsValidationErrors,
  type SpecializedPricingMode,
  type SpecializedSampleSettings,
} from '@/data/mock-org-panel-settings';
import { formatCurrency } from '@/data/mock-audience-projects';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
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

function ModeDescription({ mode }: { mode: SpecializedPricingMode }) {
  const option = PRICING_MODE_OPTIONS.find((o) => o.value === mode);
  if (!option) return null;
  return (
    <div className="flex h-full min-h-[40px] items-center gap-2 rounded-md border border-[#e8f0fe] bg-[#f0f7ff] px-3 py-2">
      <span className="wm-info shrink-0 text-base text-[#1b87e6]" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-[#54606b]">{option.description}</p>
    </div>
  );
}

function CompactField({
  children,
  error,
  className = 'w-[7.5rem]',
}: {
  children: ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={`${className} shrink-0`}>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function loiKey(loiMin: number, loiMax: number): string {
  return `loi_${loiMin}_${loiMax}`;
}

interface RateCardCellData {
  rowId: string;
  sellingCpi: number;
  buyingCpi: number;
}

interface RateCardTableRow {
  id: string;
  irLabel: string;
  cells: Record<string, RateCardCellData>;
  [key: string]: string | Record<string, RateCardCellData>;
}

function findRateCardCell(
  rows: RateCardRow[],
  irMin: number,
  irMax: number,
  loiMin: number,
  loiMax: number,
): RateCardRow | undefined {
  return rows.find(
    (r) =>
      r.irMin === irMin && r.irMax === irMax && r.loiMin === loiMin && r.loiMax === loiMax,
  );
}

function buildRateCardTableRows(rows: RateCardRow[]): RateCardTableRow[] {
  return RATE_CARD_IR_BANDS.map((ir) => {
    const cells: Record<string, RateCardCellData> = {};
    const flat: Record<string, string> = {};

    RATE_CARD_LOI_BANDS.forEach((loi) => {
      const key = loiKey(loi.loiMin, loi.loiMax);
      const cell = findRateCardCell(rows, ir.irMin, ir.irMax, loi.loiMin, loi.loiMax);
      const sellingCpi = cell?.sellingCpi ?? 0;
      const buyingCpi = cell?.buyingCpi ?? buyingFromSelling(sellingCpi);
      cells[key] = {
        rowId: cell?.id ?? `${ir.irMin}-${loi.loiMin}`,
        sellingCpi,
        buyingCpi,
      };
      flat[key] = formatCurrencyInput(sellingCpi);
    });

    return {
      id: `ir-${ir.irMin}-${ir.irMax}`,
      irLabel: ir.label,
      cells,
      ...flat,
    };
  });
}

function RateCardMatrix({
  rows,
  readOnly,
  error,
  onChangeSelling,
  onResetDefault,
}: {
  rows: RateCardRow[];
  readOnly: boolean;
  error?: string;
  onChangeSelling: (rowId: string, sellingCpi: number) => void;
  onResetDefault: () => void;
}) {
  const tableData = useMemo(() => buildRateCardTableRows(rows), [rows]);

  const columns = useMemo<IWuTableColumnDef<RateCardTableRow>[]>(() => {
    const irColumn: IWuTableColumnDef<RateCardTableRow> = {
      accessorKey: 'irLabel',
      header: 'IR \\ LOI',
      sticky: 'left',
      headerAlign: 'center',
      cellAlign: 'center',
      cell: ({ row }) => (
        <span className="font-semibold text-[#1a2340]">{row.original.irLabel}</span>
      ),
    };

    const loiColumns: IWuTableColumnDef<RateCardTableRow>[] = RATE_CARD_LOI_BANDS.map((loi) => {
      const key = loiKey(loi.loiMin, loi.loiMax);
      return {
        accessorKey: key,
        header: loi.label,
        headerAlign: 'center',
        cellAlign: 'center',
        cell: ({ row }) => {
          const cell = row.original.cells[key];
          if (!cell) return null;

          if (readOnly) {
            return (
              <span className="font-medium text-[#1a2340]">
                {formatCurrency(cell.sellingCpi)}
              </span>
            );
          }

          return (
            <WuInput
              variant="table"
              value={`$${formatCurrencyInput(cell.sellingCpi)}`}
              onChange={(e) =>
                onChangeSelling(cell.rowId, parseCurrencyInput(e.target.value))
              }
              aria-label={`Selling CPI ${row.original.irLabel} ${loi.label}`}
            />
          );
        },
      };
    });

    return [irColumn, ...loiColumns];
  }, [readOnly, onChangeSelling]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#1a2340]">Rate card</p>
        {!readOnly && (
          <WuButton variant="secondary" size="sm" onClick={onResetDefault}>
            Reset
          </WuButton>
        )}
      </div>

      {error && <FieldError message={error} />}

      <div className="overflow-x-auto">
        <WuTable
          data={tableData as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          size="compact"
          tableLayout="auto"
        />
      </div>
    </div>
  );
}

interface SpecializedSampleFieldsProps {
  section: SpecializedSampleSettings;
  fieldsReadOnly: boolean;
  pricingModeLocked: boolean;
  errors: SettingsValidationErrors;
  onChange: (updates: Partial<SpecializedSampleSettings>) => void;
}

export function SpecializedSampleFields({
  section,
  fieldsReadOnly,
  pricingModeLocked,
  errors,
  onChange,
}: SpecializedSampleFieldsProps) {
  const inputClass = fieldsReadOnly ? 'bg-[#f5f6f8]' : '';
  const fieldClass = 'w-full max-w-[7.5rem]';

  const selectedMode =
    PRICING_MODE_OPTIONS.find((o) => o.value === section.pricingMode) ?? PRICING_MODE_OPTIONS[0];

  function handleSellingChange(rowId: string, sellingCpi: number) {
    onChange({
      rateCardRows: section.rateCardRows.map((row) =>
        row.id === rowId
          ? { ...row, sellingCpi, buyingCpi: buyingFromSelling(sellingCpi) }
          : row,
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[11rem_minmax(0,1fr)]">
        <div className="min-w-0">
          <FieldLabel
            label="Pricing model"
            required
            tooltip={
              pricingModeLocked ? 'Only Admins can change the pricing model.' : undefined
            }
          />
          <WuSelect
            data={PRICING_MODE_OPTIONS as unknown as Record<string, unknown>[]}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedMode as unknown as Record<string, unknown>}
            onSelect={(item) =>
              onChange({ pricingMode: (item as { value: SpecializedPricingMode }).value })
            }
            variant="outlined"
            placeholder="Select pricing model"
            disabled={pricingModeLocked}
            className="w-full"
          />
        </div>
        <div className="min-w-0">
          <ModeDescription mode={section.pricingMode} />
        </div>
      </div>

      <div>
        {section.pricingMode === 'fixed_price' && (
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            <CompactField error={errors.sellingCpi}>
              <FieldLabel
                label="Selling CPI"
                required
                tooltip="Fixed selling CPI charged to the client."
              />
              <WuInput
                variant="outlined"
                value={formatCurrencyInput(section.sellingCpi)}
                disabled={fieldsReadOnly}
                onChange={(e) => onChange({ sellingCpi: parseCurrencyInput(e.target.value) })}
                Icon={<span className="text-xs text-[#8c9baa]">$</span>}
                iconPosition="left"
                className={`${fieldClass} ${inputClass}`}
                aria-invalid={!!errors.sellingCpi}
              />
            </CompactField>
            <CompactField error={errors.buyingCpi}>
              <FieldLabel
                label="Buying CPI"
                required
                tooltip="Fixed buying CPI paid to the vendor."
              />
              <WuInput
                variant="outlined"
                value={formatCurrencyInput(section.buyingCpi)}
                disabled={fieldsReadOnly}
                onChange={(e) => onChange({ buyingCpi: parseCurrencyInput(e.target.value) })}
                Icon={<span className="text-xs text-[#8c9baa]">$</span>}
                iconPosition="left"
                className={`${fieldClass} ${inputClass}`}
                aria-invalid={!!errors.buyingCpi}
              />
            </CompactField>
            <CompactField error={errors.ir}>
              <FieldLabel label="IR" required tooltip="Fixed rates apply up to this IR." />
              <WuInput
                variant="outlined"
                value={String(section.ir)}
                disabled={fieldsReadOnly}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10);
                  onChange({ ir: Number.isFinite(val) ? val : 0 });
                }}
                Icon={<span className="text-xs text-[#8c9baa]">%</span>}
                iconPosition="right"
                className={`${fieldClass} ${inputClass}`}
                aria-invalid={!!errors.ir}
              />
            </CompactField>
            <CompactField error={errors.margin}>
              <FieldLabel
                label="Margin"
                required
                tooltip="Applied when the study IR is below the defined IR."
              />
              <WuInput
                variant="outlined"
                value={String(section.margin)}
                disabled={fieldsReadOnly}
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
        )}

        {(section.pricingMode === 'margin_based' || section.pricingMode === 'override') && (
          <div className="flex flex-wrap gap-x-4 gap-y-3">
            <CompactField error={errors.baseCpi}>
              <FieldLabel
                label="Base CPI"
                required
                tooltip={
                  section.pricingMode === 'override'
                    ? 'Minimum Selling CPI. Users cannot enter a CPI below this value.'
                    : 'Floor selling CPI when vendor markup falls below this amount.'
                }
              />
              <WuInput
                variant="outlined"
                value={formatCurrencyInput(section.baseCpi)}
                disabled={fieldsReadOnly}
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
                tooltip={
                  section.pricingMode === 'override'
                    ? 'Buying CPI = Selling CPI ÷ (1 + Margin %).'
                    : 'Selling CPI = Vendor CPI × (1 + Margin %). If the result is below Base CPI, Base CPI is used.'
                }
              />
              <WuInput
                variant="outlined"
                value={String(section.margin)}
                disabled={fieldsReadOnly}
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
        )}

        {section.pricingMode === 'rate_card' && (
          <RateCardMatrix
            rows={section.rateCardRows}
            readOnly={fieldsReadOnly}
            error={errors.rateCard}
            onChangeSelling={handleSellingChange}
            onResetDefault={() => onChange({ rateCardRows: buildDefaultRateCardRows() })}
          />
        )}
      </div>

      <div className="border-t border-[#eef0f3] pt-5">
        <p className="mb-3 font-['Fira_Sans',sans-serif] text-[14px] font-normal text-[#1a2340]">
          Common settings
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          <CompactField error={errors.defaultCustomVariable} className="w-[12.5rem]">
            <FieldLabel
              label="Default variable"
              required
              tooltip="Used during panel integration."
            />
            <WuSelect
              data={CUSTOM_VARIABLE_OPTIONS as unknown as Record<string, unknown>[]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={
                CUSTOM_VARIABLE_OPTIONS.find(
                  (o) => o.value === section.defaultCustomVariable,
                ) as unknown as Record<string, unknown>
              }
              onSelect={(item) =>
                onChange({ defaultCustomVariable: (item as { value: string }).value })
              }
              variant="outlined"
              placeholder="Select variable"
              disabled={fieldsReadOnly}
              className={`w-full ${inputClass}`}
            />
          </CompactField>
          <div className="w-[11rem] shrink-0">
            <FieldLabel label="Vendor" required tooltip="Panel vendor used to fulfill projects." />
            <WuSelect
              data={VENDOR_OPTIONS as unknown as Record<string, unknown>[]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={
                VENDOR_OPTIONS.find((o) => o.value === section.vendor) as unknown as Record<
                  string,
                  unknown
                >
              }
              onSelect={(item) => onChange({ vendor: (item as { value: string }).value })}
              variant="outlined"
              placeholder="Select vendor"
              disabled={fieldsReadOnly}
              className={`w-full ${inputClass}`}
            />
            <FieldError message={errors.vendor} />
          </div>
        </div>
      </div>
    </div>
  );
}
