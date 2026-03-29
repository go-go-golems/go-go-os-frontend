import type { RuntimeBundleMeta, RuntimeSurfaceId, RuntimeAction, SessionId, StackId } from '../plugin-runtime/contracts';
import { QuickJSRuntimeService, type QuickJSRuntimeServiceOptions } from '../plugin-runtime/runtimeService';
import {
  BROKER_OWNED_RUNTIME_SESSION,
  type RuntimeSessionOwnership,
} from '../runtime-session-manager/runtimeOwnership';

export interface SpawnRuntimeSessionRequest {
  stackId: StackId;
  sessionId: SessionId;
  packageIds: string[];
  bundleCode: string;
}

export interface RuntimeSessionSummary {
  sessionId: SessionId;
  stackId: StackId;
  packageIds: string[];
  surfaces: string[];
  surfaceTypes?: Record<string, string>;
  title: string;
  description?: string;
  origin: 'spawned' | 'attached';
  writable: boolean;
  ownership: RuntimeSessionOwnership;
}

export interface RuntimeSessionHandle {
  readonly sessionId: SessionId;
  readonly stackId: StackId;
  readonly origin: 'spawned' | 'attached';
  readonly writable: boolean;
  getBundleMeta(): RuntimeBundleMeta;
  renderSurface(surfaceId: RuntimeSurfaceId, state: unknown): unknown;
  eventSurface(surfaceId: RuntimeSurfaceId, handler: string, args: unknown, state: unknown): RuntimeAction[];
  defineSurface(surfaceId: RuntimeSurfaceId, code: string, packId: string): RuntimeBundleMeta;
  defineSurfaceRender(surfaceId: RuntimeSurfaceId, code: string): RuntimeBundleMeta;
  defineSurfaceHandler(surfaceId: RuntimeSurfaceId, handler: string, code: string): RuntimeBundleMeta;
  dispose(): boolean;
}

export interface RuntimeBroker {
  spawnSession(request: SpawnRuntimeSessionRequest): Promise<RuntimeSessionHandle>;
  getSession(sessionId: SessionId): RuntimeSessionHandle | null;
  listSessions(): RuntimeSessionSummary[];
  disposeSession(sessionId: SessionId): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

function toRuntimeSessionSummary(bundle: RuntimeBundleMeta): RuntimeSessionSummary {
  return {
    sessionId: bundle.sessionId,
    stackId: bundle.stackId,
    packageIds: [...bundle.packageIds],
    surfaces: [...bundle.surfaces],
    surfaceTypes: bundle.surfaceTypes ? { ...bundle.surfaceTypes } : undefined,
    title: bundle.title,
    description: bundle.description,
    origin: 'spawned',
    writable: true,
    ownership: BROKER_OWNED_RUNTIME_SESSION,
  };
}

export function createRuntimeBroker(
  options: QuickJSRuntimeServiceOptions = {},
): RuntimeBroker {
  const runtimeService = new QuickJSRuntimeService(options);
  const handles = new Map<SessionId, RuntimeSessionHandle>();
  const summaries = new Map<SessionId, RuntimeSessionSummary>();
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function updateBundle(bundle: RuntimeBundleMeta): RuntimeBundleMeta {
    summaries.set(bundle.sessionId, toRuntimeSessionSummary(bundle));
    emit();
    return bundle;
  }

  function createHandle(bundle: RuntimeBundleMeta): RuntimeSessionHandle {
    return {
      sessionId: bundle.sessionId,
      stackId: bundle.stackId,
      origin: 'spawned',
      writable: true,
      getBundleMeta() {
        return {
          ...bundle,
          packageIds: [...bundle.packageIds],
          surfaces: [...bundle.surfaces],
          surfaceTypes: bundle.surfaceTypes ? { ...bundle.surfaceTypes } : undefined,
        };
      },
      renderSurface(surfaceId, state) {
        return runtimeService.renderRuntimeSurface(bundle.sessionId, surfaceId, state);
      },
      eventSurface(surfaceId, handler, args, state) {
        return runtimeService.eventRuntimeSurface(bundle.sessionId, surfaceId, handler, args, state);
      },
      defineSurface(surfaceId, code, packId) {
        bundle = updateBundle(runtimeService.defineRuntimeSurface(bundle.sessionId, surfaceId, code, packId));
        return bundle;
      },
      defineSurfaceRender(surfaceId, code) {
        bundle = updateBundle(runtimeService.defineRuntimeSurfaceRender(bundle.sessionId, surfaceId, code));
        return bundle;
      },
      defineSurfaceHandler(surfaceId, handler, code) {
        bundle = updateBundle(runtimeService.defineRuntimeSurfaceHandler(bundle.sessionId, surfaceId, handler, code));
        return bundle;
      },
      dispose() {
        return broker.disposeSession(bundle.sessionId);
      },
    };
  }

  const broker: RuntimeBroker = {
    async spawnSession(request) {
      if (handles.has(request.sessionId)) {
        throw new Error(`Runtime session already exists: ${request.sessionId}`);
      }

      const bundle = await runtimeService.loadRuntimeBundle(
        request.stackId,
        request.sessionId,
        request.packageIds,
        request.bundleCode,
      );
      const handle = createHandle(bundle);
      handles.set(request.sessionId, handle);
      updateBundle(bundle);
      return handle;
    },
    getSession(sessionId) {
      return handles.get(sessionId) ?? null;
    },
    listSessions() {
      return Array.from(summaries.values())
        .map((summary) => ({
          ...summary,
          packageIds: [...summary.packageIds],
          surfaces: [...summary.surfaces],
          surfaceTypes: summary.surfaceTypes ? { ...summary.surfaceTypes } : undefined,
        }))
        .sort((a, b) => a.sessionId.localeCompare(b.sessionId));
    },
    disposeSession(sessionId) {
      const disposed = runtimeService.disposeSession(sessionId);
      if (!disposed) {
        return false;
      }
      handles.delete(sessionId);
      summaries.delete(sessionId);
      emit();
      return true;
    },
    clear() {
      for (const sessionId of Array.from(handles.keys())) {
        runtimeService.disposeSession(sessionId);
      }
      handles.clear();
      summaries.clear();
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return broker;
}
