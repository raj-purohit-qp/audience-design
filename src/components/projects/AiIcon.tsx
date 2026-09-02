'use client';

import type { CSSProperties } from 'react';

/**
 * QuestionPro AI icon — star sparkle with a dot on the lower-right.
 * @see Design System → QuestionPro AI (wc-ai equivalent)
 * @see https://docs.google.com/document/d/11D_VfWvd00Qh3yOqQzlbVSTtBXM1I1x10Cd7CVbP64Q/edit?tab=t.9qohj9uo73it
 */
export function AiIcon({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={['ir-ai-icon inline-block h-[18px] w-[18px] shrink-0', className]
        .filter(Boolean)
        .join(' ')}
      style={style}
      aria-hidden="true"
    >
      <path d="M10.25 3.5c.42 3.55 2.95 6.08 6.5 6.5-3.55.42-6.08 2.95-6.5 6.5-.42-3.55-2.95-6.08-6.5-6.5 3.55-.42 6.08-2.95 6.5-6.5z" />
      <circle cx="17.25" cy="17" r="2.1" />
    </svg>
  );
}
