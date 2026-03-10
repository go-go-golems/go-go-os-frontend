// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../app/createAppStore';
import type { CardStackDefinition } from '@hypercard/engine';
import { PluginCardSessionHost } from './PluginCardSessionHost';

vi.mock('../plugin-runtime/runtimeService', () => {
  class MockQuickJSCardRuntimeService {
    async loadStackBundle() {
      return {
        id: 'mock-plugin',
        title: 'Mock Plugin',
        cards: {
          home: {
            render: () => ({ kind: 'text', text: 'unused' }),
          },
        },
      };
    }

    renderCard(_sessionId: string, _cardId: string, state: unknown) {
      const root = (state ?? {}) as Record<string, unknown>;
      const inventory = (root.inventory ?? {}) as Record<string, unknown>;
      const items = Array.isArray(inventory.items) ? inventory.items : [];
      const value = items.length;
      return {
        kind: 'panel',
        children: [{ kind: 'text', text: `Count: ${value}` }],
      };
    }

    eventCard() {
      return [];
    }

    disposeSession() {
      return true;
    }
  }

  return { QuickJSCardRuntimeService: MockQuickJSCardRuntimeService };
});

const TEST_STACK: CardStackDefinition = {
  id: 'runtime-rerender-stack',
  name: 'Runtime Rerender',
  icon: '🧪',
  homeCard: 'home',
  plugin: {
    bundleCode: 'defineStackBundle(() => ({ id: "mock-plugin", title: "Mock Plugin", cards: { home: { render() { return null; } } } }));',
  },
  cards: {
    home: {
      id: 'home',
      type: 'plugin',
      title: 'Home',
      icon: '🧪',
      ui: { t: 'text', value: 'placeholder' },
    },
  },
};

function createTestStack(
  capabilities?: NonNullable<CardStackDefinition['plugin']>['capabilities'],
): CardStackDefinition {
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

describe('PluginCardSessionHost rerender invalidation', () => {
  async function renderAndUpdateCount(stack: CardStackDefinition) {
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
          <PluginCardSessionHost windowId="window:runtime-rerender" sessionId="session-rerender" stack={stack} />
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
});
