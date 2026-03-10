import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import {
  useDesktopWindowId,
  useOpenDesktopContextMenu,
  type DesktopActionEntry,
} from '@hypercard/engine/desktop-react';
import {
  getTimelineRendererRegistryVersion,
  resolveTimelineRenderers,
  subscribeTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity, RenderMode } from '../renderers/types';
import type { ChatWidgetRenderers } from '../renderers/types';
import {
  type ChatStateSlice,
  selectCurrentTurnStats,
  selectConversationTotalTokens,
  selectModelName,
  selectRenderableTimelineEntities,
  selectShouldShowPendingAiPlaceholder,
  selectTimelineEntityById,
  selectStreamOutputTokens,
  selectStreamStartTime,
  selectSuggestions,
} from '../state/selectors';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
  normalizeSuggestionList,
} from '../state/suggestions';
import { chatWindowSlice } from '../state/chatWindowSlice';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { useRegisterConversationContextActions } from '../runtime/contextActions';
import { ChatWindow } from './ChatWindow';
import { StatsFooter } from './StatsFooter';
import type { ChatProfilePolicy } from '../runtime/profileTypes';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  profilePolicy?: ChatProfilePolicy;
  starterSuggestions?: string[];
  windowId?: string;
  renderMode?: RenderMode;
  timelineRenderers?: Partial<ChatWidgetRenderers>;
  conversationContextActions?: DesktopActionEntry[];
}

function toRenderEntity(entity: {
  id: string;
  kind: string;
  createdAt: number;
  updatedAt?: number;
  props: unknown;
}): RenderEntity {
  return {
    id: entity.id,
    kind: entity.kind,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    props: isRecord(entity.props) ? entity.props : {},
  };
}

function resolveWindowStateKey(windowId: string | undefined, convId: string): string {
  const normalizedWindowId = String(windowId ?? '').trim();
  if (normalizedWindowId) {
    return normalizedWindowId;
  }
  return `chat:conv:${String(convId ?? '').trim()}`;
}

export function ChatConversationWindow({
  convId,
  basePrefix = '',
  title = 'Chat',
  placeholder,
  headerActions,
  profilePolicy,
  starterSuggestions,
  windowId,
  renderMode = 'normal',
  timelineRenderers,
  conversationContextActions,
}: ChatConversationWindowProps) {
  const dispatch = useDispatch();
  const resolvedWindowId = useMemo(() => resolveWindowStateKey(windowId, convId), [convId, windowId]);
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix, profilePolicy);
  const runtimeWindowId = useDesktopWindowId();
  const openContextMenu = useOpenDesktopContextMenu();
  const normalizedStarterSuggestions = useMemo(
    () => normalizeSuggestionList(starterSuggestions ?? []),
    [starterSuggestions],
  );

  const entities = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectRenderableTimelineEntities(state, convId)
  , shallowEqual);
  const starterSuggestionsEntity = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectTimelineEntityById(state, convId, STARTER_SUGGESTIONS_ENTITY_ID)
  );
  const suggestions = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectSuggestions(state, convId)
  , shallowEqual);
  const modelName = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectModelName(state, convId)
  );
  const turnStats = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectCurrentTurnStats(state, convId)
  );
  const streamStartTime = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamStartTime(state, convId)
  );
  const streamOutputTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectStreamOutputTokens(state, convId)
  );
  const conversationTotalTokens = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectConversationTotalTokens(state, convId)
  );
  const showPendingResponseSpinner = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectShouldShowPendingAiPlaceholder(state, resolvedWindowId, convId)
  );
  useRegisterConversationContextActions(convId, conversationContextActions);

  useEffect(() => {
    if (entities.length > 0) {
      return;
    }
    if (readSuggestionsEntityProps(starterSuggestionsEntity)) {
      return;
    }
    if (normalizedStarterSuggestions.length === 0) {
      return;
    }
    dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId,
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        source: 'starter',
        suggestions: normalizedStarterSuggestions,
        replace: true,
      })
    );
  }, [convId, dispatch, entities.length, normalizedStarterSuggestions, starterSuggestionsEntity]);

  useEffect(() => {
    dispatch(
      chatWindowSlice.actions.setWindowConversation({
        windowId: resolvedWindowId,
        convId,
      })
    );
    return () => {
      dispatch(
        chatWindowSlice.actions.clearWindowState({
          windowId: resolvedWindowId,
        })
      );
    };
  }, [convId, dispatch, resolvedWindowId]);

  const sendWithSuggestionLifecycle = useCallback(
    async (prompt: string) => {
      dispatch(
        chatWindowSlice.actions.beginAwaitingAi({
          windowId: resolvedWindowId,
          convId,
          baselineIndex: entities.length,
        })
      );
      if (normalizedStarterSuggestions.length > 0) {
        dispatch(
          timelineSlice.actions.upsertSuggestions({
            convId,
            entityId: STARTER_SUGGESTIONS_ENTITY_ID,
            source: 'starter',
            suggestions: normalizedStarterSuggestions,
            replace: true,
          })
        );
        dispatch(
          timelineSlice.actions.consumeSuggestions({
            convId,
            entityId: STARTER_SUGGESTIONS_ENTITY_ID,
          })
        );
      }
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: ASSISTANT_SUGGESTIONS_ENTITY_ID,
        })
      );
      try {
        await send(prompt);
      } catch (error) {
        dispatch(
          chatWindowSlice.actions.clearAwaitingAi({
            windowId: resolvedWindowId,
          })
        );
        throw error;
      }
    },
    [convId, dispatch, entities.length, normalizedStarterSuggestions, resolvedWindowId, send]
  );

  const rendererRegistryVersion = useSyncExternalStore(
    subscribeTimelineRenderers,
    getTimelineRendererRegistryVersion,
    getTimelineRendererRegistryVersion
  );
  const renderers = useMemo(
    () => resolveTimelineRenderers(timelineRenderers),
    [rendererRegistryVersion, timelineRenderers]
  );

  const timelineContent = useMemo(
    () =>
      entities.map((entity) => {
        const renderEntity = toRenderEntity(entity);
        const Renderer = renderers[renderEntity.kind] ?? renderers.default;
        return <Renderer key={renderEntity.id} e={renderEntity} ctx={{ mode: renderMode, convId }} />;
      }),
    [convId, entities, renderMode, renderers]
  );

  const subtitle =
    connectionStatus === 'connected'
      ? 'connected'
      : connectionStatus === 'connecting'
        ? 'connecting…'
        : connectionStatus;

  const handleTimelineContextMenu = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!openContextMenu || !conversationContextActions || conversationContextActions.length === 0) {
        return;
      }
      const eventTarget = event.target as HTMLElement | null;
      if (eventTarget?.closest('[data-part="chat-message"]')) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      openContextMenu({
        x: event.clientX,
        y: event.clientY,
        menuId: 'conversation-context',
        target: {
          kind: 'chat.conversation',
          conversationId: convId,
          windowId: runtimeWindowId ?? undefined,
        },
      });
    },
    [convId, conversationContextActions, openContextMenu, runtimeWindowId],
  );

  return (
    <ChatWindow
      timelineContent={timelineContent}
      timelineItemCount={entities.length}
      conversationTotalTokens={conversationTotalTokens}
      isStreaming={isStreaming}
      showPendingResponseSpinner={showPendingResponseSpinner}
      onSend={sendWithSuggestionLifecycle}
      suggestions={suggestions}
      showSuggestionsAlways
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      headerActions={headerActions}
      onTimelineContextMenu={handleTimelineContextMenu}
      footer={
        <StatsFooter
          modelName={modelName}
          turnStats={turnStats}
          isStreaming={isStreaming}
          streamStartTime={streamStartTime}
          streamOutputTokens={streamOutputTokens}
        />
      }
    />
  );
}
