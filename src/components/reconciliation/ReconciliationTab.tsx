'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_RECONCILIATION_META,
  MOCK_PENDING_RECONCILIATION_REQUEST,
  STATUS_CONFIG,
  type ReconciliationMeta,
  type ReconciliationStatus,
} from '@/data/mock-reconciliation';
import { ReconciliationOverviewCards } from '@/components/reconciliation/ReconciliationOverviewCards';
import { type Batch, type StepFooterConfig } from '@/components/reconciliation/ReconciliationWizard';
import { ReconcileWizardModal } from '@/components/reconciliation/ReconcileWizardModal';
import { ReconciliationDashboard } from '@/components/reconciliation/ReconciliationDashboard';
import { DetailPageContent } from '@/components/ui/page-layout';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });
const WuChip = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })), { ssr: false });

function ReconciliationStatusChip({ status }: { status: ReconciliationStatus }) {
  const cfg = STATUS_CONFIG[status];
  const label = status === 'not_submitted' ? 'Not reconciled' : cfg.label;
  return (
    <WuChip size="sm" shape="rounded" color={cfg.color}>
      {label}
    </WuChip>
  );
}

/* ── Empty state ── */
function EmptyReconState({ onStart }: { onStart: () => void }) {
  const rules = [
    'One submission per project',
    'Maximum 20% of completed responses',
    'Submit within 30 days of project launch date',
    'Automatic wallet credit after approval',
  ];

  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f0fe]">
        <span className="wm-manage-search text-[32px] text-[#1b87e6]" aria-hidden="true" />
      </div>
      <h3 className="mb-2 text-base font-medium text-[#1a2340]">
        Review your survey responses and request credits for low-quality completes.
      </h3>
      <p className="mb-6 max-w-md text-sm text-[#8c9baa]">
        Upload Response IDs that should be reviewed. Approved responses will automatically be credited back to your wallet.
      </p>
      <div className="mb-8 inline-flex flex-col gap-2 rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-6 py-4 text-left">
        {rules.map((r) => (
          <div key={r} className="flex items-center gap-2 text-sm text-[#54606b]">
            <span className="wm-check-circle text-base text-[#188038]" aria-hidden="true" />
            {r}
          </div>
        ))}
      </div>
      <WuButton
        Icon={<span className="wm-assignment-return" aria-hidden="true" />}
        iconPosition="left"
        onClick={onStart}
      >
        Reconcile
      </WuButton>
    </div>
  );
}

/* ── Main tab ── */
export function ReconciliationTab({ projectName: _projectName }: { projectName: string }) {
  const { showToast } = useWuShowToast();

  const [meta, setMeta] = useState<ReconciliationMeta>({
    ...MOCK_RECONCILIATION_META,
    status: 'not_submitted',
  });
  const [showDashboard, setShowDashboard] = useState(false);
  const [modalOpen, setModalOpen]         = useState(false);

  /* ── Wizard state (lifted here so footer can live in WuModalFooter) ── */
  const [step, setStep]       = useState(1);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  function openModal() {
    setStep(1);
    setBatches([]);
    setConfirmed(false);
    setModalOpen(true);
  }

  function handleSubmit() {
    const idsSubmitted = batches.reduce((s, b) => s + b.valid, 0);
    const responses = batches.flatMap((b) =>
      b.ids.slice(0, b.valid).map((responseId) => ({
        responseId,
        reason: b.reason,
        decision: 'pending' as const,
      })),
    );
    showToast({ message: 'Reconciliation request submitted!', variant: 'success' });
    setMeta((prev) => ({
      ...prev,
      status: 'pending',
      request: {
        ...MOCK_PENDING_RECONCILIATION_REQUEST,
        idsSubmitted,
        responses: responses.length > 0 ? responses : MOCK_PENDING_RECONCILIATION_REQUEST.responses,
      },
    }));
    setModalOpen(false);
    setShowDashboard(true);
  }

  /* ── Footer config per step ── */
  const hasBatches = batches.length > 0;
  const footerPropsByStep: Record<number, StepFooterConfig> = {
    1: { canNext: hasBatches, nextLabel: 'Next',   nextIcon: 'wm-arrow-forward', onNext: () => setStep(2) },
    2: { canNext: true,       nextLabel: 'Next',   nextIcon: 'wm-arrow-forward', onBack: () => setStep(1), onNext: () => setStep(3) },
    3: { canNext: confirmed,  nextLabel: 'Submit', nextIcon: 'wm-send',          onBack: () => setStep(2), onNext: handleSubmit },
  };
  const footerProps = footerPropsByStep[step];

  return (
    <DetailPageContent>
      <div className="mb-5">
        <ReconciliationStatusChip status={meta.status} />
      </div>
      <ReconciliationOverviewCards meta={meta} />
      <div className="mt-8">
        {!showDashboard && <EmptyReconState onStart={openModal} />}
        {showDashboard && <ReconciliationDashboard meta={meta} />}
      </div>

      <ReconcileWizardModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        meta={meta}
        step={step}
        batches={batches}
        onBatchesChange={setBatches}
        onConfirmChange={setConfirmed}
        footerProps={footerProps}
      />
    </DetailPageContent>
  );
}
