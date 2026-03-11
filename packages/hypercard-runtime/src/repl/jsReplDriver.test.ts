import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAttachedJsSessions,
  registerAttachedJsSession,
} from './attachedJsSessionRegistry';
import { createJsReplDriver } from './jsReplDriver';

const CONTEXT = {
  lines: [],
  historyStack: [],
  envVars: {},
  aliases: {},
  uptimeMs: 0,
};

describe('jsReplDriver', () => {
  afterEach(() => {
    clearAttachedJsSessions();
  });

  it('spawns a session and evaluates plain JavaScript', async () => {
    const driver = createJsReplDriver();

    await expect(driver.execute(':spawn js-1', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'system', text: 'Spawned JS session js-1' }],
      envVars: {
        REPL_PROMPT: 'js[js-1]>',
      },
    });

    await expect(driver.execute('1 + 2', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: '3' }],
    });

    await expect(driver.execute('const x = 41', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'undefined' }],
    });

    await expect(driver.execute('x + 1', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: '42' }],
    });
  });

  it('lists sessions, globals, and supports reset/dispose', async () => {
    const driver = createJsReplDriver();

    await driver.execute(':spawn js-1', CONTEXT);
    await driver.execute('globalThis.answer = 41', CONTEXT);

    await expect(driver.execute(':sessions', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'js-1 * — JavaScript js-1 [spawned]' }],
    });

    const globals = await driver.execute(':globals', CONTEXT);
    expect(globals.lines[0]).toEqual({ type: 'system', text: 'Globals for js-1' });
    expect(globals.lines.some((line) => line.text === 'answer')).toBe(true);

    await expect(driver.execute(':reset', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'system', text: 'Reset JS session js-1' }],
    });
    await expect(driver.execute('typeof answer', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'undefined' }],
    });

    await expect(driver.execute(':dispose js-1', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'system', text: 'Disposed JS session js-1' }],
      envVars: {
        REPL_PROMPT: 'js>',
      },
    });
  });

  it('formats console logs and errors', async () => {
    const driver = createJsReplDriver();
    await driver.execute(':spawn js-1', CONTEXT);

    await expect(driver.execute('console.log("hello"); 7', CONTEXT)).resolves.toEqual({
      lines: [
        { type: 'system', text: 'hello' },
        { type: 'output', text: '7' },
      ],
    });

    await expect(driver.execute('throw new Error("boom")', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'error', text: 'Error: boom' }],
    });
  });

  it('exposes command and global completions plus help', async () => {
    const driver = createJsReplDriver();
    await driver.execute(':spawn js-1', CONTEXT);
    await driver.execute('globalThis.answer = 41', CONTEXT);

    expect(driver.getCompletions?.(':sp', CONTEXT)).toEqual([
      { value: ':spawn', detail: 'Spawn a blank JavaScript session.' },
    ]);

    expect(driver.getCompletions?.('ans', CONTEXT)).toEqual([
      { value: 'answer', detail: 'session global' },
    ]);

    expect(driver.getHelp?.(':spawn', CONTEXT)).toEqual([
      {
        title: ':spawn',
        detail: 'Spawn a blank JavaScript session.',
        usage: ':spawn [session-id]',
      },
    ]);
  });

  it('attaches to live runtime-backed JS sessions and blocks reset/dispose', async () => {
    registerAttachedJsSession({
      handle: {
        sessionId: 'runtime-1',
        stackId: 'inventory',
        origin: 'attached-runtime',
        writable: true,
        evaluate: (code) => ({ value: code === 'answer + 1' ? 42 : 41, valueType: 'number', logs: [] }),
        inspectGlobals: () => ['answer', 'console', 'ui'],
      },
      summary: {
        sessionId: 'runtime-1',
        stackId: 'inventory',
        title: 'Inventory Runtime',
        origin: 'attached-runtime',
        writable: true,
      },
    });

    const driver = createJsReplDriver();

    await expect(driver.execute(':sessions', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'runtime-1 — Inventory Runtime [attached-runtime]' }],
    });

    await expect(driver.execute(':attach runtime-1', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'system', text: 'Attached JS console to runtime session runtime-1' }],
      envVars: {
        REPL_PROMPT: 'js[runtime:runtime-1]>',
      },
    });

    await expect(driver.execute('answer + 1', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: '42' }],
    });

    await expect(driver.execute(':globals', CONTEXT)).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Globals for runtime-1' },
        { type: 'output', text: 'answer' },
        { type: 'output', text: 'console' },
        { type: 'output', text: 'ui' },
      ],
    });

    await expect(driver.execute(':reset runtime-1', CONTEXT)).rejects.toThrow(/cannot be reset/i);
    await expect(driver.execute(':dispose runtime-1', CONTEXT)).rejects.toThrow(/cannot be disposed/i);
  });
});
