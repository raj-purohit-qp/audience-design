'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MOCK_RECONCILIATION_REQUEST,
  STATUS_CONFIG,
  type ReconciliationRequest,
  type ReconciliationMeta,
} from '@/data/mock-reconciliation';

const WuButton     = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),     { ssr: false });
const WuCard       = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),       { ssr: false });
const WuCardHeader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })), { ssr: false });
const WuChip       = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),       { ssr: false });
const WuDrawer     = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDrawer })),     { ssr: false });

/* ── Status chip ── */
function StatusBadge({ status }: { status: ReconciliationRequest['status'] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <WuChip size="sm" shape="rounded" color={cfg.color} aria-label={`Status: ${cfg.label}`}>
      {cfg.label}
    </WuChip>
  );
}

/* ── Decision chip ── */
function DecisionChip({ decision }: { decision: 'approved' | 'rejected' | 'pending' }) {
  const map = {
    approved: { label: 'Approved ✓', color: 'success' as const },
    rejected: { label: 'Rejected ✕', color: 'danger'  as const },
    pending:  { label: 'Pending',    color: undefined               },
  };
  const { label, color } = map[decision];
  return <WuChip size="sm" color={color}>{label}</WuChip>;
}

/* ── Timeline ── */
const TIMELINE_STAGES = [
  'Submitted',
  'Validation complete',
  'Under review',
  'Decision issued',
  'Wallet credited',
] as const;

type TimelineStageState = 'completed' | 'upcoming' | 'inactive';

function getTimelineStageStates(
  status: ReconciliationRequest['status'],
  auditTrailLength: number,
): TimelineStageState[] {
  if (status === 'pending') {
    return ['completed', 'completed', 'completed', 'upcoming', 'upcoming'];
  }
  if (status === 'approved' || status === 'partially_approved') {
    return TIMELINE_STAGES.map(() => 'completed' as const);
  }
  return TIMELINE_STAGES.map((_, i) =>
    i < auditTrailLength ? 'completed' : 'inactive',
  );
}

function ReconciliationTimeline({
  auditTrail,
  status,
}: {
  auditTrail: ReconciliationRequest['auditTrail'];
  status: ReconciliationRequest['status'];
}) {
  const stageStates = getTimelineStageStates(status, auditTrail.length);

  return (
    <div className="space-y-0">
      {TIMELINE_STAGES.map((stage, i) => {
        const state   = stageStates[i];
        const entry   = auditTrail[i];
        const isLast  = i === TIMELINE_STAGES.length - 1;
        const current = status === 'pending' && i === 2;

        return (
          <div key={stage} className="flex gap-4">
            {/* Spine */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  state === 'completed'
                    ? 'border-2 border-[#1b87e6] bg-[#1b87e6] text-white'
                    : state === 'upcoming'
                      ? 'bg-white'
                      : 'border-2 border-[#e0e4e8] bg-white text-[#c4cdd5]'
                }`}
                style={
                  state === 'upcoming'
                    ? { border: '2px solid #1b87e6', background: '#ffffff' }
                    : undefined
                }
                aria-label={
                  state === 'completed'
                    ? `${stage} — completed`
                    : state === 'upcoming'
                      ? `${stage} — upcoming`
                      : stage
                }
              >
                {state === 'completed' && (
                  <span className="wm-check text-xs" aria-hidden="true" />
                )}
                {state === 'inactive' && (
                  <span className="h-2 w-2 rounded-full bg-[#e0e4e8]" aria-hidden="true" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-[2px] flex-1 ${state === 'completed' ? 'bg-[#1b87e6]' : 'bg-[#e0e4e8]'}`}
                  style={{ minHeight: 28 }}
                />
              )}
            </div>
            {/* Content */}
            <div className="pb-5">
              <p
                className={`text-sm font-medium ${
                  state === 'completed' || state === 'upcoming'
                    ? 'text-[#1a2340]'
                    : 'text-[#c4cdd5]'
                }`}
              >
                {stage}
              </p>
              {entry && (
                <>
                  <p className="text-xs text-[#8c9baa]">{entry.date}</p>
                  {(current || (state === 'completed' && i === auditTrail.length - 1)) && (
                    <p className="mt-0.5 text-xs text-[#54606b]">{entry.event}</p>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Request detail drawer ── */
function RequestDetailDrawer({
  request,
  open,
  onClose,
}: {
  request: ReconciliationRequest;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <WuDrawer
      open={open}
      onOpenChange={(v) => { if (!v) onClose(); }}
      side="right"
    >
      <div className="flex h-full w-[560px] max-w-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e4e8] px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-[#1a2340]">{request.requestId}</h2>
            <p className="text-xs text-[#8c9baa]">Submitted {request.submittedDate}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'IDs submitted',   value: request.idsSubmitted.toString() },
              { label: 'Credit amount',   value: `$${request.creditAmount.toFixed(2)}` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-[#e0e4e8] px-4 py-3">
                <p className="text-[11px] font-medium text-[#8c9baa]">{label}</p>
                <p className="text-[22px] font-normal text-[#1a2340]">{value}</p>
              </div>
            ))}
          </div>

          {/* Response breakdown */}
          <div>
            <p className="mb-2 text-sm font-medium text-[#1a2340]">Response breakdown</p>
            <div className="overflow-hidden rounded-md border border-[#e0e4e8]">
              <table className="w-full text-xs" aria-label="Response breakdown">
                <thead className="bg-[#f5f6f8]">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium text-[#8c9baa]">Response ID</th>
                    <th className="px-3 py-2.5 text-left font-medium text-[#8c9baa]">Reason</th>
                    <th className="px-3 py-2.5 text-left font-medium text-[#8c9baa]">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {request.responses.map((r) => (
                    <tr key={r.responseId} className="border-t border-[#eef0f3]">
                      <td className="px-3 py-2 font-mono text-[#1a2340]">{r.responseId}</td>
                      <td className="px-3 py-2 capitalize text-[#54606b]">{r.reason.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2">
                        <DecisionChip decision={r.decision} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviewer comment */}
          {request.reviewerComment && (
            <div className="rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-4 py-3">
              <p className="mb-1 text-[11px] font-medium text-[#8c9baa]">Reviewer comment</p>
              <p className="text-sm text-[#54606b]">{request.reviewerComment}</p>
            </div>
          )}

          {/* Audit trail */}
          <div>
            <p className="mb-3 text-sm font-medium text-[#1a2340]">Audit trail</p>
            <ReconciliationTimeline auditTrail={request.auditTrail} status={request.status} />
          </div>

          {/* Wallet credit banner */}
          {(request.status === 'approved' || request.status === 'partially_approved') && (
            <div className="flex items-center justify-between rounded-md border border-[#a8d5b5] bg-[#e8f5e9] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="wm-check-circle text-base text-[#188038]" aria-hidden="true" />
                <p className="text-sm font-medium text-[#188038]">
                  ${request.creditAmount.toFixed(2)} credited to your wallet
                </p>
              </div>
              <WuButton variant="outline" color="primary">
                View transaction
              </WuButton>
            </div>
          )}
        </div>
      </div>
    </WuDrawer>
  );
}

/* ── Summary banner ── */
function SummaryBanner({ request }: { request: ReconciliationRequest }) {
  const cfg = STATUS_CONFIG[request.status];
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e0e4e8] bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="wm-assignment text-2xl text-[#1b87e6]" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-[#1a2340]">{request.requestId}</p>
          <p className="text-xs text-[#8c9baa]">{request.idsSubmitted} IDs submitted · {request.submittedDate}</p>
        </div>
      </div>
      <StatusBadge status={request.status} />
    </div>
  );
}

/* ── History table ── */
function RequestHistoryTable({
  request,
  onViewDetail,
}: {
  request: ReconciliationRequest;
  onViewDetail: () => void;
}) {
  return (
    <WuCard rounded className="overflow-hidden p-0 shadow-sm">
      <WuCardHeader>
        Request history
      </WuCardHeader>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label="Reconciliation request history">
          <thead className="bg-[#f5f6f8]">
            <tr>
              {['Request ID', 'Submitted date', 'IDs submitted', 'Status', 'Credit amount', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#8c9baa]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-[#eef0f3] hover:bg-[#f9fafb]">
              <td className="px-4 py-3 font-medium text-[#1b87e6]">{request.requestId}</td>
              <td className="px-4 py-3 text-[#54606b]">{request.submittedDate}</td>
              <td className="px-4 py-3 text-[#1a2340]">{request.idsSubmitted}</td>
              <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
              <td className="px-4 py-3 font-medium text-[#1a2340]">${request.creditAmount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <WuButton variant="outline" color="primary" onClick={onViewDetail}>
                  View
                </WuButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </WuCard>
  );
}

/* ── Main dashboard ── */
export function ReconciliationDashboard({ meta }: { meta: ReconciliationMeta }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const request = meta.request ?? MOCK_RECONCILIATION_REQUEST;

  return (
    <div>
      <SummaryBanner request={request} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Timeline */}
        <WuCard rounded className="overflow-hidden p-0 shadow-sm">
          <WuCardHeader>
            Reconciliation timeline
          </WuCardHeader>
          <div className="px-5 py-5">
            <ReconciliationTimeline auditTrail={request.auditTrail} status={request.status} />
          </div>
        </WuCard>

        {/* Right: History table */}
        <div className="xl:col-span-2">
          <RequestHistoryTable request={request} onViewDetail={() => setDrawerOpen(true)} />
        </div>
      </div>

      <RequestDetailDrawer
        request={request}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
