'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_RECONCILIATION_META,
  MOCK_PENDING_RECONCILIATION_REQUEST,
  STATUS_CONFIG,
  type ReconciliationMeta,
} from '@/data/mock-reconciliation';
import { ReconciliationOverviewCards } from '@/components/reconciliation/ReconciliationOverviewCards';
import {
  ReconciliationWizard,
  StepFooter,
  type Batch,
} from '@/components/reconciliation/ReconciliationWizard';
import { ReconciliationDashboard } from '@/components/reconciliation/ReconciliationDashboard';

const WuButton       = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),       { ssr: false });
const WuModal        = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),        { ssr: false });
const WuModalHeader  = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),  { ssr: false });
const WuModalContent = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })), { ssr: false });
const WuModalFooter  = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),  { ssr: false });

/* ── Page header — mirrors ProjectDashboard header style ── */
function ReconPageHeader({ meta, projectName }: { meta: ReconciliationMeta; projectName: string }) {
  const cfg = STATUS_CONFIG[meta.status];
  const reconStatusLabel = meta.status === 'not_submitted' ? 'Not reconciled' : cfg.label;
  const reconStatusBg    = meta.status === 'not_submitted' ? '#f5f6f8' : cfg.bg;
  const reconStatusFg    = meta.status === 'not_submitted' ? '#54606b' : cfg.fg;

  return (
    <header>
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-start justify-between gap-4 px-7 py-5">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-normal leading-tight text-[#1a2340]">{projectName}</h1>
            <span
              className="inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium"
              style={{ background: reconStatusBg, color: reconStatusFg, borderColor: 'transparent' }}
            >
              {reconStatusLabel}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#8c9baa]">
            <span className="inline-flex items-center gap-1">
              <span className="wm-event text-[15px]" aria-hidden="true" />
              Closed {meta.closeDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="wm-schedule text-[15px]" aria-hidden="true" />
              Deadline {meta.deadlineDate}
            </span>
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                meta.daysRemaining <= 7 ? 'text-[#d93025]' : 'text-[#b06d00]'
              }`}
            >
              <span className="wm-timer text-[15px]" aria-hidden="true" />
              {meta.daysRemaining} days remaining
            </span>
          </div>
        </div>
      </div>
      <hr className="border-[#e0e4e8]" />
    </header>
  );
}

/* ── Empty state ── */
function EmptyReconState({ onStart }: { onStart: () => void }) {
  const rules = [
    'One submission per project',
    'Maximum 20% of completed responses',
    'Submit within 30 days of project close',
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
export function ReconciliationTab({ projectName }: { projectName: string }) {
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
    showToast({ message: 'Reconciliation request submitted!', variant: 'success' });
    setMeta((prev) => ({
      ...prev,
      status: 'pending',
      request: {
        ...MOCK_PENDING_RECONCILIATION_REQUEST,
        idsSubmitted,
      },
    }));
    setModalOpen(false);
    setShowDashboard(true);
  }

  /* ── Footer config per step ── */
  const hasBatches = batches.length > 0;
  const footerProps = ({
    1: { canNext: hasBatches,  nextLabel: 'Next',    nextIcon: 'wm-arrow-forward', onBack: undefined,         onNext: () => setStep(2) },
    2: { canNext: true,        nextLabel: 'Next',    nextIcon: 'wm-arrow-forward', onBack: () => setStep(1), onNext: () => setStep(3) },
    3: { canNext: confirmed,   nextLabel: 'Submit',  nextIcon: 'wm-send',          onBack: () => setStep(2), onNext: handleSubmit     },
  } as Record<number, Parameters<typeof StepFooter>[0]>)[step];

  return (
    <div>
      <ReconPageHeader meta={meta} projectName={projectName} />
      <div className="mx-auto max-w-[1320px] px-7 py-6 pb-14">
        <ReconciliationOverviewCards meta={meta} />
        <div className="mt-8">
          {!showDashboard && <EmptyReconState onStart={openModal} />}
          {showDashboard && <ReconciliationDashboard meta={meta} />}
        </div>
      </div>

      {/* ── Wizard modal ── */}
      <WuModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        maxWidth="940px"
        maxHeight="584px"
        preventClickOutside
        aria-describedby={undefined}
      >
        <WuModalHeader className="recon-modal-header">
          <span className="wm-assignment-return text-lg text-[#1b87e6]" aria-hidden="true" />
          Reconcile
        </WuModalHeader>

        {/* Scrollable body — no extra padding wrapper */}
        <WuModalContent className="p-0">
          <ReconciliationWizard
            meta={meta}
            step={step}
            batches={batches}
            onBatchesChange={setBatches}
            onConfirmChange={setConfirmed}
          />
        </WuModalContent>

        {/* Sticky footer — outside the scroll area */}
        <WuModalFooter className="recon-modal-footer block overflow-hidden rounded-b-[inherit] p-0">
          {footerProps && <StepFooter current={step} {...footerProps} />}
        </WuModalFooter>
      </WuModal>
    </div>
  );
}
