'use client';

import Link from 'next/link';

interface HeaderBreadcrumbProps {
  parentHref?: string;
  parentLabel?: string;
  currentName: string;
  /** @deprecated Use currentName */
  projectName?: string;
}

export function HeaderBreadcrumb({
  parentHref = '/projects',
  parentLabel = 'Specialized sample',
  currentName,
  projectName,
}: HeaderBreadcrumbProps) {
  const label = currentName || projectName || '';

  return (
    <nav
      className="flex min-w-0 items-center gap-1.5 text-[13px] text-white/55"
      aria-label="Breadcrumb"
    >
      <Link
        href={parentHref}
        className="audience-header-breadcrumb-link shrink-0 no-underline hover:underline"
      >
        {parentLabel}
      </Link>
      <span className="shrink-0 opacity-50" aria-hidden="true">
        ›
      </span>
      <span className="max-w-[320px] truncate text-white/90">{label}</span>
    </nav>
  );
}
