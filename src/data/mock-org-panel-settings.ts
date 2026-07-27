// ─────────────────────────────────────────────────────────────
//  Organization-level Audience Panel Settings — mock data
// ─────────────────────────────────────────────────────────────

export type AdminRole = 'uber_admin' | 'admin';

export type ApprovalStatus = 'none' | 'pending';

export type SpecializedPricingMode =
  | 'fixed_price'
  | 'margin_based'
  | 'rate_card'
  | 'override';

export const PRICING_MODE_OPTIONS: {
  value: SpecializedPricingMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'fixed_price',
    label: 'Fixed price',
    description: 'Fixed Buying CPI and Selling CPI up to a defined IR.',
  },
  {
    value: 'margin_based',
    label: 'Margin based',
    description:
      'Vendor CPI is marked up by Margin %. If the result is below Base CPI, Base CPI is used as the floor.',
  },
  {
    value: 'rate_card',
    label: 'Rate card',
    description: 'Different Selling and Buying CPI by IR and LOI ranges. Ranges must not overlap.',
  },
  {
    value: 'override',
    label: 'Override pricing',
    description:
      'User enters a Selling CPI (cannot be less than Base CPI). Buying CPI is derived from Margin %.',
  },
];

export interface RateCardRow {
  id: string;
  irMin: number;
  irMax: number;
  loiMin: number;
  loiMax: number;
  sellingCpi: number;
  buyingCpi: number;
}

export interface SpecializedSampleSettings {
  pricingMode: SpecializedPricingMode;
  /** Fixed price */
  sellingCpi: number;
  buyingCpi: number;
  ir: number;
  /** Margin based & Override — floor / minimum CPI */
  baseCpi: number;
  /** Margin based & Override */
  margin: number;
  /** Rate card rows */
  rateCardRows: RateCardRow[];
  /** Common */
  defaultCustomVariable: string;
  vendor: string;
}

/** Instant Answers — Selling CPI and Default variable only */
export interface PanelSettingsSection {
  baseSellingCpi: number;
  defaultCustomVariable: string;
}

/** B2B project pricing — Base CPI floor and Margin % for the account */
export interface B2BPricingSettings {
  baseCpi: number;
  margin: number;
}

export interface ApprovalAttachment {
  id: string;
  name: string;
  sizeLabel: string;
}

export type RequestLogStatus = 'pending' | 'approved' | 'rejected';

export interface RequestLogEntry {
  id: string;
  /** Account Manager (Admin) who submitted the request */
  accountManager: string;
  date: string;
  time: string;
  /** Specialized Sample pricing mode label at submit time */
  pricingModel: string;
  status: RequestLogStatus;
  /** Rejection reason from the business owner (Uber Admin); empty when not rejected */
  reason?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  reviewedTime?: string;
}

export interface PendingApproval {
  /** Links this pending request to its request-log row */
  requestLogId: string;
  submittedBy: string;
  submittedDate: string;
  submittedTime: string;
  /** Optional AM comment submitted with the request */
  comment?: string;
  /** Optional supporting documents submitted with the request */
  attachments?: ApprovalAttachment[];
  /** Draft settings awaiting Uber Admin approval */
  draft: {
    specializedSample: SpecializedSampleSettings;
    b2bPricing: B2BPricingSettings;
    instantAnswers: PanelSettingsSection;
  };
}

export interface OrganizationPanelSettings {
  orgId: string;
  orgName: string;
  /** Primary user email for the organization */
  userEmail: string;
  /** License label, e.g. "Research Edition Sub Account | Active" */
  license: string;
  /** Account manager username / display id */
  accountManager: string;
  specializedSample: SpecializedSampleSettings;
  /** B2B project pricing defaults for this account */
  b2bPricing: B2BPricingSettings;
  instantAnswers: PanelSettingsSection;
  approvalStatus: ApprovalStatus;
  pendingApproval: PendingApproval | null;
  /** Chronological history of approval requests (newest first) */
  requestLog: RequestLogEntry[];
}

export function getPricingModeLabel(mode: SpecializedPricingMode): string {
  return PRICING_MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

export const CUSTOM_VARIABLE_OPTIONS = [
  { value: 'Custom1', label: 'Custom1' },
  { value: 'Custom2', label: 'Custom2' },
  { value: 'Custom3', label: 'Custom3' },
  { value: 'Custom4', label: 'Custom4' },
  { value: 'Custom5', label: 'Custom5' },
] as const;

export const VENDOR_OPTIONS = [
  { value: 'PureSpectrum', label: 'PureSpectrum', vendorCpi: 0.25 },
  { value: 'Cint', label: 'Cint', vendorCpi: 2.0 },
  { value: 'QuestionPro Panel', label: 'QuestionPro Panel', vendorCpi: 0.8 },
] as const;

export const MOCK_USERS: Record<
  AdminRole,
  { name: string; role: AdminRole; orgId: string }
> = {
  uber_admin: { name: 'Raj Purohit', role: 'uber_admin', orgId: '204891' },
  admin: { name: 'Sarah Chen', role: 'admin', orgId: '103284' },
};

export const MOCK_ADMIN_USER = MOCK_USERS.uber_admin;

export function createEmptyRateCardRow(): RateCardRow {
  const sellingCpi = RATE_CARD_MIN_SELLING_CPI;
  return {
    id: `rc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    irMin: 10,
    irMax: 15,
    loiMin: 0,
    loiMax: 2,
    sellingCpi,
    buyingCpi: buyingFromSelling(sellingCpi),
  };
}

export const RATE_CARD_MIN_SELLING_CPI = 1.5;

/** 150% markup between Selling and Buying CPI (Buying = Selling ÷ 2.5) */
export const RATE_CARD_MARKUP = 1.5;

export function sellingFromBuying(buyingCpi: number): number {
  return Number((buyingCpi * (1 + RATE_CARD_MARKUP)).toFixed(2));
}

export function buyingFromSelling(sellingCpi: number): number {
  return Number((sellingCpi / (1 + RATE_CARD_MARKUP)).toFixed(2));
}

export function floorRateCardSelling(sellingCpi: number): number {
  return Math.max(RATE_CARD_MIN_SELLING_CPI, sellingCpi);
}

/**
 * Default rate card bands — IR rows × LOI columns.
 * IR upper bounds are exclusive of the next band where labels share an edge (e.g. 50–80 vs 80–100).
 */
export const RATE_CARD_IR_BANDS = [
  { label: '80-100%', irMin: 80, irMax: 100 },
  { label: '50-80%', irMin: 50, irMax: 79 },
  { label: '30-50%', irMin: 30, irMax: 49 },
  { label: '20-30%', irMin: 20, irMax: 29 },
  { label: '16-20%', irMin: 16, irMax: 19 },
  { label: '10-15%', irMin: 10, irMax: 15 },
] as const;

export const RATE_CARD_LOI_BANDS = [
  { label: '0-2 min', loiMin: 0, loiMax: 2 },
  { label: '3-5 min', loiMin: 3, loiMax: 5 },
  { label: '6-7 min', loiMin: 6, loiMax: 7 },
  { label: '8-10 min', loiMin: 8, loiMax: 10 },
  { label: '11-15 min', loiMin: 11, loiMax: 15 },
  { label: '16-20 min', loiMin: 16, loiMax: 20 },
  { label: '21-25 min', loiMin: 21, loiMax: 25 },
] as const;

/** Buying CPI grid matching vendor rate card (rows = IR bands, cols = LOI bands) */
const DEFAULT_BUYING_CPI_GRID: number[][] = [
  // 80-100%
  [0.25, 0.25, 0.25, 0.35, 0.55, 0.75, 1.0],
  // 50-80%
  [0.25, 0.35, 0.45, 0.55, 0.75, 1.0, 1.5],
  // 30-50%
  [0.35, 0.45, 0.55, 0.75, 1.0, 1.5, 2.0],
  // 20-30%
  [0.55, 0.55, 0.75, 1.0, 1.5, 2.0, 3.0],
  // 16-20%
  [0.55, 0.75, 1.0, 1.5, 2.0, 3.0, 4.0],
  // 10-15%
  [0.75, 1.0, 1.5, 2.0, 3.0, 5.0, 6.0],
];

export function buildDefaultRateCardRows(): RateCardRow[] {
  const rows: RateCardRow[] = [];
  RATE_CARD_IR_BANDS.forEach((irBand, irIndex) => {
    RATE_CARD_LOI_BANDS.forEach((loiBand, loiIndex) => {
      const rawBuying = DEFAULT_BUYING_CPI_GRID[irIndex][loiIndex];
      const sellingCpi = floorRateCardSelling(sellingFromBuying(rawBuying));
      const buyingCpi = buyingFromSelling(sellingCpi);
      rows.push({
        id: `rc-${irBand.irMin}-${irBand.irMax}-${loiBand.loiMin}-${loiBand.loiMax}`,
        irMin: irBand.irMin,
        irMax: irBand.irMax,
        loiMin: loiBand.loiMin,
        loiMax: loiBand.loiMax,
        buyingCpi,
        sellingCpi,
      });
    });
  });
  return rows;
}

const DEFAULT_SPECIALIZED: SpecializedSampleSettings = {
  pricingMode: 'margin_based',
  sellingCpi: 1.5,
  buyingCpi: 0.5,
  ir: 50,
  baseCpi: 1.5,
  margin: 70,
  rateCardRows: buildDefaultRateCardRows(),
  defaultCustomVariable: 'Custom1',
  vendor: 'PureSpectrum',
};

const DEFAULT_B2B: B2BPricingSettings = {
  baseCpi: 5.0,
  margin: 70,
};

export const MOCK_ORG_SETTINGS: Record<string, OrganizationPanelSettings> = {
  '103284': {
    orgId: '103284',
    orgName: 'Acme Research Inc.',
    userEmail: 'sarah.chen@acmeresearch.com',
    license: 'Research Edition Sub Account | Active',
    accountManager: 'sarah.chen',
    specializedSample: {
      ...DEFAULT_SPECIALIZED,
      pricingMode: 'margin_based',
      baseCpi: 1.5,
      margin: 70,
      defaultCustomVariable: 'Custom1',
      vendor: 'PureSpectrum',
    },
    b2bPricing: {
      ...DEFAULT_B2B,
    },
    instantAnswers: {
      baseSellingCpi: 0.85,


      defaultCustomVariable: 'Custom2',
    },
    approvalStatus: 'none',
    pendingApproval: null,
    requestLog: [
      {
        id: 'rl-103284-3',
        accountManager: 'Sarah Chen',
        date: 'July 15, 2026',
        time: '3:45 PM',
        pricingModel: 'Margin based',
        status: 'approved',
        reviewedBy: 'Raj Purohit',
        reviewedDate: 'July 15, 2026',
        reviewedTime: '4:10 PM',
      },
      {
        id: 'rl-103284-2',
        accountManager: 'Sarah Chen',
        date: 'July 8, 2026',
        time: '10:15 AM',
        pricingModel: 'Fixed price',
        status: 'rejected',
        reason: 'Buying CPI is too low for PureSpectrum at this IR. Please revise to at least $0.75.',
        reviewedBy: 'Raj Purohit',
        reviewedDate: 'July 8, 2026',
        reviewedTime: '2:30 PM',
      },
      {
        id: 'rl-103284-1',
        accountManager: 'Sarah Chen',
        date: 'June 22, 2026',
        time: '9:05 AM',
        pricingModel: 'Fixed price',
        status: 'approved',
        reviewedBy: 'Raj Purohit',
        reviewedDate: 'June 22, 2026',
        reviewedTime: '11:40 AM',
      },
    ],
  },
  '204891': {
    orgId: '204891',
    orgName: 'Horizon Consumer Brands',
    userEmail: 'raj.purohit@horizonbrands.com',
    license: 'Research Edition | Active',
    accountManager: 'raj.purohit',
    specializedSample: {
      ...DEFAULT_SPECIALIZED,
      pricingMode: 'fixed_price',
      sellingCpi: 2.25,
      buyingCpi: 0.5,
      ir: 40,
      baseCpi: 1.5,
      margin: 70,
      defaultCustomVariable: 'Custom3',
      vendor: 'Cint',
    },
    b2bPricing: {
      ...DEFAULT_B2B,
    },
    instantAnswers: {
      baseSellingCpi: 1.1,


      defaultCustomVariable: 'Custom1',
    },
    approvalStatus: 'none',
    pendingApproval: null,
    requestLog: [
      {
        id: 'rl-204891-2',
        accountManager: 'Sarah Chen',
        date: 'July 10, 2026',
        time: '11:20 AM',
        pricingModel: 'Fixed price',
        status: 'approved',
        reviewedBy: 'Raj Purohit',
        reviewedDate: 'July 10, 2026',
        reviewedTime: '1:05 PM',
      },
      {
        id: 'rl-204891-1',
        accountManager: 'Sarah Chen',
        date: 'June 28, 2026',
        time: '4:50 PM',
        pricingModel: 'Rate card',
        status: 'rejected',
        reason: 'Rate card Selling CPI floor conflicts with negotiated client rates. Use Fixed price instead.',
        reviewedBy: 'Raj Purohit',
        reviewedDate: 'June 29, 2026',
        reviewedTime: '9:15 AM',
      },
    ],
  },
  '305112': {
    orgId: '305112',
    orgName: 'Northstar Insights LLC',
    userEmail: 'ops@northstarinsights.com',
    license: 'Research Edition Sub Account | Active',
    accountManager: 'sarah.chen',
    specializedSample: {
      ...DEFAULT_SPECIALIZED,
      pricingMode: 'fixed_price',
      sellingCpi: 1.8,
      buyingCpi: 0.5,
      ir: 45,
      margin: 70,
      defaultCustomVariable: 'Custom2',
      vendor: 'PureSpectrum',
    },
    b2bPricing: {
      ...DEFAULT_B2B,
    },
    instantAnswers: {
      baseSellingCpi: 0.9,


      defaultCustomVariable: 'Custom1',
    },
    approvalStatus: 'pending',
    pendingApproval: {
      requestLogId: 'rl-305112-pending',
      submittedBy: 'Sarah Chen',
      submittedDate: 'July 20, 2026',
      submittedTime: '2:15 PM',
      comment: 'Client negotiated a higher Selling CPI for Q3 brand tracker. Please approve Override mode.',
      draft: {
        specializedSample: {
          ...DEFAULT_SPECIALIZED,
          pricingMode: 'override',
          baseCpi: 2.0,
          margin: 70,
          defaultCustomVariable: 'Custom2',
          vendor: 'PureSpectrum',
        },
        b2bPricing: {
          ...DEFAULT_B2B,
        },
        instantAnswers: {
          baseSellingCpi: 0.9,


          defaultCustomVariable: 'Custom1',
        },
      },
    },
    requestLog: [
      {
        id: 'rl-305112-pending',
        accountManager: 'Sarah Chen',
        date: 'July 20, 2026',
        time: '2:15 PM',
        pricingModel: 'Override pricing',
        status: 'pending',
      },
    ],
  },
  '412890': {
    orgId: '412890',
    orgName: 'BrightPath Media Group',
    userEmail: 'admin@brightpathmedia.com',
    license: 'Corporate Edition | Active',
    accountManager: 'sarah.chen',
    specializedSample: {
      ...DEFAULT_SPECIALIZED,
      pricingMode: 'margin_based',
      baseCpi: 1.5,
      margin: 70,
      defaultCustomVariable: 'Custom1',
      vendor: 'Cint',
    },
    b2bPricing: {
      ...DEFAULT_B2B,
    },
    instantAnswers: {
      baseSellingCpi: 1.0,


      defaultCustomVariable: 'Custom3',
    },
    approvalStatus: 'pending',
    pendingApproval: {
      requestLogId: 'rl-412890-pending',
      submittedBy: 'Sarah Chen',
      submittedDate: 'July 21, 2026',
      submittedTime: '9:40 AM',
      comment: 'Switching to Rate card so LOI bands match their wave design.',
      draft: {
        specializedSample: {
          ...DEFAULT_SPECIALIZED,
          pricingMode: 'rate_card',
          rateCardRows: buildDefaultRateCardRows().map((row, i) =>
            i === 0 ? { ...row, sellingCpi: 2.25, buyingCpi: buyingFromSelling(2.25) } : row,
          ),
          defaultCustomVariable: 'Custom1',
          vendor: 'Cint',
        },
        b2bPricing: {
          ...DEFAULT_B2B,
        },
        instantAnswers: {
          baseSellingCpi: 1.05,


          defaultCustomVariable: 'Custom3',
        },
      },
    },
    requestLog: [
      {
        id: 'rl-412890-pending',
        accountManager: 'Sarah Chen',
        date: 'July 21, 2026',
        time: '9:40 AM',
        pricingModel: 'Rate card',
        status: 'pending',
      },
    ],
  },
  '501234': {
    orgId: '501234',
    orgName: 'Cascade Consumer Panel Co. — West Region Strategic Insights Division',
    userEmail: 'panel.admin@cascadecpc.com',
    license: 'Research Edition Sub Account | Active',
    accountManager: 'sarah.chen',
    specializedSample: {
      ...DEFAULT_SPECIALIZED,
      pricingMode: 'fixed_price',
      sellingCpi: 1.5,
      buyingCpi: 0.5,
      ir: 50,
      margin: 70,
      defaultCustomVariable: 'Custom4',
      vendor: 'QuestionPro Panel',
    },
    b2bPricing: {
      ...DEFAULT_B2B,
    },
    instantAnswers: {
      baseSellingCpi: 0.8,


      defaultCustomVariable: 'Custom4',
    },
    approvalStatus: 'pending',
    pendingApproval: {
      requestLogId: 'rl-501234-pending',
      submittedBy: 'Sarah Chen',
      submittedDate: 'July 21, 2026',
      submittedTime: '11:05 AM',
      draft: {
        specializedSample: {
          ...DEFAULT_SPECIALIZED,
          pricingMode: 'fixed_price',
          sellingCpi: 2.5,
          buyingCpi: 0.85,
          ir: 35,
          margin: 70,
          defaultCustomVariable: 'Custom4',
          vendor: 'QuestionPro Panel',
        },
        b2bPricing: {
          ...DEFAULT_B2B,
        },
        instantAnswers: {
          baseSellingCpi: 0.95,


          defaultCustomVariable: 'Custom4',
        },
      },
    },
    requestLog: [
      {
        id: 'rl-501234-pending',
        accountManager: 'Sarah Chen',
        date: 'July 21, 2026',
        time: '11:05 AM',
        pricingModel: 'Fixed price',
        status: 'pending',
      },
    ],
  },
};

export function getVendorCpi(vendor: string): number {
  return VENDOR_OPTIONS.find((v) => v.value === vendor)?.vendorCpi ?? 1.0;
}

export interface PricingPreviewResult {
  mode: SpecializedPricingMode | 'instant_answers' | 'b2b';
  vendorCpi?: number;
  baseCpi?: number;
  margin?: number;
  sellingCpi: number;
  buyingCpi?: number;
  ir?: number;
  markedUpCpi?: number;
  floorApplied?: boolean;
  label: string;
  detail?: string;
}

/** Selling CPI = max(Base CPI, Vendor CPI × (1 + Margin/100)) */
export function calculateMarginBasedSelling(
  vendorCpi: number,
  baseCpi: number,
  margin: number,
): { sellingCpi: number; markedUpCpi: number; floorApplied: boolean } {
  const markedUpCpi = Number((vendorCpi * (1 + margin / 100)).toFixed(2));
  const floorApplied = markedUpCpi < baseCpi;
  const sellingCpi = floorApplied ? baseCpi : markedUpCpi;
  return { sellingCpi, markedUpCpi, floorApplied };
}

/** Buying CPI derived from entered Selling CPI and Margin % */
export function calculateOverrideBuyingCpi(sellingCpi: number, margin: number): number {
  if (margin <= -100) return sellingCpi;
  return Number((sellingCpi / (1 + margin / 100)).toFixed(2));
}

export function calculateSpecializedPreview(
  settings: SpecializedSampleSettings,
  vendorCpi: number,
  /** Demo override selling CPI for preview (must be >= baseCpi in real use) */
  overrideSellingCpi = 2.0,
): PricingPreviewResult {
  switch (settings.pricingMode) {
    case 'fixed_price':
      return {
        mode: 'fixed_price',
        sellingCpi: settings.sellingCpi,
        buyingCpi: settings.buyingCpi,
        ir: settings.ir,
        margin: settings.margin,
        label: 'Fixed price',
        detail: `Fixed rates up to ${settings.ir}% IR · ${settings.margin}% margin below IR`,
      };
    case 'margin_based': {
      const { sellingCpi, markedUpCpi, floorApplied } = calculateMarginBasedSelling(
        vendorCpi,
        settings.baseCpi,
        settings.margin,
      );
      return {
        mode: 'margin_based',
        vendorCpi,
        baseCpi: settings.baseCpi,
        margin: settings.margin,
        sellingCpi,
        markedUpCpi,
        floorApplied,
        label: floorApplied ? 'Base CPI floor applied' : 'Margin applied to vendor CPI',
        detail: floorApplied
          ? `Marked-up CPI ($${markedUpCpi.toFixed(2)}) is below Base CPI ($${settings.baseCpi.toFixed(2)})`
          : `Vendor CPI × (1 + ${settings.margin}%)`,
      };
    }
    case 'rate_card': {
      const first = settings.rateCardRows[0];
      if (!first) {
        return {
          mode: 'rate_card',
          sellingCpi: 0,
          label: 'Rate card',
          detail: 'Add at least one rate card row',
        };
      }
      return {
        mode: 'rate_card',
        sellingCpi: first.sellingCpi,
        buyingCpi: first.buyingCpi,
        label: 'Rate card (sample row)',
        detail: `IR ${first.irMin}–${first.irMax}% · LOI ${first.loiMin}–${first.loiMax} min`,
      };
    }
    case 'override': {
      const selling = Math.max(overrideSellingCpi, settings.baseCpi);
      const buyingCpi = calculateOverrideBuyingCpi(selling, settings.margin);
      return {
        mode: 'override',
        baseCpi: settings.baseCpi,
        margin: settings.margin,
        sellingCpi: selling,
        buyingCpi,
        label: 'Override pricing',
        detail: `Entered Selling CPI must be ≥ Base CPI ($${settings.baseCpi.toFixed(2)})`,
      };
    }
  }
}

export function calculatePricingPreview(baseSellingCpi: number): PricingPreviewResult {
  return {
    mode: 'instant_answers',
    baseCpi: baseSellingCpi,
    sellingCpi: baseSellingCpi,
    label: 'Selling CPI',
    detail: 'Instant answers uses the account Selling CPI.',
  };
}

/** B2B: Selling CPI = Base CPI × (1 + Margin %) for account-level preview */
export function calculateB2BPreview(settings: B2BPricingSettings): PricingPreviewResult {
  const sellingCpi = Number((settings.baseCpi * (1 + settings.margin / 100)).toFixed(2));
  return {
    mode: 'b2b',
    baseCpi: settings.baseCpi,
    margin: settings.margin,
    sellingCpi,
    label: 'B2B margin applied',
    detail: `Selling CPI = Base CPI × (1 + ${settings.margin}%)`,
  };
}

export function formatCurrencyInput(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(2);
}

export function parseCurrencyInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface SettingsValidationErrors {
  baseSellingCpi?: string;
  margin?: string;
  defaultCustomVariable?: string;
  vendor?: string;
  sellingCpi?: string;
  buyingCpi?: string;
  ir?: string;
  baseCpi?: string;
  rateCard?: string;
  rateCardRows?: Record<string, string>;
}

function rangesOverlap(
  aMin: number,
  aMax: number,
  bMin: number,
  bMax: number,
): boolean {
  return aMin <= bMax && bMin <= aMax;
}

/** Two rate-card rows overlap when both IR ranges and LOI ranges overlap */
export function findRateCardOverlaps(rows: RateCardRow[]): string | undefined {
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i];
      const b = rows[j];
      if (
        rangesOverlap(a.irMin, a.irMax, b.irMin, b.irMax) &&
        rangesOverlap(a.loiMin, a.loiMax, b.loiMin, b.loiMax)
      ) {
        return `Rate card rows ${i + 1} and ${j + 1} overlap on IR and LOI. Ranges must not overlap.`;
      }
    }
  }
  return undefined;
}

export function validateSpecializedSample(
  section: SpecializedSampleSettings,
): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};

  if (!section.defaultCustomVariable) {
    errors.defaultCustomVariable = 'Default variable is required.';
  }
  if (!section.vendor) {
    errors.vendor = 'Vendor is required for Specialized sample.';
  }

  switch (section.pricingMode) {
    case 'fixed_price':
      if (!section.sellingCpi || section.sellingCpi <= 0) {
        errors.sellingCpi = 'Selling CPI is required and must be greater than 0.';
      }
      if (!section.buyingCpi || section.buyingCpi <= 0) {
        errors.buyingCpi = 'Buying CPI is required and must be greater than 0.';
      }
      if (!section.ir || section.ir <= 0 || section.ir > 100) {
        errors.ir = 'IR must be between 1 and 100%.';
      }
      if (section.margin < 0 || section.margin > 100 || Number.isNaN(section.margin)) {
        errors.margin = 'Margin must be between 0 and 100%.';
      }
      break;

    case 'margin_based':
      if (!section.baseCpi || section.baseCpi <= 0) {
        errors.baseCpi = 'Base CPI is required and must be greater than 0.';
      }
      if (section.margin < 0 || section.margin > 100 || Number.isNaN(section.margin)) {
        errors.margin = 'Margin must be between 0 and 100%.';
      }
      break;

    case 'override':
      if (!section.baseCpi || section.baseCpi <= 0) {
        errors.baseCpi = 'Base CPI is required and must be greater than 0.';
      }
      if (section.margin < 0 || section.margin > 100 || Number.isNaN(section.margin)) {
        errors.margin = 'Margin must be between 0 and 100%.';
      }
      break;

    case 'rate_card': {
      if (!section.rateCardRows.length) {
        errors.rateCard = 'Add at least one rate card row.';
        break;
      }
      const rowErrors: Record<string, string> = {};
      section.rateCardRows.forEach((row, index) => {
        if (row.irMin < 0 || row.irMax > 100 || row.irMin > row.irMax) {
          rowErrors[row.id] = `Row ${index + 1}: IR range must be 0–100% with min ≤ max.`;
        } else if (row.loiMin < 0 || row.loiMin > row.loiMax) {
          rowErrors[row.id] = `Row ${index + 1}: LOI range is invalid (min ≤ max, min ≥ 0).`;
        } else if (!row.sellingCpi || row.sellingCpi <= 0) {
          rowErrors[row.id] = `Row ${index + 1}: Selling CPI must be greater than 0.`;
        } else if (!row.buyingCpi || row.buyingCpi <= 0) {
          rowErrors[row.id] = `Row ${index + 1}: Buying CPI must be greater than 0.`;
        }
      });
      if (Object.keys(rowErrors).length) {
        errors.rateCardRows = rowErrors;
      }
      const overlap = findRateCardOverlaps(section.rateCardRows);
      if (overlap) {
        errors.rateCard = overlap;
      }
      break;
    }
  }

  return errors;
}

export function validateB2BPricing(section: B2BPricingSettings): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};
  if (!section.baseCpi || section.baseCpi <= 0) {
    errors.baseCpi = 'Base CPI is required and must be greater than 0.';
  }
  if (section.margin < 0 || section.margin > 100 || Number.isNaN(section.margin)) {
    errors.margin = 'Margin must be between 0 and 100%.';
  }
  return errors;
}

export function validatePanelSection(
  section: PanelSettingsSection,
  requireVendor: boolean,
  vendor?: string,
): SettingsValidationErrors {
  const errors: SettingsValidationErrors = {};

  if (!section.baseSellingCpi || section.baseSellingCpi <= 0) {
    errors.baseSellingCpi = 'Selling CPI is required and must be greater than 0.';
  }
  if (!section.defaultCustomVariable) {
    errors.defaultCustomVariable = 'Default variable is required.';
  }
  if (requireVendor && !vendor) {
    errors.vendor = 'Vendor is required for Specialized sample.';
  }

  return errors;
}

/** Simulated async org lookup for prototype */
export function searchOrganization(orgId: string): Promise<OrganizationPanelSettings> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (orgId === '000000') {
        reject(new Error('backend'));
        return;
      }
      const settings = MOCK_ORG_SETTINGS[orgId.trim()];
      if (!settings) {
        reject(new Error('not_found'));
        return;
      }
      resolve(JSON.parse(JSON.stringify(settings)) as OrganizationPanelSettings);
    }, 900);
  });
}

export interface PendingApprovalRequestSummary {
  orgId: string;
  orgName: string;
  accountManager: string;
  pricingModel: string;
  comment: string;
  submittedDate: string;
  submittedTime: string;
  requestLogId: string;
}

/** Uber Admin inbox: all orgs with a pending approval request */
export function listPendingApprovalRequests(): PendingApprovalRequestSummary[] {
  return Object.values(MOCK_ORG_SETTINGS)
    .filter((s) => s.approvalStatus === 'pending' && s.pendingApproval)
    .map((s) => {
      const pending = s.pendingApproval!;
      return {
        orgId: s.orgId,
        orgName: s.orgName,
        accountManager: pending.submittedBy,
        pricingModel: getPricingModeLabel(pending.draft.specializedSample.pricingMode),
        comment: pending.comment ?? '',
        submittedDate: pending.submittedDate,
        submittedTime: pending.submittedTime,
        requestLogId: pending.requestLogId,
      };
    })
    .sort((a, b) => {
      const aKey = `${a.submittedDate} ${a.submittedTime}`;
      const bKey = `${b.submittedDate} ${b.submittedTime}`;
      return bKey.localeCompare(aKey);
    });
}

function stampNow() {
  return { date: 'July 21, 2026', time: '11:42 AM' };
}

/** Admin submits draft pricing changes for Uber Admin approval */
export function submitForApproval(
  settings: OrganizationPanelSettings,
  submittedBy: string,
  options?: {
    comment?: string;
    attachments?: ApprovalAttachment[];
  },
): Promise<OrganizationPanelSettings> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (settings.orgId === '000001') {
        reject(new Error('backend'));
        return;
      }
      const existing = MOCK_ORG_SETTINGS[settings.orgId];
      if (!existing) {
        reject(new Error('not_found'));
        return;
      }
      const { date, time } = stampNow();
      const comment = options?.comment?.trim();
      const attachments = options?.attachments?.length
        ? (JSON.parse(JSON.stringify(options.attachments)) as ApprovalAttachment[])
        : undefined;
      const requestLogId = `rl-${settings.orgId}-${Date.now()}`;
      const logEntry: RequestLogEntry = {
        id: requestLogId,
        accountManager: submittedBy,
        date,
        time,
        pricingModel: getPricingModeLabel(settings.specializedSample.pricingMode),
        status: 'pending',
      };
      const updated: OrganizationPanelSettings = {
        ...existing,
        approvalStatus: 'pending',
        pendingApproval: {
          requestLogId,
          submittedBy,
          submittedDate: date,
          submittedTime: time,
          ...(comment ? { comment } : {}),
          ...(attachments ? { attachments } : {}),
          draft: {
            specializedSample: JSON.parse(JSON.stringify(settings.specializedSample)),
            b2bPricing: JSON.parse(JSON.stringify(settings.b2bPricing)),
            instantAnswers: JSON.parse(JSON.stringify(settings.instantAnswers)),
          },
        },
        requestLog: [logEntry, ...(existing.requestLog ?? [])],
      };
      MOCK_ORG_SETTINGS[settings.orgId] = updated;
      resolve(JSON.parse(JSON.stringify(updated)));
    }, 1000);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function updateRequestLogStatus(
  log: RequestLogEntry[],
  requestLogId: string,
  status: 'approved' | 'rejected',
  reviewedBy: string,
  date: string,
  time: string,
  reason?: string,
): RequestLogEntry[] {
  return log.map((entry) =>
    entry.id === requestLogId
      ? {
          ...entry,
          status,
          reviewedBy,
          reviewedDate: date,
          reviewedTime: time,
          ...(status === 'rejected' ? { reason: reason?.trim() || undefined } : { reason: undefined }),
        }
      : entry,
  );
}

/** Uber Admin approves pending changes and applies them as live settings */
export function approvePendingChanges(
  orgId: string,
  approvedBy: string,
  /** Optional: apply current form edits instead of original draft */
  overrideDraft?: {
    specializedSample: SpecializedSampleSettings;
    b2bPricing: B2BPricingSettings;
    instantAnswers: PanelSettingsSection;
  },
): Promise<OrganizationPanelSettings> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = MOCK_ORG_SETTINGS[orgId];
      if (!existing?.pendingApproval) {
        reject(new Error('no_pending'));
        return;
      }
      const draft = overrideDraft ?? existing.pendingApproval.draft;
      const { date, time } = stampNow();
      const requestLogId = existing.pendingApproval.requestLogId;
      const updated: OrganizationPanelSettings = {
        ...existing,
        specializedSample: JSON.parse(JSON.stringify(draft.specializedSample)),
        b2bPricing: JSON.parse(JSON.stringify(draft.b2bPricing)),
        instantAnswers: JSON.parse(JSON.stringify(draft.instantAnswers)),
        approvalStatus: 'none',
        pendingApproval: null,
        requestLog: updateRequestLogStatus(
          existing.requestLog,
          requestLogId,
          'approved',
          approvedBy,
          date,
          time,
        ),
      };
      MOCK_ORG_SETTINGS[orgId] = updated;
      resolve(JSON.parse(JSON.stringify(updated)));
    }, 1000);
  });
}

/** Uber Admin rejects a pending approval request with a reason */
export function rejectPendingChanges(
  orgId: string,
  rejectedBy: string,
  reason: string,
): Promise<OrganizationPanelSettings> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const existing = MOCK_ORG_SETTINGS[orgId];
      if (!existing?.pendingApproval) {
        reject(new Error('no_pending'));
        return;
      }
      const trimmed = reason.trim();
      if (!trimmed) {
        reject(new Error('reason_required'));
        return;
      }
      const { date, time } = stampNow();
      const requestLogId = existing.pendingApproval.requestLogId;
      const updated: OrganizationPanelSettings = {
        ...existing,
        approvalStatus: 'none',
        pendingApproval: null,
        requestLog: updateRequestLogStatus(
          existing.requestLog,
          requestLogId,
          'rejected',
          rejectedBy,
          date,
          time,
          trimmed,
        ),
      };
      MOCK_ORG_SETTINGS[orgId] = updated;
      resolve(JSON.parse(JSON.stringify(updated)));
    }, 800);
  });
}
