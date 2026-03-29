import { describe, expect, it } from 'vitest';
import {
  buildContextTargetKey,
  normalizeContextTargetRef,
  resolveContextActions,
  resolveContextActionPrecedenceKeys,
  type ContextActionRegistryState,
} from './contextActionRegistry';
import type { DesktopActionEntry } from './types';

function action(id: string): DesktopActionEntry {
  return {
    id,
    label: id,
    commandId: `cmd.${id}`,
  };
}

describe('contextActionRegistry', () => {
  it('normalizes target values and builds deterministic keys', () => {
    const key = buildContextTargetKey(
      normalizeContextTargetRef({
        kind: 'message',
        windowId: ' window:1 ',
        appId: ' inventory ',
        conversationId: ' conv:1 ',
        messageId: ' msg:1 ',
      })
    );
    expect(key).toBe('kind=message|app=inventory|window=window:1|conversation=conv:1|message=msg:1');
  });

  it('resolves precedence exact -> qualifier drop -> qualified kind -> kind -> window', () => {
    const target = {
      kind: 'message' as const,
      appId: 'inventory',
      windowId: 'window:inventory:1',
      conversationId: 'conv:1',
      messageId: 'msg:1',
    };

    const keys = resolveContextActionPrecedenceKeys(target);
    expect(keys).toEqual([
      'kind=message|app=inventory|window=window:inventory:1|conversation=conv:1|message=msg:1',
      'kind=message|window=window:inventory:1|conversation=conv:1|message=msg:1',
      'kind=message|app=inventory',
      'kind=message',
      'kind=window|app=inventory|window=window:inventory:1',
      'kind=window|window=window:inventory:1',
    ]);
  });

  it('drops app and widget qualifiers for window targets so window-scoped hooks still resolve', () => {
    const target = {
      kind: 'window' as const,
      appId: 'runtime-tools',
      windowId: 'window:runtime:1',
      widgetId: 'title-bar',
    };

    const keys = resolveContextActionPrecedenceKeys(target);
    expect(keys).toEqual([
      'kind=window|app=runtime-tools|window=window:runtime:1|widget=title-bar',
      'kind=window|app=runtime-tools|window=window:runtime:1',
      'kind=window|window=window:runtime:1|widget=title-bar',
      'kind=window|window=window:runtime:1',
      'kind=window|app=runtime-tools',
      'kind=window',
    ]);

    const registry: ContextActionRegistryState = {
      [buildContextTargetKey({ kind: 'window', windowId: 'window:runtime:1' })]: {
        target: { kind: 'window', windowId: 'window:runtime:1' },
        actions: [action('inspect-window')],
      },
    };

    expect(resolveContextActions(registry, target)).toEqual([action('inspect-window')]);
  });

  it('merges entries with deterministic precedence and item-id de-duplication', () => {
    const target = {
      kind: 'message' as const,
      appId: 'inventory',
      windowId: 'window:inventory:1',
      conversationId: 'conv:1',
      messageId: 'msg:1',
    };

    const exactKey = buildContextTargetKey(target);
    const appKindKey = buildContextTargetKey({ kind: 'message', appId: 'inventory' });
    const kindKey = buildContextTargetKey({ kind: 'message' });
    const windowKey = buildContextTargetKey({ kind: 'window', windowId: 'window:inventory:1' });

    const registry: ContextActionRegistryState = {
      [windowKey]: {
        target: { kind: 'window', windowId: 'window:inventory:1' },
        actions: [action('close-window')],
      },
      [kindKey]: {
        target: { kind: 'message' },
        actions: [action('copy')],
      },
      [appKindKey]: {
        target: { kind: 'message', appId: 'inventory' },
        actions: [action('copy'), action('create-task')],
      },
      [exactKey]: {
        target,
        actions: [action('reply')],
      },
    };

    const resolved = resolveContextActions(registry, target);
    expect(resolved).toEqual([
      action('reply'),
      action('copy'),
      action('create-task'),
      action('close-window'),
    ]);
  });

  it('falls back from icon-kind specific keys to generic icon keys', () => {
    const target = {
      kind: 'icon' as const,
      iconId: 'workspace',
      iconKind: 'folder' as const,
    };

    const folderKey = buildContextTargetKey(target);
    const genericIconKey = buildContextTargetKey({ kind: 'icon', iconId: 'workspace' });

    const registry: ContextActionRegistryState = {
      [genericIconKey]: {
        target: { kind: 'icon', iconId: 'workspace' },
        actions: [action('open-generic')],
      },
      [folderKey]: {
        target,
        actions: [action('open-folder')],
      },
    };

    const resolved = resolveContextActions(registry, target);
    expect(resolved).toEqual([action('open-folder'), action('open-generic')]);
  });

  it('drops icon/widget/app qualifiers with deterministic de-duplication for icon targets', () => {
    const target = {
      kind: 'icon' as const,
      iconId: 'inventory-folder.new-chat',
      iconKind: 'app' as const,
      appId: 'inventory',
      widgetId: 'grid',
    };

    const keys = resolveContextActionPrecedenceKeys(target);
    expect(keys).toEqual([
      'kind=icon|app=inventory|icon=inventory-folder.new-chat|iconKind=app|widget=grid',
      'kind=icon|app=inventory|icon=inventory-folder.new-chat|iconKind=app',
      'kind=icon|app=inventory|icon=inventory-folder.new-chat|widget=grid',
      'kind=icon|app=inventory|icon=inventory-folder.new-chat',
      'kind=icon|icon=inventory-folder.new-chat|iconKind=app|widget=grid',
      'kind=icon|icon=inventory-folder.new-chat|iconKind=app',
      'kind=icon|icon=inventory-folder.new-chat|widget=grid',
      'kind=icon|icon=inventory-folder.new-chat',
      'kind=icon|app=inventory',
      'kind=icon',
    ]);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
