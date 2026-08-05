'use client';

import dynamic from 'next/dynamic';
import type { AudienceTemplate } from '@/data/mock-project-create';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);

function CensusIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <rect x="55" y="58" width="90" height="48" rx="4" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="65" y="78" width="12" height="28" fill="#1b87e6" />
      <rect x="82" y="68" width="12" height="38" fill="#1b87e6" />
      <rect x="99" y="72" width="12" height="34" fill="#1b87e6" />
      <rect x="116" y="62" width="12" height="44" fill="#1b87e6" />
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
      <rect x="72" y="84" width="56" height="4" rx="2" fill="#1b87e6" />
    </svg>
  );
}

function GamersIllustration() {
  return (
    <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden="true">
      <circle cx="100" cy="42" r="12" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <path d="M84 62c4-10 28-10 32 0" fill="none" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="78" y="68" width="44" height="28" rx="6" fill="#fff" stroke="#1e3a5f" strokeWidth="2" />
      <rect x="84" y="74" width="32" height="16" rx="2" fill="#1b87e6" opacity="0.85" />
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
  displayName?: string;
  selected: boolean;
  variant: 'compact' | 'featured';
  onSelect: () => void;
}

export function AudienceTemplateCard({
  template,
  displayName,
  selected,
  variant,
  onSelect,
}: AudienceTemplateCardProps) {
  const title = displayName ?? template.name;

  if (variant === 'compact') {
    return (
      <WuCard
        rounded
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
        className={`w-[200px] shrink-0 cursor-pointer overflow-hidden border p-0 shadow-none transition-colors ${
          selected
            ? 'border-[#1b87e6] ring-1 ring-[#1b87e6]'
            : 'border-[#e0e4e8] hover:border-[#1b87e6]'
        }`}
      >
        <div className="px-4 py-3">
          <p className="text-sm font-medium text-[#1a2340]">{title}</p>
          {template.attributes && (
            <p className="mt-1 truncate text-xs text-[#8c9baa]">{template.attributes}</p>
          )}
        </div>
      </WuCard>
    );
  }

  const Illustration = template.illustration ? ILLUSTRATIONS[template.illustration] : null;

  return (
    <WuCard
      rounded
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`flex min-h-[280px] cursor-pointer flex-col overflow-hidden border p-0 shadow-none transition-colors ${
        selected
          ? 'border-[#1b87e6] ring-1 ring-[#1b87e6]'
          : 'border-[#e0e4e8] hover:border-[#1b87e6]'
      }`}
    >
      <WuCardHeader className="flex flex-col items-start gap-0 border-b border-[#e0e4e8]">
        <WuHeading size="sm">{title}</WuHeading>
      </WuCardHeader>

      {template.description && (
        <p className="px-5 pt-3 text-sm leading-relaxed text-[#54606b]">{template.description}</p>
      )}

      <div className="mt-auto flex h-[130px] items-end justify-center px-4 pb-2 pt-4">
        {Illustration ? <Illustration /> : null}
      </div>
    </WuCard>
  );
}
