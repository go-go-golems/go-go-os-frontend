import { useEffect, useRef, useState } from 'react';
import { Btn, Chip } from '@hypercard/engine';
import type { ChatMessage } from './types';

export interface StreamingChatViewProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  suggestions?: string[];
  onSend: (text: string) => void;
  onCancel?: () => void;
  onAction?: (action: unknown) => void;
  placeholder?: string;
  title?: string;
}

function StreamingCursor() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 14,
        background: 'var(--hc-color-link, #2e78ff)',
        marginLeft: 2,
        verticalAlign: 'text-bottom',
        animation: 'hc-blink 0.8s step-end infinite',
      }}
    />
  );
}

function ThinkingIndicator() {
  return (
    <div data-part="chat-message" data-role="ai">
      <div data-part="chat-role">AI:</div>
      <div
        style={{
          fontSize: 11,
          opacity: 0.7,
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ animation: 'hc-pulse 1.5s ease-in-out infinite' }}>Thinking…</span>
      </div>
    </div>
  );
}

export function StreamingChatView({
  messages,
  isStreaming,
  suggestions,
  onSend,
  onCancel,
  onAction,
  placeholder,
  title,
}: StreamingChatViewProps) {
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  function send(text: string) {
    if (!text.trim()) return;
    onSend(text.trim());
    setInput('');
  }

  const showThinking =
    isStreaming &&
    messages.length > 0 &&
    messages[messages.length - 1].status === 'streaming' &&
    messages[messages.length - 1].text === '';

  return (
    <div data-part="chat-view">
      {title && (
        <div
          data-part="chat-header"
          style={{
            padding: '6px 10px',
            borderBottom: '1px solid var(--hc-color-border, #ccc)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span>💬 {title}</span>
          {isStreaming && onCancel && <Btn onClick={onCancel}>Cancel</Btn>}
        </div>
      )}

      <div data-part="chat-timeline">
        {messages.map((m, i) => {
          // Skip rendering the streaming placeholder if we show ThinkingIndicator
          if (m.status === 'streaming' && m.text === '' && showThinking) {
            return <ThinkingIndicator key={m.id ?? i} />;
          }

          return (
            <div key={m.id ?? i} data-part="chat-message" data-role={m.role}>
              <div data-part="chat-role">{m.role === 'user' ? 'You:' : m.role === 'system' ? 'System:' : 'AI:'}</div>
              <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
                {m.text}
                {m.status === 'streaming' && m.text !== '' && <StreamingCursor />}
              </div>
              {m.status === 'error' && (
                <div style={{ fontSize: 10, color: 'var(--hc-color-danger, #c00)', marginTop: 2 }}>⚠️ Error</div>
              )}
              {m.results && m.results.length > 0 && (
                <div style={{ marginTop: 3, fontSize: 10, opacity: 0.8 }}>{m.results.length} result(s)</div>
              )}
              {m.actions && m.status !== 'streaming' && (
                <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {m.actions.map((a, j) => (
                    <Chip key={j} onClick={() => onAction?.(a.action)}>
                      {a.label}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && suggestions && !isStreaming && (
        <div data-part="chat-suggestions">
          {suggestions.map((s) => (
            <Chip key={s} onClick={() => send(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}

      <div data-part="chat-composer">
        <input
          data-part="field-input"
          style={{ flex: 1 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isStreaming && send(input)}
          placeholder={isStreaming ? 'Waiting for response…' : (placeholder ?? 'Type a message…')}
          disabled={isStreaming}
        />
        {isStreaming ? (
          onCancel ? (
            <Btn onClick={onCancel}>⏹ Stop</Btn>
          ) : null
        ) : (
          <Btn onClick={() => send(input)}>Send</Btn>
        )}
      </div>
    </div>
  );
}
