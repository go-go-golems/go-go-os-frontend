import { useCallback, useEffect, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { chatSessionSlice, createChatError } from '../state/chatSessionSlice';
import {
  type ChatStateSlice,
  selectConnectionStatus,
  selectCurrentProfileSelection,
  selectIsStreaming,
} from '../state/selectors';
import { conversationManager } from './conversationManager';
import { ChatHttpError } from './http';
import { getDebugLogger } from '../debug/debugChannels';

type ConversationStoreState = ChatStateSlice & Record<string, unknown>;

export interface UseConversationResult {
  send: (prompt: string) => Promise<void>;
  connectionStatus: ReturnType<typeof selectConnectionStatus>;
  isStreaming: boolean;
}

interface ConversationEffectSnapshot {
  convId: string;
  basePrefix: string;
  scopeKey: string;
  profile: string;
  registry: string;
}

const lifecycleLog = getDebugLogger('chat:useConversation:lifecycle');
const sendLog = getDebugLogger('chat:useConversation:send');

function normalizeSnapshotValue(value: string | undefined): string {
  const normalized = String(value ?? '').trim();
  return normalized;
}

function normalizeBasePrefix(value: string | undefined): string {
  const normalized = normalizeSnapshotValue(value);
  return normalized.replace(/\/$/, '');
}

function buildEffectSnapshot(
  convId: string,
  basePrefix: string,
  scopeKey: string | undefined,
  profile: string | undefined,
  registry: string | undefined
): ConversationEffectSnapshot {
  return {
    convId: normalizeSnapshotValue(convId),
    basePrefix: normalizeSnapshotValue(basePrefix),
    scopeKey: normalizeSnapshotValue(scopeKey),
    profile: normalizeSnapshotValue(profile),
    registry: normalizeSnapshotValue(registry),
  };
}

function diffEffectSnapshot(
  previous: ConversationEffectSnapshot,
  current: ConversationEffectSnapshot
): string[] {
  const changed: string[] = [];
  if (previous.convId !== current.convId) changed.push('convId');
  if (previous.basePrefix !== current.basePrefix) changed.push('basePrefix');
  if (previous.scopeKey !== current.scopeKey) changed.push('scopeKey');
  if (previous.profile !== current.profile) changed.push('profile');
  if (previous.registry !== current.registry) changed.push('registry');
  return changed;
}

export function useConversation(convId: string, basePrefix = '', scopeKey?: string): UseConversationResult {
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  const normalizedConvId = normalizeSnapshotValue(convId);
  const normalizedBasePrefix = normalizeBasePrefix(basePrefix);
  const normalizedScopeKey = normalizeSnapshotValue(scopeKey) || undefined;

  const connectionStatus = useSelector((state: ConversationStoreState) =>
    selectConnectionStatus(state, normalizedConvId)
  );
  const isStreaming = useSelector((state: ConversationStoreState) =>
    selectIsStreaming(state, normalizedConvId)
  );
  const profileSelection = useSelector((state: ConversationStoreState) =>
    selectCurrentProfileSelection(state, normalizedScopeKey)
  , shallowEqual);
  const selectedProfile = normalizeSnapshotValue(profileSelection.profile) || undefined;
  const selectedRegistry = normalizeSnapshotValue(profileSelection.registry) || undefined;
  const lastEffectSnapshotRef = useRef<ConversationEffectSnapshot | null>(null);
  const lastEffectDispatchRef = useRef<typeof dispatch | null>(null);
  const effectRunIdRef = useRef(0);

  useEffect(() => {
    const snapshot = buildEffectSnapshot(
      normalizedConvId,
      normalizedBasePrefix,
      normalizedScopeKey,
      selectedProfile,
      selectedRegistry
    );
    const previousSnapshot = lastEffectSnapshotRef.current;
    const changedKeys = previousSnapshot ? diffEffectSnapshot(previousSnapshot, snapshot) : ['mount'];
    const dispatchChanged = lastEffectDispatchRef.current !== null && lastEffectDispatchRef.current !== dispatchRef.current;
    if (dispatchChanged) {
      changedKeys.push('dispatch');
    }
    effectRunIdRef.current += 1;
    const runId = effectRunIdRef.current;
    lifecycleLog('effect:start run=%d conv=%s changes=%o snapshot=%o', runId, normalizedConvId, changedKeys, snapshot);
    lastEffectSnapshotRef.current = snapshot;
    lastEffectDispatchRef.current = dispatchRef.current;

    let disposed = false;

    conversationManager
      .connect({
        convId: normalizedConvId,
        basePrefix: normalizedBasePrefix,
        profileSelection: {
          profile: selectedProfile,
          registry: selectedRegistry,
        },
        dispatch: (action: unknown) => dispatchRef.current(action as never),
      })
      .then(() => {
        lifecycleLog('connect:ok run=%d conv=%s', runId, normalizedConvId);
      })
      .catch((error) => {
        lifecycleLog('connect:error run=%d conv=%s error=%o', runId, normalizedConvId, error);
        if (disposed) return;
        dispatchRef.current(
          chatSessionSlice.actions.pushError({
            convId: normalizedConvId,
            error: createChatError({
              kind: 'runtime_error',
              stage: 'connect',
              source: 'useConversation.connect',
              message: error instanceof Error ? error.message : String(error),
              recoverable: true,
            }),
          })
        );
      });

    return () => {
      lifecycleLog('effect:cleanup run=%d conv=%s', runId, normalizedConvId);
      disposed = true;
      conversationManager.disconnect(normalizedConvId);
    };
  }, [normalizedBasePrefix, normalizedConvId, normalizedScopeKey, selectedProfile, selectedRegistry]);

  const send = useCallback(
    async (prompt: string) => {
      sendLog('send:start conv=%s len=%d', normalizedConvId, prompt.length);
      try {
        await conversationManager.send(prompt, normalizedConvId, normalizedBasePrefix, {
          profile: selectedProfile,
          registry: selectedRegistry,
        });
        sendLog('send:ok conv=%s', normalizedConvId);
      } catch (error) {
        sendLog('send:error conv=%s error=%o', normalizedConvId, error);
        const mapped =
          error instanceof ChatHttpError
            ? createChatError({
                kind: 'http_error',
                stage: error.stage,
                source: 'useConversation.send',
                status: error.status,
                message: error.message,
                recoverable: error.status >= 500 || error.status === 429,
                details: { url: error.url },
              })
            : createChatError({
                kind: 'runtime_error',
                stage: 'send',
                source: 'useConversation.send',
                message: error instanceof Error ? error.message : String(error),
                recoverable: true,
              });
        dispatchRef.current(
          chatSessionSlice.actions.pushError({
            convId: normalizedConvId,
            error: mapped,
          })
        );
        throw error;
      }
    },
    [normalizedBasePrefix, normalizedConvId, selectedProfile, selectedRegistry]
  );

  return {
    send,
    connectionStatus,
    isStreaming,
  };
}
