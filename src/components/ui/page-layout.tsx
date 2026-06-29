import type { ReactNode } from 'react';

/** Shared horizontal gutter for dashboard detail pages (matches projects list px-6). */
export const detailPageGutter = 'mx-auto max-w-[1320px] px-6';

export function DetailPageContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`py-6 pb-14 ${className}`}>{children}</div>;
}

export function DetailTabContainer({ children }: { children: ReactNode }) {
  return <div className={detailPageGutter}>{children}</div>;
}
