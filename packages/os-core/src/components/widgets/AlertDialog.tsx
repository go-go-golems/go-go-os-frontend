import { useId } from 'react';
import { PARTS } from '../../parts';
import { Btn } from './Btn';

export type AlertDialogType = 'stop' | 'caution' | 'note';

export interface AlertDialogAction {
  label: string;
  onClick: () => void;
  isDefault?: boolean;
}

export interface AlertDialogProps {
  type: AlertDialogType;
  message: string;
  onOK?: () => void;
  actions?: AlertDialogAction[];
}

const ICONS: Record<AlertDialogType, string> = {
  stop: '✋',
  caution: '⚠️',
  note: '🖥️',
};

export function AlertDialog({ type, message, onOK, actions }: AlertDialogProps) {
  const rawId = useId();
  const messageId = `alert-msg-${rawId.replace(/:/g, '')}`;
  const resolvedActions: AlertDialogAction[] =
    actions && actions.length > 0 ? actions : [{ label: 'OK', onClick: onOK ?? (() => {}), isDefault: true }];

  return (
    <div
      data-part={PARTS.alertDialog}
      data-variant={type}
      role="alertdialog"
      aria-modal="true"
      aria-describedby={messageId}
    >
      <div>
        <div data-part={PARTS.alertDialogIcon}>{ICONS[type]}</div>
        <div>
          <div id={messageId} data-part={PARTS.alertDialogMessage}>
            {message}
          </div>
          <div style={{ textAlign: 'right', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {resolvedActions.map((a) => (
              <Btn key={a.label} isDefault={a.isDefault} onClick={a.onClick}>
                {a.label}
              </Btn>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
