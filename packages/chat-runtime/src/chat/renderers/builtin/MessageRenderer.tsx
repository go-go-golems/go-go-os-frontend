import { type MouseEvent, useMemo } from 'react';
import {
  useDesktopWindowId,
  useOpenDesktopContextMenu,
} from '@hypercard/engine/desktop-react';
import type { RenderContext, RenderEntity } from '../types';
import { useRegisterMessageContextActions } from '../../runtime/contextActions';

function StreamingCursor() {
  return (
    <span
      data-part="chat-window-cursor"
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

function ThinkingDots() {
  return (
    <div data-part="chat-window-thinking">
      <span style={{ animation: 'hc-pulse 1.5s ease-in-out infinite' }}>Thinking…</span>
    </div>
  );
}

function roleLabel(role: string) {
  if (role === 'user') return 'You:';
  if (role === 'system') return 'System:';
  if (role === 'thinking') return 'AI Thinking:';
  return 'AI:';
}

export function MessageRenderer({ e, ctx }: { e: RenderEntity; ctx?: RenderContext }) {
  const role = String(e.props.role ?? 'assistant');
  const content = String(e.props.content ?? '');
  const streaming = e.props.streaming === true;
  const convId = String(ctx?.convId ?? '').trim();
  const windowId = useDesktopWindowId();
  const openContextMenu = useOpenDesktopContextMenu();

  const messageContextActions = useMemo(() => {
    if (!convId) {
      return [];
    }

    const payload = {
      conversationId: convId,
      messageId: e.id,
      role,
      content,
    };

    return [
      { id: `chat-message.reply.${e.id}`, label: 'Reply', commandId: 'chat.message.reply', payload },
      { id: `chat-message.copy.${e.id}`, label: 'Copy', commandId: 'clipboard.copy-text', payload: { ...payload, text: content } },
      { id: `chat-message.create-task.${e.id}`, label: 'Create Task', commandId: 'chat.message.create-task', payload },
      { id: `chat-message.debug-event.${e.id}`, label: 'Debug Event', commandId: 'chat.message.debug-event', payload },
    ];
  }, [content, convId, e.id, role]);

  useRegisterMessageContextActions(convId, e.id, messageContextActions);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (!convId || !openContextMenu) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      menuId: 'message-context',
      target: {
        kind: 'chat.message',
        conversationId: convId,
        messageId: e.id,
        windowId: windowId ?? undefined,
      },
    });
  };

  if (streaming && content.length === 0) {
    return (
      <div data-part="chat-message" data-role={role} onContextMenu={handleContextMenu}>
        <div data-part="chat-role">{roleLabel(role)}</div>
        <ThinkingDots />
      </div>
    );
  }

  return (
    <div data-part="chat-message" data-role={role} onContextMenu={handleContextMenu}>
      <div data-part="chat-role">{roleLabel(role)}</div>
      <div style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
        {content}
        {streaming && content.length > 0 && <StreamingCursor />}
      </div>
    </div>
  );
}
