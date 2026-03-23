import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import {
  createHypercardReplDriver,
  getRuntimePackageDocsMetadata,
} from './hypercardReplDriver';
import { clearAttachedRuntimeSessions } from './attachedRuntimeSessionRegistry';
import { DEFAULT_RUNTIME_SESSION_MANAGER } from '../runtime-session-manager';

const TEST_UI_RUNTIME_PACKAGE = {
  packageId: 'ui',
  version: '1.0.0',
  summary: 'Test UI package',
  installPrelude: `
    registerRuntimePackageApi('ui', {
      ui: {
        panel(children = []) { return { kind: 'panel', children }; },
        text(value) { return { kind: 'text', value }; },
        button(label, props = {}) { return { kind: 'button', label, props }; }
      }
    });
  `,
  docsMetadata: {
    packId: 'ui.card.v1',
    docs: {
      files: [
        {
          package: {
            name: 'ui.card.v1',
            title: 'UI Runtime Surface Type',
            description: 'Test docs for ui package',
          },
          symbols: [
            {
              name: 'ui.panel',
              summary: 'Compose a panel node.',
            },
          ],
        },
      ],
    },
  },
  surfaceTypes: ['ui.card.v1'],
} as const;

const TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE = {
  packId: 'ui.card.v1',
  validateTree(value: unknown) {
    return value;
  },
  render() {
    return null;
  },
} as const;

beforeEach(() => {
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
  registerRuntimePackage(TEST_UI_RUNTIME_PACKAGE);
  registerRuntimeSurfaceType(TEST_UI_CARD_V1_RUNTIME_SURFACE_TYPE);
});

afterEach(() => {
  DEFAULT_RUNTIME_SESSION_MANAGER.clear();
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
  clearAttachedRuntimeSessions();
});

describe('hypercardReplDriver', () => {
  it('lists runtime packages and package docs metadata', async () => {
    const driver = createHypercardReplDriver();
    const result = await driver.execute('packages', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });

    expect(result.lines).toEqual([
      { type: 'output', text: 'ui — Test UI package' },
    ]);
    expect(getRuntimePackageDocsMetadata('ui')).toEqual(TEST_UI_RUNTIME_PACKAGE.docsMetadata);
  });

  it('spawns a broker-backed runtime session and renders surfaces', async () => {
    const driver = createHypercardReplDriver({
      bundleLibrary: {
        inventory: {
          key: 'inventory',
          title: 'Inventory fixture',
          stackId: 'inventory',
          packageIds: ['ui'],
          bundleCode: INVENTORY_STACK,
          docsMetadata: {
            packId: 'ui.card.v1',
            docs: {
              by_symbol: {
                lowStock: {
                  name: 'lowStock',
                  summary: 'Threshold-based inventory triage view for low or empty stock.',
                  prose: 'Lists items below their inventory threshold and helps route follow-up actions.',
                },
              },
            },
          },
        },
      },
    });

    await expect(
      driver.execute('spawn inventory inventory@repl', {
        lines: [],
        historyStack: [],
        envVars: {},
        aliases: {},
        uptimeMs: 0,
      }),
    ).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Spawned runtime session inventory@repl from inventory' },
        { type: 'output', text: 'surfaces: lowStock' },
      ],
      envVars: {
        REPL_PROMPT: 'hc[inventory@repl]>',
      },
    });

    const sessions = await driver.execute('sessions', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(sessions.lines).toEqual([
      { type: 'output', text: 'inventory@repl * — inventory (ui) [spawned]' },
      { type: 'system', text: '  surfaces: lowStock' },
    ]);

    const surfaces = await driver.execute('surfaces inventory@repl', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(surfaces.lines).toEqual([
      { type: 'system', text: 'Runtime surfaces for inventory@repl' },
      { type: 'output', text: 'lowStock — Threshold-based inventory triage view for low or empty stock. [ui.card.v1]' },
    ]);

    const rendered = await driver.execute(
      'render lowStock {"filters":{"filter":"all"},"draft":{"limit":2}}',
      {
        lines: [],
        historyStack: [],
        envVars: {},
        aliases: {},
        uptimeMs: 0,
      },
    );
    expect(rendered.lines[0]).toEqual({ type: 'output', text: '{' });
    expect(rendered.lines.some((line) => line.text.includes('"kind": "panel"'))).toBe(true);

    await expect(
      driver.execute('open-surface lowStock inventory@repl', {
        lines: [],
        historyStack: [],
        envVars: {},
        aliases: {},
        uptimeMs: 0,
      }),
    ).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Requested runtime surface window for inventory@repl:lowStock' },
      ],
      effects: [
        {
          type: 'open-window',
          payload: {
            kind: 'runtime-surface',
            sessionId: 'inventory@repl',
            stackId: 'inventory',
            surfaceId: 'lowStock',
            title: 'inventory:lowStock',
          },
        },
      ],
    });
  });

  it('supports inline runtime surface authoring commands', async () => {
    const driver = createHypercardReplDriver({
      bundleLibrary: {
        inventory: {
          key: 'inventory',
          title: 'Inventory fixture',
          stackId: 'inventory',
          packageIds: ['ui'],
          bundleCode: INVENTORY_STACK,
        },
      },
    });

    await driver.execute('spawn inventory inventory@authoring', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });

    await expect(
      driver.execute(
        'define-surface scratch ui.card.v1 ({ ui }) => ({ render() { return ui.text("hello scratch"); }, handlers: {} })',
        {
          lines: [],
          historyStack: [],
          envVars: {},
          aliases: {},
          uptimeMs: 0,
        },
      ),
    ).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Defined runtime surface scratch in inventory@authoring' },
        { type: 'output', text: 'surfaces: lowStock, scratch' },
      ],
    });

    const scratchRender = await driver.execute('render scratch', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(scratchRender.lines.some((line) => line.text.includes('"hello scratch"'))).toBe(true);

    await expect(
      driver.execute(
        'define-render scratch function ({ state }) { return ui.text(state.message || "patched"); }',
        {
          lines: [],
          historyStack: [],
          envVars: {},
          aliases: {},
          uptimeMs: 0,
        },
      ),
    ).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Updated render() for scratch in inventory@authoring' },
      ],
    });

    const patchedRender = await driver.execute('render scratch {"message":"patched from render"}', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(patchedRender.lines.some((line) => line.text.includes('"patched from render"'))).toBe(true);

    await expect(
      driver.execute(
        'define-handler scratch ping function ({ dispatch }) { dispatch({ type: "notify.show", payload: { message: "pong" } }); }',
        {
          lines: [],
          historyStack: [],
          envVars: {},
          aliases: {},
          uptimeMs: 0,
        },
      ),
    ).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Updated handler scratch.ping in inventory@authoring' },
      ],
    });

    const handlerResult = await driver.execute('event scratch ping', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(handlerResult.lines.some((line) => line.text.includes('"notify.show"'))).toBe(true);
  });

  it('attaches to live host-owned runtime sessions in read-only mode', async () => {
    const runtimeHandle = await DEFAULT_RUNTIME_SESSION_MANAGER.ensureSession({
      bundleId: 'inventory',
      sessionId: 'inventory@live',
      packageIds: ['ui'],
      bundleCode: INVENTORY_STACK,
    });
    runtimeHandle.attachView('window:inventory@live');
    runtimeHandle.defineSurfaceRender('lowStock', 'function () { return { kind: "panel", children: [{ kind: "text", value: "attached" }] }; }');

    const driver = createHypercardReplDriver();
    const context = {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    };

    await expect(driver.execute('attach inventory@live', context)).resolves.toEqual({
      lines: [{ type: 'system', text: 'Attached to runtime session: inventory@live (read-only)' }],
      envVars: {
        REPL_PROMPT: 'hc[inventory@live]>',
      },
    });

    await expect(driver.execute('sessions', context)).resolves.toEqual({
      lines: [
        { type: 'output', text: 'inventory@live * — inventory (ui) [attached, read-only]' },
        { type: 'system', text: '  surfaces: lowStock' },
      ],
    });

    const rendered = await driver.execute('render lowStock', context);
    expect(rendered.lines.some((line) => line.text.includes('"attached"'))).toBe(true);

    await expect(driver.execute('event lowStock ping', context)).rejects.toThrow(/read-only/i);
    await expect(
      driver.execute(
        'define-surface scratch ui.card.v1 ({ ui }) => ({ render() { return ui.text("hello"); }, handlers: {} })',
        context,
      ),
    ).rejects.toThrow(/read-only/i);
    await expect(driver.execute('open-surface lowStock', context)).resolves.toEqual({
      lines: [
        { type: 'system', text: 'Requested runtime surface window for inventory@live:lowStock (read-only attached view)' },
      ],
      effects: [
        {
          type: 'open-window',
          payload: {
            kind: 'runtime-surface',
            sessionId: 'inventory@live',
            stackId: 'inventory',
            surfaceId: 'lowStock',
            title: 'inventory:lowStock',
          },
        },
      ],
    });
  });

  it('exposes command and package-doc completions', () => {
    const driver = createHypercardReplDriver({
      bundleLibrary: {
        inventory: {
          key: 'inventory',
          title: 'Inventory fixture',
          stackId: 'inventory',
          packageIds: ['ui'],
          bundleCode: INVENTORY_STACK,
          docsMetadata: {
            packId: 'ui.card.v1',
            docs: {
              by_symbol: {
                lowStock: {
                  name: 'lowStock',
                  summary: 'Threshold-based inventory triage view for low or empty stock.',
                  prose: 'Lists items below their inventory threshold and helps route follow-up actions.',
                },
              },
            },
          },
        },
      },
    });

    expect(driver.getCompletions?.('pa', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    })).toEqual([
      { value: 'packages', detail: 'List registered runtime packages and their summaries.' },
    ]);

    expect(driver.getCompletions?.('help ', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    })).toEqual(
      expect.arrayContaining([
        { value: 'ui.card.v1', detail: 'Test docs for ui package' },
        { value: 'ui.panel', detail: 'Compose a panel node.' },
        { value: 'lowStock', detail: 'Threshold-based inventory triage view for low or empty stock.' },
      ]),
    );

    expect(driver.getHelp?.('lowStock', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    })).toEqual([
      {
        title: 'lowStock',
        detail: 'Threshold-based inventory triage view for low or empty stock.',
        usage: 'Lists items below their inventory threshold and helps route follow-up actions.',
      },
    ]);

    expect(driver.getCompletions?.('define-surface scratch ', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    })).toEqual(
      expect.arrayContaining([
        { value: 'ui.card.v1', detail: 'registered runtime surface type' },
      ]),
    );
  });

  it('executes help commands for commands and docs topics', async () => {
    const driver = createHypercardReplDriver({
      bundleLibrary: {
        inventory: {
          key: 'inventory',
          title: 'Inventory fixture',
          stackId: 'inventory',
          packageIds: ['ui'],
          bundleCode: INVENTORY_STACK,
          docsMetadata: {
            packId: 'ui.card.v1',
            docs: {
              by_symbol: {
                lowStock: {
                  name: 'lowStock',
                  summary: 'Threshold-based inventory triage view for low or empty stock.',
                },
              },
            },
          },
        },
      },
    });

    const context = {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    };

    await expect(driver.execute('help attach', context)).resolves.toEqual({
      lines: [
        { type: 'output', text: 'attach — Attach the REPL to a live host-owned runtime session in read-only mode.' },
        { type: 'system', text: '  attach <session-id>' },
      ],
    });

    await expect(driver.execute('help lowStock', context)).resolves.toEqual({
      lines: [
        { type: 'output', text: 'lowStock — Threshold-based inventory triage view for low or empty stock.' },
      ],
    });
  });
});
