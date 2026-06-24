'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

type CompactNumericInputProps = Omit<ComponentProps<typeof WuInput>, 'variant'>;

export function CompactNumericInput(props: CompactNumericInputProps) {
  return (
    <div className="audience-input-70x32 shrink-0">
      <WuInput variant="outlined" {...props} />
    </div>
  );
}
