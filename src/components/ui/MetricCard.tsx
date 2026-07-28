'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';

const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuCardHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardHeader })),
  { ssr: false },
);

export function MetricIconBadge({
  icon,
  bg,
  fg,
  size = 28,
}: {
  icon: string;
  bg: string;
  fg: string;
  size?: number;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded ${bg} ${fg}`}
      style={{ width: size, height: size }}
    >
      <span className={`${icon} text-[15px]`} aria-hidden="true" />
    </span>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  iconBg: string;
  iconFg: string;
  hoverable?: boolean;
  children?: ReactNode;
}

export function MetricCard({
  label,
  value,
  sub,
  icon,
  iconBg,
  iconFg,
  hoverable = false,
  children,
}: MetricCardProps) {
  const [hov, setHov] = useState(false);

  return (
    <WuCard
      rounded
      className={`flex h-full flex-col overflow-hidden border border-[#e0e4e8] p-0 shadow-none ${
        hoverable
          ? `transition-colors duration-150 ${hov ? 'border-[#1b87e6]' : ''}`
          : ''
      }`}
      onMouseEnter={hoverable ? () => setHov(true) : undefined}
      onMouseLeave={hoverable ? () => setHov(false) : undefined}
    >
      <WuCardHeader className="flex items-center gap-2">
        <MetricIconBadge icon={icon} bg={iconBg} fg={iconFg} />
        {label}
      </WuCardHeader>
      {children ?? (
        <div className="flex flex-1 flex-col gap-0.5 px-4 py-3">
          <p className="text-2xl font-normal leading-tight text-[#1a2340]">{value}</p>
          {sub && <p className="text-xs text-[#8c9baa]">{sub}</p>}
        </div>
      )}
    </WuCard>
  );
}
