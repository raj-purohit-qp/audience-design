'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { ChildCountryProject } from '@/data/mock-multi-country';
import { getCountryByCode, getFeasibilityLabel } from '@/data/mock-multi-country';
import { formatCurrency } from '@/data/mock-audience-projects';
import { DetailPageContent } from '@/components/ui/page-layout';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuDrawer = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDrawer })),
  { ssr: false },
);

interface CountryDetailDrawerProps {
  child: ChildCountryProject | null;
  open: boolean;
  onClose: () => void;
}

export function CountryDetailDrawer({ child, open, onClose }: CountryDetailDrawerProps) {
  const { showToast } = useWuShowToast();

  if (!child) return null;

  const country = getCountryByCode(child.countryCode);

  return (
    <WuDrawer open={open} onOpenChange={(v) => { if (!v) onClose(); }} side="right">
      <div className="flex h-full w-[560px] max-w-full flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-base font-medium text-gray-900">
              {country?.flag} {country?.label}
            </h2>
            <p className="text-xs text-gray-500">{child.name} · {child.projectId}</p>
          </div>
          <WuChip size="sm" color={child.status === 'Live' ? 'success' : undefined}>
            {child.status}
          </WuChip>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Responses', value: child.responses.toLocaleString() },
              { label: 'Collected', value: child.collected.toLocaleString() },
              { label: 'CPI', value: formatCurrency(child.cpi) },
              { label: 'Cost', value: formatCurrency(child.totalCost) },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-md border border-gray-200 px-4 py-3">
                <p className="text-[11px] font-medium text-gray-500">{label}</p>
                <p className="text-lg font-normal text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-900">Audience configuration</p>
            <p className="text-sm text-gray-600">{child.audienceSummary}</p>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-900">Qualification summary</p>
            <div className="flex flex-wrap gap-2">
              {(country?.qualificationCategories ?? []).map((cat) => (
                <WuChip key={cat} size="sm">{cat}</WuChip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-gray-900">Feasibility</p>
            <p className="text-sm text-gray-600">{getFeasibilityLabel(child.feasibility)}</p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-900">Activity history</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>Jun 1, 2026 — Country project created</li>
              <li>Jun 2, 2026 — Audience configuration saved</li>
              <li>Jun 3, 2026 — Project launched</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-gray-200 px-6 py-4">
          <WuButton
            variant="outlined"
            color="primary"
            onClick={() => showToast({ message: 'Edit audience for this country', variant: 'success' })}
          >
            Edit audience
          </WuButton>
          <WuButton
            variant="outlined"
            onClick={() => showToast({ message: 'Country paused', variant: 'success' })}
          >
            Pause country
          </WuButton>
          <WuButton
            variant="outlined"
            onClick={() => showToast({ message: 'Country closed', variant: 'success' })}
          >
            Close country
          </WuButton>
          <WuButton
            variant="link"
            onClick={() => showToast({ message: 'Opening responses…', variant: 'success' })}
          >
            View responses
          </WuButton>
        </div>
      </div>
    </WuDrawer>
  );
}

interface CountriesTabProps {
  children: ChildCountryProject[];
  onAddCountry?: () => void;
}

export function CountriesTab({ children, onAddCountry }: CountriesTabProps) {
  const [drawerChild, setDrawerChild] = useState<ChildCountryProject | null>(null);

  return (
    <DetailPageContent>
      <div className="mb-4 flex items-center justify-between">
        <WuHeading size="sm">Countries</WuHeading>
        {onAddCountry && (
          <WuButton variant="outlined" color="primary" onClick={onAddCountry}>
            <span className="wm-add" aria-hidden="true" /> Add country
          </WuButton>
        )}
      </div>

      <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
        <table className="w-full text-sm" aria-label="Country projects">
          <thead className="bg-gray-50">
            <tr>
              {['Country', 'Status', 'Responses', 'CPI', 'Cost', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const country = getCountryByCode(child.countryCode);
              return (
                <tr
                  key={child.id}
                  className="cursor-pointer border-t border-gray-100 hover:bg-gray-50"
                  onClick={() => setDrawerChild(child)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {country?.flag} {country?.label}
                    <span className="mt-0.5 block text-xs font-normal text-gray-500">{child.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <WuChip size="sm" color={child.status === 'Live' ? 'success' : undefined}>
                      {child.status}
                    </WuChip>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {child.collected.toLocaleString()} / {child.responses.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(child.cpi)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(child.totalCost)}</td>
                  <td className="px-4 py-3">
                    <WuButton
                      variant="link"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDrawerChild(child);
                      }}
                    >
                      View details
                    </WuButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CountryDetailDrawer
        child={drawerChild}
        open={drawerChild !== null}
        onClose={() => setDrawerChild(null)}
      />
    </DetailPageContent>
  );
}
