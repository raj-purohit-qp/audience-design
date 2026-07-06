'use client';

export const RECONCILIATION_GUIDELINES = [
  'You can submit multiple reconciliations while the reconciliation window is open',
  'Submit within 30 days of project launch date',
  'Automatic wallet credit after approval',
] as const;

export function ReconciliationGuidelines({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col gap-2 rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-6 py-4 text-left ${className}`}
    >
      {RECONCILIATION_GUIDELINES.map((rule) => (
        <div key={rule} className="flex items-center gap-2 text-sm text-[#54606b]">
          <span className="wm-check-circle shrink-0 text-base text-[#188038]" aria-hidden="true" />
          {rule}
        </div>
      ))}
    </div>
  );
}
