import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { showToast } from '@hypercard/engine';
import {
  registerRuntimeSession,
  removeRuntimeSession,
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
import { QuickJSRuntimeService } from '../plugin-runtime/runtimeService';
import { registerAttachedJsSession, unregisterAttachedJsSession } from '../repl/attachedJsSessionRegistry';
import { registerAttachedRuntimeSession, unregisterAttachedRuntimeSession } from '../repl/attachedRuntimeSessionRegistry';
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

  const runtimeServiceRef = useRef<QuickJSRuntimeService | null>(null);
  const loadedBundleRef = useRef<RuntimeBundleMeta | null>(null);
  const isPreview = mode === 'preview';
  if (!runtimeServiceRef.current) {
    runtimeServiceRef.current = new QuickJSRuntimeService();
  }

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

    if (runtimeSession.status !== 'loading') {
      return;
    }

    let cancelled = false;
    const runtimeService = runtimeServiceRef.current;
    const config = pluginConfig;

    async function loadBundle() {
      if (!runtimeService) {
        return;
      }

      try {
        const runtimeBundle = await runtimeService.loadRuntimeBundle(bundle.id, sessionId, config.packageIds, config.bundleCode);
        if (cancelled) {
          return;
        }
        loadedBundleRef.current = runtimeBundle;

        dispatch(setRuntimeSessionStatus({ sessionId, status: 'ready' }));

        // Inject any runtime surfaces that were registered before the session loaded
        if (runtimeService) {
          const report = injectPendingRuntimeSurfacesWithReport(runtimeService, sessionId);
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
        }

        if (runtimeBundle.initialSessionState && typeof runtimeBundle.initialSessionState === 'object') {
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

        if (runtimeBundle.initialSurfaceState && typeof runtimeBundle.initialSurfaceState === 'object') {
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
        dispatch(setRuntimeSessionStatus({ sessionId, status: 'error', error: message }));
      }
    }

    void loadBundle();

    return () => {
      cancelled = true;
    };
  }, [dispatch, pluginConfig, runtimeSession, sessionId, bundle.id, currentSurfaceId, windowId, store]);

  // Subscribe to the runtime surface registry and inject new surfaces as they arrive.
  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
      return;
    }
    const runtimeService = runtimeServiceRef.current;
    if (!runtimeService) {
      return;
    }
    return onRegistryChange(() => {
      const report = injectPendingRuntimeSurfacesWithReport(runtimeService, sessionId);
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
  }, [dispatch, pluginConfig, runtimeSession, sessionId]);

  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready' || isPreview) {
      return;
    }

    const runtimeService = runtimeServiceRef.current;
    if (!runtimeService) {
      return;
    }

    const getMeta = () => runtimeService.getRuntimeBundleMeta(sessionId);

    registerAttachedRuntimeSession({
      handle: {
        sessionId,
        stackId: bundle.id,
        origin: 'attached',
        writable: false,
        getBundleMeta: getMeta,
        renderSurface(surfaceId, state) {
          return runtimeService.renderRuntimeSurface(sessionId, surfaceId, state);
        },
        eventSurface(surfaceId, handler, args, state) {
          return runtimeService.eventRuntimeSurface(sessionId, surfaceId, handler, args, state);
        },
        defineSurface() {
          throw new Error(`Attached runtime session ${sessionId} is read-only`);
        },
        defineSurfaceRender() {
          throw new Error(`Attached runtime session ${sessionId} is read-only`);
        },
        defineSurfaceHandler() {
          throw new Error(`Attached runtime session ${sessionId} is read-only`);
        },
        dispose() {
          return false;
        },
      },
      summary: {
        sessionId,
        stackId: bundle.id,
        packageIds: [...getMeta().packageIds],
        surfaces: [...getMeta().surfaces],
        surfaceTypes: getMeta().surfaceTypes ? { ...getMeta().surfaceTypes } : undefined,
        title: getMeta().title,
        description: getMeta().description,
        origin: 'attached',
        writable: false,
      },
    });

    registerAttachedJsSession({
      handle: {
        sessionId,
        stackId: bundle.id,
        origin: 'attached-runtime',
        writable: true,
        evaluate(code) {
          return runtimeService.evaluateSessionJs(sessionId, code);
        },
        inspectGlobals() {
          return runtimeService.getSessionGlobalNames(sessionId);
        },
      },
      summary: {
        sessionId,
        stackId: bundle.id,
        title: getMeta().title,
        origin: 'attached-runtime',
        writable: true,
      },
    });

    return () => {
      unregisterAttachedJsSession(sessionId);
      unregisterAttachedRuntimeSession(sessionId);
    };
  }, [bundle.id, isPreview, pluginConfig, runtimeSession, sessionId]);

  useEffect(() => {
    if (!pluginConfig) {
      return;
    }

    return () => {
      const runtimeService = runtimeServiceRef.current;
      runtimeService?.disposeSession(sessionId);
      loadedBundleRef.current = null;
      dispatch(removeRuntimeSession({ sessionId }));
    };
  }, [dispatch, pluginConfig, sessionId]);

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

  const renderOutcome = useMemo<{ tree: unknown | null; error: string | null }>(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
      return { tree: null, error: null };
    }

    const projectedState = projectState();

    try {
      return {
        tree: (() => {
          const runtimeSurface = getPendingRuntimeSurfaces().find((surface) => surface.surfaceId === currentSurfaceId);
          const packId = normalizeRuntimeSurfaceTypeId(runtimeSurface?.packId ?? loadedBundleRef.current?.surfaceTypes?.[currentSurfaceId]);
          const rawTree = runtimeServiceRef.current?.renderRuntimeSurface(sessionId, currentSurfaceId, projectedState) ?? null;
          return rawTree === null ? null : validateRuntimeSurfaceTree(packId, rawTree);
        })(),
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [currentSurfaceId, pluginConfig, projectState, runtimeSession, sessionId]);

  const tree = renderOutcome.tree;
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
      if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
        return;
      }

      let actions: RuntimeAction[];
      try {
        const projectedState = projectState();
        actions = runtimeServiceRef.current?.eventRuntimeSurface(
          sessionId,
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

  if (!runtimeSession || runtimeSession.status === 'loading') {
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

  const runtimeSurface = getPendingRuntimeSurfaces().find((surface) => surface.surfaceId === currentSurfaceId);
  const packId = normalizeRuntimeSurfaceTypeId(runtimeSurface?.packId ?? loadedBundleRef.current?.surfaceTypes?.[currentSurfaceId]);

  return <>{renderRuntimeSurfaceTree(packId, tree, emitRuntimeEvent)}</>;
}
