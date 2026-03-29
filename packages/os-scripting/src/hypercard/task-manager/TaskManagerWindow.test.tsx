// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { TaskManagerWindow } from './TaskManagerWindow';
import {
  clearTaskManagerSources,
  registerTaskManagerSource,
} from './taskManagerRegistry';
import type { TaskManagerRow, TaskManagerSource } from './types';

const roots: Root[] = [];
const containers: HTMLElement[] = [];

function createSource(options: {
  id: string;
  title: string;
  rows: TaskManagerRow[];
  invoke?: (actionId: string, rowId: string) => void | Promise<void>;
}): TaskManagerSource {
  return {
    sourceId: () => options.id,
    title: () => options.title,
    listRows: () => options.rows,
    invoke: options.invoke ?? (() => undefined),
    subscribe: () => () => undefined,
  };
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
  clearTaskManagerSources();
});

async function renderWindow() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  containers.push(container);

  const root = createRoot(container);
  roots.push(root);

  await act(async () => {
    root.render(<TaskManagerWindow />);
  });

  return container;
}

describe('TaskManagerWindow', () => {
  it('renders an empty state when no sources are registered', async () => {
    const container = await renderWindow();
    expect(container.textContent).toContain('No task-manager sources are registered yet.');
  });

  it('renders mixed runtime and js rows', async () => {
    registerTaskManagerSource(
      createSource({
        id: 'runtime',
        title: 'Runtime Sessions',
        rows: [
          {
            id: 'session-1',
            kind: 'runtime-session',
            sourceId: 'runtime',
            sourceTitle: 'Runtime Sessions',
            title: 'Inventory · home',
            status: 'ready',
            details: { bundleId: 'inventory' },
            actions: [{ id: 'open', label: 'Open', intent: 'open' }],
          },
        ],
      }),
    );
    registerTaskManagerSource(
      createSource({
        id: 'js',
        title: 'JavaScript Sessions',
        rows: [
          {
            id: 'js-1',
            kind: 'js-session',
            sourceId: 'js',
            sourceTitle: 'JavaScript Sessions',
            title: 'Scratch Pad',
            status: 'ready',
            details: { globals: '4' },
            actions: [{ id: 'focus', label: 'Focus', intent: 'focus' }],
          },
        ],
      }),
    );

    const container = await renderWindow();
    const text = container.textContent ?? '';

    expect(text).toContain('Runtime Sessions');
    expect(text).toContain('JavaScript Sessions');
    expect(text).toContain('Inventory · home');
    expect(text).toContain('Scratch Pad');
  });

  it('renders a single runtime-only source cleanly', async () => {
    registerTaskManagerSource(
      createSource({
        id: 'runtime',
        title: 'Runtime Sessions',
        rows: [
          {
            id: 'session-1',
            kind: 'runtime-session',
            sourceId: 'runtime',
            sourceTitle: 'Runtime Sessions',
            title: 'Inventory · report',
            status: 'ready',
            details: { bundleId: 'inventory' },
            actions: [{ id: 'open', label: 'Open', intent: 'open' }],
          },
        ],
      }),
    );

    const container = await renderWindow();
    expect(container.textContent).toContain('runtime-session: 1');
    expect(container.textContent).toContain('Inventory · report');
  });

  it('renders a single js-only source cleanly', async () => {
    registerTaskManagerSource(
      createSource({
        id: 'js',
        title: 'JavaScript Sessions',
        rows: [
          {
            id: 'js-1',
            kind: 'js-session',
            sourceId: 'js',
            sourceTitle: 'JavaScript Sessions',
            title: 'Sandbox',
            status: 'ready',
            details: { globals: '8' },
            actions: [{ id: 'focus', label: 'Focus', intent: 'focus' }],
          },
        ],
      }),
    );

    const container = await renderWindow();
    expect(container.textContent).toContain('js-session: 1');
    expect(container.textContent).toContain('Sandbox');
  });

  it('invokes row actions through the owning source', async () => {
    const invoke = vi.fn();
    registerTaskManagerSource(
      createSource({
        id: 'runtime',
        title: 'Runtime Sessions',
        rows: [
          {
            id: 'session-1',
            kind: 'runtime-session',
            sourceId: 'runtime',
            sourceTitle: 'Runtime Sessions',
            title: 'Inventory · home',
            status: 'ready',
            details: { bundleId: 'inventory' },
            actions: [{ id: 'inspect', label: 'Inspect', intent: 'inspect' }],
          },
        ],
        invoke,
      }),
    );

    const container = await renderWindow();
    const button = Array.from(container.querySelectorAll('button')).find((node) => node.textContent === 'Inspect');
    expect(button).toBeTruthy();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(invoke).toHaveBeenCalledWith('inspect', 'session-1');
  });
});
