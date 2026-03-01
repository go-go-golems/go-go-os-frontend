import { type ReactNode, useState } from 'react';
import type { ChatMessage } from './types';
import { StreamingChatView } from './StreamingChatView';

export interface ChatSidebarProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSend: (text: string) => void;
  onCancel?: () => void;
  onAction?: (action: unknown) => void;
  suggestions?: string[];
  title?: string;
  placeholder?: string;
  /** Additional content to render below the chat (e.g., model info) */
  footer?: ReactNode;
}

/**
 * A sidebar panel wrapping StreamingChatView with collapse/expand.
 * Designed for use as a desktop companion panel.
 */
export function ChatSidebar({
  messages,
  isStreaming,
  onSend,
  onCancel,
  onAction,
  suggestions,
  title = 'AI Assistant',
  placeholder,
  footer,
}: ChatSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside
        style={{
          width: 44,
          height: '100%',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 8,
          borderLeft: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <button type="button" onClick={() => setCollapsed(false)} title="Open chat">
          💬
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 'var(--hc-chat-sidebar-width, 340px)',
        maxWidth: '48vw',
        minWidth: 280,
        height: '100%',
        borderLeft: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--hc-color-ai-bg, #fafbfc)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          flexShrink: 0,
        }}
      >
        <strong style={{ fontSize: 12 }}>💬 {title}</strong>
        <span style={{ fontSize: 10, opacity: 0.6 }}>
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <button type="button" onClick={() => setCollapsed(true)} title="Collapse chat">
            ◀
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <StreamingChatView
          messages={messages}
          isStreaming={isStreaming}
          suggestions={suggestions}
          onSend={onSend}
          onCancel={onCancel}
          onAction={onAction}
          placeholder={placeholder}
        />
      </div>

      {footer && (
        <div
          style={{
            borderTop: '1px solid rgba(0,0,0,0.08)',
            padding: '4px 10px',
            fontSize: 10,
            opacity: 0.6,
            flexShrink: 0,
          }}
        >
          {footer}
        </div>
      )}
    </aside>
  );
}
