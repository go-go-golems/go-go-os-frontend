// @vitest-environment jsdom
import { act } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { RenderEntity } from '@hypercard/chat-runtime';
import { HypercardCardRenderer } from './hypercardCard';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function createStore() {
  return configureStore({
    reducer: {
      test: (state = {}) => state,
    },
  });
}

function renderCard(entity: RenderEntity) {
  const store = createStore();
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(
      <Provider store={store}>
        <HypercardCardRenderer e={entity} ctx={{ mode: 'normal', convId: 'conv-card' }} />
      </Provider>,
    );
  });

  return container;
}

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

describe('HypercardCardRenderer', () => {
  it('renders highlighted streaming card code from the incoming payload', () => {
    const container = renderCard({
      id: 'evt-card:result',
      kind: 'hypercard.card.v2',
      createdAt: 1,
      props: {
        status: 'streaming',
        detail: 'streaming Low Stock Card',
        result: {
          title: 'Low Stock Card',
          name: 'Low Stock Card',
          data: {
            artifact: {
              id: 'artifact-card-1',
            },
            card: {
              id: 'runtime-low-stock',
              code: '({ ui }) => ({ render() { return ui.text("low stock"); } })',
            },
          },
        },
      },
      updatedAt: 2,
    });

    expect(container.textContent).toContain('Low Stock Card');
    expect(container.textContent).toContain('status: streaming');
    expect(container.textContent).toContain('({ ui }) =>');
    expect(container.textContent).toContain('ui.text("low stock")');
    expect(container.textContent).not.toContain('Open');
    expect(container.textContent).not.toContain('Edit');
    expect(container.querySelector('[data-part="syntax-highlight"]')).not.toBeNull();
  });

  it('keeps ready cards actionable once the runtime card exists', () => {
    const container = renderCard({
      id: 'evt-card-ready:result',
      kind: 'hypercard.card.v2',
      createdAt: 1,
      props: {
        status: 'success',
        detail: 'ready',
        result: {
          title: 'Inventory Drilldown',
          data: {
            artifact: {
              id: 'artifact-card-2',
            },
            card: {
              id: 'runtime-drilldown',
              code: '({ ui }) => ({ render() { return ui.text("ready"); } })',
            },
          },
        },
        runtimeCardId: 'runtime-drilldown',
        artifactId: 'artifact-card-2',
      },
      updatedAt: 2,
    });

    expect(container.textContent).toContain('Inventory Drilldown');
    expect(container.textContent).toContain('status: success');
    expect(container.textContent).toContain('ready');
    expect(container.textContent).toContain('Open');
    expect(container.textContent).toContain('Edit');
  });
});
