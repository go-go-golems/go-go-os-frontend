import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import type { ChatProfilePolicy } from './profileTypes';

type ConversationStoreState = ChatStateSlice & Record<string, unknown>;

export interface UseConversationResult {
  send: (prompt: string) => Promise<void>;
  connectionStatus: ReturnType<typeof selectConnectionStatus>;
  isStreaming: boolean;
}

interface ConversationEffectSnapshot {
  convId: string;
  basePrefix: string;
  profilePolicy: string;
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
  profilePolicy: ChatProfilePolicy | undefined,
  profile: string | undefined,
  registry: string | undefined
): ConversationEffectSnapshot {
  const policyKey = (() => {
    if (!profilePolicy) return 'none';
    if (profilePolicy.kind === 'fixed') {
      return `fixed:${normalizeSnapshotValue(profilePolicy.profile)}`;
    }
    if (profilePolicy.kind === 'selectable') {
      return `selectable:${normalizeSnapshotValue(profilePolicy.scopeKey)}`;
    }
    return 'none';
  })();
  return {
    convId: normalizeSnapshotValue(convId),
    basePrefix: normalizeSnapshotValue(basePrefix),
    profilePolicy: policyKey,
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
  if (previous.profilePolicy !== current.profilePolicy) changed.push('profilePolicy');
  if (previous.profile !== current.profile) changed.push('profile');
  if (previous.registry !== current.registry) changed.push('registry');
  return changed;
}

function resolveEffectiveProfileSelection(
  policy: ChatProfilePolicy | undefined,
  selected: { profile?: string; registry?: string }
): { profile?: string; registry?: string } | undefined {
  if (!policy || policy.kind === 'none') {
    return undefined;
  }
  if (policy.kind === 'fixed') {
    const fixed = normalizeSnapshotValue(policy.profile);
    const registry = normalizeSnapshotValue(selected.registry) || undefined;
    return fixed ? { profile: fixed, registry } : undefined;
  }
  const selectedProfile = normalizeSnapshotValue(selected.profile);
  const selectedRegistry = normalizeSnapshotValue(selected.registry) || undefined;
  if (!selectedProfile && !selectedRegistry) {
    return undefined;
  }
  return {
    profile: selectedProfile || undefined,
    registry: selectedRegistry,
  };
}

export function useConversation(convId: string, basePrefix = '', profilePolicy?: ChatProfilePolicy): UseConversationResult {
  const dispatch = useDispatch();
  const dispatchRef = useRef(dispatch);
  useEffect(() => {
    dispatchRef.current = dispatch;
  }, [dispatch]);

  const normalizedConvId = normalizeSnapshotValue(convId);
  const normalizedBasePrefix = normalizeBasePrefix(basePrefix);
  const normalizedProfilePolicy = useMemo<ChatProfilePolicy | undefined>(() => {
    if (!profilePolicy || profilePolicy.kind === 'none') {
      return { kind: 'none' };
    }
    if (profilePolicy.kind === 'fixed') {
      const profile = normalizeSnapshotValue(profilePolicy.profile);
      return profile ? { kind: 'fixed', profile } : { kind: 'none' };
    }
    const scopeKey = normalizeSnapshotValue(profilePolicy.scopeKey) || undefined;
    return { kind: 'selectable', scopeKey };
  }, [profilePolicy?.kind, (profilePolicy as { profile?: string } | undefined)?.profile, (profilePolicy as { scopeKey?: string } | undefined)?.scopeKey]);
  const normalizedScopeKey = normalizedProfilePolicy?.kind === 'selectable'
    ? normalizeSnapshotValue(normalizedProfilePolicy.scopeKey) || undefined
    : undefined;

  const connectionStatus = useSelector((state: ConversationStoreState) =>
    selectConnectionStatus(state, normalizedConvId)
  );
  const isStreaming = useSelector((state: ConversationStoreState) =>
    selectIsStreaming(state, normalizedConvId)
  );
  const profileSelection = useSelector((state: ConversationStoreState) =>
    selectCurrentProfileSelection(state, normalizedScopeKey)
  , shallowEqual);
  const effectiveProfileSelection = useMemo(
    () => resolveEffectiveProfileSelection(normalizedProfilePolicy, profileSelection),
    [normalizedProfilePolicy, profileSelection],
  );
  const selectedProfile = normalizeSnapshotValue(effectiveProfileSelection?.profile) || undefined;
  const selectedRegistry = normalizeSnapshotValue(effectiveProfileSelection?.registry) || undefined;
  const lastEffectSnapshotRef = useRef<ConversationEffectSnapshot | null>(null);
  const lastEffectDispatchRef = useRef<typeof dispatch | null>(null);
  const effectRunIdRef = useRef(0);

  useEffect(() => {
    const snapshot = buildEffectSnapshot(
      normalizedConvId,
      normalizedBasePrefix,
      normalizedProfilePolicy,
      selectedProfile,
      selectedRegistry,
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
        profileSelection: effectiveProfileSelection,
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
  }, [effectiveProfileSelection, normalizedBasePrefix, normalizedConvId, normalizedProfilePolicy, selectedProfile, selectedRegistry]);

  const send = useCallback(
    async (prompt: string) => {
      sendLog('send:start conv=%s len=%d', normalizedConvId, prompt.length);
      try {
        await conversationManager.send(prompt, normalizedConvId, normalizedBasePrefix, effectiveProfileSelection);
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
    [effectiveProfileSelection, normalizedBasePrefix, normalizedConvId]
  );

  return {
    send,
    connectionStatus,
    isStreaming,
  };
}
