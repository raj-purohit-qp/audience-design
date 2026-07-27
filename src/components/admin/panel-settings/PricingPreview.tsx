'use client';

import { useEffect, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  buyingFromSelling,
  calculateMarginBasedSelling,
  calculateOverrideBuyingCpi,
  formatCurrencyInput,
  parseCurrencyInput,
  sellingFromBuying,
  type PricingPreviewResult,
} from '@/data/mock-org-panel-settings';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

type PreviewState = {
  sellingCpi: number;
  buyingCpi: number;
  ir: number;
  margin: number;
  vendorCpi: number;
  baseCpi: number;
  markedUpCpi: number;
  floorApplied: boolean;
  label: string;
  detail?: string;
};

function stateFromPreview(preview: PricingPreviewResult): PreviewState {
  return {
    sellingCpi: preview.sellingCpi,
    buyingCpi: preview.buyingCpi ?? 0,
    ir: preview.ir ?? 0,
    margin: preview.margin ?? 0,
    vendorCpi: preview.vendorCpi ?? 0,
    baseCpi: preview.baseCpi ?? 0,
    markedUpCpi: preview.markedUpCpi ?? 0,
    floorApplied: preview.floorApplied ?? false,
    label: preview.label,
    detail: preview.detail,
  };
}

function previewSyncKey(preview: PricingPreviewResult): string {
  return [
    preview.mode,
    preview.sellingCpi,
    preview.buyingCpi ?? '',
    preview.ir ?? '',
    preview.margin ?? '',
    preview.vendorCpi ?? '',
    preview.baseCpi ?? '',
    preview.markedUpCpi ?? '',
    preview.floorApplied ?? '',
    preview.label,
    preview.detail ?? '',
  ].join('|');
}

function marginFromSellBuy(sellingCpi: number, buyingCpi: number): number {
  if (sellingCpi <= 0) return 0;
  return Math.round(((sellingCpi - buyingCpi) / sellingCpi) * 100);
}

function fixedPriceDetail(ir: number, margin: number): string {
  return `Fixed rates up to ${ir}% IR · ${margin}% margin below IR`;
}

function marginBasedMeta(
  vendorCpi: number,
  baseCpi: number,
  margin: number,
): Pick<PreviewState, 'sellingCpi' | 'markedUpCpi' | 'floorApplied' | 'label' | 'detail'> {
  const { sellingCpi, markedUpCpi, floorApplied } = calculateMarginBasedSelling(
    vendorCpi,
    baseCpi,
    margin,
  );
  return {
    sellingCpi,
    markedUpCpi,
    floorApplied,
    label: floorApplied ? 'Base CPI floor applied' : 'Margin applied to vendor CPI',
    detail: floorApplied
      ? `Marked-up CPI ($${markedUpCpi.toFixed(2)}) is below Base CPI ($${baseCpi.toFixed(2)})`
      : `Vendor CPI × (1 + ${margin}%)`,
  };
}

function instantAnswersMeta(
  baseSellingCpi: number,
): Pick<PreviewState, 'sellingCpi' | 'baseCpi' | 'label' | 'detail'> {
  return {
    baseCpi: baseSellingCpi,
    sellingCpi: baseSellingCpi,
    label: 'Selling CPI',
    detail: 'Instant answers uses the account Selling CPI.',
  };
}

const VALUE_COL = 'flex h-8 w-[5.75rem] shrink-0 items-center justify-end';

function PreviewInputRow({
  label,
  value,
  onChange,
  prefix,
  suffix,
  highlight,
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (raw: string) => void;
  prefix?: string;
  suffix?: string;
  highlight?: boolean;
  readOnly?: boolean;
}) {
  const isEditable = !readOnly && !!onChange;

  return (
    <div
      className={`flex min-h-10 items-center justify-between gap-2 px-3 py-1.5 ${
        highlight ? 'bg-[#e8f5e9]' : ''
      }`}
    >
      <span
        className={`min-w-0 flex-1 text-xs font-medium ${
          highlight ? 'text-[#188038]' : 'text-[#8c9baa]'
        }`}
      >
        {label}
      </span>
      {isEditable ? (
        <div className={VALUE_COL}>
          <WuInput
            variant="outlined"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            {...(prefix
              ? {
                  Icon: <span className="text-xs text-[#8c9baa]">{prefix}</span>,
                  iconPosition: 'left' as const,
                }
              : suffix
                ? {
                    Icon: <span className="text-xs text-[#8c9baa]">{suffix}</span>,
                    iconPosition: 'right' as const,
                  }
                : {})}
            className="w-full [&_input]:!h-8 [&_input]:!min-h-8 [&_input]:!py-0 [&_input]:!text-right [&_input]:!text-sm [&_input]:!tabular-nums"
            aria-label={label}
          />
        </div>
      ) : (
        <div className={VALUE_COL}>
          <span
            className={`inline-flex items-center gap-0.5 text-sm font-medium tabular-nums ${
              highlight ? 'text-[#188038]' : 'text-[#1a2340]'
            }`}
          >
            {prefix ? <span className="text-xs opacity-80">{prefix}</span> : null}
            {value}
            {suffix ? <span className="text-xs opacity-80">{suffix}</span> : null}
          </span>
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[#eef0f3]" aria-hidden="true" />;
}

function PreviewRows({ rows }: { rows: ReactNode[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-[#e0e4e8] bg-white">
      {rows.map((row, index) => (
        <div key={index}>
          {index > 0 && <Divider />}
          {row}
        </div>
      ))}
    </div>
  );
}

export function PricingPreview({ preview }: { preview: PricingPreviewResult }) {
  const [state, setState] = useState<PreviewState>(() => stateFromPreview(preview));
  const syncKey = previewSyncKey(preview);

  useEffect(() => {
    setState(stateFromPreview(preview));
    // Reset sandbox when org settings (source preview) change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- syncKey captures preview identity
  }, [syncKey]);

  const parseMoney = (raw: string) => parseCurrencyInput(raw);
  const parsePercent = (raw: string) => {
    const val = parseInt(raw.replace(/\D/g, ''), 10);
    return Number.isFinite(val) ? val : 0;
  };

  const rows: ReactNode[] = [];

  switch (preview.mode) {
    case 'fixed_price': {
      rows.push(
        <PreviewInputRow
          key="buying"
          label="Buying CPI"
          value={formatCurrencyInput(state.buyingCpi)}
          prefix="$"
          onChange={(raw) => {
            const buyingCpi = parseMoney(raw);
            const margin = marginFromSellBuy(state.sellingCpi, buyingCpi);
            setState((prev) => ({
              ...prev,
              buyingCpi,
              margin,
              detail: fixedPriceDetail(prev.ir, margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="ir"
          label="IR"
          value={String(state.ir)}
          suffix="%"
          onChange={(raw) => {
            const ir = parsePercent(raw);
            setState((prev) => ({
              ...prev,
              ir,
              detail: fixedPriceDetail(ir, prev.margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="margin"
          label="Margin (below IR)"
          value={String(state.margin)}
          suffix="%"
          onChange={(raw) => {
            const margin = parsePercent(raw);
            const buyingCpi = calculateOverrideBuyingCpi(state.sellingCpi, margin);
            setState((prev) => ({
              ...prev,
              margin,
              buyingCpi,
              detail: fixedPriceDetail(prev.ir, margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          onChange={(raw) => {
            const sellingCpi = parseMoney(raw);
            const margin = marginFromSellBuy(sellingCpi, state.buyingCpi);
            setState((prev) => ({
              ...prev,
              sellingCpi,
              margin,
              detail: fixedPriceDetail(prev.ir, margin),
            }));
          }}
        />,
      );
      break;
    }
    case 'margin_based': {
      rows.push(
        <PreviewInputRow
          key="vendor"
          label="Vendor CPI"
          value={formatCurrencyInput(state.vendorCpi)}
          prefix="$"
          onChange={(raw) => {
            const vendorCpi = parseMoney(raw);
            setState((prev) => ({
              ...prev,
              vendorCpi,
              ...marginBasedMeta(vendorCpi, prev.baseCpi, prev.margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="margin"
          label="Margin"
          value={String(state.margin)}
          suffix="%"
          onChange={(raw) => {
            const margin = parsePercent(raw);
            setState((prev) => ({
              ...prev,
              margin,
              ...marginBasedMeta(prev.vendorCpi, prev.baseCpi, margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="marked"
          label="Marked-up CPI"
          value={formatCurrencyInput(state.markedUpCpi)}
          prefix="$"
          readOnly
        />,
        <PreviewInputRow
          key="base"
          label={state.floorApplied ? 'Base CPI floor' : 'Base CPI'}
          value={formatCurrencyInput(state.baseCpi)}
          prefix="$"
          onChange={(raw) => {
            const baseCpi = parseMoney(raw);
            setState((prev) => ({
              ...prev,
              baseCpi,
              ...marginBasedMeta(prev.vendorCpi, baseCpi, prev.margin),
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          readOnly
        />,
      );
      break;
    }
    case 'rate_card': {
      rows.push(
        <PreviewInputRow
          key="buying"
          label="Buying CPI"
          value={formatCurrencyInput(state.buyingCpi)}
          prefix="$"
          onChange={(raw) => {
            const buyingCpi = parseMoney(raw);
            setState((prev) => ({
              ...prev,
              buyingCpi,
              sellingCpi: sellingFromBuying(buyingCpi),
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          onChange={(raw) => {
            const sellingCpi = parseMoney(raw);
            setState((prev) => ({
              ...prev,
              sellingCpi,
              buyingCpi: buyingFromSelling(sellingCpi),
            }));
          }}
        />,
      );
      break;
    }
    case 'override': {
      rows.push(
        <PreviewInputRow
          key="base"
          label="Base CPI (floor)"
          value={formatCurrencyInput(state.baseCpi)}
          prefix="$"
          onChange={(raw) => {
            const baseCpi = parseMoney(raw);
            const sellingCpi = Math.max(state.sellingCpi, baseCpi);
            const buyingCpi = calculateOverrideBuyingCpi(sellingCpi, state.margin);
            setState((prev) => ({
              ...prev,
              baseCpi,
              sellingCpi,
              buyingCpi,
              detail: `Entered Selling CPI must be ≥ Base CPI ($${baseCpi.toFixed(2)})`,
            }));
          }}
        />,
        <PreviewInputRow
          key="margin"
          label="Margin"
          value={String(state.margin)}
          suffix="%"
          onChange={(raw) => {
            const margin = parsePercent(raw);
            const buyingCpi = calculateOverrideBuyingCpi(state.sellingCpi, margin);
            setState((prev) => ({
              ...prev,
              margin,
              buyingCpi,
            }));
          }}
        />,
        <PreviewInputRow
          key="buying"
          label="Buying CPI"
          value={formatCurrencyInput(state.buyingCpi)}
          prefix="$"
          onChange={(raw) => {
            const buyingCpi = parseMoney(raw);
            const derivedSelling = Number(
              (buyingCpi * (1 + state.margin / 100)).toFixed(2),
            );
            const sellingCpi = Math.max(derivedSelling, state.baseCpi);
            setState((prev) => ({
              ...prev,
              buyingCpi:
                sellingCpi === derivedSelling
                  ? buyingCpi
                  : calculateOverrideBuyingCpi(sellingCpi, prev.margin),
              sellingCpi,
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          onChange={(raw) => {
            const entered = parseMoney(raw);
            const sellingCpi = Math.max(entered, state.baseCpi);
            const buyingCpi = calculateOverrideBuyingCpi(sellingCpi, state.margin);
            setState((prev) => ({
              ...prev,
              sellingCpi,
              buyingCpi,
            }));
          }}
        />,
      );
      break;
    }
    case 'instant_answers': {
      rows.push(
        <PreviewInputRow
          key="base"
          label="Selling CPI"
          value={formatCurrencyInput(state.baseCpi)}
          prefix="$"
          onChange={(raw) => {
            const baseCpi = parseMoney(raw);
            setState((prev) => ({
              ...prev,
              ...instantAnswersMeta(baseCpi),
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          readOnly
        />,
      );
      break;
    }
    case 'b2b': {
      rows.push(
        <PreviewInputRow
          key="base"
          label="Base CPI"
          value={formatCurrencyInput(state.baseCpi)}
          prefix="$"
          onChange={(raw) => {
            const baseCpi = parseMoney(raw);
            const sellingCpi = Number((baseCpi * (1 + state.margin / 100)).toFixed(2));
            setState((prev) => ({
              ...prev,
              baseCpi,
              sellingCpi,
              detail: `Selling CPI = Base CPI × (1 + ${prev.margin}%)`,
            }));
          }}
        />,
        <PreviewInputRow
          key="margin"
          label="Margin"
          value={String(state.margin)}
          suffix="%"
          onChange={(raw) => {
            const margin = parsePercent(raw);
            const sellingCpi = Number((state.baseCpi * (1 + margin / 100)).toFixed(2));
            setState((prev) => ({
              ...prev,
              margin,
              sellingCpi,
              detail: `Selling CPI = Base CPI × (1 + ${margin}%)`,
            }));
          }}
        />,
        <PreviewInputRow
          key="selling"
          label="Selling CPI"
          value={formatCurrencyInput(state.sellingCpi)}
          prefix="$"
          highlight
          readOnly
        />,
      );
      break;
    }
  }

  return (
    <div className="w-full rounded-lg border border-[#e0e4e8] bg-[#f9fafb] p-3">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="wm-calculate text-base text-[#1b87e6]" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-[#1a2340]">Pricing preview</h3>
      </div>

      <PreviewRows rows={rows} />

      {(state.detail || state.label) && (
        <p className="mt-2 px-1 text-xs text-[#54606b]">
          {state.detail ?? (
            <>
              <span className="font-medium text-[#1a2340]">Result: </span>({state.label})
            </>
          )}
        </p>
      )}
    </div>
  );
}
