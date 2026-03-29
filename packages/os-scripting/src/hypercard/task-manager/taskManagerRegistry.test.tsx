import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearTaskManagerSources,
  invokeTaskManagerAction,
  listTaskManagerRows,
  listTaskManagerSources,
  registerTaskManagerSource,
} from './taskManagerRegistry';
import type { TaskManagerRow, TaskManagerSource } from './types';

function createSource({
  id,
  title,
  rows,
  onInvoke,
}: {
  id: string;
  title: string;
  rows: TaskManagerRow[];
  onInvoke?: (actionId: string, rowId: string) => void;
}): TaskManagerSource & { __setRows(nextRows: TaskManagerRow[]): void } {
  const listeners = new Set<() => void>();
  let currentRows = rows;

  return {
    sourceId() {
      return id;
    },
    title() {
      return title;
    },
    listRows() {
      return currentRows;
    },
    invoke(actionId, rowId) {
      onInvoke?.(actionId, rowId);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    __setRows(nextRows) {
      currentRows = nextRows;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('taskManagerRegistry', () => {
  afterEach(() => {
    clearTaskManagerSources();
  });

  it('registers heterogeneous sources and flattens their rows', () => {
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
            title: 'Inventory Home',
            status: 'ready',
            actions: [],
          },
        ],
      }),
    );

    registerTaskManagerSource(
      createSource({
        id: 'js',
        title: 'JavaScript REPL',
        rows: [
          {
            id: 'js-1',
            kind: 'js-session',
            sourceId: 'js',
            sourceTitle: 'JavaScript REPL',
            title: 'Scratch',
            status: 'idle',
            actions: [],
          },
        ],
      }),
    );

    expect(listTaskManagerSources().map((source) => source.sourceId())).toEqual(['runtime', 'js']);
    expect(listTaskManagerRows().map((row) => row.id)).toEqual(['session-1', 'js-1']);
  });

  it('refreshes flattened rows when a registered source emits changes', () => {
    const source = createSource({
      id: 'js',
      title: 'JavaScript REPL',
      rows: [],
    });

    registerTaskManagerSource(source);

    source.__setRows([
      {
        id: 'js-1',
        kind: 'js-session',
        sourceId: 'js',
        sourceTitle: 'JavaScript REPL',
        title: 'Scratch',
        status: 'idle',
        actions: [],
      },
    ]);

    expect(listTaskManagerRows().map((row) => row.id)).toEqual(['js-1']);
  });

  it('routes actions back to the owning source', async () => {
    const onInvoke = vi.fn();
    registerTaskManagerSource(
      createSource({
        id: 'js',
        title: 'JavaScript REPL',
        rows: [
          {
            id: 'js-1',
            kind: 'js-session',
            sourceId: 'js',
            sourceTitle: 'JavaScript REPL',
            title: 'Scratch',
            status: 'idle',
            actions: [{ id: 'dispose', label: 'Dispose', intent: 'dispose' }],
          },
        ],
        onInvoke,
      }),
    );

    await invokeTaskManagerAction('js', 'js-1', 'dispose');

    expect(onInvoke).toHaveBeenCalledWith('dispose', 'js-1');
  });
});
