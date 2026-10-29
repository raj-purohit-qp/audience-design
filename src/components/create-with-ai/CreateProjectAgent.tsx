'use client';

import './CreateProjectAgent.css';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiIcon } from '@/components/projects/AiIcon';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWorkspaceSession } from '@/components/workspace/useWorkspaceSession';
import {
  AI_STAGES,
  clearCreateWithAi,
  getCreateWithAiJob,
  handOffCreateWithAi,
  resumeCreateWithAi,
  retryCreateWithAi,
  startCreateWithAi,
  subscribeCreateWithAi,
  type AiJob,
} from '@/data/create-with-ai';
import { MULTI_COUNTRY_CATALOG } from '@/data/mock-multi-country';
import {
  AGENT_COPY,
  analysisSummary,
  applyGuidedOption,
  applyGuidedText,
  countryListLabel,
  draftFromRecentTemplate,
  formatGuidedDate,
  isoToDate,
  isConfirmReply,
  labelForDraftField,
  minGuidedDueDate,
  optionLayoutForStep,
  optionsForStep,
  questionForStep,
  recentProjectTemplates,
  remainingGuidedStep,
  requestMissingCopy,
  reviewDetails,
  toIsoDate,
  type GuidedDraft,
  type GuidedField,
  type GuidedOption,
  type GuidedStep,
  type RecentProjectTemplate,
} from '@/data/mock-create-agent';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false },
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false },
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);
const WuDatePicker = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDatePicker })),
  { ssr: false },
);
const WuCard = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCard })),
  { ssr: false },
);

type CountrySelectOption = {
  value: string;
  label: string;
  icon?: ReactNode;
};

const COUNTRY_SELECT_OPTIONS: CountrySelectOption[] = MULTI_COUNTRY_CATALOG.map((country) => ({
  value: country.value,
  label: '',
  icon: (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true">{country.flag}</span>
      <span>{country.label}</span>
      <span className="text-[11px] text-[#8c9baa]">{country.value}</span>
    </span>
  ),
}));

interface AgentMessage {
  id: string;
  role: 'agent' | 'user';
  text: string;
  field?: GuidedField;
  control?: 'country' | 'date';
  options?: GuidedOption[];
  optionLayout?: 'chips' | 'list';
  optionsDisabled?: boolean;
  stages?: boolean;
  kind?: 'summary' | 'selected-recent';
  recent?: RecentProjectTemplate;
  embedInRecent?: boolean;
}

function nextId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function questionMessage(step: GuidedField): AgentMessage {
  return {
    id: nextId('agent'),
    role: 'agent',
    text: questionForStep(step),
    field: step,
    control: step === 'country' ? 'country' : step === 'dueDate' ? 'date' : undefined,
    options: optionsForStep(step),
    optionLayout: optionLayoutForStep(step),
  };
}

function openingMessages(): AgentMessage[] {
  return [
    {
      id: nextId('agent'),
      role: 'agent',
      text: AGENT_COPY.greeting,
    },
  ];
}

function confirmMessage(draft: GuidedDraft): AgentMessage {
  return {
    id: nextId('agent'),
    role: 'agent',
    text: `${reviewDetails(draft)}\n\n${AGENT_COPY.confirm}`,
    kind: 'summary',
    options: [
      { id: 'continue', label: "No, that's all" },
      { id: 'more', label: 'Yes, I have more' },
    ],
    optionLayout: 'chips',
  };
}

function RecentProjectCard({
  template,
  selected = false,
  onSelect,
  onEditField,
}: {
  template: RecentProjectTemplate;
  selected?: boolean;
  onSelect?: () => void;
  onEditField?: (field: GuidedField) => void;
}) {
  const card = (
    <WuCard rounded className={selected ? 'create-agent-recent-card is-selected' : 'create-agent-recent-card'}>
      <p className="create-agent-recent-name">{template.name}</p>
      <dl className="create-agent-recent-meta">
        <div>
          <dt>Responses</dt>
          <dd>
            {template.responses.toLocaleString()}
            {onEditField ? (
              <button
                type="button"
                className="create-agent-edit"
                aria-label="Edit responses"
                onClick={() => onEditField('responses')}
              >
                <span className="wm-edit" aria-hidden="true" />
              </button>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Countries</dt>
          <dd>
            {countryListLabel(template.countryCodes, true)}
            {onEditField ? (
              <button
                type="button"
                className="create-agent-edit"
                aria-label="Edit countries"
                onClick={() => onEditField('country')}
              >
                <span className="wm-edit" aria-hidden="true" />
              </button>
            ) : null}
          </dd>
        </div>
        <div>
          <dt>Due date</dt>
          <dd>
            {formatGuidedDate(template.dueDate)}
            {onEditField ? (
              <button
                type="button"
                className="create-agent-edit"
                aria-label="Edit due date"
                onClick={() => onEditField('dueDate')}
              >
                <span className="wm-edit" aria-hidden="true" />
              </button>
            ) : null}
          </dd>
        </div>
      </dl>
    </WuCard>
  );

  if (!onSelect) return card;

  return (
    <button type="button" className="create-agent-recent-button" onClick={onSelect}>
      {card}
    </button>
  );
}

function draftsEqual(a: GuidedDraft, b: GuidedDraft): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function CreateProjectAgent() {
  const router = useRouter();
  const { currentUser } = useWorkspaceSession();
  const canCreate = currentUser.projectCreation.specializedSample;
  const threadRef = useRef<HTMLDivElement>(null);
  const handedOff = useRef(false);
  const navTimer = useRef<number | null>(null);
  const [draft, setDraft] = useState<GuidedDraft>({});
  const [step, setStep] = useState<GuidedStep>('intake');
  const [messages, setMessages] = useState<AgentMessage[]>(openingMessages);
  const [input, setInput] = useState('');
  const [job, setJob] = useState<AiJob | null>(null);
  const [countryPick, setCountryPick] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const busy = step === 'working' || step === 'done';
  const showRecentCards = step === 'intake' && !busy;
  const chatExpanded = !showRecentCards;
  const askStep: GuidedField | null =
    step === 'responses' || step === 'country' || step === 'survey' || step === 'dueDate' ? step : null;
  const editingField = messages.find((message) => message.id === editingId)?.field ?? null;
  const minDate = minGuidedDueDate();
  const composerDisabled = busy && job?.view !== 'failed' && job?.view !== 'no-criteria';
  const countryComposerActive =
    !composerDisabled && ((askStep === 'country' && !editingId) || editingField === 'country');

  useEffect(() => {
    resumeCreateWithAi();
    const current = getCreateWithAiJob();
    setJob(current);
    if (current?.status === 'running' && current.form) {
      handedOff.current = false;
      const restored: GuidedDraft = {
        responses: current.form.responses,
        countryCodes: current.form.countryCodes,
        surveyId: current.form.surveyId,
        dueDate: current.form.dueDate,
      };
      setDraft(restored);
      setStep('working');
      setMessages([
        {
          id: nextId('agent'),
          role: 'agent',
          text: analysisSummary(restored),
          stages: true,
        },
      ]);
    }
    const unsubscribe = subscribeCreateWithAi(() => setJob(getCreateWithAiJob()));
    return () => {
      unsubscribe();
      if (navTimer.current) window.clearTimeout(navTimer.current);
    };
  }, []);

  useEffect(() => {
    if (step === 'country' && !editingId) setCountryPick([]);
  }, [step, editingId]);

  useEffect(() => {
    const node = threadRef.current;
    if (!node) return;
    const frame = requestAnimationFrame(() => {
      const target =
        node.querySelector('.create-agent-row.has-summary') ??
        node.querySelector('.create-agent-row.has-selected-recent');
      if (target instanceof HTMLElement) {
        const threadBox = node.getBoundingClientRect();
        const targetBox = target.getBoundingClientRect();
        node.scrollTop += targetBox.top - threadBox.top - 8;
        return;
      }
      node.scrollTop = node.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, job?.stageIndex, editingId, chatExpanded]);

  useEffect(() => {
    if (step !== 'working' || !job) return;
    if (job.status === 'running') {
      setMessages((prev) => {
        const hasStages = prev.some((message) => message.stages);
        if (hasStages) return prev;
        return [
          ...prev,
          {
            id: nextId('agent'),
            role: 'agent',
            text: analysisSummary(draft),
            stages: true,
          },
        ];
      });
      return;
    }
    if (job.view === 'complete' && job.result) {
      if (handedOff.current) return;
      handedOff.current = true;
      setMessages((prev) => [
        ...prev.map((message) => (message.stages ? { ...message, stages: false } : message)),
        {
          id: nextId('agent'),
          role: 'agent',
          text: 'Your audience is ready. Opening Create project with the applied settings.',
        },
      ]);
      setStep('done');
      if (!navTimer.current) {
        navTimer.current = window.setTimeout(() => {
          handOffCreateWithAi();
          router.push('/projects/create?fromAi=1');
        }, 600);
      }
      return;
    }
    if (job.view === 'failed') {
      setStep('done');
      setMessages((prev) => [
        ...prev.map((message) => (message.stages ? { ...message, stages: false } : message)),
        {
          id: nextId('agent'),
          role: 'agent',
          text: job.error ?? "We couldn't finish analyzing this survey.",
          options: [
            { id: 'retry', label: 'Retry analysis' },
            { id: 'skip', label: 'Skip guided creation' },
          ],
          optionLayout: 'chips',
        },
      ]);
    }
    if (job.view === 'no-criteria') {
      setStep('done');
      setMessages((prev) => [
        ...prev.map((message) => (message.stages ? { ...message, stages: false } : message)),
        {
          id: nextId('agent'),
          role: 'agent',
          text:
            job.noCriteriaMessage ??
            'AI could not find audience criteria that reliably match this survey.',
          options: [
            { id: 'retry', label: 'Try again' },
            { id: 'skip', label: 'Skip guided creation' },
          ],
          optionLayout: 'chips',
        },
      ]);
    }
  }, [draft, job, router, step]);

  const stageIndex = job?.status === 'running' ? job.stageIndex : AI_STAGES.length;

  const placeholder = useMemo(() => {
    if (step === 'intake' && !editingField) return AGENT_COPY.composerIntake;
    if (editingField === 'responses' || askStep === 'responses') return 'Type a number, or pick an option above';
    if (editingField === 'country' || askStep === 'country') return 'Type countries, or use the dropdown above';
    if (editingField === 'survey' || askStep === 'survey') return 'Type a survey name, or pick an option above';
    if (editingField === 'dueDate' || askStep === 'dueDate') return 'Type a date, pick a suggestion, or use the date picker';
    if (step === 'confirm') return 'Share anything else, or confirm to create the project';
    return AGENT_COPY.composerIntake;
  }, [askStep, editingField, step]);

  function disableLastOptions(list: AgentMessage[]): AgentMessage[] {
    const next = [...list];
    for (let index = next.length - 1; index >= 0; index -= 1) {
      if (next[index].options?.length || next[index].control) {
        next[index] = { ...next[index], optionsDisabled: true };
        break;
      }
    }
    return next;
  }

  function applyRecentTemplate(template: RecentProjectTemplate) {
    if (busy) return;
    const nextDraft = draftFromRecentTemplate(template);
    setDraft(nextDraft);
    setEditingId(null);
    setCountryPick([]);
    setMessages((prev) => [
      ...disableLastOptions(prev),
      {
        id: nextId('user'),
        role: 'user',
        text: template.name,
        kind: 'selected-recent',
        recent: template,
      },
      {
        id: nextId('user'),
        role: 'user',
        text: labelForDraftField('responses', nextDraft),
        field: 'responses',
        embedInRecent: true,
      },
      {
        id: nextId('user'),
        role: 'user',
        text: labelForDraftField('country', nextDraft),
        field: 'country',
        embedInRecent: true,
      },
      {
        id: nextId('user'),
        role: 'user',
        text: labelForDraftField('dueDate', nextDraft),
        field: 'dueDate',
        embedInRecent: true,
      },
      questionMessage('survey'),
    ]);
    setStep('survey');
  }

  function beginAnalysis(nextDraft: GuidedDraft) {
    if (!nextDraft.surveyId || nextDraft.responses == null || !nextDraft.countryCodes?.length || !nextDraft.dueDate) {
      return;
    }
    setEditingId(null);
    setStep('working');
    startCreateWithAi({
      surveyId: nextDraft.surveyId,
      responses: nextDraft.responses,
      countryCodes: nextDraft.countryCodes,
      dueDate: nextDraft.dueDate,
    });
  }

  function beginCreate() {
    setMessages((prev) => disableLastOptions(prev));
    beginAnalysis(draft);
  }

  function continueFromDraft(nextDraft: GuidedDraft, userText: string, field?: GuidedField) {
    const remaining = remainingGuidedStep(nextDraft);
    setDraft(nextDraft);
    setEditingId(null);
    setMessages((prev) => {
      const withUser = [
        ...disableLastOptions(prev),
        { id: nextId('user'), role: 'user' as const, text: userText, field },
      ];
      if (remaining === 'ready') {
        return [...withUser, confirmMessage(nextDraft)];
      }
      if (!field) {
        return [...withUser, { ...questionMessage(remaining), text: requestMissingCopy(nextDraft) }];
      }
      if (remaining === remainingGuidedStep(draft) && draftsEqual(nextDraft, draft)) {
        return [
          ...withUser,
          { id: nextId('agent'), role: 'agent', text: AGENT_COPY.unclear },
          questionMessage(remaining),
        ];
      }
      return [...withUser, questionMessage(remaining)];
    });
    if (remaining === 'ready') {
      setStep('confirm');
      return;
    }
    setStep(remaining);
  }

  function commitEdit(field: GuidedField, nextDraft: GuidedDraft, userText: string) {
    const targetId = editingId;
    setDraft(nextDraft);
    setEditingId(null);
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id === targetId) return { ...message, text: userText };
        if (message.kind === 'summary') {
          return {
            ...message,
            text: `${reviewDetails(nextDraft)}\n\n${AGENT_COPY.confirm}`,
          };
        }
        return message;
      }),
    );
  }

  function handleSkip() {
    clearCreateWithAi();
    router.push('/projects/create');
  }

  function startEdit(message: AgentMessage) {
    if (!message.field || busy) return;
    setEditingId(message.id);
    setCountryPick(message.field === 'country' ? (draft.countryCodes ?? []) : []);
  }

  function cancelEdit() {
    setEditingId(null);
    setCountryPick(step === 'country' ? [] : (draft.countryCodes ?? []));
  }

  function confirmCountries() {
    if (countryPick.length === 0) return;
    const nextDraft = { ...draft, countryCodes: countryPick };
    const text = countryListLabel(countryPick, true);
    if (editingId) {
      commitEdit('country', nextDraft, text);
      return;
    }
    continueFromDraft(nextDraft, text, 'country');
  }

  function applyFieldValue(field: GuidedField, nextDraft: GuidedDraft, userText: string) {
    if (editingId) {
      commitEdit(field, nextDraft, userText);
      return;
    }
    continueFromDraft(nextDraft, userText, field);
  }

  function handleOption(option: GuidedOption, field?: GuidedField) {
    if (option.id === 'retry') {
      handedOff.current = false;
      setStep('working');
      setMessages((prev) => [
        ...disableLastOptions(prev),
        { id: nextId('user'), role: 'user', text: option.label },
        {
          id: nextId('agent'),
          role: 'agent',
          text: analysisSummary(draft),
          stages: true,
        },
      ]);
      retryCreateWithAi();
      return;
    }
    if (option.id === 'skip') {
      handleSkip();
      return;
    }
    if (option.id === 'continue') {
      beginCreate();
      return;
    }
    if (option.id === 'more') {
      setMessages((prev) => [
        ...disableLastOptions(prev),
        { id: nextId('user'), role: 'user', text: option.label },
        { id: nextId('agent'), role: 'agent', text: AGENT_COPY.more },
      ]);
      return;
    }
    const targetField = field ?? askStep;
    if (!targetField || targetField === 'country') return;
    const nextDraft = applyGuidedOption(draft, targetField, option.id);
    applyFieldValue(targetField, nextDraft, option.label);
  }

  function handleDate(date: Date | undefined) {
    if (!date) return;
    const min = minGuidedDueDate();
    const picked = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (picked < min) return;
    const iso = toIsoDate(picked);
    const nextDraft = { ...draft, dueDate: iso };
    applyFieldValue('dueDate', nextDraft, labelForDraftField('dueDate', nextDraft));
  }

  function handleSend() {
    const text = input.trim();
    if (composerDisabled) return;
    if (!text && !(countryComposerActive && countryPick.length > 0)) return;
    if (countryComposerActive && countryPick.length > 0) {
      confirmCountries();
      setInput('');
      return;
    }
    if (!text) return;
    if (job?.view === 'failed' || job?.view === 'no-criteria') {
      const lower = text.toLowerCase();
      if (lower.includes('retry') || lower.includes('try again')) {
        handleOption({ id: 'retry', label: text });
        setInput('');
        return;
      }
      if (lower.includes('skip')) {
        handleSkip();
        return;
      }
    }
    if (step === 'confirm' && !editingId) {
      setInput('');
      if (isConfirmReply(text)) {
        beginCreate();
        return;
      }
      setMessages((prev) => [
        ...disableLastOptions(prev),
        { id: nextId('user'), role: 'user', text },
        { id: nextId('agent'), role: 'agent', text: AGENT_COPY.noted },
      ]);
      return;
    }
    const field = editingField ?? askStep;
    if (!field && step !== 'intake') return;
    const nextDraft = applyGuidedText(draft, text, editingField ?? undefined);
    setInput('');
    if (!field) {
      continueFromDraft(nextDraft, text);
      return;
    }
    if (draftsEqual(nextDraft, draft)) {
      if (editingId) return;
      continueFromDraft(nextDraft, text, field);
      return;
    }
    applyFieldValue(field, nextDraft, editingId ? labelForDraftField(field, nextDraft) : text);
  }

  const selectedCountryOptions = COUNTRY_SELECT_OPTIONS.filter((country) =>
    countryPick.includes(country.value),
  );
  const selectedCountryDefs = countryPick
    .map((code) => MULTI_COUNTRY_CATALOG.find((country) => country.value === code))
    .filter((country): country is NonNullable<typeof country> => Boolean(country));
  const countrySelectTrigger = (
    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left text-xs">
      {selectedCountryDefs.length === 0
        ? 'Select countries'
        : selectedCountryDefs.map((country, index) => (
            <span key={country.value}>
              {index > 0 ? ', ' : ''}
              {country.flag} {country.label}
            </span>
          ))}
    </span>
  );

  function renderCountrySelect(confirmLabel: string) {
    return (
      <div className="create-agent-country">
        <WuSelect
          multiple
          data={COUNTRY_SELECT_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selectedCountryOptions}
          onSelect={(value) => {
            const items = (Array.isArray(value) ? value : value ? [value] : []) as CountrySelectOption[];
            const codes = items
              .map((item) => (typeof item === 'string' ? item : item?.value))
              .filter((code): code is string => Boolean(code));
            window.queueMicrotask(() => setCountryPick(codes));
          }}
          variant="outlined"
          className="create-agent-country-select"
          maxContentWidth="18rem"
          selectAll={{ enable: true }}
          CustomTrigger={countrySelectTrigger}
          aria-label="Target countries"
        />
        <WuButton size="sm" disabled={countryPick.length === 0} onClick={confirmCountries}>
          {confirmLabel}
        </WuButton>
      </div>
    );
  }

  function renderDatePicker() {
    const currentIso = editingField === 'dueDate' ? draft.dueDate : undefined;
    return (
      <div className="create-agent-datepicker">
        <WuDatePicker
          variant="outlined"
          value={currentIso ? isoToDate(currentIso) : undefined}
          onChange={handleDate}
          minDate={minDate}
          aria-label="Completion date"
          slotProps={{
            positioner: {
              className: 'z-[80]',
              style: { zIndex: 80, pointerEvents: 'auto' },
            },
          }}
        />
      </div>
    );
  }

  function renderFieldControls(field: GuidedField, confirmLabel: string) {
    if (field === 'country') return renderCountrySelect(confirmLabel);
    const options = optionsForStep(field);
    const layout = optionLayoutForStep(field);
    return (
      <div className={layout === 'chips' ? 'create-agent-options is-chips' : 'create-agent-options is-list'}>
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={layout === 'chips' ? 'create-agent-chip' : 'create-agent-choice'}
            onClick={() => handleOption(option, field)}
          >
            {layout === 'list' ? <span className="create-agent-choice-dot" aria-hidden="true" /> : null}
            <span>{option.label}</span>
          </button>
        ))}
        {field === 'dueDate' ? renderDatePicker() : null}
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="flex min-h-[320px] items-center justify-center p-6">
        <EmptyState
          icon="wm-lock"
          title="You can't create Specialized sample projects"
          description="Ask the primary user if you need project creation access."
        />
      </div>
    );
  }

  return (
    <div className={chatExpanded ? 'create-agent-page is-expanded' : 'create-agent-page'}>
      <Link href="/projects" className="create-agent-back">
        ← Back to Specialized sample
      </Link>
      <div className="create-agent-intro">
        <div className="create-agent-title">
          <AiIcon />
          <WuHeading size="lg">Create project</WuHeading>
        </div>
        <div className="mt-2 max-w-[36rem]">
          <WuSubtext size="sm">
            Describe what you want to field. Share your requirements like number of responses,
            country, due date and the survey.
          </WuSubtext>
        </div>
      </div>

      <div className={chatExpanded ? 'create-agent-card is-expanded' : 'create-agent-card'}>
        <div ref={threadRef} className="create-agent-thread" aria-live="polite">
          {messages.map((message) => {
            if (message.embedInRecent) return null;
            const isEditing = message.id === editingId;
            const canEdit =
              message.role === 'user' &&
              Boolean(message.field) &&
              !busy &&
              !isEditing &&
              editingId === null &&
              message.kind !== 'selected-recent';
            const selectedDisplay: RecentProjectTemplate | null =
              message.kind === 'selected-recent' && message.recent
                ? {
                    ...message.recent,
                    responses: draft.responses ?? message.recent.responses,
                    countryCodes: draft.countryCodes ?? message.recent.countryCodes,
                    dueDate: draft.dueDate ?? message.recent.dueDate,
                  }
                : null;
            const editingEmbedded =
              message.kind === 'selected-recent'
                ? messages.find((item) => item.embedInRecent && item.id === editingId)
                : undefined;
            return (
              <div
                key={message.id}
                className={[
                  message.role === 'user' ? 'create-agent-row is-user' : 'create-agent-row is-agent',
                  message.kind === 'selected-recent' ? 'has-selected-recent' : '',
                  message.kind === 'summary' ? 'has-summary' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {message.role === 'agent' ? (
                  <span className="create-agent-avatar" aria-hidden="true">
                    <AiIcon />
                  </span>
                ) : null}
                <div className="create-agent-bubble-wrap">
                  {selectedDisplay ? (
                    <RecentProjectCard
                      template={selectedDisplay}
                      selected
                      onEditField={
                        busy
                          ? undefined
                          : (field) => {
                              const target = messages.find(
                                (item) => item.embedInRecent && item.field === field,
                              );
                              if (target) startEdit(target);
                            }
                      }
                    />
                  ) : (
                    <div className={message.role === 'user' ? 'create-agent-user-line' : undefined}>
                      <div className={message.role === 'user' ? 'create-agent-bubble is-user' : 'create-agent-bubble'}>
                        {message.text}
                      </div>
                      {canEdit ? (
                        <button
                          type="button"
                          className="create-agent-edit"
                          aria-label="Edit answer"
                          onClick={() => startEdit(message)}
                        >
                          <span className="wm-edit" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  )}
                  {(isEditing && message.field) || editingEmbedded?.field ? (
                    <div className="create-agent-edit-panel">
                      {renderFieldControls((editingEmbedded?.field ?? message.field) as GuidedField, 'Save')}
                      <WuButton variant="link" size="sm" onClick={cancelEdit}>
                        Cancel
                      </WuButton>
                    </div>
                  ) : null}
                  {message.stages ? (
                    <ol className="create-agent-stages">
                      {AI_STAGES.map((stage, index) => {
                        const state =
                          index < stageIndex ? 'is-done' : index === stageIndex ? 'is-current' : '';
                        return (
                          <li key={stage.id} className={state}>
                            {stage.title}
                          </li>
                        );
                      })}
                    </ol>
                  ) : null}
                  {!message.optionsDisabled && message.control === 'country' && !isEditing ? (
                    renderCountrySelect('Continue')
                  ) : null}
                  {message.options?.length && !message.optionsDisabled && !isEditing ? (
                    <div
                      className={
                        message.optionLayout === 'chips'
                          ? 'create-agent-options is-chips'
                          : 'create-agent-options is-list'
                      }
                    >
                      {message.options.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={
                            message.optionLayout === 'chips'
                              ? 'create-agent-chip'
                              : 'create-agent-choice'
                          }
                          disabled={busy && option.id !== 'retry' && option.id !== 'skip'}
                          onClick={() => handleOption(option, message.field)}
                        >
                          {message.optionLayout === 'list' ? (
                            <span className="create-agent-choice-dot" aria-hidden="true" />
                          ) : null}
                          <span>{option.label}</span>
                        </button>
                      ))}
                      {message.control === 'date' ? renderDatePicker() : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="create-agent-composer-row">
          <div className="create-agent-composer">
            {countryComposerActive && selectedCountryDefs.length > 0 ? (
              <div className="create-agent-composer-chips">
                {selectedCountryDefs.map((country) => (
                  <span key={country.value} className="create-agent-composer-chip">
                    <span className="create-agent-composer-chip-label">
                      <span aria-hidden="true">{country.flag}</span> {country.label}
                    </span>
                    <button
                      type="button"
                      className="create-agent-composer-chip-remove"
                      aria-label={`Remove ${country.label}`}
                      onClick={() =>
                        setCountryPick((current) => current.filter((code) => code !== country.value))
                      }
                    >
                      <span className="wm-close" aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
            <WuTextarea
              variant="flat"
              rows={3}
              value={input}
              disabled={composerDisabled}
              placeholder={placeholder}
              aria-label="Describe the project to create"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <button
              type="button"
              className="create-agent-send"
              aria-label="Send"
              disabled={
                composerDisabled ||
                (!input.trim() && !(countryComposerActive && countryPick.length > 0))
              }
              onClick={handleSend}
            >
              <span className="wm-send" aria-hidden="true" />
            </button>
          </div>
          <div className="create-agent-create">
            <WuButton
              size="sm"
              Icon={<AiIcon />}
              iconPosition="left"
              disabled={composerDisabled || step !== 'confirm'}
              aria-label="Create"
              onClick={beginCreate}
            >
              Create
            </WuButton>
          </div>
        </div>
      </div>

      <div className="create-agent-skip">
        <WuButton variant="link" onClick={handleSkip}>
          Skip guided creation
        </WuButton>
      </div>

      {showRecentCards ? (
        <div className="create-agent-recents-wrap">
          <p className="create-agent-recents-heading">{AGENT_COPY.recents}</p>
          <div className="create-agent-recents">
            {recentProjectTemplates().map((template) => (
              <RecentProjectCard
                key={template.id}
                template={template}
                onSelect={() => applyRecentTemplate(template)}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
