'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';

const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);

interface PageHeaderProps {
  title?: string;
  description?: string;
  action?: ReactNode;
  /** When true, renders a full-width divider under the header (WickUI page pattern). */
  divider?: boolean;
}

export function PageHeader({ title, description, action, divider = false }: PageHeaderProps) {
  return (
    <div className={divider ? 'mb-6 border-b border-[#e0e4e8] pb-4' : 'mb-6'}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 text-left">
          {title && <WuHeading size="lg">{title}</WuHeading>}
          {description && (
            <div className={title ? 'mt-1' : undefined}>
              <WuSubtext size="sm">{description}</WuSubtext>
            </div>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
