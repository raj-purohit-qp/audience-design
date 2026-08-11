'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTabItem } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { detailPageGutter } from '@/components/ui/page-layout';
import { PanelSettingsFields } from '@/components/admin/panel-settings/PanelSettingsFields';
import { SpecializedSampleFields } from '@/components/admin/panel-settings/SpecializedSampleFields';
import { B2BPricingFields } from '@/components/admin/panel-settings/B2BPricingFields';
import { MultiSourceLaunchFields } from '@/components/admin/panel-settings/MultiSourceLaunchFields';
import { PricingPreview } from '@/components/admin/panel-settings/PricingPreview';
import { ApprovalRequestNotes } from '@/components/admin/panel-settings/ApprovalRequestNotes';
import { RequestLogSection } from '@/components/admin/panel-settings/RequestLogSection';
import { RejectRequestModal } from '@/components/admin/panel-settings/RejectRequestModal';
import { PendingRequestsTable } from '@/components/admin/panel-settings/PendingRequestsTable';
import { OrganizationDetailsTable } from '@/components/admin/panel-settings/OrganizationDetailsTable';
import { SettingsCard, SettingsSkeleton } from '@/components/admin/panel-settings/SettingsCard';
import {
  MOCK_USERS,
  calculateB2BPreview,
  calculatePricingPreview,
  calculateSpecializedPreview,
  getVendorCpi,
  searchOrganization,
  listPendingApprovalRequests,
  submitForApproval,
  approvePendingChanges,
  rejectPendingChanges,
  validateB2BPricing,
  validatePanelSection,
  validateSpecializedSample,
  type AdminRole,
  type ApprovalAttachment,
  type OrganizationPanelSettings,
  type PendingApprovalRequestSummary,
  type SettingsValidationErrors,
} from '@/data/mock-org-panel-settings';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuChip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuChip })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuTab = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTab })),
  { ssr: false },
);

type PagePhase = 'idle' | 'loading' | 'loaded' | 'load_error';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'uber_admin', label: 'Uber admin' },
] as const;

function settingsEqual(a: OrganizationPanelSettings, b: OrganizationPanelSettings): boolean {
  return (
    JSON.stringify({
      specializedSample: a.specializedSample,
      b2bPricing: a.b2bPricing,
      instantAnswers: a.instantAnswers,
      multiSourceLaunch: a.multiSourceLaunch,
    }) ===
    JSON.stringify({
      specializedSample: b.specializedSample,
      b2bPricing: b.b2bPricing,
      instantAnswers: b.instantAnswers,
      multiSourceLaunch: b.multiSourceLaunch,
    })
  );
}

function applyDraftToSettings(
  base: OrganizationPanelSettings,
): OrganizationPanelSettings {
  if (!base.pendingApproval) return base;
  return {
    ...base,
    specializedSample: JSON.parse(JSON.stringify(base.pendingApproval.draft.specializedSample)),
    b2bPricing: JSON.parse(JSON.stringify(base.pendingApproval.draft.b2bPricing)),
    instantAnswers: JSON.parse(JSON.stringify(base.pendingApproval.draft.instantAnswers)),
    multiSourceLaunch: JSON.parse(JSON.stringify(base.pendingApproval.draft.multiSourceLaunch)),
  };
}

export function OrganizationPanelSettingsPage() {
  const { showToast } = useWuShowToast();

  const [role, setRole] = useState<AdminRole>('admin');
  const [searchInput, setSearchInput] = useState('');
  const [phase, setPhase] = useState<PagePhase>('idle');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [settings, setSettings] = useState<OrganizationPanelSettings | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<OrganizationPanelSettings | null>(null);
  const [specializedErrors, setSpecializedErrors] = useState<SettingsValidationErrors>({});
  const [b2bErrors, setB2bErrors] = useState<SettingsValidationErrors>({});
  const [instantErrors, setInstantErrors] = useState<SettingsValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<(() => void) | null>(null);
  const [specializedFormKey, setSpecializedFormKey] = useState(0);
  const [approvalComment, setApprovalComment] = useState('');
  const [approvalAttachments, setApprovalAttachments] = useState<ApprovalAttachment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingApprovalRequestSummary[]>([]);
  const [approvingOrgId, setApprovingOrgId] = useState<string | null>(null);
  const [isHomeView, setIsHomeView] = useState(true);

  const isUberAdmin = role === 'uber_admin';
  const isAdmin = role === 'admin';
  const currentUser = MOCK_USERS[role];
  const ownOrgId = currentUser.orgId;

  const isPending = settings?.approvalStatus === 'pending';
  const showPendingTable = isUberAdmin && isHomeView;

  const refreshPendingRequests = useCallback(() => {
    setPendingRequests(listPendingApprovalRequests());
  }, []);

  useEffect(() => {
    if (isUberAdmin) {
      refreshPendingRequests();
    }
  }, [isUberAdmin, refreshPendingRequests]);

  const hasUnsavedChanges = useMemo(() => {
    if (!settings || !liveSnapshot) return false;
    const baseline = settings.pendingApproval
      ? applyDraftToSettings({
          ...liveSnapshot,
          approvalStatus: 'pending',
          pendingApproval: settings.pendingApproval,
        })
      : liveSnapshot;
    return !settingsEqual(settings, baseline);
  }, [settings, liveSnapshot]);

  /** Admin can change pricing mode; Uber Admin reviews but does not switch mode */
  const pricingModeLocked = !isAdmin || isPending;
  /** Everyone can edit field values unless a pending request is locked for Admin */
  const fieldsReadOnly = isAdmin && isPending;

  const specializedPreview = useMemo(() => {
    if (!settings) return null;
    const vendorCpi = getVendorCpi(settings.specializedSample.vendor);
    return calculateSpecializedPreview(settings.specializedSample, vendorCpi);
  }, [settings]);

  const b2bPreview = useMemo(() => {
    if (!settings) return null;
    return calculateB2BPreview(settings.b2bPricing);
  }, [settings]);

  const instantPreview = useMemo(() => {
    if (!settings) return null;
    return calculatePricingPreview(settings.instantAnswers.baseSellingCpi);
  }, [settings]);

  const loadOrganization = useCallback(async (orgId: string, options?: { asHome?: boolean }) => {
    const asHome = options?.asHome ?? false;
    setIsHomeView(asHome);
    setSearchError(null);
    setLoadError(false);
    setPhase('loading');
    setSettings(null);
    setLiveSnapshot(null);
    setApprovalComment('');
    setApprovalAttachments([]);

    try {
      const result = await searchOrganization(orgId);
      const liveCopy = JSON.parse(JSON.stringify(result)) as OrganizationPanelSettings;
      setLiveSnapshot(liveCopy);
      setSettings(applyDraftToSettings(JSON.parse(JSON.stringify(result))));
      setSpecializedErrors({});
      setInstantErrors({});
      setSpecializedFormKey((k) => k + 1);
      setApprovalComment(result.pendingApproval?.comment ?? '');
      setApprovalAttachments(
        result.pendingApproval?.attachments
          ? JSON.parse(JSON.stringify(result.pendingApproval.attachments))
          : [],
      );
      setSearchInput(asHome ? '' : orgId);
      setPhase('loaded');
    } catch (err) {
      if (err instanceof Error && err.message === 'not_found') {
        setSearchError('Organization not found.');
        setPhase('idle');
      } else {
        setLoadError(true);
        setPhase('load_error');
      }
    }
  }, []);

  const loadHomeOrganization = useCallback(
    async (forRole: AdminRole = role) => {
      const homeOrgId = MOCK_USERS[forRole].orgId;
      if (forRole === 'uber_admin') {
        setPendingRequests(listPendingApprovalRequests());
      }
      await loadOrganization(homeOrgId, { asHome: true });
    },
    [role, loadOrganization],
  );

  useEffect(() => {
    void loadHomeOrganization('admin');
    // Initial home load for default Admin role only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = useCallback(async () => {
    const orgId = searchInput.trim();
    if (!orgId) return;
    await loadOrganization(orgId, { asHome: orgId === ownOrgId });
  }, [searchInput, loadOrganization, ownOrgId]);

  function handleRoleChange(nextRole: AdminRole) {
    setRole(nextRole);
    setSearchError(null);
    setLoadError(false);
    setApprovalComment('');
    setApprovalAttachments([]);
    void loadHomeOrganization(nextRole);
  }

  function handleBackToHome() {
    guardUnsaved(() => {
      void loadHomeOrganization();
    });
  }

  async function handleViewRequest(orgId: string) {
    await loadOrganization(orgId, { asHome: false });
  }

  async function handleApproveFromList(orgId: string) {
    setApprovingOrgId(orgId);
    try {
      await approvePendingChanges(orgId, currentUser.name);
      refreshPendingRequests();
      showToast({ message: 'Pricing changes approved and applied.', variant: 'success' });
    } catch {
      showToast({ message: 'Unable to approve changes. Please try again.', variant: 'error' });
    } finally {
      setApprovingOrgId(null);
    }
  }

  function guardUnsaved(action: () => void) {
    if (hasUnsavedChanges && !fieldsReadOnly) {
      setPendingLeaveAction(() => action);
      setLeaveConfirmOpen(true);
      return;
    }
    action();
  }

  function handleCancel() {
    guardUnsaved(() => {
      if (!liveSnapshot || !settings) return;
      if (settings.pendingApproval) {
        setSettings(
          applyDraftToSettings({
            ...JSON.parse(JSON.stringify(liveSnapshot)),
            approvalStatus: 'pending',
            pendingApproval: settings.pendingApproval,
          }),
        );
      } else {
        setSettings(JSON.parse(JSON.stringify(liveSnapshot)));
      }
      setSpecializedErrors({});
      setInstantErrors({});
      setSpecializedFormKey((k) => k + 1);
    });
  }

  function handleReset() {
    guardUnsaved(() => {
      if (!liveSnapshot || !settings) return;
      if (settings.pendingApproval) {
        setSettings(
          applyDraftToSettings({
            ...JSON.parse(JSON.stringify(liveSnapshot)),
            approvalStatus: 'pending',
            pendingApproval: settings.pendingApproval,
          }),
        );
      } else {
        setSettings(JSON.parse(JSON.stringify(liveSnapshot)));
      }
      setSpecializedErrors({});
      setB2bErrors({});
      setInstantErrors({});
      setSpecializedFormKey((k) => k + 1);
      showToast({ message: 'Changes reset.', variant: 'success' });
    });
  }

  function validateCurrent(): boolean {
    if (!settings) return false;
    const specErrors = validateSpecializedSample(settings.specializedSample);
    const b2bSectionErrors = validateB2BPricing(settings.b2bPricing);
    const iaErrors = validatePanelSection(settings.instantAnswers, false);
    setSpecializedErrors(specErrors);
    setB2bErrors(b2bSectionErrors);
    setInstantErrors(iaErrors);
    return (
      Object.keys(specErrors).length === 0 &&
      Object.keys(b2bSectionErrors).length === 0 &&
      Object.keys(iaErrors).length === 0
    );
  }

  async function handleSubmitForApproval() {
    if (!settings || !isAdmin || isPending) return;
    if (!validateCurrent()) return;

    setSubmitting(true);
    try {
      const updated = await submitForApproval(settings, currentUser.name, {
        comment: approvalComment,
        attachments: approvalAttachments,
      });
      setLiveSnapshot(JSON.parse(JSON.stringify({
        ...updated,
        // live values unchanged until approval
        specializedSample: updated.specializedSample,
        b2bPricing: updated.b2bPricing,
        instantAnswers: updated.instantAnswers,
        multiSourceLaunch: updated.multiSourceLaunch,
      })));
      setSettings(applyDraftToSettings(updated));
      setApprovalComment(updated.pendingApproval?.comment ?? '');
      setApprovalAttachments(
        updated.pendingApproval?.attachments
          ? JSON.parse(JSON.stringify(updated.pendingApproval.attachments))
          : [],
      );
      setSpecializedFormKey((k) => k + 1);
      showToast({
        message: 'Pricing changes submitted for approval.',
        variant: 'success',
      });
    } catch {
      showToast({ message: 'Unable to submit for approval. Please try again.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveChanges() {
    if (!settings || !isUberAdmin || !isPending) return;
    if (!validateCurrent()) return;

    setSubmitting(true);
    try {
      await approvePendingChanges(settings.orgId, currentUser.name, {
        specializedSample: settings.specializedSample,
        b2bPricing: settings.b2bPricing,
        instantAnswers: settings.instantAnswers,
        multiSourceLaunch: settings.multiSourceLaunch,
      });
      setApprovalComment('');
      setApprovalAttachments([]);
      setSpecializedErrors({});
      setB2bErrors({});
      setInstantErrors({});
      showToast({ message: 'Pricing changes approved and applied.', variant: 'success' });
      await loadHomeOrganization();
    } catch {
      showToast({ message: 'Unable to approve changes. Please try again.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectRequest(reason: string) {
    if (!settings || !isUberAdmin || !isPending) return;

    setSubmitting(true);
    try {
      await rejectPendingChanges(settings.orgId, currentUser.name, reason);
      setApprovalComment('');
      setApprovalAttachments([]);
      setSpecializedErrors({});
      setB2bErrors({});
      setInstantErrors({});
      setRejectConfirmOpen(false);
      showToast({ message: 'Approval request rejected.', variant: 'success' });
      await loadHomeOrganization();
    } catch {
      showToast({ message: 'Unable to reject request. Please try again.', variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (hasUnsavedChanges && !fieldsReadOnly) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges, fieldsReadOnly]);

  const showHeaderActions = phase === 'loaded' && settings !== null;

  const settingsTabItems: IWuTabItem[] = useMemo(() => {
    if (!settings) return [];

    return [
      {
        value: 'specialized_sample',
        Trigger: 'Specialized sample',
        Content: (
          <div className="pt-5">
            <p className="mb-4 font-['Fira_Sans',sans-serif] text-[14px] font-normal text-[#1a2340]">
              Pricing settings
            </p>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0">
                <SpecializedSampleFields
                  key={specializedFormKey}
                  section={settings.specializedSample}
                  fieldsReadOnly={fieldsReadOnly}
                  pricingModeLocked={pricingModeLocked}
                  errors={specializedErrors}
                  onChange={(updates) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            specializedSample: { ...prev.specializedSample, ...updates },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              {specializedPreview && (
                <aside className="min-w-0 lg:sticky lg:top-4">
                  <PricingPreview preview={specializedPreview} />
                </aside>
              )}
            </div>
          </div>
        ),
      },
      {
        value: 'b2b',
        Trigger: 'B2B',
        Content: (
          <div className="pt-5">
            <p className="mb-4 font-['Fira_Sans',sans-serif] text-[14px] font-normal text-[#1a2340]">
              Pricing settings
            </p>
            <p className="mb-4 text-sm text-[#8c9baa]">
              Set Base CPI and Margin for B2B project requirements on this account.
            </p>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0">
                <B2BPricingFields
                  section={settings.b2bPricing}
                  readOnly={fieldsReadOnly}
                  errors={b2bErrors}
                  onChange={(updates) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            b2bPricing: { ...prev.b2bPricing, ...updates },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              {b2bPreview && (
                <aside className="min-w-0 lg:sticky lg:top-4">
                  <PricingPreview preview={b2bPreview} />
                </aside>
              )}
            </div>
          </div>
        ),
      },
      {
        value: 'instant_answers',
        Trigger: 'Instant answers',
        Content: (
          <div className="pt-5">
            <p className="mb-4 text-sm text-[#8c9baa]">
              Default pricing settings used for Instant answers projects.
            </p>
            <div className="mb-4 flex items-start gap-2 rounded-md border border-[#e8f0fe] bg-[#f0f7ff] px-3 py-2">
              <span className="wm-info mt-0.5 shrink-0 text-base text-[#1b87e6]" aria-hidden="true" />
              <p className="text-xs text-[#54606b]">
                Instant answers always uses the platform&apos;s default panel vendor.
              </p>
            </div>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="min-w-0">
                <PanelSettingsFields
                  section={settings.instantAnswers}
                  readOnly={fieldsReadOnly}
                  errors={instantErrors}
                  onChange={(updates) =>
                    setSettings((prev) =>
                      prev
                        ? {
                            ...prev,
                            instantAnswers: { ...prev.instantAnswers, ...updates },
                          }
                        : prev,
                    )
                  }
                />
              </div>
              {instantPreview && (
                <aside className="min-w-0 lg:sticky lg:top-4">
                  <PricingPreview preview={instantPreview} />
                </aside>
              )}
            </div>
          </div>
        ),
      },
      {
        value: 'multi_source_launch',
        Trigger: 'Multi-source launch',
        Content: (
          <div className="pt-5">
            <p className="mb-4 font-['Fira_Sans',sans-serif] text-[14px] font-normal text-[#1a2340]">
              Multi-source launch
            </p>
            <p className="mb-4 text-sm text-[#8c9baa]">
              Control whether this account can launch projects with community as an additional
              sample source.
            </p>
            <MultiSourceLaunchFields
              section={settings.multiSourceLaunch}
              readOnly={fieldsReadOnly}
              onChange={(updates) =>
                setSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        multiSourceLaunch: { ...prev.multiSourceLaunch, ...updates },
                      }
                    : prev,
                )
              }
            />
          </div>
        ),
      },
    ];
  }, [
    settings,
    specializedFormKey,
    fieldsReadOnly,
    pricingModeLocked,
    specializedErrors,
    b2bErrors,
    instantErrors,
    specializedPreview,
    b2bPreview,
    instantPreview,
  ]);

  return (
    <div className="pb-8">
      <header className="bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <WuHeading size="lg" className="shrink-0 text-left text-[#1a2340]">
              Panel settings
            </WuHeading>
            <WuSelect
              data={ROLE_OPTIONS as unknown as Record<string, unknown>[]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={ROLE_OPTIONS.find((r) => r.value === role) as unknown as Record<string, unknown>}
              onSelect={(item) => handleRoleChange((item as { value: AdminRole }).value)}
              variant="outlined"
              labelPosition="left"
              Label={<span className="whitespace-nowrap text-xs font-medium text-[#8c9baa]">Demo role</span>}
              className="w-[8.5rem] shrink-0 [&_button]:!h-8 [&_button]:!min-h-8 [&_button]:!px-2 [&_button]:!text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <WuButton
              variant="secondary"
              onClick={handleReset}
              disabled={!showHeaderActions || fieldsReadOnly || !hasUnsavedChanges || submitting}
            >
              Reset
            </WuButton>
            <WuButton
              variant="outlined"
              color="primary"
              onClick={handleCancel}
              disabled={!showHeaderActions || fieldsReadOnly || !hasUnsavedChanges || submitting}
            >
              Cancel
            </WuButton>

            {isAdmin && (
              <WuButton
                variant="primary"
                color="primary"
                onClick={handleSubmitForApproval}
                disabled={
                  !showHeaderActions || isPending || !hasUnsavedChanges || submitting
                }
                loading={submitting}
              >
                Submit for approval
              </WuButton>
            )}

            {isUberAdmin && (
              <>
                {isPending && (
                  <WuButton
                    variant="outlined"
                    color="error"
                    onClick={() => setRejectConfirmOpen(true)}
                    disabled={!showHeaderActions || submitting}
                  >
                    Reject request
                  </WuButton>
                )}
                <WuButton
                  variant="primary"
                  color="primary"
                  onClick={handleApproveChanges}
                  disabled={!showHeaderActions || !isPending || submitting}
                  loading={submitting}
                >
                  Save changes
                </WuButton>
              </>
            )}
          </div>
        </div>
        <div className="h-px w-full bg-[#e0e4e8]" aria-hidden="true" />
      </header>

      <div className={`${detailPageGutter} pt-6`}>
      {showPendingTable && (
        <div className="mb-6">
          <PendingRequestsTable
            requests={pendingRequests}
            approvingOrgId={approvingOrgId}
            onViewRequest={handleViewRequest}
            onApprove={handleApproveFromList}
          />
        </div>
      )}

      {isUberAdmin && isHomeView && (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-[#e8f0fe] bg-[#f0f7ff] px-4 py-3">
          <span className="wm-info mt-0.5 text-base text-[#1b87e6]" aria-hidden="true" />
          <p className="text-sm text-[#54606b]">
            Review pending Account manager requests above, or search for an organization below.
          </p>
        </div>
      )}

      {!isHomeView && (
        <div className="mb-5">
          <WuButton
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleBackToHome}
            Icon={<span className="wm-arrow-back" aria-hidden="true" />}
          >
            Back to organization detail
          </WuButton>
        </div>
      )}

      {isPending && settings?.pendingApproval && (
        <div className="mb-5 flex items-start gap-3 rounded-md border border-[#fef3c7] bg-[#fffbeb] px-4 py-3">
          <span className="wm-pending-actions mt-0.5 text-base text-[#b45309]" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-[#1a2340]">Pending approval</p>
            <p className="mt-0.5 text-sm text-[#54606b]">
              Submitted by {settings.pendingApproval.submittedBy} · {settings.pendingApproval.submittedDate} · {settings.pendingApproval.submittedTime}
            </p>
          </div>
          <WuChip size="sm" color="warning">Pending approval</WuChip>
        </div>
      )}

      {hasUnsavedChanges && !fieldsReadOnly && (
        <div className="mb-5 flex items-center gap-2">
          <WuChip size="sm" color="warning">Unsaved edits</WuChip>
        </div>
      )}

      <SettingsCard title="Search organization">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#54606b]" htmlFor="org-id">
            Organization ID
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-[20ch] shrink-0">
              <WuInput
                id="org-id"
                variant="outlined"
                placeholder="Enter organization ID"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value.slice(0, 20));
                  setSearchError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                aria-invalid={!!searchError}
                maxLength={20}
                className="w-full"
              />
            </div>
            <WuButton onClick={handleSearch} disabled={!searchInput.trim() || phase === 'loading'}>
              Search
            </WuButton>
            {isAdmin && !isPending && (
              <div className="flex min-w-0 max-w-xl items-start gap-2 rounded-md border border-[#e8f0fe] bg-[#f0f7ff] px-3 py-2">
                <span className="wm-info mt-0.5 shrink-0 text-base text-[#1b87e6]" aria-hidden="true" />
                <p className="text-sm text-[#54606b]">
                  You can edit pricing settings and change the pricing model. Submit changes for Uber admin approval — they are not applied until approved.
                </p>
              </div>
            )}
          </div>
          {searchError && (
            <p className="mt-1 text-xs text-[#d93025]" role="alert">{searchError}</p>
          )}
          <p className="mt-1 text-[11px] text-[#8c9baa]">
            Your organization:{' '}
            <button
              type="button"
              className="text-[#1b87e6] hover:underline"
              onClick={() => void loadHomeOrganization()}
            >
              {ownOrgId}
            </button>
            {' · '}Try{' '}
            <button type="button" className="text-[#1b87e6] hover:underline" onClick={() => setSearchInput('103284')}>
              103284
            </button>
            {' '}or{' '}
            <button type="button" className="text-[#1b87e6] hover:underline" onClick={() => setSearchInput('305112')}>
              305112
            </button>
          </p>
        </div>
      </SettingsCard>

      {phase === 'loading' && (
        <div className="mt-6">
          <SettingsSkeleton />
        </div>
      )}

      {phase === 'load_error' && (
        <div className="mt-6 rounded-lg border border-[#fce8e6] bg-[#fef7f6] px-6 py-8 text-center">
          <span className="wm-error-outline mb-3 inline-block text-4xl text-[#d93025]" aria-hidden="true" />
          <p className="text-sm font-medium text-[#1a2340]">Unable to load organization settings.</p>
          <p className="mt-1 text-sm text-[#54606b]">Please try again.</p>
          <WuButton
            className="mt-4"
            variant="outlined"
            color="primary"
            onClick={() => void loadHomeOrganization()}
          >
            Back to organization detail
          </WuButton>
        </div>
      )}

      {phase === 'loaded' && settings && (
        <div className="mt-6 space-y-6">
          <OrganizationDetailsTable
            settings={settings}
            title="Organization detail"
          />

          <div className="overflow-hidden rounded-lg border border-[#e0e4e8] bg-white px-5 py-5 shadow-sm">
            <div className="space-y-5">
              <WuTab
                items={settingsTabItems}
                defaultValue="specialized_sample"
                className="w-full"
              />

              {isAdmin && !isPending && (
                <ApprovalRequestNotes
                  comment={approvalComment}
                  attachments={approvalAttachments}
                  onCommentChange={setApprovalComment}
                  onAttachmentsChange={setApprovalAttachments}
                />
              )}

              {isPending && (
                <ApprovalRequestNotes
                  comment={approvalComment}
                  attachments={approvalAttachments}
                  readOnly
                />
              )}
            </div>
          </div>

          <RequestLogSection entries={settings.requestLog ?? []} />
        </div>
      )}

      <ConfirmModal
        open={leaveConfirmOpen}
        onOpenChange={setLeaveConfirmOpen}
        title="Discard unsaved edits?"
        description="You have unsaved edits to organization panel settings. Discard them and continue?"
        confirmLabel="Discard edits"
        variant="critical"
        onConfirm={() => {
          pendingLeaveAction?.();
          setPendingLeaveAction(null);
        }}
      />

      <RejectRequestModal
        open={rejectConfirmOpen}
        onOpenChange={setRejectConfirmOpen}
        submitting={submitting}
        onConfirm={handleRejectRequest}
      />
      </div>
    </div>
  );
}
