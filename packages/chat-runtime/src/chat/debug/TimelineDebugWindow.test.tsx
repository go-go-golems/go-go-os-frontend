// @vitest-environment jsdom
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TimelineDebugWindow } from './TimelineDebugWindow';
import type { TimelineDebugSnapshot } from './timelineDebugModel';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function renderWindow(snapshot: TimelineDebugSnapshot) {
  const store = configureStore({
    reducer: {
      timeline: (state = { byConvId: {} }) => state,
    },
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);
  const root = createRoot(container);
  roots.push(root);

  act(() => {
    root.render(
      <Provider store={store}>
        <TimelineDebugWindow conversationId={snapshot.conversationId} initialSnapshot={snapshot} />
      </Provider>,
    );
  });

  return container;
}

beforeAll(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const root of roots.splice(0)) {
    act(() => {
      root.unmount();
    });
  }
  for (const container of containers.splice(0)) {
    container.remove();
  }
});

describe('TimelineDebugWindow', () => {
  it('copies the selected entity from the detail pane', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const container = renderWindow({
      conversationId: 'conv-copy',
      exportedAt: '2026-03-06T00:00:00.000Z',
      summary: {
        entityCount: 1,
        orderCount: 1,
        kinds: { 'hypercard.card.v2': 1 },
      },
      timeline: {
        order: ['card-1:result'],
        entities: [
          {
            id: 'card-1:result',
            orderIndex: 0,
            kind: 'hypercard.card.v2',
            createdAt: 1,
            updatedAt: 2,
            version: 10,
            props: {
              status: 'success',
              detail: 'ready',
              result: {
                title: 'Card 1',
              },
            },
          },
        ],
      },
    });

    const row = container.querySelector('[data-part="timeline-debug-entity-row"]');
    expect(row).not.toBeNull();

    await act(async () => {
      row?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const copyPayloadButton = buttons.find((button) => button.textContent?.includes('Copy Payload'));
    expect(copyPayloadButton).toBeDefined();

    await act(async () => {
      copyPayloadButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(String(writeText.mock.calls[0]?.[0] ?? '')).toContain('id: "card-1:result"');
    expect(String(writeText.mock.calls[0]?.[0] ?? '')).toContain('conversationId: conv-copy');
  });
});
