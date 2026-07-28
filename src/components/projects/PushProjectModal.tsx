'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  canPushAtSameCpi,
  formatCurrency,
  minHigherPushCpi,
  type PushCpiMode,
  type PushProjectResult,
} from '@/data/mock-audience-projects';

interface PushProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  currentCpi: number;
  sameCpiPushCount?: number;
  onConfirm: (result: PushProjectResult) => void;
}

function parseCpiInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  if (!cleaned) return NaN;
  return parseFloat(cleaned);
}

function meetsMinHigherCpi(value: number, minHigher: number): boolean {
  if (!Number.isFinite(value)) return false;
  // Compare in cents to avoid float edge cases (e.g. 4.15 * 1.1)
  return Math.round(value * 100) >= Math.round(minHigher * 100);
}

const PushProjectModalInner = dynamic(
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

      return function PushProjectModalInner({
        open,
        onOpenChange,
        projectName,
        currentCpi,
        sameCpiPushCount = 0,
        onConfirm,
      }: PushProjectModalProps) {
        const sameAllowed = canPushAtSameCpi(sameCpiPushCount);
        const minHigher = minHigherPushCpi(currentCpi);
        const [mode, setMode] = useState<PushCpiMode>(sameAllowed ? 'same' : 'higher');
        const [higherCpiInput, setHigherCpiInput] = useState('');
        const [error, setError] = useState<string | null>(null);

        const parsedHigherCpi = parseCpiInput(higherCpiInput);
        const higherCpiValid = meetsMinHigherCpi(parsedHigherCpi, minHigher);
        const canSubmit = mode === 'same' ? sameAllowed : higherCpiValid;

        useEffect(() => {
          if (!open) return;
          const allowed = canPushAtSameCpi(sameCpiPushCount);
          setMode(allowed ? 'same' : 'higher');
          setHigherCpiInput('');
          setError(null);
        }, [open, currentCpi, sameCpiPushCount]);

        function handleConfirm() {
          if (!canSubmit) return;

          if (mode === 'same') {
            onConfirm({ mode: 'same', cpi: currentCpi });
            onOpenChange(false);
            return;
          }

          onConfirm({ mode: 'higher', cpi: Number(parsedHigherCpi.toFixed(2)) });
          onOpenChange(false);
        }

        return (
          <WuModal open={open} onOpenChange={onOpenChange} variant="action" size="sm">
            <WuModalHeader>Push project</WuModalHeader>
            <WuModalContent>
              <p className="mb-4 text-sm text-[#54606b]">
                Push <span className="font-medium text-[#1a2340]">{projectName}</span> to gain more
                traffic. Current CPI is {formatCurrency(currentCpi)}.
              </p>

              <p className="mb-2 text-xs font-medium text-[#54606b]">Push at</p>
              <div className="space-y-2">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 ${
                    mode === 'same' ? 'border-[#1b87e6] bg-[#f0f7ff]' : 'border-[#e0e4e8] bg-white'
                  } ${!sameAllowed ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  <input
                    type="radio"
                    name="push-cpi-mode"
                    className="mt-0.5 accent-[#1b87e6]"
                    checked={mode === 'same'}
                    disabled={!sameAllowed}
                    onChange={() => {
                      setMode('same');
                      setError(null);
                    }}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#1a2340]">Same CPI</span>
                    <span className="mt-0.5 block text-xs text-[#8c9baa]">
                      {sameAllowed
                        ? `Keep ${formatCurrency(currentCpi)} (${sameCpiPushCount}/2 same-CPI pushes used)`
                        : 'Unavailable — already pushed twice at this CPI'}
                    </span>
                  </span>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 ${
                    mode === 'higher' ? 'border-[#1b87e6] bg-[#f0f7ff]' : 'border-[#e0e4e8] bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="push-cpi-mode"
                    className="mt-0.5 accent-[#1b87e6]"
                    checked={mode === 'higher'}
                    onChange={() => {
                      setMode('higher');
                      setHigherCpiInput('');
                      setError(null);
                    }}
                  />
                  <span>
                    <span className="block text-sm font-medium text-[#1a2340]">Higher CPI</span>
                    <span className="mt-0.5 block text-xs text-[#8c9baa]">
                      Must be at least 10% above current CPI ({formatCurrency(minHigher)})
                    </span>
                  </span>
                </label>
              </div>

              {mode === 'higher' && (
                <div className="mt-4">
                  <WuInput
                    Label="New CPI"
                    variant="outlined"
                    labelPosition="top"
                    placeholder={minHigher.toFixed(2)}
                    value={higherCpiInput}
                    onChange={(e) => {
                      setHigherCpiInput(e.target.value);
                      if (error) setError(null);
                    }}
                    Icon={<span className="text-xs text-[#8c9baa]">$</span>}
                    iconPosition="left"
                    className="w-full max-w-[10rem]"
                    invalid={higherCpiInput.trim() !== '' && !higherCpiValid}
                    aria-invalid={higherCpiInput.trim() !== '' && !higherCpiValid}
                  />
                  {higherCpiInput.trim() === '' ? (
                    <p className="mt-1.5 text-xs text-[#8c9baa]">
                      Enter at least {formatCurrency(minHigher)} to enable Push.
                    </p>
                  ) : (
                    !higherCpiValid && (
                      <p className="mt-1.5 text-xs text-[#d93025]" role="alert">
                        Enter at least {formatCurrency(minHigher)} (10% above current CPI).
                      </p>
                    )
                  )}
                </div>
              )}

              {error && (
                <p className="mt-2 text-xs text-[#d93025]" role="alert">
                  {error}
                </p>
              )}
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary">Cancel</WuModalClose>
              <WuButton color="primary" onClick={handleConfirm} disabled={!canSubmit}>
                Push
              </WuButton>
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false },
);

export function PushProjectModal(props: PushProjectModalProps) {
  return <PushProjectModalInner {...props} />;
}
