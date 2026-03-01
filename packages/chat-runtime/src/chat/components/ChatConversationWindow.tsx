import { type MouseEvent, type ReactNode, useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  useDesktopWindowId,
  useOpenDesktopContextMenu,
  useRegisterConversationContextActions,
  type DesktopActionEntry,
} from '@hypercard/engine/desktop-react';
import {
  getTimelineRendererRegistryVersion,
  resolveTimelineRenderers,
  subscribeTimelineRenderers,
} from '../renderers/rendererRegistry';
import type { RenderEntity, RenderMode } from '../renderers/types';
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
  DEFAULT_CHAT_SUGGESTIONS,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
} from '../state/suggestions';
import { chatWindowSlice } from '../state/chatWindowSlice';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import { useConversation } from '../runtime/useConversation';
import { useCurrentProfile } from '../runtime/useCurrentProfile';
import { useProfiles } from '../runtime/useProfiles';
import { useSetProfile } from '../runtime/useSetProfile';
import {
  resolveProfileSelectionChange,
  resolveProfileSelectorValue,
} from './profileSelectorState';
import { ChatWindow } from './ChatWindow';
import { StatsFooter } from './StatsFooter';

export interface ChatConversationWindowProps {
  convId: string;
  basePrefix?: string;
  title?: string;
  placeholder?: string;
  headerActions?: ReactNode;
  enableProfileSelector?: boolean;
  profileRegistry?: string;
  profileScopeKey?: string;
  windowId?: string;
  renderMode?: RenderMode;
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
  enableProfileSelector = false,
  profileRegistry,
  profileScopeKey,
  windowId,
  renderMode = 'normal',
  conversationContextActions,
}: ChatConversationWindowProps) {
  const dispatch = useDispatch();
  const resolvedWindowId = useMemo(() => resolveWindowStateKey(windowId, convId), [convId, windowId]);
  const { send, connectionStatus, isStreaming } = useConversation(convId, basePrefix, profileScopeKey);
  const { profiles, loading: profilesLoading, error: profileError } = useProfiles(
    basePrefix,
    profileRegistry,
    { enabled: enableProfileSelector, scopeKey: profileScopeKey }
  );
  const currentProfile = useCurrentProfile(profileScopeKey);
  const setProfile = useSetProfile(basePrefix, { scopeKey: profileScopeKey });
  const runtimeWindowId = useDesktopWindowId();
  const openContextMenu = useOpenDesktopContextMenu();

  const entities = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectRenderableTimelineEntities(state, convId)
  );
  const starterSuggestionsEntity = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectTimelineEntityById(state, convId, STARTER_SUGGESTIONS_ENTITY_ID)
  );
  const suggestions = useSelector((state: ChatStateSlice & Record<string, unknown>) =>
    selectSuggestions(state, convId)
  );
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
    dispatch(
      timelineSlice.actions.upsertSuggestions({
        convId,
        entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        source: 'starter',
        suggestions: DEFAULT_CHAT_SUGGESTIONS,
        replace: true,
      })
    );
  }, [convId, dispatch, entities.length, starterSuggestionsEntity]);

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
      dispatch(
        timelineSlice.actions.upsertSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
          source: 'starter',
          suggestions: DEFAULT_CHAT_SUGGESTIONS,
          replace: true,
        })
      );
      dispatch(
        timelineSlice.actions.consumeSuggestions({
          convId,
          entityId: STARTER_SUGGESTIONS_ENTITY_ID,
        })
      );
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
    [convId, dispatch, entities.length, resolvedWindowId, send]
  );

  const rendererRegistryVersion = useSyncExternalStore(
    subscribeTimelineRenderers,
    getTimelineRendererRegistryVersion,
    getTimelineRendererRegistryVersion
  );
  const renderers = useMemo(
    () => resolveTimelineRenderers(),
    [rendererRegistryVersion]
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
  const defaultProfileSlug = profiles.find((profile) => profile.is_default)?.slug ?? '';
  const selectedProfileValue = resolveProfileSelectorValue(
    profiles,
    currentProfile.profile
  );

  const profileSelector = enableProfileSelector ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <label htmlFor={`chat-profile-${convId}`} style={{ fontSize: 11, opacity: 0.8 }}>
        Profile
      </label>
      <select
        id={`chat-profile-${convId}`}
        value={selectedProfileValue}
        onChange={(event) => {
          const nextProfile = resolveProfileSelectionChange(
            event.target.value,
            defaultProfileSlug
          );
          const resolvedRegistry = profileRegistry ?? currentProfile.registry ?? null;
          if (nextProfile) {
            void setProfile(nextProfile, resolvedRegistry);
            return;
          }
          void setProfile(null, resolvedRegistry);
        }}
        disabled={profilesLoading}
        style={{ fontSize: 11, padding: '1px 4px', maxWidth: 180 }}
      >
        {profilesLoading ? <option value="">Loading…</option> : null}
        {!profilesLoading && profiles.length === 0 ? <option value="">No profiles</option> : null}
        {profiles.map((profile) => (
          <option key={profile.slug} value={profile.slug}>
            {(profile.display_name?.trim() || profile.slug) + (profile.is_default ? ' (default)' : '')}
          </option>
        ))}
      </select>
      {profileError ? (
        <span style={{ fontSize: 10, color: '#b45309' }} title={profileError}>
          profile error
        </span>
      ) : null}
    </div>
  ) : null;

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
          kind: 'conversation',
          conversationId: convId,
          windowId: runtimeWindowId ?? undefined,
        },
      });
    },
    [convId, conversationContextActions, openContextMenu, runtimeWindowId],
  );

  const composedHeaderActions =
    profileSelector || headerActions
      ? (
          <>
            {profileSelector}
            {headerActions}
          </>
        )
      : undefined;

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
      headerActions={composedHeaderActions}
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
