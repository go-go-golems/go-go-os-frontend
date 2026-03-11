import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import INVENTORY_STACK from '../plugin-runtime/fixtures/inventory-stack.vm.js?raw';
import { clearRuntimePackages, registerRuntimePackage } from '../runtime-packages';
import { clearRuntimeSurfaceTypes, registerRuntimeSurfaceType } from '../runtime-packs';
import {
  createHypercardReplDriver,
  getRuntimePackageDocsMetadata,
} from './hypercardReplDriver';

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
  clearRuntimePackages();
  clearRuntimeSurfaceTypes();
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
    });

    const sessions = await driver.execute('sessions', {
      lines: [],
      historyStack: [],
      envVars: {},
      aliases: {},
      uptimeMs: 0,
    });
    expect(sessions.lines).toEqual([
      { type: 'output', text: 'inventory@repl * — inventory (ui)' },
      { type: 'system', text: '  surfaces: lowStock' },
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
  });

  it('exposes command and package-doc completions', () => {
    const driver = createHypercardReplDriver();

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
      ]),
    );
  });
});
