import { useCallback, useEffect, useMemo, useRef } from 'react';
import { shallowEqual, useDispatch, useSelector, useStore } from 'react-redux';
import type { CardStackDefinition } from '@hypercard/engine';
import { showToast } from '@hypercard/engine';
import {
  registerRuntimeSession,
  removeRuntimeSession,
  selectRuntimeCardState,
  selectProjectedRuntimeDomains,
  selectRuntimeSession,
  selectRuntimeSessionState,
  setRuntimeSessionStatus,
} from '../features/pluginCardRuntime';
import { selectFocusedWindowId, selectSessionCurrentNav, selectSessionNavDepth } from '@hypercard/engine/desktop-core';
import { markRuntimeCardInjectionResults } from '../hypercard/artifacts/artifactsSlice';
import type { RuntimeAction } from '../plugin-runtime/contracts';
import { getPendingRuntimeCards, hasRuntimeCard, injectPendingCardsWithReport, onRegistryChange } from '../plugin-runtime/runtimeCardRegistry';
import { QuickJSCardRuntimeService } from '../plugin-runtime/runtimeService';
import { dispatchRuntimeAction } from './pluginIntentRouting';
import { normalizeRuntimePackId, renderRuntimeTree, validateRuntimeTree } from '../runtime-packs';

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
  cardId: string;
  windowId: string;
  navDepth: number;
  currentNavParam?: string;
  focusedWindowId: string | null;
  runtimeStatus: string;
  sessionState: Record<string, unknown>;
  cardState: Record<string, unknown>;
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
      cardId: opts.cardId,
      windowId: opts.windowId,
    },
    nav: {
      current: opts.cardId,
      param: opts.currentNavParam,
      depth: opts.navDepth,
      canBack: opts.navDepth > 1,
    },
    ui: {
      focusedWindowId: opts.focusedWindowId,
      runtimeStatus: opts.runtimeStatus,
    },
    filters: opts.sessionState,
    draft: opts.cardState,
    ...projectedDomains,
  };
}

export interface PluginCardSessionHostProps {
  windowId: string;
  sessionId: string;
  stack: CardStackDefinition;
  mode?: 'interactive' | 'preview';
}

export function PluginCardSessionHost({
  windowId,
  sessionId,
  stack,
  mode = 'interactive',
}: PluginCardSessionHostProps) {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();

  const pluginConfig = useMemo(() => getPluginConfig(stack), [stack]);
  const currentNav = useSelector((state: StoreState) => selectSessionCurrentNav(state as any, sessionId));
  const navDepth = useSelector((state: StoreState) => selectSessionNavDepth(state as any, sessionId));
  const focusedWindowId = useSelector((state: StoreState) => selectFocusedWindowId(state as any));

  // Accept cards from the static stack definition OR runtime-injected cards (not in stack.cards)
  const currentCardId = currentNav?.card && (stack.cards[currentNav.card] || hasRuntimeCard(currentNav.card))
    ? currentNav.card
    : stack.homeCard;
  const runtimeSession = useSelector((state: StoreState) => selectRuntimeSession(state as any, sessionId));
  const sessionState = useSelector((state: StoreState) => selectRuntimeSessionState(state as any, sessionId));
  const cardState = useSelector((state: StoreState) => selectRuntimeCardState(state as any, sessionId, currentCardId));
  const projectedDomainKeys = useMemo(() => {
    const keys = pluginConfig?.capabilities?.domain;
    return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string' && key.length > 0) : [];
  }, [pluginConfig]);
  const projectedDomains = useSelector(
    (state: StoreState) => selectProjectedRuntimeDomains(state as any, projectedDomainKeys),
    shallowEqual,
  );

  const runtimeServiceRef = useRef<QuickJSCardRuntimeService | null>(null);
  const isPreview = mode === 'preview';
  if (!runtimeServiceRef.current) {
    runtimeServiceRef.current = new QuickJSCardRuntimeService();
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
        const bundle = await runtimeService.loadStackBundle(stack.id, sessionId, config.bundleCode);
        if (cancelled) {
          return;
        }

        dispatch(setRuntimeSessionStatus({ sessionId, status: 'ready' }));

        // Inject any runtime cards that were registered before the session loaded
        if (runtimeService) {
          const report = injectPendingCardsWithReport(runtimeService, sessionId);
          if (report.injected.length > 0 || report.failed.length > 0) {
            dispatch(
              markRuntimeCardInjectionResults({
                injectedCardIds: report.injected,
                failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
              }),
            );
          }
          if (report.injected.length > 0) {
            console.log(
              `[PluginCardSessionHost] Injected ${report.injected.length} runtime cards into ${sessionId}:`,
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
              cardId: currentCardId,
              windowId,
            }
          );
        }

        if (bundle.initialCardState && typeof bundle.initialCardState === 'object') {
          for (const [cardId, value] of Object.entries(bundle.initialCardState)) {
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
                  cardId,
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
        dispatch(setRuntimeSessionStatus({ sessionId, status: 'error', error: message }));
      }
    }

    void loadBundle();

    return () => {
      cancelled = true;
    };
  }, [dispatch, pluginConfig, runtimeSession, sessionId, stack.id, currentCardId, windowId, store]);

  // Subscribe to runtime card registry — inject new cards as they arrive
  useEffect(() => {
    if (!pluginConfig || !runtimeSession || runtimeSession.status !== 'ready') {
      return;
    }
    const runtimeService = runtimeServiceRef.current;
    if (!runtimeService) {
      return;
    }
    return onRegistryChange(() => {
      const report = injectPendingCardsWithReport(runtimeService, sessionId);
      if (report.injected.length > 0 || report.failed.length > 0) {
        dispatch(
          markRuntimeCardInjectionResults({
            injectedCardIds: report.injected,
            failed: report.failed.map((item) => ({ cardId: item.cardId, error: item.error })),
          }),
        );
      }
      if (report.injected.length > 0) {
        console.log(
          `[PluginCardSessionHost] Live-injected ${report.injected.length} runtime cards into ${sessionId}:`,
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
      dispatch(removeRuntimeSession({ sessionId }));
    };
  }, [dispatch, pluginConfig, sessionId]);

  const projectState = useCallback(
    () =>
      projectRuntimeState(projectedDomains, {
        stackId: stack.id,
        sessionId,
        cardId: currentCardId,
        windowId,
        navDepth,
        currentNavParam: currentNav?.param,
        focusedWindowId,
        runtimeStatus: runtimeSession?.status ?? 'missing',
        sessionState,
        cardState,
      }),
    [
      projectedDomains,
      stack.id,
      sessionId,
      currentCardId,
      windowId,
      navDepth,
      currentNav?.param,
      focusedWindowId,
      runtimeSession?.status,
      sessionState,
      cardState,
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
          const runtimeCard = getPendingRuntimeCards().find((card) => card.cardId === currentCardId);
          const packId = normalizeRuntimePackId(runtimeCard?.packId);
          const rawTree = runtimeServiceRef.current?.renderCard(sessionId, currentCardId, projectedState) ?? null;
          return rawTree === null ? null : validateRuntimeTree(packId, rawTree);
        })(),
        error: null,
      };
    } catch (error) {
      return {
        tree: null,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [currentCardId, pluginConfig, projectState, runtimeSession, sessionId]);

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
        actions = runtimeServiceRef.current?.eventCard(
          sessionId,
          currentCardId,
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
          cardId: currentCardId,
          windowId,
        });
      });
    },
    [
      currentCardId,
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
    return <div style={{ padding: 12 }}>No plugin output for card: {currentCardId}</div>;
  }

  const runtimeCard = getPendingRuntimeCards().find((card) => card.cardId === currentCardId);
  const packId = normalizeRuntimePackId(runtimeCard?.packId);

  return <>{renderRuntimeTree(packId, tree, emitRuntimeEvent)}</>;
}
