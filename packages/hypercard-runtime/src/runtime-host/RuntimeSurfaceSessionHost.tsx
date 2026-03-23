import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { showToast } from '@hypercard/engine';
import {
  registerRuntimeSession,
  resolveCapabilityPolicy,
  selectRuntimeSurfaceState,
  selectProjectedRuntimeDomains,
  selectRuntimeSession,
  selectRuntimeSessionState,
  setRuntimeSessionStatus,
} from '../features/runtimeSessions';
import { selectFocusedWindowId, selectSessionCurrentNav, selectSessionNavDepth } from '@hypercard/engine/desktop-core';
import { markRuntimeSurfaceInjectionResults } from '../hypercard/artifacts/artifactsSlice';
import type { RuntimeBundleMeta, RuntimeAction } from '../plugin-runtime/contracts';
import { getPendingRuntimeSurfaces, hasRuntimeSurface, injectPendingRuntimeSurfacesWithReport, onRegistryChange } from '../plugin-runtime/runtimeSurfaceRegistry';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { dispatchRuntimeAction } from './pluginIntentRouting';
import {
  normalizeRuntimeSurfaceTypeId,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from '../runtime-packs';

type StoreState = Record<string, unknown>;

function getPluginConfig(bundle: RuntimeBundleDefinition) {
  if (bundle.plugin && bundle.plugin.bundleCode.length > 0) {
    return bundle.plugin;
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function projectRuntimeState(domains: Record<string, unknown>, opts: {
  bundleId: string;
  sessionId: string;
  surfaceId: string;
  windowId: string;
  navDepth: number;
  currentNavParam?: string;
  focusedWindowId: string | null;
  runtimeStatus: string;
  sessionState: Record<string, unknown>;
  surfaceState: Record<string, unknown>;
}) {
  const projectedDomains = { ...domains };
  const inventory = isRecord(projectedDomains.inventory) ? projectedDomains.inventory : null;
  const sales = isRecord(projectedDomains.sales) ? projectedDomains.sales : null;

  if (inventory) {
    projectedDomains.inventory = {
      ...inventory,
      items: asArray(inventory.items),
      selectedSku: typeof opts.currentNavParam === 'string' ? opts.currentNavParam : undefined,
    };
  }

  if (sales) {
    projectedDomains.sales = {
      ...sales,
      log: asArray(sales.log),
    };
  }

  return {
    self: {
      bundleId: opts.bundleId,
      sessionId: opts.sessionId,
      surfaceId: opts.surfaceId,
      windowId: opts.windowId,
    },
    nav: {
      current: opts.surfaceId,
      param: opts.currentNavParam,
      depth: opts.navDepth,
      canBack: opts.navDepth > 1,
    },
    ui: {
      focusedWindowId: opts.focusedWindowId,
      runtimeStatus: opts.runtimeStatus,
    },
    filters: opts.sessionState,
    draft: opts.surfaceState,
    ...projectedDomains,
  };
}

export interface RuntimeSurfaceSessionHostProps {
  windowId: string;
  sessionId: string;
  bundle: RuntimeBundleDefinition;
  mode?: 'interactive' | 'preview';
}

export function RuntimeSurfaceSessionHost({
  windowId,
  sessionId,
  bundle,
  mode = 'interactive',
}: RuntimeSurfaceSessionHostProps) {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();

  const pluginConfig = useMemo(() => getPluginConfig(bundle), [bundle]);
  const currentNav = useSelector((state: StoreState) => selectSessionCurrentNav(state as any, sessionId));
  const navDepth = useSelector((state: StoreState) => selectSessionNavDepth(state as any, sessionId));
  const focusedWindowId = useSelector((state: StoreState) => selectFocusedWindowId(state as any));

  // Accept surfaces from the static bundle definition OR runtime-injected surfaces.
  const currentSurfaceId = currentNav?.surface && (bundle.surfaces[currentNav.surface] || hasRuntimeSurface(currentNav.surface))
    ? currentNav.surface
    : bundle.homeSurface;
  const runtimeSession = useSelector((state: StoreState) => selectRuntimeSession(state as any, sessionId));
  const sessionState = useSelector((state: StoreState) => selectRuntimeSessionState(state as any, sessionId));
  const surfaceState = useSelector((state: StoreState) => selectRuntimeSurfaceState(state as any, sessionId, currentSurfaceId));
  const projectedDomainAccess = useMemo(
    () => runtimeSession?.capabilities.domain ?? resolveCapabilityPolicy(pluginConfig?.capabilities).domain,
    [pluginConfig, runtimeSession?.capabilities.domain],
  );
  const projectedDomains = useSelector(
    (state: StoreState) => selectProjectedRuntimeDomains(state as any, projectedDomainAccess),
    shallowEqual,
  );

  const loadedBundleRef = useRef<RuntimeBundleMeta | null>(null);
  const isPreview = mode === 'preview';
  const localRuntimeReady = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId) !== null;

  const readRuntimeBundleMeta = useCallback(
    (runtimeHandle: ReturnType<typeof DEFAULT_RUNTIME_SESSION_MANAGER.getSession>) => {
      if (loadedBundleRef.current) {
        return loadedBundleRef.current;
      }
      if (!runtimeHandle) {
        return null;
      }
      try {
        const runtimeBundle = runtimeHandle.getBundleMeta();
        loadedBundleRef.current = runtimeBundle;
        return runtimeBundle;
      } catch {
        return null;
      }
    },
    [],
  );

  const resolveSurfacePackId = useCallback(
    (surfaceId: string, runtimeHandle: ReturnType<typeof DEFAULT_RUNTIME_SESSION_MANAGER.getSession>) => {
      const runtimeSurface = getPendingRuntimeSurfaces().find((surface) => surface.surfaceId === surfaceId);
      const runtimeBundle = readRuntimeBundleMeta(runtimeHandle);
      return normalizeRuntimeSurfaceTypeId(runtimeSurface?.packId ?? runtimeBundle?.surfaceTypes?.[surfaceId]);
    },
    [readRuntimeBundleMeta],
  );

  useEffect(() => {
    if (!pluginConfig) {
      return;
    }

    if (runtimeSession) {
      return;
    }

    dispatch(
      registerRuntimeSession({
        sessionId,
        bundleId: bundle.id,
        status: 'loading',
        capabilities: pluginConfig.capabilities,
      })
    );
  }, [dispatch, pluginConfig, runtimeSession, sessionId, bundle.id]);

  useEffect(() => {
    if (!pluginConfig || !runtimeSession) {
      return;
    }

    const runtimeStatus = runtimeSession.status;
    const recoveringReadySession = runtimeStatus === 'ready' && !localRuntimeReady;

    if (runtimeStatus !== 'loading' && !recoveringReadySession) {
      return;
    }

    let cancelled = false;
    const config = pluginConfig;

    async function loadBundle() {
      try {
        if (recoveringReadySession) {
          console.warn('[RuntimeSurfaceSessionHost] Recovering ready runtime session into fresh service', {
            sessionId,
            bundleId: bundle.id,
            currentSurfaceId,
            serviceSessions: DEFAULT_RUNTIME_SESSION_MANAGER.listSessions().map((session) => session.sessionId),
          });
        }

        const runtimeHandle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
          bundleId: bundle.id,
          sessionId,
          packageIds: config.packageIds,
          bundleCode: config.bundleCode,
        });
        if (cancelled) {
          return;
        }
        const runtimeBundle = runtimeHandle.getBundleMeta();
        loadedBundleRef.current = runtimeBundle;

        if (runtimeStatus === 'loading') {
          dispatch(setRuntimeSessionStatus({ sessionId, status: 'ready' }));
        }

        // Inject any runtime surfaces that were registered before the session loaded
        const report = injectPendingRuntimeSurfacesWithReport({
          defineRuntimeSurface(_runtimeSessionId, surfaceId, code, packId) {
            return runtimeHandle.defineSurface(surfaceId, code, packId);
          },
        }, sessionId);
        if (report.injected.length > 0 || report.failed.length > 0) {
          dispatch(
            markRuntimeSurfaceInjectionResults({
              injectedSurfaceIds: report.injected,
              failed: report.failed.map((item) => ({ surfaceId: item.surfaceId, error: item.error })),
            }),
          );
        }
        if (report.injected.length > 0) {
          console.log(
            `[RuntimeSurfaceSessionHost] Injected ${report.injected.length} runtime surfaces into ${sessionId}:`,
            report.injected,
          );
        }

        if (
          runtimeStatus === 'loading' &&
          runtimeBundle.initialSessionState &&
          typeof runtimeBundle.initialSessionState === 'object'
        ) {
          dispatchRuntimeAction(
            {
              type: 'filters.patch',
              payload: runtimeBundle.initialSessionState,
            },
            {
              dispatch: (action) => dispatch(action as never),
              getState: () => store.getState(),
              sessionId,
              surfaceId: currentSurfaceId,
              windowId,
            }
          );
        }

        if (
          runtimeStatus === 'loading' &&
          runtimeBundle.initialSurfaceState &&
          typeof runtimeBundle.initialSurfaceState === 'object'
        ) {
          for (const [surfaceId, value] of Object.entries(runtimeBundle.initialSurfaceState)) {
            if (typeof value === 'object' && value !== null) {
              dispatchRuntimeAction(
                {
                  type: 'draft.patch',
                  payload: value,
                },
                {
                  dispatch: (action) => dispatch(action as never),
                  getState: () => store.getState(),
                  sessionId,
                  surfaceId,
                  windowId,
                }
              );
            }
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        loadedBundleRef.current = null;
        console.error('[RuntimeSurfaceSessionHost] Failed to load or recover runtime session', {
          sessionId,
          bundleId: bundle.id,
          recoveringReadySession,
          message,
        });
        dispatch(setRuntimeSessionStatus({ sessionId, status: 'error', error: message }));
      }
    }

    void loadBundle();

    return () => {
      cancelled = true;
    };
  }, [bundle.id, currentSurfaceId, dispatch, localRuntimeReady, pluginConfig, runtimeSession, sessionId, store, windowId]);

  // Subscribe to the runtime surface registry and inject new surfaces as they arrive.
  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready' || !localRuntimeReady) {
      return;
    }
    const runtimeHandle = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId);
    if (!runtimeHandle) {
      return;
    }
    return onRegistryChange(() => {
      const report = injectPendingRuntimeSurfacesWithReport({
        defineRuntimeSurface(_runtimeSessionId, surfaceId, code, packId) {
          return runtimeHandle.defineSurface(surfaceId, code, packId);
        },
      }, sessionId);
      if (report.injected.length > 0 || report.failed.length > 0) {
        dispatch(
          markRuntimeSurfaceInjectionResults({
            injectedSurfaceIds: report.injected,
            failed: report.failed.map((item) => ({ surfaceId: item.surfaceId, error: item.error })),
          }),
        );
      }
      if (report.injected.length > 0) {
        console.log(
          `[RuntimeSurfaceSessionHost] Live-injected ${report.injected.length} runtime surfaces into ${sessionId}:`,
          report.injected,
        );
      }
    });
  }, [dispatch, localRuntimeReady, pluginConfig, runtimeSession, sessionId]);

  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready' || !localRuntimeReady) {
      return;
    }
    const runtimeHandle = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId);
    if (!runtimeHandle) {
      return;
    }
    return runtimeHandle.attachView(windowId);
  }, [localRuntimeReady, pluginConfig, runtimeSession, sessionId, windowId]);

  useEffect(() => {
    return () => {
      loadedBundleRef.current = null;
    };
  }, []);

  const projectState = useCallback(
    () =>
      projectRuntimeState(projectedDomains, {
        bundleId: bundle.id,
        sessionId,
        surfaceId: currentSurfaceId,
        windowId,
        navDepth,
        currentNavParam: currentNav?.param,
        focusedWindowId,
        runtimeStatus: runtimeSession?.status ?? 'missing',
        sessionState,
        surfaceState,
      }),
    [
      projectedDomains,
      bundle.id,
      sessionId,
      currentSurfaceId,
      windowId,
      navDepth,
      currentNav?.param,
      focusedWindowId,
      runtimeSession?.status,
      sessionState,
      surfaceState,
    ]
  );

  const renderOutcome = useMemo<{ tree: unknown | null; packId: string | null; error: string | null }>(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready' || !localRuntimeReady) {
      return { tree: null, packId: null, error: null };
    }

    const projectedState = projectState();

    try {
      const runtimeHandle = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId);
      if (!runtimeHandle) {
        return { tree: null, packId: null, error: null };
      }
      const packId = resolveSurfacePackId(currentSurfaceId, runtimeHandle);
      return {
        tree: (() => {
          const rawTree = runtimeHandle.renderSurface(currentSurfaceId, projectedState);
          return rawTree === null ? null : validateRuntimeSurfaceTree(packId, rawTree);
        })(),
        packId,
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        packId: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [currentSurfaceId, localRuntimeReady, pluginConfig, projectState, resolveSurfacePackId, runtimeSession, sessionId]);

  const tree = renderOutcome.tree;
  const packId = renderOutcome.packId;
  const renderError = renderOutcome.error;
  const lastRenderErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!renderError) {
      lastRenderErrorRef.current = null;
      return;
    }

    if (lastRenderErrorRef.current === renderError) {
      return;
    }

    lastRenderErrorRef.current = renderError;
    dispatch(showToast(renderError));
  }, [dispatch, renderError]);

  const emitRuntimeEvent = useCallback(
    (handler: string, args?: unknown) => {
      if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready' || !localRuntimeReady) {
        return;
      }

      let actions: RuntimeAction[];
      try {
        const projectedState = projectState();
        const runtimeHandle = DEFAULT_RUNTIME_SESSION_MANAGER.getSession(sessionId);
        if (!runtimeHandle) {
          return;
        }
        actions = runtimeHandle.eventSurface(
          currentSurfaceId,
          handler,
          args,
          projectedState,
        ) ?? [];
      } catch (error) {
        dispatch(showToast(error instanceof Error ? error.message : String(error)));
        return;
      }

      actions.forEach((runtimeAction) => {
        dispatchRuntimeAction(runtimeAction, {
          dispatch: (action) => dispatch(action as never),
          getState: () => store.getState(),
          sessionId,
          surfaceId: currentSurfaceId,
          windowId,
        });
      });
    },
    [
      currentSurfaceId,
      dispatch,
      localRuntimeReady,
      pluginConfig,
      projectState,
      runtimeSession,
      sessionId,
      windowId,
      store,
    ]
  );

  if (!pluginConfig) {
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Plugin bundle configuration is required for this host.</div>;
  }

  if (!runtimeSession || runtimeSession.status === 'loading' || (runtimeSession.status === 'ready' && !localRuntimeReady)) {
    return <div style={{ padding: 12 }}>{isPreview ? 'Loading plugin preview…' : 'Loading plugin runtime…'}</div>;
  }

  if (runtimeSession.status === 'error') {
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Runtime error: {runtimeSession.error}</div>;
  }

  if (!tree) {
    if (renderError) {
      return <div style={{ padding: 12, color: '#9f1d1d' }}>Runtime render error: {renderError}</div>;
    }
    return <div style={{ padding: 12 }}>No plugin output for surface: {currentSurfaceId}</div>;
  }

  if (!packId) {
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Runtime render error: Missing runtime surface type id for {currentSurfaceId}</div>;
  }

  return <>{renderRuntimeSurfaceTree(packId, tree, emitRuntimeEvent)}</>;
}
