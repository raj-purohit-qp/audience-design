'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  defaultTopUpQuantity,
  topUpDefaultHelperText,
} from '@/data/mock-audience-projects';

export type TopUpMode = 'same-criteria' | 'edit-criteria';

export interface TopUpCountryOption {
  value: string;
  label: string;
}

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalRequiredResponses: number;
  reconciledResponses?: number;
  /** Extra helper under Additional responses (e.g. per-country quantity). */
  quantityNote?: string;
  sameCriteriaDescription?: string;
  countries?: TopUpCountryOption[];
  selectedCountry?: string;
  onSelectedCountryChange?: (countryCode: string) => void;
  onConfirmSameCriteria: (additionalResponses: number) => void;
  onEditCriteria: () => void;
}

function parseResponseCount(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, '');
  if (!cleaned) return NaN;
  return parseInt(cleaned, 10);
}

const TopUpModalInner = dynamic(
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
        WuSelect,
      } = lib;

      return function TopUpModalInner({
        open,
        onOpenChange,
        originalRequiredResponses,
        reconciledResponses = 0,
        quantityNote,
        sameCriteriaDescription = 'Keep the current targeting and add responses to this project.',
        countries,
        selectedCountry,
        onSelectedCountryChange,
        onConfirmSameCriteria,
        onEditCriteria,
      }: TopUpModalProps) {
        const defaultQty = defaultTopUpQuantity(originalRequiredResponses, reconciledResponses);
        const helper = topUpDefaultHelperText(originalRequiredResponses, reconciledResponses);
        const [mode, setMode] = useState<TopUpMode>('same-criteria');
        const [quantityInput, setQuantityInput] = useState(String(defaultQty));

        const parsed = parseResponseCount(quantityInput);
        const isValidQuantity = Number.isInteger(parsed) && parsed >= 1;
        const countryReady = !countries || countries.length === 0 || Boolean(selectedCountry);
        const canSubmit = countryReady && (mode === 'edit-criteria' || isValidQuantity);
        const selectedCountryOption = countries?.find((item) => item.value === selectedCountry);

        useEffect(() => {
          if (!open) return;
          setMode('same-criteria');
          setQuantityInput(String(defaultTopUpQuantity(originalRequiredResponses, reconciledResponses)));
        }, [open, originalRequiredResponses, reconciledResponses]);

        function handleContinue() {
          if (!canSubmit) return;
          if (mode === 'edit-criteria') {
            onEditCriteria();
            onOpenChange(false);
            return;
          }
          onConfirmSameCriteria(parsed);
          onOpenChange(false);
        }

        return (
          <WuModal open={open} onOpenChange={onOpenChange} variant="action" size="sm">
            <WuModalHeader>Top-up</WuModalHeader>
            <WuModalContent>
              {countries && countries.length > 0 && (
                <div className="mb-4">
                  <WuSelect
                    data={countries}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={selectedCountryOption}
                    onSelect={(v) =>
                      onSelectedCountryChange?.((v as TopUpCountryOption).value)
                    }
                    Label="Country"
                    variant="outlined"
                    className="w-full"
                    placeholder="Select a country"
                    aria-label="Country to top-up"
                  />
                  <p className="mt-1.5 text-xs text-[#8c9baa]">
                    Top-up applies to this country only.
                  </p>
                </div>
              )}
              <p className="mb-3 text-sm font-medium text-[#1a2340]">
                How do you want to collect additional responses?
              </p>
              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 ${
                    mode === 'same-criteria'
                      ? 'border-[#1b87e6] bg-[#f0f7ff]'
                      : 'border-[#e0e4e8] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="top-up-mode"
                    className="mt-0.5 accent-[#1b87e6]"
                    checked={mode === 'same-criteria'}
                    onChange={() => setMode('same-criteria')}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#1a2340]">Same criteria</span>
                    <span className="mt-0.5 block text-xs text-[#8c9baa]">
                      {sameCriteriaDescription}
                    </span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 ${
                    mode === 'edit-criteria'
                      ? 'border-[#1b87e6] bg-[#f0f7ff]'
                      : 'border-[#e0e4e8] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="top-up-mode"
                    className="mt-0.5 accent-[#1b87e6]"
                    checked={mode === 'edit-criteria'}
                    onChange={() => setMode('edit-criteria')}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#1a2340]">Edit criteria</span>
                    <span className="mt-0.5 block text-xs text-[#8c9baa]">
                      {countries && countries.length > 0
                        ? 'Change targeting or balancing quotas for this country only.'
                        : 'Change targeting or balancing quotas, incidence rate, or completion date.'}
                    </span>
                  </span>
                </label>
              </div>

              {mode === 'same-criteria' && (
                <div className="mt-4">
                  <p className="mb-3 text-base font-semibold text-[#1a2340]">
                    How many additional responses do you need?
                  </p>
                  <WuInput
                    Label="Additional responses"
                    variant="outlined"
                    labelPosition="top"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full"
                    invalid={quantityInput.trim() !== '' && !isValidQuantity}
                    aria-invalid={quantityInput.trim() !== '' && !isValidQuantity}
                  />
                  <p className="mt-1.5 text-xs text-[#8c9baa]">{helper}</p>
                  {quantityNote ? (
                    <p className="mt-1 text-xs text-[#8c9baa]">{quantityNote}</p>
                  ) : null}
                </div>
              )}
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary">Cancel</WuModalClose>
              <WuButton color="primary" onClick={handleContinue} disabled={!canSubmit}>
                {mode === 'edit-criteria' ? 'Continue' : 'Launch'}
              </WuButton>
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false },
);

export function TopUpModal(props: TopUpModalProps) {
  return <TopUpModalInner {...props} />;
}
