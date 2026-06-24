'use client';

import Link from 'next/link';

interface HeaderBreadcrumbProps {
  projectName: string;
}

export function HeaderBreadcrumb({ projectName }: HeaderBreadcrumbProps) {
  return (
    <nav
      className="flex min-w-0 items-center gap-1.5 text-[13px] text-white/55"
      aria-label="Breadcrumb"
    >
      <Link
        href="/projects"
        className="audience-header-breadcrumb-link shrink-0 no-underline hover:underline"
      >
        My projects
      </Link>
      <span className="shrink-0 opacity-50" aria-hidden="true">
        ›
      </span>
      <span className="max-w-[320px] truncate text-white/90">{projectName}</span>
    </nav>
  );
}
