'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { CountryPlan, GlobalCriterion } from '@/data/mock-multi-country';
import {
  GLOBAL_CRITERIA,
  detectQualificationIssues,
  getCountryByCode,
  getFeasibilityLabel,
  getSetupStatusLabel,
} from '@/data/mock-multi-country';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);

type NavKey = 'global' | string;

interface AudienceConfigStepProps {
  plans: CountryPlan[];
  globalCriteria: GlobalCriterion[];
  onPlansChange: (plans: CountryPlan[]) => void;
}

function NavItem({
  active,
  onClick,
  children,
  status,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  status?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition-colors ${
        active ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className="min-w-0 truncate">{children}</span>
      {status && (
        <span className="shrink-0 text-xs text-gray-500">{status}</span>
      )}
    </button>
  );
}

export function AudienceConfigStep({
  plans,
  globalCriteria,
  onPlansChange,
}: AudienceConfigStepProps) {
  const { showToast } = useWuShowToast();
  const [activeNav, setActiveNav] = useState<NavKey>('global');
  const [bulkTargets, setBulkTargets] = useState<Set<string>>(new Set(plans.map((p) => p.countryCode)));
  const [copyFrom, setCopyFrom] = useState<string>(plans[0]?.countryCode ?? 'US');

  const activeCountry = activeNav !== 'global' ? getCountryByCode(activeNav) : null;
  const activePlan = plans.find((p) => p.countryCode === activeNav);

  function updatePlan(countryCode: string, patch: Partial<CountryPlan>) {
    onPlansChange(plans.map((p) => (p.countryCode === countryCode ? { ...p, ...patch } : p)));
  }

  function markConfigured(countryCode: string) {
    const issues = detectQualificationIssues(countryCode, globalCriteria);
    updatePlan(countryCode, {
      configured: issues.length === 0,
      setupStatus: issues.length === 0 ? 'ready' : 'missing_criteria',
      unresolvedIssues: issues,
    });
    showToast({ message: 'Country configuration saved', variant: 'success' });
  }

  function removeIssueForCountry(countryCode: string, criterionId: string) {
    const plan = plans.find((p) => p.countryCode === countryCode);
    if (!plan) return;
    const remaining = plan.unresolvedIssues.filter((i) => i.criterionId !== criterionId);
    updatePlan(countryCode, {
      unresolvedIssues: remaining,
      setupStatus: remaining.length === 0 ? 'ready' : 'missing_criteria',
      configured: remaining.length === 0,
    });
    showToast({ message: 'Qualification removed for this country', variant: 'success' });
  }

  function applyBulkConfig() {
    const source = plans.find((p) => p.countryCode === copyFrom);
    if (!source) return;
    onPlansChange(
      plans.map((p) =>
        bulkTargets.has(p.countryCode)
          ? {
              ...p,
              overrides: [...source.overrides],
              configured: source.configured,
              setupStatus: source.setupStatus,
              unresolvedIssues: detectQualificationIssues(p.countryCode, globalCriteria),
            }
          : p,
      ),
    );
    showToast({ message: 'Configuration applied to selected countries', variant: 'success' });
  }

  function copySettings() {
    const source = plans.find((p) => p.countryCode === copyFrom);
    if (!source || activeNav === 'global') return;
    updatePlan(activeNav, {
      overrides: [...source.overrides],
      configured: false,
      setupStatus: 'needs_setup',
    });
    showToast({ message: `Settings copied from ${getCountryByCode(copyFrom)?.label}`, variant: 'success' });
  }

  return (
    <div className="flex min-h-[480px] gap-0 overflow-hidden rounded-md border border-gray-200">
      {/* Left country nav */}
      <nav className="w-[220px] shrink-0 border-r border-gray-200 bg-gray-50 p-3" aria-label="Country navigation">
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Countries</p>
        <NavItem active={activeNav === 'global'} onClick={() => setActiveNav('global')}>
          Global
        </NavItem>
        <div className="my-2 border-t border-gray-200" />
        {plans.map((plan) => {
          const c = getCountryByCode(plan.countryCode);
          const statusIcon =
            plan.setupStatus === 'ready' ? '✓' : plan.setupStatus === 'missing_criteria' ? '⚠' : '○';
          return (
            <NavItem
              key={plan.countryCode}
              active={activeNav === plan.countryCode}
              onClick={() => setActiveNav(plan.countryCode)}
              status={statusIcon}
            >
              {c?.flag} {c?.label}
            </NavItem>
          );
        })}
      </nav>

      {/* Workspace */}
      <div className="min-w-0 flex-1 overflow-y-auto p-5">
        {activeNav === 'global' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Global criteria</h3>
              <p className="mt-1 text-sm text-gray-500">
                Criteria applied to every selected country. Override per country as needed.
              </p>
            </div>

            <div className="space-y-3">
              {globalCriteria.map((c) => (
                <div key={c.id} className="rounded-md border border-gray-200 px-4 py-3">
                  <p className="text-xs font-medium text-gray-500">{c.category}</p>
                  <p className="text-sm font-medium text-gray-900">{c.label}</p>
                  <p className="text-sm text-gray-600">{c.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">Applied to</p>
              <div className="flex flex-wrap gap-2">
                {plans.map((p) => {
                  const c = getCountryByCode(p.countryCode);
                  return (
                    <WuChip key={p.countryCode} size="sm">
                      {c?.flag} {c?.label}
                    </WuChip>
                  );
                })}
              </div>
            </div>

            {/* Bulk actions */}
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-900">Apply configuration to</p>
              <div className="mb-3 space-y-2">
                {plans.map((p) => {
                  const c = getCountryByCode(p.countryCode);
                  return (
                    <label key={p.countryCode} className="flex items-center gap-2 text-sm text-gray-700">
                      <WuCheckbox
                        checked={bulkTargets.has(p.countryCode)}
                        onCheckedChange={(checked) => {
                          setBulkTargets((prev) => {
                            const next = new Set(prev);
                            if (checked) next.add(p.countryCode);
                            else next.delete(p.countryCode);
                            return next;
                          });
                        }}
                      />
                      {c?.flag} {c?.label}
                    </label>
                  );
                })}
              </div>
              <WuButton variant="outlined" color="primary" onClick={applyBulkConfig}>
                Apply
              </WuButton>
            </div>
          </div>
        ) : activeCountry && activePlan ? (
          <div className="space-y-6">
            {/* Country header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {activeCountry.flag} {activeCountry.label}
                </h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>Estimated CPI: {activePlan.cpi.toFixed(2)} USD</span>
                  <span>Responses: {activePlan.responses.toLocaleString()}</span>
                  <span>Estimated cost: ${activePlan.estimatedCost.toFixed(2)}</span>
                  <span>Feasibility: {getFeasibilityLabel(activePlan.feasibility)}</span>
                </div>
              </div>
              <WuChip size="sm" color={activePlan.setupStatus === 'ready' ? 'success' : undefined}>
                {getSetupStatusLabel(activePlan.setupStatus)}
              </WuChip>
            </div>

            {/* Copy from */}
            <div className="flex flex-wrap items-end gap-3 rounded-md border border-gray-200 bg-gray-50 p-4">
              <div className="min-w-[200px]">
                <WuSelect
                  data={plans.map((p) => {
                    const c = getCountryByCode(p.countryCode)!;
                    return { value: p.countryCode, label: `${c.flag} ${c.label}` };
                  })}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={{
                    value: copyFrom,
                    label: `${getCountryByCode(copyFrom)?.flag} ${getCountryByCode(copyFrom)?.label}`,
                  }}
                  onSelect={(v) => setCopyFrom((v as { value: string }).value)}
                  Label="Copy from"
                  variant="outlined"
                />
              </div>
              <WuButton variant="outlined" color="primary" onClick={copySettings}>
                Copy settings
              </WuButton>
            </div>

            {/* Qualifications available */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">Qualifications</p>
              <p className="mb-3 text-xs text-gray-500">
                Only qualifications available in {activeCountry.label} are shown.
              </p>
              <div className="flex flex-wrap gap-2">
                {activeCountry.qualificationCategories.map((cat) => (
                  <WuChip key={cat} size="sm">{cat}</WuChip>
                ))}
              </div>
            </div>

            {/* Global criteria with overrides */}
            <div className="space-y-3">
              {globalCriteria.map((c) => {
                const override = activePlan.overrides.find((o) => o.criterionId === c.id);
                const unavailable = activeCountry.unavailableQualificationIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    className={`rounded-md border px-4 py-3 ${unavailable ? 'border-amber-300 bg-amber-50' : 'border-gray-200'}`}
                  >
                    <p className="text-sm font-medium text-gray-900">{c.label}</p>
                    <p className="text-xs text-gray-500">Global: {c.value}</p>
                    {override && (
                      <p className="mt-1 text-sm text-blue-700">
                        Override active: {activeCountry.label} → {override.value}
                      </p>
                    )}
                    {unavailable && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-amber-800">
                          <span className="wm-warning mr-1" aria-hidden="true" />
                          {c.label} is not available in {activeCountry.label}.
                        </p>
                        <div className="flex gap-2">
                          <WuButton
                            variant="outlined"
                            size="sm"
                            onClick={() => removeIssueForCountry(activePlan.countryCode, c.id)}
                          >
                            Remove for {activeCountry.label}
                          </WuButton>
                          <WuButton
                            variant="link"
                            size="sm"
                            onClick={() =>
                              showToast({ message: 'Alternative qualification picker coming soon', variant: 'success' })
                            }
                          >
                            Choose alternative
                          </WuButton>
                        </div>
                      </div>
                    )}
                    {c.id === 'age' && activeCountry.value === 'DE' && !override && (
                      <WuButton
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() =>
                          updatePlan(activePlan.countryCode, {
                            overrides: [{ criterionId: 'age', value: '25–65' }],
                          })
                        }
                      >
                        Set override: 25–65
                      </WuButton>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feasibility failure example for DE if restrictive */}
            {activePlan.feasibility === 'failed' && (
              <div className="rounded-md border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">Audience too restrictive.</p>
                <p className="mt-1 text-sm text-red-700">Estimated IR: 1%</p>
                <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                  <li>Increase age range</li>
                  <li>Remove employment requirement</li>
                  <li>Reduce quota requirements</li>
                </ul>
              </div>
            )}

            <WuButton onClick={() => markConfigured(activePlan.countryCode)}>
              Save country configuration
            </WuButton>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No audience qualifications available for this country.</p>
        )}
      </div>
    </div>
  );
}
