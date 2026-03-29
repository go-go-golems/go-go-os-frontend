import { useState } from 'react';
import { PARTS } from '../../parts';
import { Btn } from './Btn';

export interface RequestActionBarProps {
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary: (comment?: string) => void;
  onSecondary?: (comment?: string) => void;
  commentEnabled?: boolean;
  commentPlaceholder?: string;
  commentValue?: string;
  onCommentChange?: (value: string) => void;
  busy?: boolean;
  primaryDisabled?: boolean;
  secondaryDisabled?: boolean;
}

export function RequestActionBar({
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  commentEnabled,
  commentPlaceholder,
  commentValue,
  onCommentChange,
  busy,
  primaryDisabled,
  secondaryDisabled,
}: RequestActionBarProps) {
  const [internalComment, setInternalComment] = useState('');
  const resolvedComment = commentValue ?? internalComment;

  const setComment = (value: string) => {
    onCommentChange?.(value);
    if (onCommentChange === undefined) {
      setInternalComment(value);
    }
  };

  return (
    <div data-part={PARTS.confirmActionBar}>
      {commentEnabled && (
        <textarea
          data-part={PARTS.fieldInput}
          value={resolvedComment}
          placeholder={commentPlaceholder ?? 'Optional comment'}
          onChange={(event) => setComment(event.target.value)}
          rows={3}
          disabled={busy}
        />
      )}
      <div data-part={PARTS.confirmActionButtons}>
        {onSecondary && (
          <Btn variant="default" onClick={() => onSecondary(resolvedComment)} disabled={busy || secondaryDisabled}>
            {secondaryLabel ?? 'Cancel'}
          </Btn>
        )}
        <Btn variant="primary" onClick={() => onPrimary(resolvedComment)} disabled={busy || primaryDisabled}>
          {busy ? 'Working...' : (primaryLabel ?? 'Confirm')}
        </Btn>
      </div>
    </div>
  );
}
