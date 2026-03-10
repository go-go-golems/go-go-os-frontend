/** ── Windowing state domain types ── */

export interface WindowBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type WindowContentKind = 'card' | 'app' | 'dialog';

export interface CardSessionRef {
  stackId: string;
  cardId: string;
  param?: string;
  cardSessionId: string;
}

export interface WindowContent {
  kind: WindowContentKind;
  card?: CardSessionRef;
  appKey?: string;
  dialogKey?: string;
}

export interface WindowInstance {
  id: string;
  title: string;
  icon?: string;
  bounds: WindowBounds;
  z: number;
  minW: number;
  minH: number;
  /** Floor from OpenWindowPayload — content measurement cannot go below this. */
  baseMinW: number;
  baseMinH: number;
  isDialog?: boolean;
  isResizable?: boolean;
  content: WindowContent;
  /** Optional key used for dedupe (e.g. same card id). If omitted, id is used. */
  dedupeKey?: string;
}

export interface NavEntry {
  card: string;
  param?: string;
}

export interface SessionNav {
  nav: NavEntry[];
}

export type DesktopContextMenuTargetKind = 'window' | 'icon' | 'widget' | (string & {});
export type DesktopContextMenuIconKind = 'app' | 'folder';

export interface DesktopContextMenuTarget {
  kind: DesktopContextMenuTargetKind;
  windowId?: string;
  iconId?: string;
  iconKind?: DesktopContextMenuIconKind;
  widgetId?: string;
  messageId?: string;
  conversationId?: string;
  appId?: string;
}

export interface DesktopContextMenuSeparator {
  separator: true;
}

export interface DesktopContextMenuActionItem {
  id: string;
  label: string;
  commandId?: string;
  shortcut?: string;
  disabled?: boolean;
  checked?: boolean;
  payload?: Record<string, unknown>;
}

export type DesktopContextMenuItem = DesktopContextMenuActionItem | DesktopContextMenuSeparator;

export interface DesktopContextMenuState {
  x: number;
  y: number;
  menuId: string;
  windowId: string | null;
  widgetId?: string;
  target: DesktopContextMenuTarget;
  items: DesktopContextMenuItem[];
}

export interface DesktopState {
  activeMenuId: string | null;
  selectedIconId: string | null;
  focusedWindowId: string | null;
  contextMenu: DesktopContextMenuState | null;
  zCounter: number;
}

export interface WindowingState {
  desktop: DesktopState;
  windows: Record<string, WindowInstance>;
  /** Stable insertion order for deterministic render */
  order: string[];
  /** Per-card-session navigation stacks, keyed by cardSessionId */
  sessions: Record<string, SessionNav>;
}

/** Payload for opening a new window */
export interface OpenWindowPayload {
  id: string;
  title: string;
  icon?: string;
  bounds: WindowBounds;
  minW?: number;
  minH?: number;
  isDialog?: boolean;
  isResizable?: boolean;
  content: WindowContent;
  dedupeKey?: string;
}
