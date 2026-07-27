'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false },
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false },
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false },
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false },
);
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalClose })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
);

interface RejectRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  onConfirm: (reason: string) => void;
}

export function RejectRequestModal({
  open,
  onOpenChange,
  submitting = false,
  onConfirm,
}: RejectRequestModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setError(null);
    }
  }, [open]);

  function handleConfirm() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Please enter a reason for rejection.');
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <WuModal open={open} onOpenChange={onOpenChange} variant="critical" size="sm">
      <WuModalHeader>Reject approval request?</WuModalHeader>
      <WuModalContent>
        <p className="mb-4 text-sm text-gray-600">
          The pending pricing changes will be discarded and live settings will remain unchanged.
          Provide a reason so the Account manager can revise and resubmit.
        </p>
        <WuTextarea
          Label="Reason"
          variant="outlined"
          labelPosition="top"
          placeholder="Explain why this request is being rejected"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError(null);
          }}
          rows={4}
          className="w-full"
          aria-invalid={!!error}
        />
        {error && (
          <p className="mt-1 text-xs text-[#d93025]" role="alert">
            {error}
          </p>
        )}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary" disabled={submitting}>
          Cancel
        </WuModalClose>
        <WuButton color="error" onClick={handleConfirm} disabled={submitting} loading={submitting}>
          Reject request
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
