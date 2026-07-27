'use client';

import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  formatFileSize,
  type ApprovalAttachment,
} from '@/data/mock-org-panel-settings';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
);

const MAX_FILES = 5;
const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif';

export function ApprovalRequestNotes({
  comment,
  attachments,
  onCommentChange,
  onAttachmentsChange,
  readOnly = false,
}: {
  comment: string;
  attachments: ApprovalAttachment[];
  onCommentChange?: (value: string) => void;
  onAttachmentsChange?: (files: ApprovalAttachment[]) => void;
  readOnly?: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hovering, setHovering] = useState(false);

  const atLimit = attachments.length >= MAX_FILES;
  const uploadActive = dragging || hovering;

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || !onAttachmentsChange || atLimit) return;
    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) return;

    const next: ApprovalAttachment[] = [...attachments];
    Array.from(fileList)
      .slice(0, remaining)
      .forEach((file) => {
        next.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          sizeLabel: formatFileSize(file.size),
        });
      });
    onAttachmentsChange(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  }

  function removeAttachment(id: string) {
    onAttachmentsChange?.(attachments.filter((f) => f.id !== id));
  }

  if (readOnly && !comment.trim() && attachments.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-[#eef0f3] pt-5">
      <p className="mb-3 font-['Fira_Sans',sans-serif] text-[14px] font-normal text-[#1a2340]">
        Comment & supporting documents
      </p>

      {readOnly ? (
        <div className="space-y-4">
          {comment.trim() && (
            <div>
              <p className="mb-1 text-xs font-medium text-[#54606b]">Comment</p>
              <p className="whitespace-pre-wrap text-sm text-[#1a2340]">{comment}</p>
            </div>
          )}
          {attachments.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-[#54606b]">Supporting documents</p>
              <ul className="space-y-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-3 py-2"
                  >
                    <span className="wm-attach-file text-base text-[#54606b]" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[#1a2340]">{file.name}</span>
                    <span className="shrink-0 text-xs text-[#8c9baa]">{file.sizeLabel}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <WuTextarea
            Label="Comment"
            variant="outlined"
            labelPosition="top"
            placeholder="Add context for the Uber admin (optional)"
            value={comment}
            onChange={(e) => onCommentChange?.(e.target.value)}
            rows={4}
            className="w-full"
          />

          <div>
            <p className="mb-2 text-xs font-medium text-[#54606b]">Supporting documents</p>

            {/* WickUI Media Library upload pattern */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!atLimit) setDragging(true);
              }}
              onDragLeave={() => {
                setDragging(false);
                setHovering(false);
              }}
              onDrop={(e) => {
                if (atLimit) {
                  e.preventDefault();
                  setDragging(false);
                  return;
                }
                handleDrop(e);
              }}
              onClick={() => {
                if (!atLimit) fileInputRef.current?.click();
              }}
              onMouseEnter={() => {
                if (!atLimit) setHovering(true);
              }}
              onMouseLeave={() => setHovering(false)}
              role="button"
              tabIndex={atLimit ? -1 : 0}
              aria-disabled={atLimit}
              aria-label="Upload supporting documents"
              onKeyDown={(e) => {
                if (!atLimit && e.key === 'Enter') fileInputRef.current?.click();
              }}
              className={`flex w-full max-w-md flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed px-4 py-6 transition-colors ${
                atLimit
                  ? 'cursor-not-allowed border-[#e0e4e8] bg-[#f9fafb]'
                  : uploadActive
                    ? 'cursor-pointer border-[#1b87e6] bg-[#e8f0fe]'
                    : 'cursor-pointer border-[#d8d8d8] bg-white hover:border-[#1b87e6] hover:bg-[#f0f7ff]'
              }`}
            >
              <span
                className={`wm-cloud-upload text-[36px] ${
                  atLimit
                    ? 'text-[#c5ced6]'
                    : uploadActive
                      ? 'text-[#1b87e6]'
                      : 'text-[#8c9baa]'
                }`}
                aria-hidden="true"
              />
              <p
                className={`text-center text-[13px] font-medium ${
                  atLimit ? 'text-[#8c9baa]' : 'text-[#1a2340]'
                }`}
              >
                {atLimit ? 'Upload limit reached' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-center text-[11px] text-[#8c9baa]">
                Optional. Up to {MAX_FILES} files (PDF, Office, CSV, or images).
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                accept={ACCEPT}
                disabled={atLimit}
                onChange={(e) => handleFilesSelected(e.target.files)}
                aria-label="Upload supporting documents"
              />
            </div>

            {attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {attachments.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-2 rounded-md border border-[#e0e4e8] bg-[#f9fafb] px-3 py-2"
                  >
                    <span className="wm-attach-file text-base text-[#54606b]" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-[#1a2340]">{file.name}</span>
                    <span className="shrink-0 text-xs text-[#8c9baa]">{file.sizeLabel}</span>
                    <WuButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeAttachment(file.id)}
                      aria-label={`Remove ${file.name}`}
                    >
                      Remove
                    </WuButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
