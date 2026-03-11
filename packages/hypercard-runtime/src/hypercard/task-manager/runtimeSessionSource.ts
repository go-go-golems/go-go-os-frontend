import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { openWindow, type OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { TaskManagerRow, TaskManagerSource } from './types';
import { buildRuntimeDebugWindowPayload } from '../debug/runtimeDebugApp';
import type { RuntimeSessionRecord } from '../../features/runtimeSessions/runtimeSessionsSlice';

interface RuntimeSessionTaskManagerState {
  runtimeSessions?: {
    sessions: Record<string, RuntimeSessionRecord>;
  };
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
  getState: () => RuntimeSessionTaskManagerState;
  dispatch: (action: unknown) => void;
  bundles: RuntimeBundleDefinition[];
  ownerAppId: string;
  subscribe: (listener: () => void) => () => void;
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
  sessionId: string,
  session: RuntimeSessionRecord,
  navSessions: RuntimeSessionTaskManagerState['windowing'],
): { surfaceId: string | null; param?: string } {
  const nav = navSessions?.sessions?.[sessionId]?.nav;
  if (Array.isArray(nav) && nav.length > 0) {
    const current = nav[nav.length - 1];
    if (typeof current?.surface === 'string') {
      return { surfaceId: current.surface, param: current.param };
    }
  }
  return { surfaceId: Object.keys(session.surfaceState ?? {})[0] ?? null };
}

export function createRuntimeSessionTaskManagerSource(
  options: RuntimeSessionTaskManagerSourceOptions,
): TaskManagerSource {
  const bundlesById = new Map(options.bundles.map((bundle) => [bundle.id, bundle]));

  return {
    sourceId() {
      return 'runtime-sessions';
    },
    title() {
      return 'Runtime Sessions';
    },
    listRows() {
      const state = options.getState();
      const sessions = state.runtimeSessions?.sessions ?? {};
      const windowing = state.windowing;

      return Object.entries(sessions).map(([sessionId, session]) => {
        const bundle = bundlesById.get(session.bundleId);
        const currentSurface = currentSurfaceForSession(sessionId, session, windowing);
        return {
          id: sessionId,
          kind: 'runtime-session',
          sourceId: 'runtime-sessions',
          sourceTitle: 'Runtime Sessions',
          title: `${bundle?.name ?? session.bundleId}${currentSurface.surfaceId ? ` · ${currentSurface.surfaceId}` : ''}`,
          status: session.status,
          details: {
            bundleId: session.bundleId,
            bundleName: bundle?.name ?? session.bundleId,
            currentSurface: currentSurface.surfaceId ?? '—',
            surfaceCount: String(Object.keys(session.surfaceState ?? {}).length),
          },
          actions: [
            { id: 'open', label: 'Open', intent: 'open' },
            { id: 'inspect', label: 'Inspect', intent: 'inspect' },
          ],
        } satisfies TaskManagerRow;
      });
    },
    invoke(actionId, rowId) {
      const state = options.getState();
      const session = state.runtimeSessions?.sessions?.[rowId];
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

      if (actionId === 'open') {
        const bundle = bundlesById.get(session.bundleId);
        if (!bundle) {
          throw new Error(`Unknown runtime bundle: ${session.bundleId}`);
        }
        const currentSurface = currentSurfaceForSession(rowId, session, state.windowing);
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
      return options.subscribe(listener);
    },
  };
}
