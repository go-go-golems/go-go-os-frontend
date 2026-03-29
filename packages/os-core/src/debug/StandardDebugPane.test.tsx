// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore, type Reducer } from '@reduxjs/toolkit';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { debugReducer } from './debugSlice';
import { StandardDebugPane } from './StandardDebugPane';

const runtimeDebugPaneSpy = vi.fn();
const previousActEnvironment = (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT;

vi.mock('../components/shell/RuntimeDebugPane', () => ({
  RuntimeDebugPane: (props: unknown) => {
    runtimeDebugPaneSpy(props);
    return null;
  },
}));

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function renderWithStore(reducer: Record<string, Reducer>) {
  const store = configureStore({ reducer });
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  roots.push(root);
  act(() =>
    root.render(
      <Provider store={store}>
        <StandardDebugPane />
      </Provider>,
    ),
  );
}

afterEach(() => {
  runtimeDebugPaneSpy.mockReset();
  for (const root of roots) {
    act(() => root.unmount());
  }
  roots.length = 0;
  for (const container of containers) {
    container.remove();
  }
  containers.length = 0;
});

describe('StandardDebugPane', () => {
  it('uses runtimeSessions for the default runtime snapshot when present', () => {
    const runtimeSessionsReducer: Reducer<{ sessions: { demo: { title: string } } }> = (
      state = { sessions: { demo: { title: 'Demo Session' } } },
    ) => state;

    renderWithStore({
      debug: debugReducer,
      runtimeSessions: runtimeSessionsReducer,
    });

    expect(runtimeDebugPaneSpy).toHaveBeenCalled();
    expect(runtimeDebugPaneSpy.mock.lastCall?.[0]).toMatchObject({
      snapshot: {
        runtime: {
          sessions: {
            demo: { title: 'Demo Session' },
          },
        },
      },
    });
  });

  it('falls back to pluginCardRuntime for legacy stores', () => {
    const legacyRuntimeReducer: Reducer<{ sessions: { legacy: { title: string } } }> = (
      state = { sessions: { legacy: { title: 'Legacy Session' } } },
    ) => state;

    renderWithStore({
      debug: debugReducer,
      pluginCardRuntime: legacyRuntimeReducer,
    });

    expect(runtimeDebugPaneSpy).toHaveBeenCalled();
    expect(runtimeDebugPaneSpy.mock.lastCall?.[0]).toMatchObject({
      snapshot: {
        runtime: {
          sessions: {
            legacy: { title: 'Legacy Session' },
          },
        },
      },
    });
  });
});
