'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);

export function ProjectHeaderAnalyticsActions() {
  const { showToast } = useWuShowToast();

  return (
    <>
      <WuButton
        variant="link"
        color="primary"
        Icon={<span className="wm-bar-chart" />}
        iconPosition="left"
        onClick={() =>
          showToast({ message: 'Opening BI analytics…', variant: 'success' })
        }
      >
        BI analytics
      </WuButton>
      <WuButton
        Icon={<span className="wm-insert-chart" />}
        iconPosition="left"
        onClick={() => showToast({ message: 'Opening Analytics…', variant: 'success' })}
      >
        Analytics
      </WuButton>
    </>
  );
}
