/**
 * Simple module to pass initial code to the CodeEditorWindow.
 * Since the editor opens as a windowing-system app (by appKey string),
 * we can't pass rich props directly. Instead, the caller stashes the
 * code here before dispatching openWindow, and the editor reads it on mount.
 */

import { type OpenWindowPayload, openWindow } from '../../desktop/core';
import { getPendingRuntimeCards } from '../../plugin-runtime';
import {
  buildRuntimeCardEditorAppKey,
  HYPERCARD_TOOLS_APP_ID,
  type RuntimeCardRef,
} from './runtimeCardRef';

const pendingCode = new Map<string, string>();
type WindowDispatch = (action: ReturnType<typeof openWindow>) => unknown;

function codeKey(ref: RuntimeCardRef): string {
  return `${ref.ownerAppId}::${ref.cardId}`;
}

export function buildCodeEditorWindowPayload(ref: RuntimeCardRef): OpenWindowPayload {
  const key = codeKey(ref);
  const appKey = buildRuntimeCardEditorAppKey(ref);
  return {
    id: `window:${HYPERCARD_TOOLS_APP_ID}:editor:${key}`,
    title: `✏️ ${ref.cardId}`,
    icon: '✏️',
    bounds: { x: 100, y: 40, w: 600, h: 500 },
    content: { kind: 'app', appKey },
    dedupeKey: `runtime-card-editor:${key}`,
  };
}

/** Stash code for a card editor and open the window. */
export function openCodeEditor(dispatch: WindowDispatch, ref: RuntimeCardRef, code: string): void {
  pendingCode.set(codeKey(ref), code);
  dispatch(openWindow(buildCodeEditorWindowPayload(ref)));
}

/** Get the initial code for a card editor. Falls back to registry. */
export function getEditorInitialCode(ref: RuntimeCardRef): string {
  const key = codeKey(ref);
  const stashed = pendingCode.get(key);
  if (stashed !== undefined) {
    pendingCode.delete(key);
    return stashed;
  }
  // Fallback: look up from the runtime card registry
  const cards = getPendingRuntimeCards();
  const found = cards.find((c) => c.cardId === ref.cardId);
  return found?.code ?? `// No code found for card: ${ref.cardId}\n`;
}
