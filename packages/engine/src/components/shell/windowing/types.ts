export interface DesktopActionItem {
  id: string;
  label: string;
  commandId: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  visibility?: DesktopActionVisibility;
  payload?: Record<string, unknown>;
}

export interface DesktopActionSeparator {
  separator: true;
}

export type DesktopActionEntry = DesktopActionItem | DesktopActionSeparator;

export type DesktopSectionMergeMode = 'append' | 'replace';

export interface DesktopActionSection {
  id: string;
  label: string;
  /** Merge behavior when another section with the same id is encountered. */
  merge?: DesktopSectionMergeMode;
  items: DesktopActionEntry[];
}

export type DesktopCommandSource = 'menu' | 'context-menu' | 'icon' | 'programmatic';

export type ContextTargetKind = 'window' | 'icon' | 'widget' | 'message' | 'conversation';
export type DesktopIconKind = 'app' | 'folder';

export interface DesktopActionVisibilityContext {
  profile?: string;
  registry?: string;
  roles?: string[];
  target?: DesktopContextTargetRef;
}

export interface DesktopVisibilityContextResolverArgs {
  state: unknown;
  target: DesktopContextTargetRef;
  invocation?: DesktopCommandInvocation;
}

export type DesktopVisibilityContextResolver = (
  args: DesktopVisibilityContextResolverArgs,
) => DesktopActionVisibilityContext;

export interface DesktopActionVisibility {
  /**
   * Only allow this action when the active profile slug matches one of these values.
   */
  allowedProfiles?: string[];
  /**
   * Only allow this action when at least one active role matches one of these values.
   */
  allowedRoles?: string[];
  /**
   * Optional custom predicate for advanced visibility checks.
   */
  when?: (context: DesktopActionVisibilityContext) => boolean;
  /**
   * Unauthorized actions are hidden by default. Use `disable` to keep them visible but disabled.
   */
  unauthorized?: 'hide' | 'disable';
}

export interface DesktopFolderIconOptions {
  /**
   * Ordered icon ids that belong to this folder.
   * Unknown ids are ignored at runtime.
   */
  memberIconIds: string[];
}

export interface DesktopContextTargetRef {
  kind: ContextTargetKind;
  windowId?: string;
  iconId?: string;
  iconKind?: DesktopIconKind;
  widgetId?: string;
  messageId?: string;
  conversationId?: string;
  appId?: string;
}

export interface DesktopCommandInvocation {
  source: DesktopCommandSource;
  menuId?: string;
  windowId?: string | null;
  widgetId?: string;
  contextTarget?: DesktopContextTargetRef;
  payload?: Record<string, unknown>;
}

export interface DesktopContextMenuOpenRequest {
  x: number;
  y: number;
  target: DesktopContextTargetRef;
  menuId?: string;
  windowId?: string | null;
  widgetId?: string;
}

// Backward-compatible menu aliases used throughout existing callers.
export type DesktopMenuItem = DesktopActionItem;
export type DesktopMenuSeparator = DesktopActionSeparator;
export type DesktopMenuEntry = DesktopActionEntry;
export type DesktopMenuSection = DesktopActionSection;

export interface DesktopIconDef {
  id: string;
  label: string;
  icon: string;
  kind?: DesktopIconKind;
  appId?: string;
  folder?: DesktopFolderIconOptions;
  /** Explicit horizontal position. When omitted, icons auto-flow in a grid. */
  x?: number;
  /** Explicit vertical position. When omitted, icons auto-flow in a grid. */
  y?: number;
}

export interface DesktopWindowDef {
  id: string;
  title: string;
  icon?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  focused?: boolean;
  isDialog?: boolean;
  isResizable?: boolean;
}
