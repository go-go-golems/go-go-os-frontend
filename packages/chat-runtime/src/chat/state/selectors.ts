import type { ChatErrorRecord, ChatSessionSliceState } from './chatSessionSlice';
import type { ChatWindowSliceState } from './chatWindowSlice';
import type { ChatProfilesState } from './profileSlice';
import type { ConversationTimelineState, TimelineEntity, TimelineState } from './timelineSlice';
import {
  ASSISTANT_SUGGESTIONS_ENTITY_ID,
  readSuggestionsEntityProps,
  STARTER_SUGGESTIONS_ENTITY_ID,
  SUGGESTIONS_ENTITY_KIND,
} from './suggestions';

export interface ChatStateSlice {
  timeline: TimelineState;
  chatSession: ChatSessionSliceState;
  chatWindow?: ChatWindowSliceState;
  chatProfiles?: ChatProfilesState;
}

const EMPTY_TIMELINE: ConversationTimelineState = {
  byId: {},
  order: [],
};
const EMPTY_TIMELINE_ENTITIES: TimelineEntity[] = [];
const EMPTY_SUGGESTIONS: string[] = [];
const EMPTY_ERROR_HISTORY: ChatErrorRecord[] = [];
const EMPTY_CHAT_PROFILES: ChatProfilesState = {
  availableProfiles: [],
  selectedProfile: null,
  selectedRegistry: null,
  selectedByScope: {},
  loading: false,
  error: null,
};
const EMPTY_CHAT_WINDOW: ChatWindowSliceState = {
  byWindowId: {},
};
const EMPTY_PROFILE_SELECTION: { profile: string | undefined; registry: string | undefined } = {
  profile: undefined,
  registry: undefined,
};

function normalizeSelectorValue(value: string | undefined): string {
  return String(value ?? '').trim();
}

function getTimelineConversation(
  state: ChatStateSlice,
  convId: string
): ConversationTimelineState {
  return state.timeline.byConvId[convId] ?? EMPTY_TIMELINE;
}

function getChatSession(state: ChatStateSlice, convId: string) {
  return state.chatSession.byConvId[convId];
}

function getChatProfiles(state: ChatStateSlice): ChatProfilesState {
  return state.chatProfiles ?? EMPTY_CHAT_PROFILES;
}

function getChatWindow(state: ChatStateSlice): ChatWindowSliceState {
  return state.chatWindow ?? EMPTY_CHAT_WINDOW;
}

export const selectConversationTimelineState = (
  state: ChatStateSlice,
  convId: string
): ConversationTimelineState => getTimelineConversation(state, convId);

export const selectTimelineEntities = (
  state: ChatStateSlice,
  convId: string
): TimelineEntity[] => {
  const conv = getTimelineConversation(state, convId);
  if (conv.order.length === 0) {
    return EMPTY_TIMELINE_ENTITIES;
  }
  return conv.order.map((id) => conv.byId[id]).filter(Boolean);
};

export const selectRenderableTimelineEntities = (
  state: ChatStateSlice,
  convId: string
): TimelineEntity[] => selectTimelineEntities(state, convId).filter((entity) => entity.kind !== SUGGESTIONS_ENTITY_KIND);

export const selectTimelineEntityById = (
  state: ChatStateSlice,
  convId: string,
  entityId: string
): TimelineEntity | undefined => getTimelineConversation(state, convId).byId[entityId];

export const selectConnectionStatus = (state: ChatStateSlice, convId: string) =>
  getChatSession(state, convId)?.connectionStatus ?? 'idle';

export const selectIsStreaming = (state: ChatStateSlice, convId: string): boolean =>
  getChatSession(state, convId)?.isStreaming ?? false;

function messageRole(props: unknown): string {
  if (!props || typeof props !== 'object' || Array.isArray(props)) {
    return '';
  }
  return String((props as Record<string, unknown>).role ?? '')
    .trim()
    .toLowerCase();
}

function isUserMessageEntity(entity: TimelineEntity): boolean {
  return entity.kind === 'message' && messageRole(entity.props) === 'user';
}

function isAiSignalEntity(entity: TimelineEntity): boolean {
  if (entity.kind !== 'message') {
    return true;
  }
  return messageRole(entity.props) !== 'user';
}

function findIndexAfter(
  entities: TimelineEntity[],
  startIndex: number,
  predicate: (entity: TimelineEntity) => boolean
): number {
  const safeStart = Math.max(0, startIndex);
  for (let i = safeStart; i < entities.length; i += 1) {
    if (predicate(entities[i])) {
      return i;
    }
  }
  return -1;
}

export const selectShouldShowPendingAiPlaceholder = (
  state: ChatStateSlice,
  windowId: string,
  convId: string
): boolean => {
  const normalizedWindowId = normalizeSelectorValue(windowId);
  const normalizedConvId = normalizeSelectorValue(convId);
  if (!normalizedWindowId || !normalizedConvId) {
    return false;
  }

  if (selectConnectionStatus(state, normalizedConvId) === 'error') {
    return false;
  }

  const windowState = getChatWindow(state).byWindowId[normalizedWindowId];
  if (!windowState || windowState.convId !== normalizedConvId || !windowState.awaiting) {
    return false;
  }

  const entities = selectRenderableTimelineEntities(state, normalizedConvId);
  const userIndex = findIndexAfter(entities, windowState.awaiting.baselineIndex, isUserMessageEntity);
  if (userIndex < 0) {
    return false;
  }

  const aiIndex = findIndexAfter(entities, userIndex + 1, isAiSignalEntity);
  return aiIndex < 0;
};

export const selectSuggestions = (state: ChatStateSlice, convId: string): string[] =>
{
  const conv = getTimelineConversation(state, convId);

  const assistant = readSuggestionsEntityProps(conv.byId[ASSISTANT_SUGGESTIONS_ENTITY_ID]);
  if (assistant && assistant.consumedAt === undefined && assistant.items.length > 0) {
    return assistant.items;
  }

  const starter = readSuggestionsEntityProps(conv.byId[STARTER_SUGGESTIONS_ENTITY_ID]);
  if (!starter || starter.consumedAt !== undefined || starter.items.length === 0) {
    return EMPTY_SUGGESTIONS;
  }

  const hasRenderableEntities = conv.order.some((id) => {
    const entity = conv.byId[id];
    return Boolean(entity && entity.kind !== SUGGESTIONS_ENTITY_KIND);
  });

  return hasRenderableEntities ? EMPTY_SUGGESTIONS : starter.items;
};

export const selectLastError = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.currentError?.message ?? getChatSession(state, convId)?.lastError ?? null;

export const selectCurrentError = (
  state: ChatStateSlice,
  convId: string
): ChatErrorRecord | null => getChatSession(state, convId)?.currentError ?? null;

export const selectErrorHistory = (
  state: ChatStateSlice,
  convId: string
): ChatErrorRecord[] => getChatSession(state, convId)?.errorHistory ?? EMPTY_ERROR_HISTORY;

export const selectHasRecoverableError = (state: ChatStateSlice, convId: string): boolean => {
  const current = getChatSession(state, convId)?.currentError;
  return Boolean(current && current.recoverable !== false);
};

export const selectModelName = (state: ChatStateSlice, convId: string): string | null =>
  getChatSession(state, convId)?.modelName ?? null;

export const selectCurrentTurnStats = (state: ChatStateSlice, convId: string) =>
  getChatSession(state, convId)?.turnStats ?? null;

export const selectStreamStartTime = (state: ChatStateSlice, convId: string): number | null =>
  getChatSession(state, convId)?.streamStartTime ?? null;

export const selectStreamOutputTokens = (state: ChatStateSlice, convId: string): number =>
  getChatSession(state, convId)?.streamOutputTokens ?? 0;

export const selectConversationCachedTokens = (state: ChatStateSlice, convId: string): number => {
  const session = getChatSession(state, convId);
  if (!session) return 0;
  return Math.max(0, session.conversationCachedTokens);
};

export const selectConversationTotalTokens = (state: ChatStateSlice, convId: string): number => {
  const session = getChatSession(state, convId);
  if (!session) return 0;
  return Math.max(
    0,
    session.conversationInputTokens +
      session.conversationOutputTokens +
      session.conversationCachedTokens
  );
};

export const selectConversationIds = (state: ChatStateSlice): string[] => {
  const timelineIds = Object.keys(state.timeline.byConvId);
  const sessionIds = Object.keys(state.chatSession.byConvId);
  return Array.from(new Set([...timelineIds, ...sessionIds]));
};

export const selectAvailableProfiles = (state: ChatStateSlice) =>
  getChatProfiles(state).availableProfiles;

export const selectProfileLoading = (state: ChatStateSlice) =>
  getChatProfiles(state).loading;

export const selectProfileError = (state: ChatStateSlice) =>
  getChatProfiles(state).error;

export function selectCurrentProfileSelection(
  state: ChatStateSlice,
  scopeKey?: string
): { profile: string | undefined; registry: string | undefined } {
  const profiles = getChatProfiles(state);
  const normalizedScope = String(scopeKey ?? '').trim();
  if (normalizedScope) {
    const scoped = profiles.selectedByScope[normalizedScope];
    if (scoped) {
      return {
        profile: scoped.profile ?? undefined,
        registry: scoped.registry ?? undefined,
      };
    }
  }
  const profile = profiles.selectedProfile ?? undefined;
  const registry = profiles.selectedRegistry ?? undefined;
  if (profile === undefined && registry === undefined) {
    return EMPTY_PROFILE_SELECTION;
  }
  return { profile, registry };
}
