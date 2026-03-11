import { useSyncExternalStore } from 'react';
import type { JsEvalResult } from '../plugin-runtime/jsSessionService';

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

const attachedJsSessions = new Map<string, AttachedJsSessionEntry>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function registerAttachedJsSession(entry: AttachedJsSessionEntry): void {
  attachedJsSessions.set(entry.summary.sessionId, entry);
  emit();
}

export function unregisterAttachedJsSession(sessionId: string): void {
  if (!attachedJsSessions.delete(sessionId)) {
    return;
  }
  emit();
}

export function clearAttachedJsSessions(): void {
  if (attachedJsSessions.size === 0) {
    return;
  }
  attachedJsSessions.clear();
  emit();
}

export function listAttachedJsSessions(): AttachedJsSessionEntry[] {
  return Array.from(attachedJsSessions.values()).sort((left, right) =>
    left.summary.sessionId.localeCompare(right.summary.sessionId),
  );
}

export function getAttachedJsSession(sessionId: string): AttachedJsSessionEntry | null {
  return attachedJsSessions.get(sessionId) ?? null;
}

export function subscribeAttachedJsSessions(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useAttachedJsSessions(): AttachedJsSessionEntry[] {
  return useSyncExternalStore(
    subscribeAttachedJsSessions,
    listAttachedJsSessions,
    listAttachedJsSessions,
  );
}
