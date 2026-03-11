import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import type { CardStackDefinition } from '@hypercard/engine';
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
import { dispatchRuntimeAction } from './pluginIntentRouting';
import {
  normalizeRuntimeSurfaceTypeId,
  renderRuntimeSurfaceTree,
  validateRuntimeSurfaceTree,
} from '../runtime-packs';

type StoreState = Record<string, unknown>;

function getPluginConfig(stack: CardStackDefinition) {
  if (stack.plugin && stack.plugin.bundleCode.length > 0) {
    return stack.plugin;
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
  stackId: string;
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
      stackId: opts.stackId,
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
  stack: CardStackDefinition;
  mode?: 'interactive' | 'preview';
}

export function RuntimeSurfaceSessionHost({
  windowId,
  sessionId,
  stack,
  mode = 'interactive',
}: RuntimeSurfaceSessionHostProps) {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();

  const pluginConfig = useMemo(() => getPluginConfig(stack), [stack]);
  const currentNav = useSelector((state: StoreState) => selectSessionCurrentNav(state as any, sessionId));
  const navDepth = useSelector((state: StoreState) => selectSessionNavDepth(state as any, sessionId));
  const focusedWindowId = useSelector((state: StoreState) => selectFocusedWindowId(state as any));

  // Accept surfaces from the static stack definition OR runtime-injected surfaces (not in stack.cards)
  const currentSurfaceId = currentNav?.card && (stack.cards[currentNav.card] || hasRuntimeSurface(currentNav.card))
    ? currentNav.card
    : stack.homeCard;
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
        stackId: stack.id,
        status: 'loading',
        capabilities: pluginConfig.capabilities,
      })
    );
  }, [dispatch, pluginConfig, runtimeSession, sessionId, stack.id]);

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
        const bundle = await runtimeService.loadRuntimeBundle(stack.id, sessionId, config.packageIds, config.bundleCode);
        if (cancelled) {
          return;
        }
        loadedBundleRef.current = bundle;

        dispatch(setRuntimeSessionStatus({ sessionId, status: 'ready' }));

        // Inject any runtime surfaces that were registered before the session loaded
        if (runtimeService) {
          const report = injectPendingRuntimeSurfacesWithReport(runtimeService, sessionId);
          if (report.injected.length > 0 || report.failed.length > 0) {
            dispatch(
              markRuntimeSurfaceInjectionResults({
                injectedCardIds: report.injected,
                failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
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

        if (bundle.initialSessionState && typeof bundle.initialSessionState === 'object') {
          dispatchRuntimeAction(
            {
              type: 'filters.patch',
              payload: bundle.initialSessionState,
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

        if (bundle.initialSurfaceState && typeof bundle.initialSurfaceState === 'object') {
          for (const [surfaceId, value] of Object.entries(bundle.initialSurfaceState)) {
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
  }, [dispatch, pluginConfig, runtimeSession, sessionId, stack.id, currentSurfaceId, windowId, store]);

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
            injectedCardIds: report.injected,
            failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
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
        stackId: stack.id,
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
      stack.id,
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
          const runtimeSurface = getPendingRuntimeSurfaces().find((surface) => surface.cardId === currentSurfaceId);
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
    return <div style={{ padding: 12, color: '#9f1d1d' }}>Plugin stack configuration is required for this host.</div>;
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

  const runtimeSurface = getPendingRuntimeSurfaces().find((surface) => surface.cardId === currentSurfaceId);
  const packId = normalizeRuntimeSurfaceTypeId(runtimeSurface?.packId ?? loadedBundleRef.current?.surfaceTypes?.[currentSurfaceId]);

  return <>{renderRuntimeSurfaceTree(packId, tree, emitRuntimeEvent)}</>;
}
