/**
 * Simple module to pass initial code to the CodeEditorWindow.
 * Since the editor opens as a windowing-system app (by appKey string),
 * we can't pass rich props directly. Instead, the caller stashes the
 * code here before dispatching openWindow, and the editor reads it on mount.
 */

import { type OpenWindowPayload, openWindow } from '@hypercard/engine/desktop-core';
import { getPendingRuntimeSurfaces } from '../../plugin-runtime';
import {
  buildRuntimeSurfaceEditorAppKey,
  HYPERCARD_TOOLS_APP_ID,
  type RuntimeSurfaceRef,
} from './runtimeSurfaceRef';

const pendingCode = new Map<string, string>();
type WindowDispatch = (action: ReturnType<typeof openWindow>) => unknown;

function codeKey(ref: RuntimeSurfaceRef): string {
  return `${ref.ownerAppId}::${ref.surfaceId}`;
}

export function buildCodeEditorWindowPayload(ref: RuntimeSurfaceRef): OpenWindowPayload {
  const key = codeKey(ref);
  const appKey = buildRuntimeSurfaceEditorAppKey(ref);
  return {
    id: `window:${HYPERCARD_TOOLS_APP_ID}:editor:${key}`,
    title: `✏️ ${ref.surfaceId}`,
    icon: '✏️',
    bounds: { x: 100, y: 40, w: 600, h: 500 },
    content: { kind: 'app', appKey },
    dedupeKey: `runtime-surface-editor:${key}`,
  };
}

/** Stash code for a runtime surface editor and open the window. */
export function openCodeEditor(dispatch: WindowDispatch, ref: RuntimeSurfaceRef, code: string): void {
  pendingCode.set(codeKey(ref), code);
  dispatch(openWindow(buildCodeEditorWindowPayload(ref)));
}

/** Get the initial code for a runtime surface editor. Falls back to registry. */
export function getEditorInitialCode(ref: RuntimeSurfaceRef): string {
  const key = codeKey(ref);
  const stashed = pendingCode.get(key);
  if (stashed !== undefined) {
    pendingCode.delete(key);
    return stashed;
  }
  // Fallback: look up from the runtime surface registry.
  const surfaces = getPendingRuntimeSurfaces();
  const found = surfaces.find((surface) => surface.cardId === ref.surfaceId);
  return found?.code ?? `// No code found for surface: ${ref.surfaceId}\n`;
}
