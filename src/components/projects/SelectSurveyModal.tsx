'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MOCK_SURVEYS,
  NO_SURVEY_OPTION,
  SURVEY_FOLDERS,
  getSurveysForFolder,
  type SurveyFolderOption,
  type SurveyOption,
} from '@/data/mock-project-create';

interface SelectSurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSurveyId: string;
  onSelect: (survey: SurveyOption) => void;
}

const SelectSurveyModalInner = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((lib) => {
      const {
        WuModal,
        WuModalHeader,
        WuModalContent,
        WuModalFooter,
        WuModalClose,
        WuButton,
        WuInput,
        WuSurveySelect,
        WuSurveySource,
        WuSurveyList,
        WuSurveyItem,
        WuSharedSurvey,
      } = lib;

      return function SelectSurveyModalInner({
        open,
        onOpenChange,
        selectedSurveyId,
        onSelect,
      }: SelectSurveyModalProps) {
        const [folder, setFolder] = useState<SurveyFolderOption>(SURVEY_FOLDERS[0]);
        const [search, setSearch] = useState('');
        const [pendingId, setPendingId] = useState(selectedSurveyId);

        const surveys = useMemo(
          () => getSurveysForFolder(folder.value, search),
          [folder.value, search],
        );

        function handleOpenChange(next: boolean) {
          if (next) {
            setPendingId(selectedSurveyId);
            setSearch('');
            setFolder(SURVEY_FOLDERS[0]);
          }
          onOpenChange(next);
        }

        function handleConfirm() {
          if (pendingId === NO_SURVEY_OPTION.id) {
            onSelect(NO_SURVEY_OPTION);
          } else {
            const survey = MOCK_SURVEYS.find((s) => s.id === pendingId);
            if (survey) onSelect(survey);
          }
          onOpenChange(false);
        }

        return (
          <WuModal open={open} onOpenChange={handleOpenChange} size="lg">
            <WuModalHeader>Select survey</WuModalHeader>
            <WuModalContent>
              <div className="space-y-4">
                <WuInput
                  variant="outlined"
                  placeholder="Search surveys in this folder…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search surveys"
                  className="w-full"
                />

                <WuSurveySelect
                  className="min-h-[320px] overflow-hidden rounded-md border border-[#e0e4e8]"
                  Sidebar={
                    <div className="flex h-full flex-col gap-2 p-2">
                      <WuSharedSurvey
                        label="Shared with me"
                        onClick={() => {
                          const shared = SURVEY_FOLDERS.find((f) => f.value === 'shared');
                          if (shared) setFolder(shared);
                        }}
                      />
                      <WuSurveySource
                        data={SURVEY_FOLDERS.filter((f) => f.value !== 'shared')}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={folder.value === 'shared' ? SURVEY_FOLDERS[0] : folder}
                        onSelect={(v) => setFolder(v as SurveyFolderOption)}
                        searchable
                        placeholder="Search folders…"
                        variant="outlined"
                      />
                    </div>
                  }
                >
                  <div className="flex h-full flex-col p-2">
                    {surveys.length === 0 ? (
                      <div className="flex flex-1 items-center justify-center px-4 py-10 text-center">
                        <p className="text-sm text-[#54606b]">
                          No surveys found in this folder
                          {search.trim() ? ` matching “${search.trim()}”` : ''}.
                        </p>
                      </div>
                    ) : (
                      <WuSurveyList>
                        {surveys.map((survey) => (
                          <WuSurveyItem
                            key={survey.id}
                            isActive={pendingId === survey.id}
                            isShared={survey.folderId === 'shared'}
                            onClick={() => setPendingId(survey.id)}
                          >
                            <span className="flex min-w-0 flex-col items-start gap-0.5 text-left">
                              <span className="truncate">{survey.name}</span>
                              {survey.questionCount !== undefined && (
                                <span className="text-[11px] text-[#8c9baa]">
                                  {survey.questionCount} questions
                                </span>
                              )}
                            </span>
                          </WuSurveyItem>
                        ))}
                      </WuSurveyList>
                    )}
                  </div>
                </WuSurveySelect>

                <button
                  type="button"
                  className={`w-full rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${
                    pendingId === NO_SURVEY_OPTION.id
                      ? 'border-[#1b87e6] bg-[#e8f0fe] text-[#1a2340]'
                      : 'border-[#e0e4e8] text-[#54606b] hover:border-[#1b87e6]'
                  }`}
                  onClick={() => setPendingId(NO_SURVEY_OPTION.id)}
                >
                  {NO_SURVEY_OPTION.name}
                </button>
              </div>
            </WuModalContent>
            <WuModalFooter>
              <WuModalClose variant="secondary">Cancel</WuModalClose>
              <WuButton color="primary" onClick={handleConfirm}>
                Select
              </WuButton>
            </WuModalFooter>
          </WuModal>
        );
      };
    }),
  { ssr: false },
);

export function SelectSurveyModal(props: SelectSurveyModalProps) {
  return <SelectSurveyModalInner {...props} />;
}
