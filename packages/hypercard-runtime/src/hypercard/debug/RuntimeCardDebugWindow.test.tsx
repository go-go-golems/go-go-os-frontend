// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { CardStackDefinition } from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import { createAppStore } from '../../app/createAppStore';
import { registerRuntimeSession } from '../../features/runtimeSessions';
import { RuntimeCardDebugWindow } from './RuntimeCardDebugWindow';

const DEBUG_STACK: CardStackDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeCard: 'currentCard',
  plugin: { packageIds: [], bundleCode: '' },
  cards: {
    currentCard: {
      id: 'currentCard',
      type: 'plugin',
      title: 'Current Card',
      icon: '✅',
      ui: {},
      meta: {
        runtime: {
          source: 'defineRuntimeSurface("currentCard", () => ({}));',
        },
      },
    },
    cachedCard: {
      id: 'cachedCard',
      type: 'plugin',
      title: 'Cached Card',
      icon: '🧊',
      ui: {},
      meta: {
        runtime: {
          source: 'defineRuntimeSurface("cachedCard", () => ({}));',
        },
      },
    },
  },
};

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

describe('RuntimeCardDebugWindow', () => {
  it('shows only the actively running card in plugin session actions', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-1',
        stackId: 'os-launcher',
        status: 'ready',
        initialSurfaceState: {
          currentCard: { ready: true },
          cachedCard: { ready: false },
        },
      }),
    );

    store.dispatch(
      openWindow({
        id: 'window:current',
        title: 'Current Card',
        icon: '✅',
        bounds: { x: 32, y: 32, w: 320, h: 200 },
        content: {
          kind: 'card',
          card: {
            stackId: 'os-launcher',
            cardId: 'currentCard',
            cardSessionId: 'session-1',
          },
        },
      }),
    );

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeCardDebugWindow ownerAppId="hypercard-runtime-debug" stacks={[DEBUG_STACK]} />
        </Provider>,
      );
    });

    const sessionRow = Array.from(container.querySelectorAll('tr')).find((row) =>
      row.textContent?.includes('session-1'),
    );

    expect(sessionRow?.textContent).toContain('currentCard');
    expect(sessionRow?.textContent).not.toContain('cachedCard');
  });
});
