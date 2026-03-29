import { describe, expect, it, vi } from 'vitest';
import {
  composeDesktopContributions,
  mergeActionSections,
  routeContributionCommand,
  type DesktopCommandHandler,
  type DesktopContribution,
} from './desktopContributions';
import type { DesktopMenuSection } from './types';

describe('composeDesktopContributions', () => {
  it('merges menu sections by id in contribution order', () => {
    const contributions: DesktopContribution[] = [
      {
        id: 'a',
        menus: [{ id: 'file', label: 'File', items: [{ id: 'open', label: 'Open', commandId: 'file.open' }] }],
      },
      {
        id: 'b',
        menus: [{ id: 'file', label: 'File', items: [{ id: 'close', label: 'Close', commandId: 'file.close' }] }],
      },
    ];

    const composed = composeDesktopContributions(contributions);
    expect(composed.menus).toHaveLength(1);
    expect(composed.menus[0].id).toBe('file');
    expect(composed.menus[0].items.map((item) => ('separator' in item ? 'sep' : item.id))).toEqual(['open', 'close']);
  });

  it('sorts command handlers by descending priority (stable)', () => {
    const mk = (id: string, priority: number): DesktopCommandHandler => ({
      id,
      priority,
      matches: () => false,
      run: () => 'pass',
    });

    const composed = composeDesktopContributions([
      { id: 'a', commands: [mk('low', 1), mk('mid-a', 5)] },
      { id: 'b', commands: [mk('mid-b', 5), mk('high', 20)] },
    ]);

    expect(composed.commandHandlers.map((h) => h.id)).toEqual(['high', 'mid-a', 'mid-b', 'low']);
  });

  it('throws on duplicate icon ids in non-production mode', () => {
    expect(() =>
      composeDesktopContributions([
        { id: 'a', icons: [{ id: 'chat', label: 'Chat', icon: '💬' }] },
        { id: 'b', icons: [{ id: 'chat', label: 'Chat2', icon: '🧪' }] },
      ]),
    ).toThrow(/icon collision/);
  });

  it('warns and keeps first icon on collision when configured', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const composed = composeDesktopContributions(
      [
        { id: 'a', icons: [{ id: 'chat', label: 'Chat', icon: '💬' }] },
        { id: 'b', icons: [{ id: 'chat', label: 'Chat2', icon: '🧪' }] },
      ],
      { onIconCollision: 'warn' },
    );
    expect(composed.icons).toHaveLength(1);
    expect(composed.icons[0].label).toBe('Chat');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('mergeActionSections', () => {
  it('keeps stable section order and appends by default', () => {
    const merged = mergeActionSections([
      { id: 'file', label: 'File', items: [{ id: 'open', label: 'Open', commandId: 'file.open' }] },
      { id: 'window', label: 'Window', items: [{ id: 'tile', label: 'Tile', commandId: 'window.tile' }] },
      { id: 'file', label: 'File', items: [{ id: 'close', label: 'Close', commandId: 'file.close' }] },
    ]);

    expect(merged.map((section) => section.id)).toEqual(['file', 'window']);
    expect(merged[0].items.map((item) => ('separator' in item ? 'sep' : item.id))).toEqual(['open', 'close']);
  });

  it('supports replace merge mode for deterministic overrides', () => {
    const merged = mergeActionSections([
      { id: 'debug', label: 'Debug', items: [{ id: 'event', label: 'Event Viewer', commandId: 'debug.event' }] },
      {
        id: 'debug',
        label: 'Debug',
        merge: 'replace',
        items: [{ id: 'timeline', label: 'Timeline', commandId: 'debug.timeline' }],
      },
      { id: 'debug', label: 'Debug', items: [{ id: 'redux', label: 'Redux Perf', commandId: 'debug.redux' }] },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].items.map((item) => ('separator' in item ? 'sep' : item.id))).toEqual(['timeline', 'redux']);
  });

  it('accepts legacy DesktopMenuSection alias shapes unchanged', () => {
    const legacyMenus: DesktopMenuSection[] = [
      {
        id: 'file',
        label: 'File',
        items: [
          { id: 'legacy-open', label: 'Legacy Open', commandId: 'legacy.open' },
          { separator: true },
          { id: 'legacy-close', label: 'Legacy Close', commandId: 'legacy.close' },
        ],
      },
      {
        id: 'file',
        label: 'File',
        items: [{ id: 'legacy-refresh', label: 'Legacy Refresh', commandId: 'legacy.refresh' }],
      },
    ];

    const composed = composeDesktopContributions([{ id: 'legacy', menus: legacyMenus }]);
    expect(composed.menus).toHaveLength(1);
    expect(composed.menus[0].items.map((item) => ('separator' in item ? 'sep' : item.id))).toEqual([
      'legacy-open',
      'sep',
      'legacy-close',
      'legacy-refresh',
    ]);
  });
});

describe('routeContributionCommand', () => {
  it('short-circuits on first handled handler', () => {
    const first = vi.fn(() => 'handled' as const);
    const second = vi.fn(() => 'handled' as const);

    const handled = routeContributionCommand(
      'debug.open',
      [
        { id: 'first', matches: () => true, run: first },
        { id: 'second', matches: () => true, run: second },
      ],
      {
        dispatch: vi.fn(),
        focusedWindowId: null,
        openSurfaceWindow: vi.fn(),
        closeWindow: vi.fn(),
      },
    );

    expect(handled).toBe(true);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it('forwards invocation metadata to handlers', () => {
    const run = vi.fn(() => 'handled' as const);
    routeContributionCommand(
      'window.close-focused',
      [{ id: 'ctx-handler', matches: () => true, run }],
      {
        dispatch: vi.fn(),
        focusedWindowId: 'window-1',
        openSurfaceWindow: vi.fn(),
        closeWindow: vi.fn(),
      },
      { source: 'context-menu', menuId: 'window', windowId: 'window-1', widgetId: 'title-bar' },
    );

    expect(run).toHaveBeenCalledWith(
      'window.close-focused',
      expect.objectContaining({ focusedWindowId: 'window-1' }),
      expect.objectContaining({ source: 'context-menu', widgetId: 'title-bar' }),
    );
  });
});
