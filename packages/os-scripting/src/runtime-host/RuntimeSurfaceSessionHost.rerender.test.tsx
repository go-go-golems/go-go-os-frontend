// @vitest-environment jsdom
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../app/createAppStore';
import type { RuntimeBundleDefinition } from '@go-go-golems/os-core';
import { getAttachedJsSession, clearAttachedJsSessions } from '../repl/attachedJsSessionRegistry';
import { getAttachedRuntimeSession, clearAttachedRuntimeSessions } from '../repl/attachedRuntimeSessionRegistry';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';
import { RuntimeSurfaceSessionHost } from './RuntimeSurfaceSessionHost';

vi.mock('../plugin-runtime/runtimeService', () => {
  const surfaceTypeForSession = (sessionId: string) => (sessionId.includes('kanban') ? 'kanban.v1' : 'ui.card.v1');

  class MockQuickJSRuntimeService {
    health() {
      return {
        ready: true as const,
        sessions: ['session-rerender', 'session-attach', 'session-stable'],
      };
    }

    getSessionGlobalNames() {
      return ['console', 'inventory'];
    }

    evaluateSessionJs() {
      return {
        value: 3,
        valueType: 'number',
        logs: [],
      };
    }

    getRuntimeBundleMeta(sessionId: string) {
      const surfaceType = surfaceTypeForSession(sessionId);
      return {
        stackId: 'runtime-rerender-stack',
        sessionId,
        title: 'Mock Plugin',
        packageIds: ['ui'],
        surfaces: ['home'],
        surfaceTypes: {
          home: surfaceType,
        },
      };
    }

    async loadRuntimeBundle(_stackId: string, sessionId: string) {
      const surfaceType = surfaceTypeForSession(sessionId);
      return {
        stackId: 'runtime-rerender-stack',
        sessionId,
        id: 'mock-plugin',
        title: 'Mock Plugin',
        packageIds: ['ui'],
        surfaces: ['home'],
        surfaceTypes: {
          home: surfaceType,
        },
      };
    }

    renderRuntimeSurface(sessionId: string, _surfaceId: string, state: unknown) {
      if (surfaceTypeForSession(sessionId) === 'kanban.v1') {
        return {
          kind: 'kanban.page',
          title: 'Personal Planner',
          sections: [],
        };
      }
      const root = (state ?? {}) as Record<string, unknown>;
      const inventory = (root.inventory ?? {}) as Record<string, unknown>;
      const items = Array.isArray(inventory.items) ? inventory.items : [];
      const value = items.length;
      return {
        kind: 'panel',
        children: [{ kind: 'text', text: `Count: ${value}` }],
      };
    }

    eventRuntimeSurface() {
      return [];
    }

    disposeSession() {
      return true;
    }
  }

  return { QuickJSRuntimeService: MockQuickJSRuntimeService };
});

const TEST_STACK: RuntimeBundleDefinition = {
  id: 'runtime-rerender-stack',
  name: 'Runtime Rerender',
  icon: '🧪',
  homeSurface: 'home',
  plugin: {
    packageIds: ['ui'],
    bundleCode:
      'defineRuntimeBundle(() => ({ id: "mock-plugin", title: "Mock Plugin", packageIds: ["ui"], surfaces: { home: { packId: "ui.card.v1", render() { return null; } } } }));',
  },
  surfaces: {
    home: {
      id: 'home',
      type: 'plugin',
      title: 'Home',
      icon: '🧪',
      ui: { t: 'text', value: 'placeholder' },
    },
  },
};

const TEST_KANBAN_V1_RUNTIME_SURFACE_TYPE = {
  packId: 'kanban.v1',
  validateTree(value: unknown) {
    const node = value as { kind?: string; title?: string };
    if (typeof node !== 'object' || node === null || node.kind !== 'kanban.page') {
      throw new Error("root.kind 'kanban.page' is required");
    }
    return node;
  },
  render({ tree }: { tree: { title?: string } }) {
    return <div>Kanban title: {tree.title ?? 'Untitled'}</div>;
  },
} as const;

function createTestStack(
  capabilities?: NonNullable<RuntimeBundleDefinition['plugin']>['capabilities'],
): RuntimeBundleDefinition {
  return {
    ...TEST_STACK,
    plugin: {
      ...TEST_STACK.plugin!,
      capabilities,
    },
  };
}

function inventoryReducer(state = { items: [] as Array<{ sku: string }> }, action: { type: string; payload?: unknown }) {
  if (action.type === 'inventory/setItems' && Array.isArray(action.payload)) {
    return { items: action.payload as Array<{ sku: string }> };
  }
  return state;
}

const roots: Root[] = [];
const containers: HTMLElement[] = [];

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
  clearAttachedJsSessions();
  clearAttachedRuntimeSessions();
  DEFAULT_RUNTIME_SESSION_MANAGER.clear();
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
});

async function waitForText(container: HTMLElement, text: string, timeoutMs = 3000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (container.textContent?.includes(text)) {
      return;
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 15));
    });
  }
  throw new Error(`Timed out waiting for text: ${text}`);
}

describe('RuntimeSurfaceSessionHost rerender invalidation', () => {
  async function renderAndUpdateCount(stack: RuntimeBundleDefinition) {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);

    const { createStore } = createAppStore({ inventory: inventoryReducer });
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost windowId="window:runtime-rerender" sessionId="session-rerender" bundle={stack} />
        </Provider>,
      );
    });

    await waitForText(container, 'Count: 0');

    await act(async () => {
      store.dispatch({ type: 'inventory/setItems', payload: [{ sku: 'A-1' }, { sku: 'A-2' }] });
    });

    await waitForText(container, 'Count: 2');
  }

  it('rerenders when only projected domain state changes and capabilities are omitted', async () => {
    await renderAndUpdateCount(createTestStack());
  });

  it('rerenders when only projected domain state changes and capabilities.domain is all', async () => {
    await renderAndUpdateCount(createTestStack({ domain: 'all' }));
  });

  it('registers ready interactive sessions in the attached runtime registry', async () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);

    const { createStore } = createAppStore({ inventory: inventoryReducer });
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost windowId="window:runtime-attach" sessionId="session-attach" bundle={TEST_STACK} />
        </Provider>,
      );
    });

    await waitForText(container, 'Count: 0');

    const attached = getAttachedRuntimeSession('session-attach');
    expect(attached?.summary.origin).toBe('attached');
    expect(attached?.summary.writable).toBe(false);
    expect(attached?.summary.surfaces).toEqual(['home']);

    const attachedJs = getAttachedJsSession('session-attach');
    expect(attachedJs?.summary.origin).toBe('attached-runtime');
    expect(attachedJs?.handle.inspectGlobals()).toContain('console');
  });

  it('does not dispose the runtime session when the bundle prop is recreated with equivalent plugin config', async () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);

    const { createStore } = createAppStore({ inventory: inventoryReducer });
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    const firstBundle = createTestStack();

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost windowId="window:runtime-rerender" sessionId="session-stable" bundle={firstBundle} />
        </Provider>,
      );
    });

    await waitForText(container, 'Count: 0');

    const secondBundle: RuntimeBundleDefinition = {
      ...createTestStack(),
      plugin: { ...firstBundle.plugin! },
      surfaces: { ...firstBundle.surfaces },
    };

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost windowId="window:runtime-rerender" sessionId="session-stable" bundle={secondBundle} />
        </Provider>,
      );
    });

    await waitForText(container, 'Count: 0');

    const attached = getAttachedRuntimeSession('session-stable');
    expect(attached).toBeTruthy();
    expect(() => attached?.handle.getBundleMeta()).not.toThrow();
    expect(attached?.summary.title).toBe('Mock Plugin');
  });

  it('survives StrictMode remount/effect replay without losing the managed runtime session', async () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);

    const { createStore } = createAppStore({ inventory: inventoryReducer });
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <StrictMode>
          <Provider store={store}>
            <RuntimeSurfaceSessionHost windowId="window:runtime-strict" sessionId="session-strict" bundle={TEST_STACK} />
          </Provider>
        </StrictMode>,
      );
    });

    await waitForText(container, 'Count: 0');
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-strict')).not.toBeNull();
    expect(getAttachedRuntimeSession('session-strict')?.summary.sessionId).toBe('session-strict');

    await act(async () => {
      store.dispatch({ type: 'inventory/setItems', payload: [{ sku: 'B-1' }] });
    });

    await waitForText(container, 'Count: 1');
    expect(
      DEFAULT_RUNTIME_SESSION_MANAGER.listSessions().filter((entry) => entry.sessionId === 'session-strict'),
    ).toHaveLength(1);
  });

  it('rehydrates bundle metadata after host remount for non-default runtime surface packs', async () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    registerRuntimeSurfaceType(TEST_KANBAN_V1_RUNTIME_SURFACE_TYPE);

    const { createStore } = createAppStore({ inventory: inventoryReducer });
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost
            windowId="window:runtime-kanban"
            sessionId="session-kanban-remount"
            bundle={TEST_STACK}
          />
        </Provider>,
      );
    });

    await waitForText(container, 'Kanban title: Personal Planner');
    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-kanban-remount')).not.toBeNull();

    await act(async () => {
      root.render(<Provider store={store}><div>placeholder</div></Provider>);
    });

    expect(DEFAULT_RUNTIME_SESSION_MANAGER.getSession('session-kanban-remount')).not.toBeNull();

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceSessionHost
            windowId="window:runtime-kanban"
            sessionId="session-kanban-remount"
            bundle={TEST_STACK}
          />
        </Provider>,
      );
    });

    await waitForText(container, 'Kanban title: Personal Planner');
    expect(container.textContent).not.toContain("Runtime render error: root.kind 'kanban.page' is not supported");
  });
});
