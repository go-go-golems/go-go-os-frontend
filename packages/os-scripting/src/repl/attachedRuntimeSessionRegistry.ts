import { useSyncExternalStore } from 'react';
import type { SessionId } from '../plugin-runtime/contracts';
import {
  ATTACHED_READ_ONLY_RUNTIME_SESSION,
  DEFAULT_RUNTIME_SESSION_MANAGER,
  type RuntimeSessionManagerHandle,
  type RuntimeSessionManagerSummary,
} from '../runtime-session-manager';
import type { RuntimeSessionHandle, RuntimeSessionSummary } from './runtimeBroker';

export interface AttachedRuntimeSessionEntry {
  handle: RuntimeSessionHandle;
  summary: RuntimeSessionSummary;
}

let snapshot: AttachedRuntimeSessionEntry[] = [];
const listeners = new Set<() => void>();
let unsubscribeManager: (() => void) | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function toSummary(summary: RuntimeSessionManagerSummary): RuntimeSessionSummary {
  return {
    sessionId: summary.sessionId,
    stackId: summary.bundleId,
    packageIds: [...summary.packageIds],
    surfaces: [...summary.surfaces],
    surfaceTypes: summary.surfaceTypes ? { ...summary.surfaceTypes } : undefined,
    title: summary.title,
    description: summary.description,
    origin: 'attached',
    writable: false,
    ownership: ATTACHED_READ_ONLY_RUNTIME_SESSION,
  };
}

function toHandle(handle: RuntimeSessionManagerHandle): RuntimeSessionHandle {
  return {
    sessionId: handle.sessionId,
    stackId: handle.bundleId,
    origin: 'attached',
    writable: false,
    getBundleMeta() {
      return handle.getBundleMeta();
    },
    renderSurface(surfaceId, state) {
      return handle.renderSurface(surfaceId, state);
    },
    eventSurface(surfaceId, handler, args, state) {
      return handle.eventSurface(surfaceId, handler, args, state);
    },
    defineSurface() {
      throw new Error(`Attached runtime session ${handle.sessionId} is read-only`);
    },
    defineSurfaceRender() {
      throw new Error(`Attached runtime session ${handle.sessionId} is read-only`);
    },
    defineSurfaceHandler() {
      throw new Error(`Attached runtime session ${handle.sessionId} is read-only`);
    },
    dispose() {
      return false;
    },
  };
}

function rebuildSnapshot() {
  snapshot = DEFAULT_RUNTIME_SESSION_MANAGER.listSessions()
    .filter((summary) => summary.status === 'ready' && summary.attachedViewIds.length > 0)
    .map((summary) => {
      const handle = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(summary.sessionId);
      if (!handle) {
        return null;
      }
      return {
        handle: toHandle(handle),
        summary: toSummary(summary),
      } satisfies AttachedRuntimeSessionEntry;
    })
    .filter((entry): entry is AttachedRuntimeSessionEntry => entry !== null)
    .sort((left, right) => left.summary.sessionId.localeCompare(right.summary.sessionId));
}

function ensureSubscribed() {
  if (unsubscribeManager) {
    return;
  }
  rebuildSnapshot();
  unsubscribeManager = DEFAULT_RUNTIME_SESSION_MANAGER.subscribe(() => {
    rebuildSnapshot();
    emit();
  });
}

function releaseSubscriptionIfIdle() {
  if (listeners.size > 0 || !unsubscribeManager) {
    return;
  }
  unsubscribeManager();
  unsubscribeManager = null;
  snapshot = [];
}

export function clearAttachedRuntimeSessions(): void {
  rebuildSnapshot();
}

export function listAttachedRuntimeSessions(): AttachedRuntimeSessionEntry[] {
  ensureSubscribed();
  return snapshot;
}

export function getAttachedRuntimeSession(sessionId: SessionId): AttachedRuntimeSessionEntry | null {
  ensureSubscribed();
  return snapshot.find((entry) => entry.summary.sessionId === sessionId) ?? null;
}

export function subscribeAttachedRuntimeSessions(listener: () => void): () => void {
  ensureSubscribed();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    releaseSubscriptionIfIdle();
  };
}

export function useAttachedRuntimeSessions(): AttachedRuntimeSessionEntry[] {
  return useSyncExternalStore(
    subscribeAttachedRuntimeSessions,
    listAttachedRuntimeSessions,
    listAttachedRuntimeSessions,
  );
}
