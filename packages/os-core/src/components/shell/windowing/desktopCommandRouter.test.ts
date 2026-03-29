import { describe, expect, it, vi } from 'vitest';
import { routeDesktopCommand, type DesktopCommandRouteContext } from './desktopCommandRouter';

function makeContext(overrides: Partial<DesktopCommandRouteContext> = {}): DesktopCommandRouteContext {
  return {
    homeSurfaceId: 'home',
    focusedWindowId: 'window-1',
    openSurfaceWindow: vi.fn(),
    closeWindow: vi.fn(),
    tileWindows: vi.fn(),
    cascadeWindows: vi.fn(),
    ...overrides,
  };
}

describe('routeDesktopCommand', () => {
  it('opens home card for window.open.home', () => {
    const ctx = makeContext();
    const handled = routeDesktopCommand('window.open.home', ctx);

    expect(handled).toBe(true);
    expect(ctx.openSurfaceWindow).toHaveBeenCalledWith('home', { dedupe: false });
  });

  it('closes focused window for window.close-focused when focus exists', () => {
    const ctx = makeContext({ focusedWindowId: 'window-42' });
    const handled = routeDesktopCommand('window.close-focused', ctx);

    expect(handled).toBe(true);
    expect(ctx.closeWindow).toHaveBeenCalledWith('window-42');
  });

  it('does not handle window.close-focused when there is no focus', () => {
    const ctx = makeContext({ focusedWindowId: null });
    const handled = routeDesktopCommand('window.close-focused', ctx);

    expect(handled).toBe(false);
    expect(ctx.closeWindow).not.toHaveBeenCalled();
  });

  it('opens a specific surface for window.open.surface.*', () => {
    const ctx = makeContext();
    const handled = routeDesktopCommand('window.open.surface.report', ctx);

    expect(handled).toBe(true);
    expect(ctx.openSurfaceWindow).toHaveBeenCalledWith('report', { dedupe: false });
  });

  it('routes tile and cascade commands', () => {
    const ctx = makeContext();

    expect(routeDesktopCommand('window.tile', ctx)).toBe(true);
    expect(routeDesktopCommand('window.cascade', ctx)).toBe(true);
    expect(ctx.tileWindows).toHaveBeenCalledTimes(1);
    expect(ctx.cascadeWindows).toHaveBeenCalledTimes(1);
  });

  it('passes unknown commands through', () => {
    const ctx = makeContext();
    const handled = routeDesktopCommand('chat.new', ctx);

    expect(handled).toBe(false);
    expect(ctx.openSurfaceWindow).not.toHaveBeenCalled();
    expect(ctx.closeWindow).not.toHaveBeenCalled();
    expect(ctx.tileWindows).not.toHaveBeenCalled();
    expect(ctx.cascadeWindows).not.toHaveBeenCalled();
  });
});
