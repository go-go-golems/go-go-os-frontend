// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { RuntimeBundleDefinition } from '@hypercard/engine';
import { openWindow } from '@hypercard/engine/desktop-core';
import { createAppStore } from '../../app/createAppStore';
import { registerRuntimeSession } from '../../features/runtimeSessions';
import { RuntimeSurfaceDebugWindow } from './RuntimeSurfaceDebugWindow';
import {
  clearRegisteredJsSessionDebugSources,
  registerJsSessionDebugSource,
} from './jsSessionDebugRegistry';
import { createJsSessionBroker } from '../../repl/jsSessionBroker';

const DEBUG_STACK: RuntimeBundleDefinition = {
  id: 'os-launcher',
  name: 'go-go-os Launcher',
  icon: '🖥️',
  homeSurface: 'currentCard',
  plugin: { packageIds: [], bundleCode: '' },
  surfaces: {
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
  clearRegisteredJsSessionDebugSources();
});

describe('RuntimeSurfaceDebugWindow', () => {
  it('shows built-in surface edit actions and only the actively running surface in session actions', async () => {
    const { createStore } = createAppStore({});
    const store = createStore();

    store.dispatch(
      registerRuntimeSession({
        sessionId: 'session-1',
        bundleId: 'os-launcher',
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
          kind: 'surface',
          surface: {
            bundleId: 'os-launcher',
            surfaceId: 'currentCard',
            surfaceSessionId: 'session-1',
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
          <RuntimeSurfaceDebugWindow ownerAppId="hypercard-runtime-debug" bundles={[DEBUG_STACK]} />
        </Provider>,
      );
    });

    const sessionRow = Array.from(container.querySelectorAll('tr')).find((row) =>
      row.textContent?.includes('session-1'),
    );
    const editButtons = Array.from(container.querySelectorAll('button')).filter((button) =>
      button.textContent?.includes('Edit'),
    );

    expect(sessionRow?.textContent).toContain('currentCard');
    expect(sessionRow?.textContent).not.toContain('cachedCard');
    expect(editButtons).toHaveLength(3);
  });

  it('shows JS-session summary and directs operators to Task Manager', async () => {
    const broker = createJsSessionBroker();
    await broker.spawnSession({ sessionId: 'js-1', title: 'Scratch Pad' });
    registerJsSessionDebugSource({
      id: 'js-repl',
      title: 'JavaScript REPL',
      broker,
    });

    const { createStore } = createAppStore({});
    const store = createStore();

    const container = document.createElement('div');
    document.body.appendChild(container);
    containers.push(container);

    const root = createRoot(container);
    roots.push(root);

    await act(async () => {
      root.render(
        <Provider store={store}>
          <RuntimeSurfaceDebugWindow ownerAppId="hypercard-runtime-debug" bundles={[DEBUG_STACK]} />
        </Provider>,
      );
    });

    const text = container.textContent ?? '';
    expect(text).toContain('JS Sessions (1)');
    expect(text).toContain('1 JS session across 1 source');
    expect(text).toContain('Open Task Manager');
  });
});
