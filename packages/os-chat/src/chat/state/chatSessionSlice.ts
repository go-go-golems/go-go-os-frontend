import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { stripTrailingWhitespace } from '../sem/semHelpers';

export type ChatConnectionStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export interface TurnStats {
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
  durationMs?: number;
  tps?: number;
}

export type ChatErrorKind =
  | 'ws_error'
  | 'ws_close'
  | 'hydrate_error'
  | 'http_error'
  | 'sem_decode_error'
  | 'runtime_error'
  | 'unknown_error';

export type ChatErrorStage =
  | 'connect'
  | 'hydrate'
  | 'stream'
  | 'send'
  | 'disconnect'
  | 'unknown';

export interface ChatErrorRecord {
  id: string;
  kind: ChatErrorKind;
  stage: ChatErrorStage;
  message: string;
  source?: string;
  code?: string;
  status?: number;
  recoverable?: boolean;
  at: number;
  details?: Record<string, unknown>;
}

export interface ChatErrorInput {
  id?: string;
  kind: ChatErrorKind;
  stage: ChatErrorStage;
  message?: string;
  source?: string;
  code?: string;
  status?: number;
  recoverable?: boolean;
  at?: number;
  details?: Record<string, unknown>;
}

export interface ChatSessionState {
  connectionStatus: ChatConnectionStatus;
  isStreaming: boolean;
  modelName: string | null;
  turnStats: TurnStats | null;
  conversationInputTokens: number;
  conversationOutputTokens: number;
  conversationCachedTokens: number;
  streamStartTime: number | null;
  streamOutputTokens: number;
  lastError: string | null;
  currentError: ChatErrorRecord | null;
  errorHistory: ChatErrorRecord[];
}

export interface ChatSessionSliceState {
  byConvId: Record<string, ChatSessionState>;
}
const MAX_ERROR_HISTORY = 20;

const initialState: ChatSessionSliceState = {
  byConvId: {},
};

let errorSeq = 0;

function nextErrorId(): string {
  errorSeq += 1;
  return `chat-error-${errorSeq}`;
}

function defaultErrorMessage(kind: ChatErrorKind, stage: ChatErrorStage): string {
  return `${kind.replace(/_/g, ' ')} (${stage})`;
}

function defaultRecoverable(kind: ChatErrorKind): boolean {
  return kind !== 'unknown_error';
}

function toChatErrorRecord(input: ChatErrorInput): ChatErrorRecord {
  const message = stripTrailingWhitespace(input.message ?? '').trim();
  return {
    id: input.id ?? nextErrorId(),
    kind: input.kind,
    stage: input.stage,
    message: message.length > 0 ? message : defaultErrorMessage(input.kind, input.stage),
    source: input.source,
    code: input.code,
    status: input.status,
    recoverable: input.recoverable ?? defaultRecoverable(input.kind),
    at: input.at ?? Date.now(),
    details: input.details,
  };
}

export function createChatError(input: ChatErrorInput): ChatErrorRecord {
  return toChatErrorRecord(input);
}

function createInitialChatSessionState(): ChatSessionState {
  return {
    connectionStatus: 'idle',
    isStreaming: false,
    modelName: null,
    turnStats: null,
    conversationInputTokens: 0,
    conversationOutputTokens: 0,
    conversationCachedTokens: 0,
    streamStartTime: null,
    streamOutputTokens: 0,
    lastError: null,
    currentError: null,
    errorHistory: [],
  };
}

function getSession(state: ChatSessionSliceState, convId: string): ChatSessionState {
  if (!state.byConvId[convId]) {
    state.byConvId[convId] = createInitialChatSessionState();
  }
  return state.byConvId[convId];
}

function applyError(
  session: ChatSessionState,
  error: ChatErrorRecord | null,
  options: { pushHistory: boolean }
) {
  session.currentError = error;
  session.lastError = error?.message ?? null;
  if (!error || !options.pushHistory) {
    return;
  }
  session.errorHistory = [...session.errorHistory, error].slice(-MAX_ERROR_HISTORY);
}

export const chatSessionSlice = createSlice({
  name: 'chatSession',
  initialState,
  reducers: {
    setConnectionStatus(
      state,
      action: PayloadAction<{ convId: string; status: ChatConnectionStatus }>
    ) {
      getSession(state, action.payload.convId).connectionStatus = action.payload.status;
    },

    setIsStreaming(state, action: PayloadAction<{ convId: string; isStreaming: boolean }>) {
      getSession(state, action.payload.convId).isStreaming = action.payload.isStreaming;
    },

    setModelName(state, action: PayloadAction<{ convId: string; modelName: string | null }>) {
      getSession(state, action.payload.convId).modelName = action.payload.modelName;
    },

    setTurnStats(state, action: PayloadAction<{ convId: string; turnStats: TurnStats | null }>) {
      getSession(state, action.payload.convId).turnStats = action.payload.turnStats;
    },

    addConversationUsage(
      state,
      action: PayloadAction<{
        convId: string;
        inputTokens?: number;
        outputTokens?: number;
        cachedTokens?: number;
      }>
    ) {
      const session = getSession(state, action.payload.convId);
      if (typeof action.payload.inputTokens === 'number' && Number.isFinite(action.payload.inputTokens)) {
        session.conversationInputTokens += Math.max(0, Math.trunc(action.payload.inputTokens));
      }
      if (typeof action.payload.outputTokens === 'number' && Number.isFinite(action.payload.outputTokens)) {
        session.conversationOutputTokens += Math.max(0, Math.trunc(action.payload.outputTokens));
      }
      if (typeof action.payload.cachedTokens === 'number' && Number.isFinite(action.payload.cachedTokens)) {
        session.conversationCachedTokens += Math.max(0, Math.trunc(action.payload.cachedTokens));
      }
    },

    markStreamStart(state, action: PayloadAction<{ convId: string; streamStartTime?: number }>) {
      const session = getSession(state, action.payload.convId);
      session.streamStartTime = action.payload.streamStartTime ?? Date.now();
      session.streamOutputTokens = 0;
      session.currentError = null;
      session.lastError = null;
    },

    updateStreamTokens(state, action: PayloadAction<{ convId: string; streamOutputTokens: number }>) {
      const session = getSession(state, action.payload.convId);
      session.streamOutputTokens = Math.max(0, Math.trunc(action.payload.streamOutputTokens));
    },

    setError(state, action: PayloadAction<{ convId: string; error: ChatErrorInput | null }>) {
      const session = getSession(state, action.payload.convId);
      if (!action.payload.error) {
        applyError(session, null, { pushHistory: false });
        return;
      }
      applyError(session, toChatErrorRecord(action.payload.error), { pushHistory: false });
    },

    pushError(state, action: PayloadAction<{ convId: string; error: ChatErrorInput }>) {
      const session = getSession(state, action.payload.convId);
      applyError(session, toChatErrorRecord(action.payload.error), { pushHistory: true });
    },

    clearError(state, action: PayloadAction<{ convId: string }>) {
      const session = getSession(state, action.payload.convId);
      applyError(session, null, { pushHistory: false });
    },

    setStreamError(state, action: PayloadAction<{ convId: string; error: string | null }>) {
      const session = getSession(state, action.payload.convId);
      const normalized = stripTrailingWhitespace(action.payload.error ?? '').trim();
      if (!normalized) {
        applyError(session, null, { pushHistory: false });
        return;
      }
      applyError(
        session,
        toChatErrorRecord({
          kind: 'runtime_error',
          stage: 'unknown',
          source: 'chatSession.setStreamError',
          message: normalized,
        }),
        { pushHistory: true }
      );
    },

    resetSession(state, action: PayloadAction<{ convId: string }>) {
      state.byConvId[action.payload.convId] = createInitialChatSessionState();
    },

    clearConversationSession(state, action: PayloadAction<{ convId: string }>) {
      delete state.byConvId[action.payload.convId];
    },
  },
});

export const chatSessionReducer = chatSessionSlice.reducer;
