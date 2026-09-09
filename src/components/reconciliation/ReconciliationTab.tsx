'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_RECONCILIATION_META,
  canSubmitReconciliation,
  getAggregateReconciliationStatus,
  type ReconciliationMeta,
  type ReconciliationRequest,
} from '@/data/mock-reconciliation';
import { ReconciliationOverviewCards } from '@/components/reconciliation/ReconciliationOverviewCards';
import { type Batch, type StepFooterConfig } from '@/components/reconciliation/ReconciliationWizard';
import { ReconcileWizardModal } from '@/components/reconciliation/ReconcileWizardModal';
import { ReconciliationDashboard } from '@/components/reconciliation/ReconciliationDashboard';
import { ReconciliationGuidelines } from '@/components/reconciliation/ReconciliationGuidelines';
import { DetailPageContent } from '@/components/ui/page-layout';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });

function buildRequestFromBatches(batches: Batch[], requestIndex: number): ReconciliationRequest {
  const idsSubmitted = batches.reduce((s, b) => s + b.valid, 0);
  const submittedDate = format(new Date(), 'MMM d, yyyy');
  const responses = batches.flatMap((b) =>
    b.ids.slice(0, b.valid).map((responseId) => ({
      responseId,
      reason: b.reason,
      decision: 'pending' as const,
    })),
  );

  return {
    requestId: `REQ-2026-${1024 + requestIndex}`,
    submittedDate,
    idsSubmitted,
    status: 'pending',
    creditAmount: 0,
    responses,
    auditTrail: [
      { date: submittedDate, event: 'Request submitted' },
      { date: submittedDate, event: 'Validation completed' },
      { date: submittedDate, event: 'Under review by QP quality team' },
    ],
  };
}

/* ── Empty state ── */
function EmptyReconState({ onStart, canReconcile }: { onStart: () => void; canReconcile: boolean }) {
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
      {canReconcile ? (
        <WuButton
          Icon={<span className="wm-assignment-return" aria-hidden="true" />}
          iconPosition="left"
          onClick={onStart}
        >
          Reconcile
        </WuButton>
      ) : (
        <p className="text-sm text-[#8c9baa]">The reconciliation window is closed or your ID allowance is fully used.</p>
      )}
    </div>
  );
}

/* ── Main tab ── */
export function ReconciliationTab({
  projectName: _projectName,
  onReconciled,
}: {
  projectName: string;
  onReconciled?: (idsSubmitted: number) => void;
}) {
  const { showToast } = useWuShowToast();

  const [meta, setMeta] = useState<ReconciliationMeta>({
    ...MOCK_RECONCILIATION_META,
    status: 'not_submitted',
    requests: [],
  });
  const [modalOpen, setModalOpen] = useState(false);

  /* ── Wizard state (lifted here so footer can live in WuModalFooter) ── */
  const [step, setStep] = useState(1);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const hasSubmissions = meta.requests.length > 0;
  const canReconcile = canSubmitReconciliation(meta);

  function openModal() {
    setStep(1);
    setBatches([]);
    setConfirmed(false);
    setModalOpen(true);
  }

  function handleSubmit() {
    const newRequest = buildRequestFromBatches(batches, meta.requests.length);
    showToast({ message: 'Reconciliation request submitted!', variant: 'success' });
    onReconciled?.(newRequest.idsSubmitted);
    setMeta((prev) => {
      const requests = [...prev.requests, newRequest];
      return {
        ...prev,
        requests,
        status: getAggregateReconciliationStatus({ ...prev, requests }),
      };
    });
    setModalOpen(false);
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
      <ReconciliationOverviewCards meta={meta} />
      <ReconciliationGuidelines className="mt-5 w-full" />
      <div className="mt-8">
        {!hasSubmissions && <EmptyReconState onStart={openModal} canReconcile={canReconcile} />}
        {hasSubmissions && (
          <ReconciliationDashboard meta={meta} canReconcile={canReconcile} onReconcile={openModal} />
        )}
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
