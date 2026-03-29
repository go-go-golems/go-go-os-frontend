import { afterEach, describe, expect, it, vi } from 'vitest';
import { createJsSessionBroker } from './jsSessionBroker';

describe('jsSessionBroker', () => {
  const brokers: Array<ReturnType<typeof createJsSessionBroker>> = [];

  afterEach(() => {
    for (const broker of brokers) {
      broker.clear();
    }
    brokers.length = 0;
  });

  it('spawns sessions and exposes live handles plus summaries', async () => {
    const broker = createJsSessionBroker();
    brokers.push(broker);

    const handle = await broker.spawnSession({ sessionId: 'js-1', title: 'JS One' });
    expect(handle.sessionId).toBe('js-1');
    expect(broker.getSession('js-1')).toBe(handle);

    expect(handle.eval('1 + 2')).toEqual({
      value: 3,
      valueType: 'number',
      logs: [],
    });

    const summaries = broker.listSessions();
    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toEqual(expect.objectContaining({
      sessionId: 'js-1',
      title: 'JS One',
    }));
    expect(summaries[0].globalNames).toContain('console');
  });

  it('supports reset and prelude installation through the live handle', async () => {
    const broker = createJsSessionBroker();
    brokers.push(broker);

    const handle = await broker.spawnSession({ sessionId: 'js-1' });
    handle.installPrelude('globalThis.seeded = 123');
    expect(handle.eval('seeded')).toEqual({
      value: 123,
      valueType: 'number',
      logs: [],
    });

    await handle.reset();
    expect(handle.eval('typeof seeded')).toEqual({
      value: 'undefined',
      valueType: 'string',
      logs: [],
    });
  });

  it('emits subscription updates for spawn, reset, and dispose', async () => {
    const broker = createJsSessionBroker();
    brokers.push(broker);
    const listener = vi.fn();
    const unsubscribe = broker.subscribe(listener);

    await broker.spawnSession({ sessionId: 'js-1' });
    await broker.resetSession('js-1');
    broker.disposeSession('js-1');

    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it('rejects duplicate session ids', async () => {
    const broker = createJsSessionBroker();
    brokers.push(broker);

    await broker.spawnSession({ sessionId: 'js-1' });
    await expect(broker.spawnSession({ sessionId: 'js-1' })).rejects.toThrow(/already exists/i);
  });
});
