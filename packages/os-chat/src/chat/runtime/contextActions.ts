import { useMemo } from 'react';
import {
  useDesktopWindowId,
  useRegisterContextActions,
  type DesktopActionEntry,
  type DesktopContextTargetRef,
} from '@go-go-golems/os-core/desktop-react';

export function useRegisterConversationContextActions(
  conversationId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined,
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo<DesktopContextTargetRef | null>(() => {
    const normalizedConversationId = String(conversationId ?? '').trim();
    if (!normalizedConversationId) return null;
    return {
      kind: 'chat.conversation',
      conversationId: normalizedConversationId,
      windowId: windowId ?? undefined,
    };
  }, [conversationId, windowId]);
  useRegisterContextActions(target, actions);
}

export function useRegisterMessageContextActions(
  conversationId: string | null | undefined,
  messageId: string | null | undefined,
  actions: DesktopActionEntry[] | null | undefined,
): void {
  const windowId = useDesktopWindowId();
  const target = useMemo<DesktopContextTargetRef | null>(() => {
    const normalizedConversationId = String(conversationId ?? '').trim();
    const normalizedMessageId = String(messageId ?? '').trim();
    if (!normalizedConversationId || !normalizedMessageId) return null;
    return {
      kind: 'chat.message',
      conversationId: normalizedConversationId,
      messageId: normalizedMessageId,
      windowId: windowId ?? undefined,
    };
  }, [conversationId, messageId, windowId]);
  useRegisterContextActions(target, actions);
}
