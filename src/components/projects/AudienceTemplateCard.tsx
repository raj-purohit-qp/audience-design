'use client';

import type { AudienceTemplate } from '@/data/mock-project-create';

const CARD_BASE =
  'rounded-lg border border-[#E0E4E8] bg-white text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all';

const CARD_SELECTED = 'border-blue-600 ring-1 ring-blue-600';
const CARD_HOVER = 'hover:border-[#C5CDD8] hover:shadow-[0_2px_6px_rgba(15,23,42,0.08)]';

function CensusIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <rect x="55" y="58" width="90" height="48" rx="4" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="65" y="78" width="12" height="28" fill="#2563eb" />
      <rect x="82" y="68" width="12" height="38" fill="#2563eb" />
      <rect x="99" y="72" width="12" height="34" fill="#2563eb" />
      <rect x="116" y="62" width="12" height="44" fill="#2563eb" />
      <circle cx="72" cy="38" r="10" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <path d="M62 56c4-8 16-8 20 0" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx="128" cy="38" r="10" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <path d="M118 56c4-8 16-8 20 0" fill="none" stroke="#1e3a5f" strokeWidth="2" />
    </svg>
  );
}

function EmployeesIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <rect x="48" y="28" width="104" height="64" rx="16" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx="100" cy="52" r="12" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <path d="M84 76c4-10 28-10 32 0" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="72" y="84" width="56" height="4" rx="2" fill="#2563eb" />
    </svg>
  );
}

function GamersIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <circle cx="100" cy="42" r="12" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <path d="M84 62c4-10 28-10 32 0" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="78" y="68" width="44" height="28" rx="6" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="84" y="74" width="32" height="16" rx="2" fill="#2563eb" opacity="0.85" />
      <circle cx="92" cy="82" r="2" fill="#fff" />
      <circle cx="108" cy="82" r="2" fill="#fff" />
    </svg>
  );
}

const ILLUSTRATIONS = {
  census: CensusIllustration,
  employees: EmployeesIllustration,
  gamers: GamersIllustration,
};

interface AudienceTemplateCardProps {
  template: AudienceTemplate;
  selected: boolean;
  variant: 'compact' | 'featured';
  onSelect: () => void;
}

export function AudienceTemplateCard({
  template,
  selected,
  variant,
  onSelect,
}: AudienceTemplateCardProps) {
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`${CARD_BASE} ${CARD_HOVER} w-[200px] shrink-0 px-4 py-3 ${
          selected ? CARD_SELECTED : ''
        }`}
      >
        <span className="block text-sm font-medium text-gray-800">{template.name}</span>
        {template.attributes && (
          <span className="mt-1 block truncate text-xs text-gray-500">{template.attributes}</span>
        )}
      </button>
    );
  }

  const Illustration = template.illustration ? ILLUSTRATIONS[template.illustration] : null;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${CARD_BASE} ${CARD_HOVER} flex min-h-[280px] flex-col overflow-hidden ${
        selected ? CARD_SELECTED : ''
      }`}
    >
      <div className="px-5 pt-5">
        <h3 className="text-base font-semibold text-gray-900">{template.name}</h3>
        <div className="mt-3 border-t border-[#E0E4E8]" />
      </div>

      {template.description && (
        <p className="px-5 pt-3 text-sm leading-relaxed text-gray-500">{template.description}</p>
      )}

      <div className="mt-auto flex h-[130px] items-end justify-center px-4 pb-2 pt-4">
        {Illustration ? <Illustration /> : null}
      </div>
    </button>
  );
}
