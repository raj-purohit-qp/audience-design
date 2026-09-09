'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  defaultTopUpQuantity,
  topUpDefaultHelperText,
} from '@/data/mock-audience-projects';

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalRequiredResponses: number;
  reconciledResponses?: number;
  onConfirm: (additionalResponses: number) => void;
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
      } = lib;

      return function TopUpModalInner({
        open,
        onOpenChange,
        originalRequiredResponses,
        reconciledResponses = 0,
        onConfirm,
      }: TopUpModalProps) {
        const defaultQty = defaultTopUpQuantity(originalRequiredResponses, reconciledResponses);
        const helper = topUpDefaultHelperText(originalRequiredResponses, reconciledResponses);
        const [quantityInput, setQuantityInput] = useState(String(defaultQty));

        const parsed = parseResponseCount(quantityInput);
        const isValid = Number.isInteger(parsed) && parsed >= 1;

        useEffect(() => {
          if (!open) return;
          setQuantityInput(String(defaultTopUpQuantity(originalRequiredResponses, reconciledResponses)));
        }, [open, originalRequiredResponses, reconciledResponses]);

        function handleContinue() {
          if (!isValid) return;
          onConfirm(parsed);
          onOpenChange(false);
        }

        return (
          <WuModal open={open} onOpenChange={onOpenChange} variant="action" size="sm">
            <WuModalHeader>Top-up</WuModalHeader>
            <WuModalContent>
              <p className="mb-4 text-base font-semibold text-[#1a2340]">
                How many additional responses do you need?
              </p>
              <WuInput
                Label="Additional responses"
                variant="outlined"
                labelPosition="top"
                value={quantityInput}
                onChange={(e) => setQuantityInput(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full"
                invalid={quantityInput.trim() !== '' && !isValid}
                aria-invalid={quantityInput.trim() !== '' && !isValid}
              />
              <p className="mt-1.5 text-xs text-[#8c9baa]">{helper}</p>
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary">Cancel</WuModalClose>
              <WuButton color="primary" onClick={handleContinue} disabled={!isValid}>
                Launch
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
