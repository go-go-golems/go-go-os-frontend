import { afterEach, describe, expect, it } from 'vitest';
import {
  clearAttachedJsSessions,
} from './attachedJsSessionRegistry';
import { createJsReplDriver } from './jsReplDriver';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import { TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE, TEST_UI_RUNTIME_PACKAGE } from '../testRuntimeUi';

const CONTEXT = {
  lines: [],
  historyStack: [],
  envVars: {},
  aliases: {},
  uptimeMs: 0,
};

describe('jsReplDriver', () => {
  afterEach(() => {
    DEFAULT_RUNTIME_SESSION_MANAGER.clear();
    clearAttachedJsSessions();
    clearRuntimePackages();
    clearRuntimeSurfaceTypes();
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
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    const runtimeHandle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'runtime-1',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    runtimeHandle.attachView('window:runtime-1');
    await DEFAULT_RUNTIME_SESSION_MANAGER.getSession('runtime-1')?.evaluateSessionJs('globalThis.answer = 41');

    const driver = createJsReplDriver();

    await expect(driver.execute(':sessions', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'runtime-1 — Inventory [attached-runtime]' }],
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

    const globals = await driver.execute(':globals', CONTEXT);
    expect(globals.lines[0]).toEqual({ type: 'system', text: 'Globals for runtime-1' });
    expect(globals.lines).toContainEqual({ type: 'output', text: 'answer' });
    expect(globals.lines).toContainEqual({ type: 'output', text: 'console' });
    expect(globals.lines).toContainEqual({ type: 'output', text: 'ui' });

    await expect(driver.execute(':reset runtime-1', CONTEXT)).rejects.toThrow(/cannot be reset/i);
    await expect(driver.execute(':dispose runtime-1', CONTEXT)).rejects.toThrow(/cannot be disposed/i);
  });

  it('can start already attached to a runtime-backed JS session', async () => {
    registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
    registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
    const runtimeHandle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'runtime-2',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    runtimeHandle.attachView('window:runtime-2');

    const driver = createJsReplDriver({
      initialSessionId: 'runtime-2',
      initialOrigin: 'attached-runtime',
    });

    await expect(driver.execute('typeof ui', CONTEXT)).resolves.toEqual({
      lines: [{ type: 'output', text: 'object' }],
    });
  });
});
