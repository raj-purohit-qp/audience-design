'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import {
  HOME_PRODUCT_CARDS,
  type HomeColumnAction,
  type HomeFeatureColumn,
  type HomeProductCard,
  type HomeProductFeature,
} from '@/data/mock-home';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);
const WuCardFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCardFooter })),
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
const WuText = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuText })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);

const ACCENT = {
  blue: {
    bar: 'bg-[rgb(var(--wu-blue-p))]',
    chip: '!border-0 !bg-[#e8f1fc] !text-[rgb(var(--wu-blue-p))]',
    iconWrap: 'bg-[#e8f1fc]',
    icon: 'text-[rgb(var(--wu-blue-p))]',
    check: 'text-[rgb(var(--wu-blue-p))]',
    button: undefined as string | undefined,
  },
  purple: {
    bar: 'bg-[#7c5cbf]',
    chip: '!border-0 !bg-[#f3eefc] !text-[#7c5cbf]',
    iconWrap: 'bg-[#f3eefc]',
    icon: 'text-[#7c5cbf]',
    check: 'text-[#7c5cbf]',
    button: '!border-[#7c5cbf] !bg-[#7c5cbf] hover:!bg-[#6b4eab]',
  },
} as const;

function FeatureList({
  features,
  checkClass,
}: {
  features: HomeProductFeature[];
  checkClass: string;
}) {
  return (
    <ul className="flex flex-col gap-3.5">
      {features.map((feature) => (
        <li key={feature.id} className="flex items-start gap-3">
          <span
            className={`wm-check-circle mt-0.5 shrink-0 text-lg ${checkClass}`}
            aria-hidden="true"
          />
          <WuText size="md" as="span">
            {feature.label}
          </WuText>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ card }: { card: HomeProductCard }) {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const accent = ACCENT[card.accent];

  const footerActions: HomeColumnAction[] = card.featureColumns
    ? card.featureColumns.map((column) => column.action)
    : (card.actions ?? []);

  function handleAction(action: HomeColumnAction) {
    if (action.href) {
      router.push(action.href);
      return;
    }
    showToast({ message: `${action.label} coming soon`, variant: 'success' });
  }

  return (
    <WuCard
      rounded
      className="flex h-full min-h-[480px] flex-col overflow-hidden border border-[#e0e4e8] bg-white p-0 shadow-sm"
    >
      <div className={`h-1.5 w-full shrink-0 ${accent.bar}`} aria-hidden="true" />

      <div className="flex flex-1 flex-col gap-6 px-9 pb-3 pt-7">
        <div className="flex flex-col gap-4">
          <span
            className={`inline-flex h-[60px] w-[60px] items-center justify-center rounded-full ${accent.iconWrap}`}
            aria-hidden="true"
          >
            <span className={`${card.icon} text-3xl ${accent.icon}`} />
          </span>
          <WuChip size="md" shape="rounded" className={`w-fit ${accent.chip}`}>
            {card.eyebrow}
          </WuChip>
          <div className="flex flex-col gap-2">
            <WuHeading size="lg">{card.title}</WuHeading>
            <WuText size="md" className="text-[#54606b]">
              {card.description}
            </WuText>
          </div>
        </div>

        {card.featureColumns ? (
          <div className="grid flex-1 gap-9 border-t border-[#eef0f3] pt-6 sm:grid-cols-2">
            {card.featureColumns.map((column: HomeFeatureColumn) => (
              <div key={column.id} className="flex flex-col gap-4">
                {column.title ? (
                  <WuSubtext size="md" className="font-medium text-[#1a2340]">
                    {column.title}
                  </WuSubtext>
                ) : null}
                <FeatureList features={column.features} checkClass={accent.check} />
              </div>
            ))}
          </div>
        ) : card.features ? (
          <div className="border-t border-[#eef0f3] pt-6">
            <FeatureList features={card.features} checkClass={accent.check} />
          </div>
        ) : null}
      </div>

      <WuCardFooter
        className={`mt-auto grid gap-9 border-t border-[#eef0f3] bg-transparent px-9 py-7 ${
          footerActions.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {footerActions.map((action) => (
          <div key={action.id} className="flex">
            <WuButton
              color="primary"
              className={
                footerActions.length === 1
                  ? `w-full ${accent.button ?? ''}`
                  : accent.button
              }
              onClick={() => handleAction(action)}
            >
              {action.label}
            </WuButton>
          </div>
        ))}
      </WuCardFooter>
    </WuCard>
  );
}

export function HomeProductChooser() {
  return (
    <div className="bg-white px-6 pb-10 pt-4">
      <PageHeader
        title="Audience"
        description="Choose how you want to collect responses for your project."
      />

      <div className="mx-auto grid max-w-[90rem] gap-7 md:grid-cols-2 md:items-stretch">
        {HOME_PRODUCT_CARDS.map((card) => (
          <ProductCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
