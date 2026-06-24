// ─────────────────────────────────────────────────────────────
//  Reconciliation mock data
// ─────────────────────────────────────────────────────────────

export type ReconciliationStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'withdrawn';

export type ResponseDecision = 'approved' | 'rejected' | 'pending';

export const REJECTION_REASONS = [
  { value: 'speeding',            code: 'QP-101', label: 'Speeding',              description: 'Survey completed unusually fast, indicating low-quality data.' },
  { value: 'straightlining',      code: 'QP-102', label: 'Straightlining',        description: 'Respondent selected the same answer for all questions.' },
  { value: 'duplicate_response',  code: 'QP-103', label: 'Duplicate response',    description: 'Response was submitted more than once.' },
  { value: 'fraud_detection',     code: 'QP-104', label: 'Fraud detection',       description: 'Flagged by fraud detection systems.' },
  { value: 'device_mismatch',     code: 'QP-106', label: 'Device mismatch',       description: 'Device type does not match panel profile.' },
  { value: 'geo_mismatch',        code: 'QP-107', label: 'Geo mismatch',          description: 'Respondent location does not match target geography.' },
  { value: 'quality_failure',     code: 'QP-108', label: 'Quality failure',       description: 'Failed one or more quality check questions.' },
  { value: 'inconsistent',        code: 'QP-109', label: 'Inconsistent answers',  description: 'Contradictory answers detected across questions.' },
  { value: 'open_end_gibberish',  code: 'QP-110', label: 'Open-end gibberish',    description: 'Open-ended responses contain nonsensical text.' },
  { value: 'bot_activity',        code: 'QP-111', label: 'Bot activity',          description: 'Response pattern matches automated bot behavior.' },
  { value: 'other',               code: 'QP-112', label: 'Other',                 description: 'Other quality issue not covered above.' },
] as const;

export type RejectionReasonValue = (typeof REJECTION_REASONS)[number]['value'];

export interface ReconciliationResponseRow {
  responseId: string;
  reason: RejectionReasonValue;
  decision: ResponseDecision;
}

export interface ReconciliationRequest {
  requestId: string;
  submittedDate: string;
  idsSubmitted: number;
  status: ReconciliationStatus;
  creditAmount: number;
  responses: ReconciliationResponseRow[];
  auditTrail: { date: string; event: string }[];
  reviewerComment?: string;
}

export interface ReconciliationMeta {
  projectId: string;
  closeDate: string;
  deadlineDate: string;
  daysRemaining: number;
  eligibleResponses: number;
  maxIds: number;
  maxPct: number;
  estimatedRefund: number;
  cpi: number;
  status: ReconciliationStatus;
  request?: ReconciliationRequest;
}

// ── Pending request (shown immediately after submission) ──
export const MOCK_PENDING_RECONCILIATION_REQUEST: ReconciliationRequest = {
  requestId: 'REQ-2026-1024',
  submittedDate: 'Jun 24, 2026',
  idsSubmitted: 6,
  status: 'pending',
  creditAmount: 0,
  responses: [
    { responseId: 'R-20481', reason: 'speeding',           decision: 'pending' },
    { responseId: 'R-20492', reason: 'straightlining',     decision: 'pending' },
    { responseId: 'R-20503', reason: 'duplicate_response', decision: 'pending' },
    { responseId: 'R-20514', reason: 'quality_failure',    decision: 'pending' },
    { responseId: 'R-20525', reason: 'bot_activity',       decision: 'pending' },
    { responseId: 'R-20536', reason: 'geo_mismatch',       decision: 'pending' },
  ],
  auditTrail: [
    { date: 'Jun 24, 2026', event: 'Request submitted' },
    { date: 'Jun 24, 2026', event: 'Validation completed' },
    { date: 'Jun 24, 2026', event: 'Under review by QP quality team' },
  ],
};

// ── Submitted request (used for post-decision demo) ──
export const MOCK_RECONCILIATION_REQUEST: ReconciliationRequest = {
  requestId: 'REQ-2026-1024',
  submittedDate: 'Jul 12, 2026',
  idsSubmitted: 80,
  status: 'partially_approved',
  creditAmount: 245.0,
  responses: [
    { responseId: 'R-10021', reason: 'speeding',           decision: 'approved'  },
    { responseId: 'R-10034', reason: 'straightlining',     decision: 'approved'  },
    { responseId: 'R-10047', reason: 'bot_activity',       decision: 'approved'  },
    { responseId: 'R-10058', reason: 'device_mismatch',    decision: 'rejected'  },
    { responseId: 'R-10063', reason: 'geo_mismatch',       decision: 'approved'  },
    { responseId: 'R-10071', reason: 'fraud_detection',    decision: 'approved'  },
    { responseId: 'R-10089', reason: 'quality_failure',    decision: 'rejected'  },
    { responseId: 'R-10095', reason: 'duplicate_response', decision: 'approved'  },
    { responseId: 'R-10102', reason: 'open_end_gibberish', decision: 'approved'  },
    { responseId: 'R-10118', reason: 'inconsistent',       decision: 'rejected'  },
  ],
  auditTrail: [
    { date: 'Jul 12, 2026', event: 'Request submitted' },
    { date: 'Jul 12, 2026', event: 'Validation completed — 80 of 82 IDs valid' },
    { date: 'Jul 13, 2026', event: 'Under review by QP quality team' },
    { date: 'Jul 14, 2026', event: 'Decision issued — 70 IDs approved, 10 rejected' },
    { date: 'Jul 14, 2026', event: '$245.00 credited to wallet' },
  ],
  reviewerComment: '10 IDs rejected due to insufficient evidence of VPN/geo mismatch.',
};

// ── Default meta for a closed project ──
export const MOCK_RECONCILIATION_META: ReconciliationMeta = {
  projectId: 'QP-M6548',
  closeDate: 'Jul 10, 2026',
  deadlineDate: 'Aug 9, 2026',
  daysRemaining: 23,
  eligibleResponses: 500,
  maxIds: 100,
  maxPct: 20,
  estimatedRefund: 350.0,
  cpi: 3.5,
  status: 'not_submitted',
};

// ── Status display config ──
export const STATUS_CONFIG: Record<
  ReconciliationStatus,
  { label: string; color: 'success' | 'warning' | 'danger' | undefined; bg: string; fg: string }
> = {
  not_submitted:      { label: 'Not submitted',      color: undefined,  bg: '#f5f6f8', fg: '#54606b' },
  pending:            { label: 'Pending approval', color: 'warning',  bg: '#fff8e1', fg: '#b06d00' },
  approved:           { label: 'Approved',           color: 'success',  bg: '#e8f5e9', fg: '#188038' },
  partially_approved: { label: 'Partially approved', color: 'warning',  bg: '#fff8e1', fg: '#b06d00' },
  rejected:           { label: 'Rejected',           color: 'danger',   bg: '#fce8e6', fg: '#d93025' },
  withdrawn:          { label: 'Withdrawn',          color: undefined,  bg: '#f5f6f8', fg: '#54606b' },
};

// ── Validation summary used in Step 1 ──
export interface ValidationSummary {
  uploaded: number;
  valid: number;
  invalid: number;
  duplicates: number;
  errors: { responseId: string; type: string; message: string }[];
}

export const MOCK_VALIDATION_SUMMARY: ValidationSummary = {
  uploaded: 85,
  valid: 80,
  invalid: 3,
  duplicates: 2,
  errors: [
    { responseId: 'R-99901', type: 'Not found',           message: 'Response ID not found in this project' },
    { responseId: 'R-99902', type: 'Not complete',        message: 'Response is not a completed interview' },
    { responseId: 'R-99903', type: 'Not found',           message: 'Response ID not found in this project' },
    { responseId: 'R-10021', type: 'Duplicate',           message: 'Already included in this upload' },
    { responseId: 'R-10034', type: 'Duplicate',           message: 'Already included in this upload' },
  ],
};
