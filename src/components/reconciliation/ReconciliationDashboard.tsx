'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
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

/* ── Request status drawer ── */
function RequestStatusDrawer({
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
      <div className="flex h-full w-[480px] max-w-full flex-col">
        <div className="flex items-center justify-between border-b border-[#e0e4e8] px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-[#1a2340]">{request.requestId}</h2>
            <p className="text-xs text-[#8c9baa]">Submitted {request.submittedDate}</p>
          </div>
          <StatusBadge status={request.status} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <p className="mb-4 text-sm font-medium text-[#1a2340]">Reconciliation timeline</p>
          <ReconciliationTimeline auditTrail={request.auditTrail} status={request.status} />
        </div>
      </div>
    </WuDrawer>
  );
}

/* ── History table ── */
function RequestHistoryTable({
  requests,
  onCheck,
}: {
  requests: ReconciliationRequest[];
  onCheck: (request: ReconciliationRequest) => void;
}) {
  const sorted = [...requests].reverse();

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
            {sorted.map((request) => (
              <tr key={request.requestId} className="border-t border-[#eef0f3] hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-medium text-[#1b87e6]">{request.requestId}</td>
                <td className="px-4 py-3 text-[#54606b]">{request.submittedDate}</td>
                <td className="px-4 py-3 text-[#1a2340]">{request.idsSubmitted}</td>
                <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                <td className="px-4 py-3 font-medium text-[#1a2340]">${request.creditAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <WuButton variant="outline" color="primary" onClick={() => onCheck(request)}>
                    Check
                  </WuButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WuCard>
  );
}

/* ── Main dashboard ── */
export function ReconciliationDashboard({
  meta,
  canReconcile,
  onReconcile,
}: {
  meta: ReconciliationMeta;
  canReconcile: boolean;
  onReconcile: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReconciliationRequest | null>(null);

  function openStatus(request: ReconciliationRequest) {
    setSelectedRequest(request);
    setDrawerOpen(true);
  }

  return (
    <div>
      {canReconcile && (
        <div className="mb-5 flex justify-end">
          <WuButton
            Icon={<span className="wm-assignment-return" aria-hidden="true" />}
            iconPosition="left"
            onClick={onReconcile}
          >
            New submission
          </WuButton>
        </div>
      )}

      <RequestHistoryTable requests={meta.requests} onCheck={openStatus} />

      {selectedRequest && (
        <RequestStatusDrawer
          request={selectedRequest}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
