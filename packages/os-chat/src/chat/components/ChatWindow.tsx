import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import { Btn, Chip } from '@go-go-golems/os-core';

export interface ChatWindowProps {
  timelineContent: ReactNode;
  timelineItemCount?: number;
  conversationTotalTokens?: number;
  isStreaming: boolean;
  showPendingResponseSpinner?: boolean;
  onSend: (text: string) => Promise<void> | void;
  onCancel?: () => void;
  suggestions?: string[];
  showSuggestionsAlways?: boolean;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  welcomeContent?: ReactNode;
  footer?: ReactNode;
  headerActions?: ReactNode;
  onTimelineContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}

function WelcomeScreen({ children }: { children?: ReactNode }) {
  return (
    <div data-part="chat-window-welcome">
      {children ?? (
        <>
          <div data-part="chat-window-welcome-icon">💬</div>
          <div data-part="chat-window-welcome-title">How can I help?</div>
          <div data-part="chat-window-welcome-hint">
            Ask a question, request data, or try one of the suggestions below.
          </div>
        </>
      )}
    </div>
  );
}

export function ChatWindow({
  timelineContent,
  timelineItemCount = 0,
  conversationTotalTokens = 0,
  isStreaming,
  showPendingResponseSpinner = false,
  onSend,
  onCancel,
  suggestions,
  showSuggestionsAlways = false,
  title = 'Chat',
  subtitle,
  placeholder,
  welcomeContent,
  footer,
  headerActions,
  onTimelineContextMenu,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isAwaitingResponse = showPendingResponseSpinner;
  const isSendLocked = isStreaming || isSubmitting || isAwaitingResponse;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'instant' });
  });

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSendLocked) return;
    setSendError(null);
    setIsSubmitting(true);
    try {
      await onSend(trimmed);
      setInput('');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setSendError(message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  }

  const isEmpty = timelineItemCount === 0;

  return (
    <div data-part="chat-window">
      <div data-part="chat-window-header">
        <div data-part="chat-window-header-left">
          <span data-part="chat-window-title">💬 {title}</span>
          {subtitle && <span data-part="chat-window-subtitle">{subtitle}</span>}
        </div>
        <div data-part="chat-window-header-right">
          {headerActions}
          <span data-part="chat-window-msg-count">
            {timelineItemCount} message{timelineItemCount !== 1 ? 's' : ''}
          </span>
          <span data-part="chat-window-token-count">{conversationTotalTokens.toLocaleString('en-US')} tok</span>
          {isStreaming && onCancel && <Btn onClick={onCancel}>⏹ Stop</Btn>}
        </div>
      </div>

      <div data-part="chat-timeline" onContextMenu={onTimelineContextMenu}>
        {isEmpty && <WelcomeScreen>{welcomeContent}</WelcomeScreen>}
        {timelineContent}
        {showPendingResponseSpinner && (
          <div data-part="chat-message" data-role="assistant">
            <div data-part="chat-role">AI:</div>
            <div data-part="chat-window-thinking">
              <span style={{ animation: 'hc-pulse 1.2s ease-in-out infinite' }}>...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {suggestions &&
        suggestions.length > 0 &&
        (showSuggestionsAlways || ((isEmpty || timelineItemCount <= 1) && !isSendLocked)) && (
          <div data-part="chat-suggestions">
            {suggestions.map((suggestion) => (
              <Chip key={suggestion} onClick={() => send(suggestion)}>
                {suggestion}
              </Chip>
            ))}
          </div>
        )}

      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(event) => {
            if (sendError) setSendError(null);
            setInput(event.target.value);
          }}
          onKeyDown={(event) => event.key === 'Enter' && send(input)}
          placeholder={isSendLocked ? 'Waiting for response…' : (placeholder ?? 'Type a message…')}
          disabled={isSendLocked}
        />
        {isStreaming ? (
          onCancel ? (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          ) : null
        ) : (
          <Btn onClick={() => send(input)} disabled={isSendLocked}>
            {isSubmitting ? 'Sending…' : isAwaitingResponse ? 'Waiting…' : 'Send'}
          </Btn>
        )}
      </div>
      {sendError && <div data-part="chat-composer-error">{sendError}</div>}

      {footer && <div data-part="chat-window-footer">{footer}</div>}
    </div>
  );
}
