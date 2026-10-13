import type { ReactNode } from 'react';

/** Shared horizontal gutter for dashboard detail pages — full content width. */
export const detailPageGutter = 'w-full px-6 lg:px-8';

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
