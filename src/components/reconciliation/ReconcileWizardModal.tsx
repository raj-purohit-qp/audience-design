'use client';

import dynamic from 'next/dynamic';
import {
  ReconciliationWizard,
  StepFooter,
  type Batch,
  type StepFooterConfig,
} from '@/components/reconciliation/ReconciliationWizard';
import type { ReconciliationMeta } from '@/data/mock-reconciliation';

export interface ReconcileWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meta: ReconciliationMeta;
  step: number;
  batches: Batch[];
  onBatchesChange: (batches: Batch[]) => void;
  onConfirmChange: (confirmed: boolean) => void;
  footerProps: StepFooterConfig | undefined;
}

const ReconcileWizardModalInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = lib;

      return function ReconcileWizardModalInner({
        open,
        onOpenChange,
        meta,
        step,
        batches,
        onBatchesChange,
        onConfirmChange,
        footerProps,
      }: ReconcileWizardModalProps) {
        return (
          <WuModal
            open={open}
            onOpenChange={onOpenChange}
            maxWidth="960px"
            maxHeight={step === 1 ? '760px' : '640px'}
            preventClickOutside
            aria-describedby={undefined}
          >
            <WuModalHeader className="recon-modal-header">
              <span className="flex items-center gap-2">
                <span className="wm-assignment-return inline-flex text-[18px] leading-none text-[#1b87e6]" aria-hidden="true" />
                Reconcile
              </span>
            </WuModalHeader>

            <WuModalContent
              className={`recon-modal-content p-0 ${step === 1 ? 'recon-modal-content--step1' : 'recon-modal-content--scroll'}`}
            >
              <ReconciliationWizard
                meta={meta}
                step={step}
                batches={batches}
                onBatchesChange={onBatchesChange}
                onConfirmChange={onConfirmChange}
              />
            </WuModalContent>

            <WuModalFooter className="recon-modal-footer block overflow-hidden rounded-b-[inherit] p-0">
              {footerProps && <StepFooter current={step} {...footerProps} />}
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false },
);

export function ReconcileWizardModal(props: ReconcileWizardModalProps) {
  return <ReconcileWizardModalInner {...props} />;
}
