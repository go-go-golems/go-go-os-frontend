import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { TaskManagerRow, TaskManagerSource } from './types';
import { buildRuntimeDebugWindowPayload } from '../debug/runtimeDebugApp';
import {
  DEFAULT_RUNTIME_SESSION_MANAGER,
  type RuntimeSessionManager,
  type RuntimeSessionManagerSummary,
} from '../../runtime-session-manager';

interface RuntimeSessionTaskManagerState {
  windowing?: {
    sessions: Record<string, {
      nav?: Array<{
        surface?: string;
        param?: string;
      }>;
    }>;
  };
}

interface RuntimeSessionTaskManagerSourceOptions {
  sourceId?: string;
  sourceTitle?: string;
  getState: () => RuntimeSessionTaskManagerState;
  dispatch: (action: unknown) => void;
  bundles: RuntimeBundleDefinition[];
  ownerAppId: string;
  focusJsConsole?: (sessionId: string) => void;
  subscribe: (listener: () => void) => () => void;
  manager?: RuntimeSessionManager;
}

function buildBundleSurfaceWindowPayload(
  bundle: RuntimeBundleDefinition,
  surfaceId: string,
  param?: string,
): OpenWindowPayload | null {
  const surface = bundle.surfaces[surfaceId];
  if (!surface) {
    return null;
  }

  const sessionId =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? `task-manager:${bundle.id}:${surfaceId}:${globalThis.crypto.randomUUID()}`
      : `task-manager:${bundle.id}:${surfaceId}:${Date.now()}`;

  return {
    id: `window:task-manager:${bundle.id}:${surfaceId}:${sessionId}`,
    title: surface.title ?? surfaceId,
    icon: surface.icon ?? '📄',
    bounds: { x: 180, y: 56, w: 960, h: 700 },
    content: {
      kind: 'surface',
      surface: {
        bundleId: bundle.id,
        surfaceId,
        surfaceSessionId: sessionId,
        param,
      },
    },
    dedupeKey: `task-surface:${bundle.id}:${surfaceId}:${param ?? ''}`,
  };
}

function currentSurfaceForSession(
  session: RuntimeSessionManagerSummary,
  navSessions: RuntimeSessionTaskManagerState['windowing'],
): { surfaceId: string | null; param?: string } {
  const nav = navSessions?.sessions?.[session.sessionId]?.nav;
  if (Array.isArray(nav) && nav.length > 0) {
    const current = nav[nav.length - 1];
    if (typeof current?.surface === 'string') {
      return { surfaceId: current.surface, param: current.param };
    }
  }
  return { surfaceId: session.surfaces[0] ?? null };
}

export function createRuntimeSessionTaskManagerSource(
  options: RuntimeSessionTaskManagerSourceOptions,
): TaskManagerSource {
  const bundlesById = new Map(options.bundles.map((bundle) => [bundle.id, bundle]));
  const sourceId = options.sourceId ?? 'runtime-sessions';
  const sourceTitle = options.sourceTitle ?? 'Runtime Sessions';
  const manager = options.manager ?? DEFAULT_RUNTIME_SESSION_MANAGER;

  return {
    sourceId() {
      return sourceId;
    },
    title() {
      return sourceTitle;
    },
    listRows() {
      const state = options.getState();
      const windowing = state.windowing;

      return manager.listSessions().map((session) => {
        const bundle = bundlesById.get(session.bundleId);
        const currentSurface = currentSurfaceForSession(session, windowing);
        return {
          id: session.sessionId,
          kind: 'runtime-session',
          sourceId,
          sourceTitle,
          title: `${bundle?.name ?? session.bundleId}${currentSurface.surfaceId ? ` · ${currentSurface.surfaceId}` : ''}`,
          status: session.status,
          details: {
            bundleId: session.bundleId,
            bundleName: bundle?.name ?? session.bundleId,
            ownership: session.ownership.kind,
            currentSurface: currentSurface.surfaceId ?? '—',
            surfaceCount: String(session.surfaces.length),
            attachedViews: String(session.attachedViewIds.length),
          },
          actions: [
            { id: 'open', label: 'Open', intent: 'open' },
            { id: 'js-console', label: 'JS Console', intent: 'custom' },
            { id: 'inspect', label: 'Inspect', intent: 'inspect' },
          ],
        } satisfies TaskManagerRow;
      });
    },
    invoke(actionId, rowId) {
      const state = options.getState();
      const session = manager.listSessions().find((entry) => entry.sessionId === rowId);
      if (!session) {
        throw new Error(`Unknown runtime session: ${rowId}`);
      }

      if (actionId === 'inspect') {
        options.dispatch(
          openWindow(
            buildRuntimeDebugWindowPayload({
              appId: options.ownerAppId,
            }),
          ),
        );
        return;
      }

      if (actionId === 'js-console') {
        options.focusJsConsole?.(rowId);
        return;
      }

      if (actionId === 'open') {
        const bundle = bundlesById.get(session.bundleId);
        if (!bundle) {
          throw new Error(`Unknown runtime bundle: ${session.bundleId}`);
        }
        const currentSurface = currentSurfaceForSession(session, state.windowing);
        if (!currentSurface.surfaceId) {
          throw new Error(`Runtime session has no active surface: ${rowId}`);
        }
        const payload = buildBundleSurfaceWindowPayload(bundle, currentSurface.surfaceId, currentSurface.param);
        if (!payload) {
          throw new Error(`Unknown runtime surface: ${session.bundleId}:${currentSurface.surfaceId}`);
        }
        options.dispatch(openWindow(payload));
        return;
      }

      throw new Error(`Unsupported runtime session action: ${actionId}`);
    },
    subscribe(listener) {
      const unregisterStore = options.subscribe(listener);
      const unregisterManager = manager.subscribe(listener);
      return () => {
        unregisterManager();
        unregisterStore();
      };
    },
  };
}
