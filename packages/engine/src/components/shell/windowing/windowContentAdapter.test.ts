import { describe, expect, it, vi } from 'vitest';
import { renderWindowContentWithAdapters, type WindowContentAdapter } from './windowContentAdapter';

const baseWindow = {
  id: 'window:1',
  title: 'Test',
  bounds: { x: 0, y: 0, w: 200, h: 120 },
  z: 1,
  minW: 100,
  minH: 80,
  content: { kind: 'app' as const, appKey: 'app.test' },
};

const ctx = {
  bundle: {
    id: 's1',
    name: 'Stack',
    icon: '🧪',
    surfaces: {},
    homeSurface: 'home',
    plugin: {
      packageIds: [],
      bundleCode: '',
      capabilities: {},
    },
  },
  mode: 'interactive' as const,
};

describe('renderWindowContentWithAdapters', () => {
  it('uses first adapter that can render and returns non-null output', () => {
    const adapters: WindowContentAdapter[] = [
      {
        id: 'a',
        canRender: () => true,
        render: () => null,
      },
      {
        id: 'b',
        canRender: () => true,
        render: () => 'rendered-b',
      },
      {
        id: 'c',
        canRender: () => true,
        render: () => 'rendered-c',
      },
    ];

    expect(renderWindowContentWithAdapters(baseWindow, ctx, adapters)).toBe('rendered-b');
  });

  it('returns null when no adapter can render', () => {
    const adapters: WindowContentAdapter[] = [
      {
        id: 'a',
        canRender: () => false,
        render: () => 'never',
      },
    ];

    expect(renderWindowContentWithAdapters(baseWindow, ctx, adapters)).toBeNull();
  });

  it('does not call render for adapters that do not match', () => {
    const renderSpy = vi.fn(() => 'x');
    const adapters: WindowContentAdapter[] = [
      {
        id: 'a',
        canRender: () => false,
        render: renderSpy,
      },
    ];

    renderWindowContentWithAdapters(baseWindow, ctx, adapters);
    expect(renderSpy).not.toHaveBeenCalled();
  });
});
