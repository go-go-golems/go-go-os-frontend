import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Btn, Chip } from '@go-go-golems/os-core';
import type { ChatMessage } from './types';

export interface ChatViewProps {
  messages: ChatMessage[];
  suggestions?: string[];
  onSend: (text: string) => void;
  onAction: (action: unknown) => void;
  renderResults?: (results: unknown[]) => ReactNode;
  placeholder?: string;
}

export function ChatView({ messages, suggestions, onSend, onAction, renderResults, placeholder }: ChatViewProps) {
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

  return (
    <div data-part="chat-view">
      <div data-part="chat-timeline">
        {messages.map((m, i) => (
          <div key={i} data-part="chat-message" data-role={m.role}>
            <div data-part="chat-role">{m.role === 'user' ? 'You:' : 'AI:'}</div>
            <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>{m.text}</div>
            {m.results && m.results.length > 0 && renderResults && (
              <div style={{ marginTop: 3 }}>{renderResults(m.results)}</div>
            )}
            {m.actions && (
              <div style={{ marginTop: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {m.actions.map((a, j) => (
                  <Chip key={j} onClick={() => onAction(a.action)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {messages.length <= 1 && suggestions && (
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
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
          placeholder={placeholder ?? 'Type a message…'}
        />
        <Btn onClick={() => send(input)}>Send</Btn>
      </div>
    </div>
  );
}
