'use client';

import dynamic from 'next/dynamic';

interface IrAiEstimateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IrAiEstimateModalInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const {
        WuModal,
        WuModalHeader,
        WuModalContent,
        WuModalFooter,
        WuModalClose,
      } = lib;

      return function IrAiEstimateModalInner({
        open,
        onOpenChange,
      }: IrAiEstimateModalProps) {
        return (
          <WuModal open={open} onOpenChange={onOpenChange} size="lg">
            <WuModalHeader>AI Incidence Rate Estimation</WuModalHeader>
            <WuModalContent>
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <span className="wm-auto-awesome text-4xl text-blue-600" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">AI analysis workflow</p>
                <p className="max-w-md text-sm text-gray-500">
                  The full IR estimation experience will be built in upcoming screens. This
                  placeholder confirms the entry point opens a modal without leaving the page.
                </p>
              </div>
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary">Close</WuModalClose>
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false }
);

export function IrAiEstimateModal({ open, onOpenChange }: IrAiEstimateModalProps) {
  return <IrAiEstimateModalInner open={open} onOpenChange={onOpenChange} />;
}
