import { useSyncExternalStore } from 'react';
import type { JsEvalResult } from '../plugin-runtime/jsSessionService';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';

export interface AttachedJsSessionSummary {
  sessionId: string;
  stackId: string;
  title: string;
  origin: 'attached-runtime';
  writable: true;
}

export interface AttachedJsSessionHandle {
  sessionId: string;
  stackId: string;
  origin: 'attached-runtime';
  writable: true;
  evaluate(code: string): JsEvalResult;
  inspectGlobals(): string[];
}

export interface AttachedJsSessionEntry {
  handle: AttachedJsSessionHandle;
  summary: AttachedJsSessionSummary;
}

let snapshot: AttachedJsSessionEntry[] = [];
const listeners = new Set<() => void>();
let unsubscribeManager: (() => void) | null = null;

function emit() {
  listeners.forEach((listener) => listener());
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
        handle: {
          sessionId: summary.sessionId,
          stackId: summary.bundleId,
          origin: 'attached-runtime',
          writable: true,
          evaluate(code) {
            return handle.evaluateSessionJs(code);
          },
          inspectGlobals() {
            return handle.getSessionGlobalNames();
          },
        },
        summary: {
          sessionId: summary.sessionId,
          stackId: summary.bundleId,
          title: summary.title,
          origin: 'attached-runtime',
          writable: true,
        },
      } satisfies AttachedJsSessionEntry;
    })
    .filter((entry): entry is AttachedJsSessionEntry => entry !== null)
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

export function clearAttachedJsSessions(): void {
  rebuildSnapshot();
}

export function listAttachedJsSessions(): AttachedJsSessionEntry[] {
  ensureSubscribed();
  return snapshot;
}

export function getAttachedJsSession(sessionId: string): AttachedJsSessionEntry | null {
  ensureSubscribed();
  return snapshot.find((entry) => entry.summary.sessionId === sessionId) ?? null;
}

export function subscribeAttachedJsSessions(listener: () => void): () => void {
  ensureSubscribed();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    releaseSubscriptionIfIdle();
  };
}

export function useAttachedJsSessions(): AttachedJsSessionEntry[] {
  return useSyncExternalStore(
    subscribeAttachedJsSessions,
    listAttachedJsSessions,
    listAttachedJsSessions,
  );
}
