'use client';

import React, { useState, useRef, type ChangeEvent } from 'react';
import dynamic from 'next/dynamic';
import {
  REJECTION_REASONS,
  getReconciliationLimitError,
  getRemainingReconciliationIds,
  type RejectionReasonValue,
  type ReconciliationMeta,
} from '@/data/mock-reconciliation';

const WuButton     = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),     { ssr: false });
const WuCard       = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),       { ssr: false });
const WuCardHeader = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })), { ssr: false });
const WuChip       = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),       { ssr: false });
const WuInput      = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),      { ssr: false });
const WuSelect     = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),     { ssr: false });

/* ── Types ── */
export interface ReviewRow { responseId: string; reason: RejectionReasonValue }

export interface Batch {
  id: string;
  reason: RejectionReasonValue;
  ids: string[];
  /** valid / invalid counts after simulated validation */
  valid: number;
  invalid: number;
}

function simulateBatchCounts(idCount: number) {
  const invalid = Math.min(Math.floor(idCount * 0.05), 2);
  return { valid: idCount - invalid, invalid };
}

function mergeBatchByReason(batches: Batch[], incoming: Batch): Batch[] {
  const existing = batches.find((b) => b.reason === incoming.reason);
  if (!existing) return [...batches, incoming];

  const seen = new Set(existing.ids);
  const mergedIds = [...existing.ids];
  for (const id of incoming.ids) {
    if (!seen.has(id)) {
      seen.add(id);
      mergedIds.push(id);
    }
  }

  const counts = simulateBatchCounts(mergedIds.length);
  return batches.map((b) =>
    b.id === existing.id
      ? { ...b, ids: mergedIds, valid: counts.valid, invalid: counts.invalid }
      : b,
  );
}

/* ── Step indicator ── */
const STEPS = [
  { n: 1, label: 'Upload IDs',       icon: 'wm-upload-file'  },
  { n: 2, label: 'Review',           icon: 'wm-fact-check'   },
  { n: 3, label: 'Submit',           icon: 'wm-send'         },
];

/* ── Bottom footer bar: steps (left) + Back/Next (right) ── */
interface StepFooterProps {
  current: number;
  canNext: boolean;
  nextLabel?: string;
  nextIcon?: string;
  onBack?: () => void;
  onNext: () => void;
}

export type StepFooterConfig = Omit<StepFooterProps, 'current'>;

export function StepFooter({ current, canNext, nextLabel = 'Next', nextIcon = 'wm-arrow-forward', onBack, onNext }: StepFooterProps) {
  return (
    <div className="flex w-full items-center justify-between border-t border-[#e0e4e8] bg-white px-6 py-3.5">
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const done   = s.n < current;
          const active = s.n === current;
          const color  = done || active ? '#1b3a8a' : '#c4cdd5';

          return (
            <div key={s.n} className="flex items-center gap-2">
              {/* Icon + label */}
              <div className="flex items-center gap-1.5">
                <span
                  className={`${s.icon} text-[20px] transition-colors`}
                  style={{ color }}
                  aria-hidden="true"
                />
                <span
                  className="whitespace-nowrap text-[13px] transition-colors"
                  style={{
                    color: active ? '#1a2340' : done ? '#1a2340' : '#c4cdd5',
                    fontWeight: active ? 600 : 400,
                  }}
                  aria-current={active ? 'step' : undefined}
                >
                  {s.label}
                </span>
              </div>
              {/* Arrow between steps */}
              {i < STEPS.length - 1 && (
                <span
                  className="wm-arrow-forward mx-1 text-[18px] transition-colors"
                  style={{ color: done ? '#1b3a8a' : '#c4cdd5' }}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3">
        {onBack && (
          <WuButton
            variant="link"
            color="primary"
            Icon={<span className="wm-arrow-back" aria-hidden="true" />}
            iconPosition="left"
            onClick={onBack}
          >
            Back
          </WuButton>
        )}
        <WuButton
          disabled={!canNext}
          Icon={<span className={nextIcon} aria-hidden="true" />}
          iconPosition="right"
          onClick={onNext}
        >
          {nextLabel}
        </WuButton>
      </div>
    </div>
  );
}

/* ── Reason label helper ── */
function reasonLabel(v: RejectionReasonValue) {
  return REJECTION_REASONS.find((r) => r.value === v)?.label ?? v;
}

/* ── Single batch card ── */
function BatchCard({ batch, onRemove }: { batch: Batch; onRemove: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <WuCard rounded className="overflow-hidden p-0 shadow-sm">
      <WuCardHeader
        className="flex cursor-pointer items-center justify-between border-b border-[#eef0f3] px-4 py-3 hover:bg-[#f9fafb]"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="wm-label text-base text-[#1b87e6]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[#1a2340]">{reasonLabel(batch.reason)}</p>
            <p className="text-[11px] text-[#8c9baa]">
              {batch.valid} valid · {batch.invalid} invalid · {batch.ids.length} uploaded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WuChip size="sm" color="success">{batch.valid} IDs</WuChip>
          <button
            type="button"
            aria-label={`Remove batch: ${reasonLabel(batch.reason)}`}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded hover:bg-[#fce8e6]"
          >
            <span className="wm-delete text-base text-[#d93025]" aria-hidden="true" />
          </button>
          <span className={`${expanded ? 'wm-expand-less' : 'wm-expand-more'} text-lg text-[#8c9baa]`} aria-hidden="true" />
        </div>
      </WuCardHeader>

      {expanded && (
        <div className="max-h-48 overflow-y-auto">
          <div className="flex flex-wrap gap-1.5 px-4 py-3">
            {batch.ids.map((id) => (
              <span key={id} className="rounded bg-[#f5f6f8] px-2 py-0.5 font-mono text-xs text-[#1a2340]">{id}</span>
            ))}
          </div>
        </div>
      )}
    </WuCard>
  );
}

/* ── Download reason codes helper ── */
function downloadReasonCodes() {
  const csv = 'Code,Reason,Description\n' +
    REJECTION_REASONS.map((r) => `${r.code},${r.label},${r.description}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'rejection-reason-codes.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ── Compact batch row for sidebar list ── */
function CompactBatchItem({ batch, onRemove }: { batch: Batch; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-[#e0e4e8] bg-white px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="wm-label shrink-0 text-base text-[#1b87e6]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[#1a2340]">{reasonLabel(batch.reason)}</p>
          <p className="text-[11px] text-[#8c9baa]">
            {batch.valid} valid · {batch.invalid} invalid · {batch.ids.length} uploaded
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <WuChip size="sm" color="success">{batch.valid} IDs</WuChip>
        <button
          type="button"
          aria-label={`Remove batch: ${reasonLabel(batch.reason)}`}
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-[#fce8e6]"
        >
          <span className="wm-delete text-base text-[#d93025]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── Manual entry: Add-batch form ── */
function AddBatchForm({
  onAdd,
  maxRemaining,
  maxPct,
  batches,
  onRemoveBatch,
}: {
  onAdd: (batch: Batch) => void;
  maxRemaining: number;
  maxPct: number;
  batches: Batch[];
  onRemoveBatch: (id: string) => void;
}) {
  const [text, setText]     = useState('');
  const [reason, setReason] = useState<RejectionReasonValue | ''>('');

  const rawIds       = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const limitError   = getReconciliationLimitError(rawIds.length, maxRemaining, maxPct);
  const overLimit    = limitError !== null;
  const hasInput     = rawIds.length > 0 && reason !== '';

  function handleAdd() {
    if (!hasInput) return;
    const counts = simulateBatchCounts(rawIds.length);
    onAdd({
      id: `batch-${Date.now()}`,
      reason: reason as RejectionReasonValue,
      ids: rawIds,
      valid: counts.valid,
      invalid: counts.invalid,
    });
    setText('');
  }

  return (
    <div className="recon-step1-manual-row grid grid-cols-[auto_1fr] items-stretch gap-4">
      {/* Box 1 — manual entry */}
      <WuCard rounded className="flex h-full w-[248px] shrink-0 flex-col p-0 shadow-sm">
        <WuCardHeader className="border-b border-[#eef0f3] px-4 py-2.5 text-sm font-medium text-[#1a2340]">
          Manual entry
        </WuCardHeader>
        <div className="flex flex-1 flex-col gap-2.5 px-4 py-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[#8c9baa]" htmlFor="batch-ids">
              Paste response IDs (one per line)
            </label>
            <textarea
              id="batch-ids"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              placeholder={'R-10021\nR-10034\nR-10047\nR-10058\nR-10063\nR-10071\nR-10089\nR-10095\nR-10102\nR-10118'}
              className="recon-id-input resize-none rounded-md border-2 border-[#c4cdd5] bg-white px-2 py-1.5 font-mono text-sm leading-5 text-[#1a2340] placeholder:text-[#c4cdd5] focus:border-[#1b87e6] focus:outline-none"
              aria-label="Response IDs for this batch"
              spellCheck={false}
            />
            <p className={`text-xs ${overLimit ? 'font-medium text-[#d93025]' : 'text-[#8c9baa]'}`} role={overLimit ? 'alert' : undefined}>
              {overLimit ? limitError : `${rawIds.length} IDs entered`}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-[#8c9baa]">
              Rejection reason for this batch
            </p>
            <WuSelect
              data={REJECTION_REASONS as unknown as Record<string, unknown>[]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={(reason === '' ? null : REJECTION_REASONS.find((r) => r.value === reason)) as unknown as Record<string, unknown>}
              onSelect={(item) => {
                const selected = item as { value: RejectionReasonValue };
                setReason(selected.value);
              }}
              variant="outlined"
              placeholder="Select reason"
              className="w-full"
            />
            {reason !== '' && (
              <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[#8c9baa]">
                {REJECTION_REASONS.find((r) => r.value === reason)?.description}
              </p>
            )}
          </div>

          <WuButton
            variant="outlined"
            color="primary"
            disabled={!hasInput || overLimit}
            Icon={<span className="wm-add" aria-hidden="true" />}
            iconPosition="left"
            onClick={handleAdd}
            className="w-full"
          >
            Add batch
          </WuButton>
        </div>
      </WuCard>

      {/* Box 2 — batches added */}
      <WuCard rounded className="flex h-full min-w-0 flex-1 flex-col p-0 shadow-sm">
        <WuCardHeader className="flex items-center justify-between border-b border-[#eef0f3] px-4 py-2.5">
          <span className="text-sm font-medium text-[#1a2340]">
            {batches.length === 0
              ? 'Batches added'
              : `${batches.length} ${batches.length === 1 ? 'batch' : 'batches'} added`}
          </span>
          {batches.length > 0 && (
            <span className="text-xs text-[#8c9baa]">
              {batches.reduce((s, b) => s + b.valid, 0)} valid IDs total
            </span>
          )}
        </WuCardHeader>
        <div className="flex flex-1 flex-col px-4 py-3">
          {batches.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#e0e4e8] bg-[#f9fafb] px-4 py-5 text-center">
              <span className="wm-inbox mb-1.5 inline-block text-[24px] text-[#c4cdd5]" aria-hidden="true" />
              <p className="text-sm text-[#54606b]">No batches added yet</p>
              <p className="mt-0.5 text-xs text-[#8c9baa]">
                Enter IDs, select a rejection reason, then click Add batch.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {batches.map((b) => (
                <CompactBatchItem
                  key={b.id}
                  batch={b}
                  onRemove={() => onRemoveBatch(b.id)}
                />
              ))}
            </div>
          )}
        </div>
      </WuCard>
    </div>
  );
}

/* ── CSV upload section ── */
function CsvUploadSection() {
  const [dragging, setDragging]   = useState(false);
  const [hovering, setHovering]   = useState(false);
  const [fileName, setFileName]   = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  }

  const filtered = REJECTION_REASONS.filter((r) =>
    search === '' ||
    r.label.toLowerCase().includes(search.toLowerCase()) ||
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    r.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <WuCard rounded className="overflow-hidden p-0 shadow-sm">
      <WuCardHeader className="border-b border-[#eef0f3] px-4 py-2.5 text-sm font-medium text-[#1a2340]">
        Upload a CSV
      </WuCardHeader>
      <div className="recon-upload-csv-body">
        {/* Left — upload card (WickUI Media Library/Card spec) */}
        <div className="recon-csv-upload-panel border-r border-[#eef0f3]">
          <div className="flex w-max max-w-full flex-col items-center gap-3 px-4 text-center">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => { setDragging(false); setHovering(false); }}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              role="button"
              tabIndex={0}
              aria-label="Click or drag to upload CSV"
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '16px',
                gap: '6px',
                width: '120px',
                height: '120px',
                background: dragging ? '#e8f0fe' : hovering ? '#f0f7ff' : '#FFFFFF',
                border: `2px solid ${dragging || hovering ? '#1b87e6' : '#D8D8D8'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <span
                className={`wm-cloud-upload text-[36px] ${dragging || hovering ? 'text-[#1b87e6]' : 'text-[#8c9baa]'}`}
                aria-hidden="true"
              />
              {fileName ? (
                <p className="text-center text-[11px] font-medium text-[#1a2340]">{fileName}</p>
              ) : (
                <p className="text-center text-[11px] text-[#8c9baa]">Drag & drop or click</p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="sr-only"
                aria-label="Upload CSV file"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const f = e.target.files?.[0];
                  if (f) setFileName(f.name);
                }}
              />
            </div>

            <div className="inline-flex flex-wrap items-center justify-center gap-1">
              <WuButton
                variant="link"
                size="sm"
                Icon={<span className="wm-download" aria-hidden="true" />}
                iconPosition="left"
                onClick={() => {
                  const csv = 'ResponseID,ReasonCode\nR-10001,QP-101\nR-10002,QP-103\n';
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement('a');
                  a.href = url; a.download = 'reconciliation-template.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Download template
              </WuButton>
              <span className="text-[#d8d8d8]">|</span>
              <WuButton
                variant="link"
                size="sm"
                Icon={<span className="wm-folder-open" aria-hidden="true" />}
                iconPosition="left"
                onClick={() => fileRef.current?.click()}
              >
                Browse file
              </WuButton>
            </div>
            <p className="text-[11px] text-[#c4cdd5]">CSV only · max 500 IDs · max 5 MB</p>
          </div>
        </div>

        {/* Right — searchable reason codes reference */}
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[#eef0f3] px-4 py-2.5">
            <p className="text-xs font-medium text-[#1a2340]">Reason codes reference</p>
            <WuButton
              variant="outlined"
              color="primary"
              Icon={<span className="wm-download text-sm" aria-hidden="true" />}
              iconPosition="left"
              onClick={downloadReasonCodes}
            >
              Reason codes
            </WuButton>
          </div>
          <div className="border-b border-[#eef0f3] px-3 py-2">
            <div className="w-1/2">
              <WuInput
                variant="flat"
                placeholder="Search codes or reasons…"
                Icon={<span className="wm-search" aria-hidden="true" />}
                iconPosition="left"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full bg-[#F5F5F5]"
                aria-label="Search reason codes"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <table className="w-full text-xs" aria-label="Reason codes">
              <thead className="sticky top-0 bg-[#f5f6f8]">
                <tr>
                  <th className="w-20 px-3 py-2 text-left font-medium text-[#8c9baa]">Code</th>
                  <th className="w-28 px-3 py-2 text-left font-medium text-[#8c9baa]">Reason</th>
                  <th className="px-3 py-2 text-left font-medium text-[#8c9baa]">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.value} className="border-t border-[#eef0f3] hover:bg-[#f9fafb]">
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rounded bg-[#1b87e6] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                        {r.code}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium text-[#1a2340]">{r.label}</td>
                    <td className="px-3 py-2 text-[#54606b]">{r.description}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-4 text-center text-[#8c9baa]">No results</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WuCard>
  );
}

/* ─────────────────────────────────────────
   Step 1 — Upload IDs
───────────────────────────────────────── */
/* ── WickUI Switch component (spec: 219px × 32px, #E8E8E8 pill, border-radius 76px) ── */
function ModeSwitch({
  value,
  onChange,
}: {
  value: 'manual' | 'csv';
  onChange: (v: 'manual' | 'csv') => void;
}) {
  return (
    <div
      role="group"
      aria-label="Upload mode"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px',
        width: '219px',
        minWidth: '120px',
        maxWidth: '272px',
        height: '32px',
        minHeight: '32px',
        maxHeight: '32px',
        background: '#E8E8E8',
        borderRadius: '76px',
      }}
    >
      {(['manual', 'csv'] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            style={{
              flex: 1,
              height: '28px',
              minWidth: '64px',
              maxWidth: '136px',
              paddingLeft: '8px',
              paddingRight: '8px',
              borderRadius: '76px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: active ? 500 : 400,
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
              background: active ? '#1b87e6' : 'transparent',
              color: active ? '#ffffff' : '#54606b',
              boxShadow: active ? '0 1px 3px rgba(27,135,230,0.3)' : 'none',
            }}
          >
            {opt === 'manual' ? 'Manual entry' : 'Upload CSV'}
          </button>
        );
      })}
    </div>
  );
}

/* ── Mode switcher options ── */
const MODE_OPTIONS = [
  { value: 'manual', label: 'Manual entry' },
  { value: 'csv',    label: 'Upload CSV'   },
] as const;

function Step1Upload({
  onBatchesChange,
  batches,
  meta,
}: {
  onBatchesChange: (batches: Batch[]) => void;
  batches: Batch[];
  meta: ReconciliationMeta;
}) {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const maxIds = getRemainingReconciliationIds(meta);
  const totalValid = batches.reduce((s, b) => s + b.valid, 0);
  const remaining  = Math.max(0, maxIds - totalValid);

  return (
    <div className="space-y-3">
      {/* ── Header row: title + switcher + download button ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1a2340]">Upload response IDs</h2>
          {batches.length > 0 && (
            <span className="rounded-full bg-[#e8f0fe] px-2.5 py-0.5 text-xs font-medium text-[#1b87e6]">
              {totalValid} IDs · {remaining} remaining
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ModeSwitch value={mode} onChange={setMode} />
        </div>
      </div>

      {/* ── Mode content ── */}
      {mode === 'manual' ? (
        <AddBatchForm
          onAdd={(b) => onBatchesChange(mergeBatchByReason(batches, b))}
          maxRemaining={remaining}
          maxPct={meta.maxPct}
          batches={batches}
          onRemoveBatch={(id) => onBatchesChange(batches.filter((x) => x.id !== id))}
        />
      ) : (
        <CsvUploadSection />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Step 2 — Review (read-only summary of all batches)
───────────────────────────────────────── */
function Step2Review({ batches }: { batches: Batch[] }) {
  const totalValid   = batches.reduce((s, b) => s + b.valid, 0);
  const totalInvalid = batches.reduce((s, b) => s + b.invalid, 0);

  return (
    <div>
      <h2 className="mb-1 text-lg font-medium text-[#1a2340]">Review</h2>
      <p className="mb-5 text-sm text-[#8c9baa]">
        Confirm the batches below before proceeding. Go back to add or remove batches.
      </p>

      {/* Totals */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Batches',      value: batches.length.toString(),  color: 'text-[#1a2340]' },
          { label: 'Total IDs',    value: batches.reduce((s,b) => s + b.ids.length, 0).toString(), color: 'text-[#1a2340]' },
          { label: 'Valid IDs',    value: totalValid.toString(),      color: 'text-[#188038]' },
          { label: 'Invalid IDs',  value: totalInvalid.toString(),    color: totalInvalid > 0 ? 'text-[#d93025]' : 'text-[#8c9baa]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-md border border-[#e0e4e8] bg-white px-4 py-3">
            <p className={`text-[22px] font-normal ${color}`}>{value}</p>
            <p className="text-[11px] text-[#8c9baa]">{label}</p>
          </div>
        ))}
      </div>

      {/* Per-batch table */}
      <WuCard rounded className="overflow-hidden p-0 shadow-sm">
        <WuCardHeader className="border-b border-[#eef0f3] px-4 py-3 text-sm font-medium text-[#1a2340]">
          Batch breakdown
        </WuCardHeader>
        <table className="w-full text-sm" aria-label="Batch breakdown">
          <thead className="bg-[#f5f6f8]">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8c9baa]">Rejection reason</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8c9baa]">Uploaded</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8c9baa]">Valid</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-[#8c9baa]">Invalid</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-t border-[#eef0f3]">
                <td className="px-4 py-2.5 font-medium text-[#1a2340]">{reasonLabel(b.reason)}</td>
                <td className="px-4 py-2.5 text-[#54606b]">{b.ids.length}</td>
                <td className="px-4 py-2.5 text-[#188038]">{b.valid}</td>
                <td className="px-4 py-2.5 text-[#d93025]">{b.invalid}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </WuCard>

    </div>
  );
}

/* ─────────────────────────────────────────
   Step 3 — Confirm & submit
───────────────────────────────────────── */
function Step3Confirm({
  batches,
  meta,
  onConfirmChange,
}: {
  batches: Batch[];
  meta: ReconciliationMeta;
  onConfirmChange: (v: boolean) => void;
}) {
  const idCount         = batches.reduce((s, b) => s + b.valid, 0);
  const estimatedCredit = idCount * meta.cpi;
  const currentCost     = meta.eligibleResponses * meta.cpi;
  const afterApproval   = currentCost - estimatedCredit;

  return (
    <div>
      <h2 className="mb-1 text-base font-medium text-[#1a2340]">Confirm submission</h2>
      <p className="mb-3 text-sm text-[#8c9baa]">
        Review the reconciliation impact before submitting your request.
      </p>

      {/* Impact cards */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: 'Responses submitted',      value: idCount.toString(),               sub: 'Valid IDs',               color: 'text-[#1a2340]' },
          { label: 'Estimated credit',          value: `$${estimatedCredit.toFixed(2)}`, sub: `${idCount} × $${meta.cpi.toFixed(2)} CPI`, color: 'text-[#188038]' },
          { label: 'Current project cost',      value: `$${currentCost.toLocaleString()}`, sub: 'Before reconciliation', color: 'text-[#1a2340]' },
          { label: 'Est. cost after approval',  value: `$${afterApproval.toFixed(2)}`,  sub: 'If all approved',          color: 'text-[#1b87e6]' },
        ].map(({ label, value, sub, color }) => (
          <WuCard key={label} rounded className="p-0 shadow-sm">
            <WuCardHeader className="border-b border-[#eef0f3] px-3 py-1.5 text-[11px] font-medium text-[#8c9baa]">
              {label}
            </WuCardHeader>
            <div className="px-3 py-2">
              <p className={`text-lg font-normal leading-tight ${color}`}>{value}</p>
              <p className="mt-0.5 text-[11px] text-[#8c9baa]">{sub}</p>
            </div>
          </WuCard>
        ))}
      </div>

      {/* Batch summary */}
      <WuCard rounded className="mb-3 overflow-hidden p-0 shadow-sm">
        <WuCardHeader className="border-b border-[#eef0f3] px-4 py-2 text-sm font-medium text-[#1a2340]">
          Submission breakdown by reason
        </WuCardHeader>
        <div className="max-h-[120px] divide-y divide-[#eef0f3] overflow-y-auto">
          {batches.map((b) => (
            <div key={b.id} className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-[#1a2340]">{reasonLabel(b.reason)}</span>
              <WuChip size="sm">{b.valid} IDs</WuChip>
            </div>
          ))}
        </div>
      </WuCard>

      {/* Disclaimer */}
      <div className="mb-3 flex items-start gap-2 rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-3 py-2.5">
        <span className="wm-info mt-0.5 shrink-0 text-base text-[#8c9baa]" aria-hidden="true" />
        <p className="text-xs leading-snug text-[#54606b]">
          Final credit amount may vary depending on approval results. Credits are applied to your wallet within 2 business days of approval.
        </p>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#e0e4e8] bg-white px-3 py-3">
        <input
          type="checkbox"
          onChange={(e) => onConfirmChange(e.target.checked)}
          className="mt-0.5 accent-[#1b87e6]"
          aria-required="true"
        />
        <span className="text-sm text-[#1a2340]">
          I confirm that the submitted responses violate quality requirements and I have reviewed each ID before submission.
        </span>
      </label>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main wizard — pure content renderer
   (state lives in ReconciliationTab so
    StepFooter can be placed in WuModalFooter)
───────────────────────────────────────── */
export function ReconciliationWizard({
  meta,
  step,
  batches,
  onBatchesChange,
  onConfirmChange,
}: {
  meta: ReconciliationMeta;
  step: number;
  batches: Batch[];
  onBatchesChange: (b: Batch[]) => void;
  onConfirmChange: (v: boolean) => void;
}) {
  return (
    <div className={`recon-wizard-body ${step === 1 ? 'recon-wizard-body--step1' : ''}`}>
      {step === 1 && (
        <Step1Upload
          batches={batches}
          onBatchesChange={onBatchesChange}
          meta={meta}
        />
      )}
      {step === 2 && <Step2Review batches={batches} />}
      {step === 3 && (
        <Step3Confirm
          batches={batches}
          meta={meta}
          onConfirmChange={onConfirmChange}
        />
      )}
    </div>
  );
}
