import { describe, expect, it } from 'vitest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';
import { createAppRegistry } from '../registry/createAppRegistry';
import { buildLauncherIcons } from '../runtime/buildLauncherIcons';

function appModule(appId: string): LaunchableAppModule {
  return {
    manifest: {
      id: appId,
      name: `App ${appId}`,
      icon: '📦',
      launch: { mode: 'window' },
    },
    buildLaunchWindow: () => ({
      id: `window:${appId}`,
      title: appId,
      bounds: { x: 0, y: 0, w: 320, h: 200 },
      content: { kind: 'app', appKey: `${appId}:default` },
    }),
    renderWindow: () => null,
  };
}

describe('buildLauncherIcons', () => {
  it('adds default launcher folder with all app icons as members', () => {
    const registry = createAppRegistry([appModule('inventory'), appModule('todo')]);
    const icons = buildLauncherIcons(registry);

    expect(icons.map((icon) => icon.id)).toEqual(['inventory', 'todo', 'launcher.apps.folder']);
    expect(icons[0]).toMatchObject({ kind: 'app', appId: 'inventory' });
    expect(icons[1]).toMatchObject({ kind: 'app', appId: 'todo' });
    expect(icons[2]).toMatchObject({
      kind: 'folder',
      label: 'Applications',
      icon: '🗂️',
      folder: {
        memberIconIds: ['inventory', 'todo'],
      },
    });
  });

  it('supports disabling the launcher folder icon', () => {
    const registry = createAppRegistry([appModule('inventory'), appModule('todo')]);
    const icons = buildLauncherIcons(registry, { folder: false });

    expect(icons.map((icon) => icon.id)).toEqual(['inventory', 'todo']);
    expect(icons.every((icon) => icon.kind === 'app')).toBe(true);
  });

  it('filters custom folder members to known icon ids', () => {
    const registry = createAppRegistry([appModule('inventory'), appModule('todo'), appModule('crm')]);
    const icons = buildLauncherIcons(registry, {
      folder: {
        id: 'workspace',
        label: 'Workspace',
        icon: '🧰',
        memberIconIds: ['todo', 'missing', 'todo', 'inventory'],
      },
    });

    expect(icons.map((icon) => icon.id)).toEqual(['crm', 'inventory', 'todo', 'workspace']);
    expect(icons.at(-1)).toMatchObject({
      id: 'workspace',
      kind: 'folder',
      folder: {
        memberIconIds: ['todo', 'inventory'],
      },
    });
  });
});
