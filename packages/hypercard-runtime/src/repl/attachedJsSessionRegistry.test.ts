import { describe, expect, it, afterEach } from 'vitest';
import {
  clearAttachedJsSessions,
  getAttachedJsSession,
  listAttachedJsSessions,
  registerAttachedJsSession,
  unregisterAttachedJsSession,
} from './attachedJsSessionRegistry';

afterEach(() => {
  clearAttachedJsSessions();
});

describe('attachedJsSessionRegistry', () => {
  it('registers and looks up attached JS sessions', () => {
    registerAttachedJsSession({
      handle: {
        sessionId: 'session-1',
        stackId: 'inventory',
        origin: 'attached-runtime',
        writable: true,
        evaluate: () => ({ value: 3, valueType: 'number', logs: [] }),
        inspectGlobals: () => ['console', 'ui'],
      },
      summary: {
        sessionId: 'session-1',
        stackId: 'inventory',
        title: 'Inventory Live',
        origin: 'attached-runtime',
        writable: true,
      },
    });

    expect(getAttachedJsSession('session-1')?.summary.title).toBe('Inventory Live');
    expect(listAttachedJsSessions().map((entry) => entry.summary.sessionId)).toEqual(['session-1']);
  });

  it('unregisters attached JS sessions', () => {
    registerAttachedJsSession({
      handle: {
        sessionId: 'session-1',
        stackId: 'inventory',
        origin: 'attached-runtime',
        writable: true,
        evaluate: () => ({ value: undefined, valueType: 'undefined', logs: [] }),
        inspectGlobals: () => [],
      },
      summary: {
        sessionId: 'session-1',
        stackId: 'inventory',
        title: 'Inventory Live',
        origin: 'attached-runtime',
        writable: true,
      },
    });

    unregisterAttachedJsSession('session-1');
    expect(getAttachedJsSession('session-1')).toBeNull();
  });
});
