/**
 * Utility for consistent doc link interaction behavior across all surfaces.
 *
 * Determines whether a click should open in the current window or a new window
 * based on modifier keys (Cmd/Ctrl) and middle-click.
 */

/** Returns true if the click event indicates "open in new window" intent. */
export function isNewWindowClick(event: { metaKey?: boolean; ctrlKey?: boolean; button?: number }): boolean {
  // Middle click
  if (event.button === 1) return true;
  // Cmd+Click (macOS) or Ctrl+Click (Windows/Linux)
  if (event.metaKey || event.ctrlKey) return true;
  return false;
}

/**
 * Try to extract moduleId and slug from a module docs URL.
 * Expected pattern: /api/apps/{moduleId}/docs/{slug}
 * Returns undefined if the URL doesn't match.
 */
export function parseModuleDocUrl(url: string): { moduleId: string; slug: string } | undefined {
  const match = url.match(/^\/api\/apps\/([^/]+)\/docs\/(.+)$/);
  if (!match) return undefined;
  return {
    moduleId: decodeURIComponent(match[1]),
    slug: decodeURIComponent(match[2]),
  };
}

export interface DocLinkTarget {
  moduleId: string;
  slug: string;
}

export interface DocLinkHandlers {
  onClick: (event: React.MouseEvent) => void;
  onAuxClick: (event: React.MouseEvent) => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

/**
 * Creates click/context-menu handlers for a doc link.
 *
 * - Plain click: opens in current window (calls openDoc)
 * - Cmd/Ctrl+click or middle-click: opens in new window (calls openDocNewWindow)
 * - Right-click: shows context menu (calls showMenu)
 */
export function createDocLinkHandlers(
  target: DocLinkTarget,
  openDoc: (moduleId: string, slug: string) => void,
  openDocNewWindow?: (moduleId: string, slug: string) => void,
  showMenu?: (x: number, y: number, target: DocLinkTarget) => void,
): DocLinkHandlers {
  return {
    onClick: (event: React.MouseEvent) => {
      if (isNewWindowClick(event.nativeEvent) && openDocNewWindow) {
        event.preventDefault();
        openDocNewWindow(target.moduleId, target.slug);
      } else {
        openDoc(target.moduleId, target.slug);
      }
    },
    onAuxClick: (event: React.MouseEvent) => {
      if (event.button === 1 && openDocNewWindow) {
        event.preventDefault();
        openDocNewWindow(target.moduleId, target.slug);
      }
    },
    onContextMenu: (event: React.MouseEvent) => {
      if (showMenu) {
        event.preventDefault();
        showMenu(event.clientX, event.clientY, target);
      }
    },
  };
}
