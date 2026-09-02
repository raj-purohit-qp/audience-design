import type { SurveyOption } from './mock-project-create';

export interface IrAiCriterion {
  id: string;
  label: string;
}

/** Primary US demo survey — targets KIA electric vehicle owners in screener questions. */
export const US_EV_SURVEY: SurveyOption = {
  id: 'svy-ev-001',
  name: 'Electric Vehicle Ownership Study',
  questionCount: 24,
  folderId: 'research',
};

/** Applied US audience qualifications shown in IR by AI Step 1. */
export const US_APPLIED_CRITERIA: IrAiCriterion[] = [
  { id: 'car_owner', label: 'Car owner' },
  { id: 'age', label: 'Age 25–54' },
  { id: 'region', label: 'California' },
  { id: 'gender', label: 'Male / Female' },
];

export const IR_AI_CRITERIA_CHIP_LIMIT = 5;

export type IrAiCriteriaAnswer = 'yes' | 'no' | null;

export type IrAiWorkflowStep = 1 | 2;

export type IrAiStep2View = 'processing' | 'result' | 'error' | 'manual';

export type IrAiConfidence = 'high' | 'medium' | 'low';

/** Prototype demo variants — set via sessionStorage: ir-ai-demo = error | low | high-match */
export type IrAiDemoVariant = 'default' | 'error' | 'low' | 'high-match';

export interface IrAiAssumptionStep {
  label: string;
}

export interface IrAiTargetingComparisonRow {
  surveyRequirement: string;
  audienceTargeting: string;
}

export interface IrAiEstimateResult {
  estimatedIr: number;
  confidence: IrAiConfidence;
  reasoning: string;
  targetingComparison: IrAiTargetingComparisonRow[];
  targetingGap: string | null;
  targetingGapDetail: string | null;
  strongMatch: boolean;
  strongMatchMessage: string | null;
  lowConfidenceWarning: string | null;
  summaryReason: string;
  assumptionSteps: IrAiAssumptionStep[];
}

export const IR_AI_CONFIDENCE_LABELS: Record<IrAiConfidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export const IR_AI_CONFIDENCE_DESCRIPTIONS: Record<IrAiConfidence, string> = {
  high: 'AI found a strong match between the survey requirements and available audience targeting.',
  medium: 'AI found a partial match and identified some targeting limitations.',
  low: 'AI found significant gaps between the survey requirements and available audience targeting.',
};

export const US_EV_IR_ESTIMATE: IrAiEstimateResult = {
  estimatedIr: 18,
  confidence: 'medium',
  reasoning:
    'Your survey targets electric vehicle owners. Your selected audience criteria target car owners, but the panel does not have direct targeting for specific vehicle brands such as KIA. AI therefore estimates the IR based on the broader car-owner audience and the additional qualification requirement in the survey.',
  targetingComparison: [
    { surveyRequirement: 'Electric vehicle owners', audienceTargeting: 'Car owners' },
    {
      surveyRequirement: 'Specific vehicle brand: KIA',
      audienceTargeting: 'Not available in panel',
    },
    {
      surveyRequirement: 'United States respondents',
      audienceTargeting: 'United States respondents',
    },
  ],
  targetingGap: 'KIA-specific vehicle targeting isn\u2019t available in the audience panel.',
  targetingGapDetail:
    'Specific KIA EV ownership cannot be directly targeted through the available audience qualifications.',
  strongMatch: false,
  strongMatchMessage: null,
  lowConfidenceWarning: null,
  summaryReason:
    'The survey requires a niche audience that cannot be fully targeted using the available panel qualifications.',
  assumptionSteps: [
    { label: 'Survey audience' },
    { label: 'Electric vehicle owners' },
    { label: 'Available panel targeting' },
    { label: 'Car owners' },
    { label: 'Additional survey screening requirement' },
    { label: 'Estimated qualification rate' },
    { label: '18% IR' },
  ],
};

export const US_EV_IR_ESTIMATE_LOW: IrAiEstimateResult = {
  ...US_EV_IR_ESTIMATE,
  estimatedIr: 5,
  confidence: 'low',
  lowConfidenceWarning:
    'This audience appears highly niche, and the available audience qualifications do not fully match the survey requirements.',
  assumptionSteps: US_EV_IR_ESTIMATE.assumptionSteps.map((step, index, arr) =>
    index === arr.length - 1 ? { label: '5% IR' } : step,
  ),
};

export const US_EV_IR_ESTIMATE_HIGH_MATCH: IrAiEstimateResult = {
  estimatedIr: 42,
  confidence: 'high',
  reasoning:
    'Your survey focuses on general car ownership attitudes. The car-owner audience criteria you selected closely align with the screener requirements in your survey.',
  targetingComparison: [
    { surveyRequirement: 'Car owners', audienceTargeting: 'Car owners' },
    {
      surveyRequirement: 'United States respondents',
      audienceTargeting: 'United States respondents',
    },
    { surveyRequirement: 'Age 25–54', audienceTargeting: 'Age 25–54' },
    { surveyRequirement: 'Gender', audienceTargeting: 'Gender targeting' },
  ],
  targetingGap: null,
  targetingGapDetail: null,
  strongMatch: true,
  strongMatchMessage:
    'The available audience criteria closely match the requirements identified in your survey.',
  lowConfidenceWarning: null,
  summaryReason: 'Survey requirements align well with available panel targeting.',
  assumptionSteps: [
    { label: 'Survey audience' },
    { label: 'Car owners' },
    { label: 'Available panel targeting' },
    { label: 'Car owners + demographics' },
    { label: 'Minimal additional screening' },
    { label: 'Estimated qualification rate' },
    { label: '42% IR' },
  ],
};

export function getIrAiDemoVariant(): IrAiDemoVariant {
  if (typeof window === 'undefined') return 'default';
  const value = sessionStorage.getItem('ir-ai-demo');
  if (value === 'error' || value === 'low' || value === 'high-match') return value;
  return 'default';
}

export function buildIrAiEstimate(
  hasCriteriaAdded: boolean,
  demoVariant: IrAiDemoVariant = 'default',
): IrAiEstimateResult | null {
  if (demoVariant === 'error') return null;
  if (demoVariant === 'low') return US_EV_IR_ESTIMATE_LOW;
  if (demoVariant === 'high-match') return US_EV_IR_ESTIMATE_HIGH_MATCH;
  if (!hasCriteriaAdded) {
    return {
      ...US_EV_IR_ESTIMATE,
      estimatedIr: 12,
      confidence: 'low',
      reasoning:
        'Without audience criteria, AI estimated IR from survey screener requirements only. Adding panel qualifications could improve targeting precision.',
      targetingComparison: [
        { surveyRequirement: 'Electric vehicle owners', audienceTargeting: 'Survey screening only' },
        {
          surveyRequirement: 'Specific vehicle brand: KIA',
          audienceTargeting: 'Not available in panel',
        },
        {
          surveyRequirement: 'United States respondents',
          audienceTargeting: 'United States respondents',
        },
      ],
      lowConfidenceWarning:
        'No audience criteria were applied. The estimate relies on survey requirements alone.',
      assumptionSteps: [
        { label: 'Survey audience' },
        { label: 'Electric vehicle owners' },
        { label: 'No panel qualifications applied' },
        { label: 'Survey screening only' },
        { label: 'Estimated qualification rate' },
        { label: '12% IR' },
      ],
    };
  }
  return US_EV_IR_ESTIMATE;
}

export function validateManualIr(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter an incidence rate to continue.';
  const num = Number(trimmed);
  if (Number.isNaN(num) || num < 0 || num > 100) return 'Enter an IR between 0% and 100%.';
  return null;
}
