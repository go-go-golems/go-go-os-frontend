export interface DesktopCommandRouteContext {
  homeSurfaceId: string;
  focusedWindowId: string | null;
  openSurfaceWindow: (surfaceId: string, options?: { dedupe?: boolean }) => void;
  closeWindow: (windowId: string) => void;
  tileWindows: () => void;
  cascadeWindows: () => void;
}

/**
 * Routes built-in desktop commands and returns true when handled.
 * Unknown commands are intentionally passed through to host handlers.
 */
export function routeDesktopCommand(commandId: string, ctx: DesktopCommandRouteContext): boolean {
  if (commandId === 'window.open.home') {
    ctx.openSurfaceWindow(ctx.homeSurfaceId, { dedupe: false });
    return true;
  }

  if (commandId === 'window.close-focused' && ctx.focusedWindowId) {
    ctx.closeWindow(ctx.focusedWindowId);
    return true;
  }

  if (commandId.startsWith('window.open.surface.')) {
    const surfaceId = commandId.replace('window.open.surface.', '');
    ctx.openSurfaceWindow(surfaceId, { dedupe: false });
    return true;
  }

  if (commandId === 'window.tile') {
    ctx.tileWindows();
    return true;
  }

  if (commandId === 'window.cascade') {
    ctx.cascadeWindows();
    return true;
  }

  return false;
}
