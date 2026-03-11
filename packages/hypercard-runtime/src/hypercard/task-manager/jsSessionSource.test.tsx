import { describe, expect, it, vi } from 'vitest';
import { createJsSessionBroker } from '../../repl/jsSessionBroker';
import { createJsSessionTaskManagerSource } from './jsSessionSource';

describe('jsSessionTaskManagerSource', () => {
  it('derives JS-session rows from a broker', async () => {
    const broker = createJsSessionBroker();
    await broker.spawnSession({ sessionId: 'js-1', title: 'Scratch Pad' });

    const source = createJsSessionTaskManagerSource({
      sourceId: 'js-repl',
      sourceTitle: 'JavaScript REPL',
      broker,
    });

    expect(source.listRows()).toEqual([
      expect.objectContaining({
        id: 'js-1',
        kind: 'js-session',
        title: 'Scratch Pad',
        details: expect.objectContaining({
          globals: expect.any(String),
        }),
      }),
    ]);
  });

  it('routes focus, reset, and dispose actions', async () => {
    const broker = createJsSessionBroker();
    await broker.spawnSession({ sessionId: 'js-1', title: 'Scratch Pad' });
    const focusSession = vi.fn();

    const source = createJsSessionTaskManagerSource({
      sourceId: 'js-repl',
      sourceTitle: 'JavaScript REPL',
      broker,
      focusSession,
    });

    await source.invoke('focus', 'js-1');
    await source.invoke('reset', 'js-1');
    await source.invoke('dispose', 'js-1');

    expect(focusSession).toHaveBeenCalledWith('js-1');
    expect(broker.listSessions()).toHaveLength(0);
  });
});
