'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CREDIT_BALANCE, formatCurrency } from '@/data/mock-audience-projects';

const WuFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuFooter })),
  { ssr: false }
);

export function AudienceFooter() {
  const { showToast } = useWuShowToast();

  return (
    <WuFooter className="mt-auto flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
      <span className="text-xs text-gray-400">QuestionPro QuestionPro Admin</span>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Credit balance:</span>
        <span className="font-semibold text-gray-900">{formatCurrency(CREDIT_BALANCE)}</span>
        <button
          type="button"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
          onClick={() =>
            showToast({ message: 'Add credits flow coming soon', variant: 'success' })
          }
        >
          Add more
        </button>
      </div>
    </WuFooter>
  );
}
