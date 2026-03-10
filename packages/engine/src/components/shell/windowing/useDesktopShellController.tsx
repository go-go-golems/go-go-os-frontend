import {
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as debugModule from 'debug';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { clearToast, showToast } from '../../../features/notifications/notificationsSlice';
import { type NotificationsStateSlice, selectToast } from '../../../features/notifications/selectors';
import {
  selectActiveMenuId,
  selectDesktopContextMenu,
  selectFocusedWindow,
  selectSelectedIconId,
  selectWindowsByZ,
  type WindowingStateSlice,
} from '../../../desktop/core/state/selectors';
import type {
  DesktopContextMenuItem,
  DesktopContextMenuState,
  WindowInstance,
} from '../../../desktop/core/state/types';
import {
  clearDesktopTransient,
  closeDesktopContextMenu,
  closeWindow,
  focusWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  updateWindowMinSize,
  setDesktopContextMenu,
  setActiveMenu,
  setSelectedIcon,
} from '../../../desktop/core/state/windowingSlice';
import {
  applyActionVisibility,
  isContextCommandAllowed,
} from './contextActionVisibility';
import {
  buildContextTargetKey,
  normalizeContextTargetRef,
  resolveContextActionPrecedenceKeys,
  resolveContextActions,
  type ContextActionRegistryState,
} from './contextActionRegistry';
import {
  composeDesktopContributions,
  mergeActionSections,
  routeContributionCommand,
  type DesktopCommandContext,
} from './desktopContributions';
import {
  createAppWindowContentAdapter,
  createFallbackWindowContentAdapter,
} from './defaultWindowContentAdapters';
import { dragOverlayStore, useDragOverlaySnapshot } from './dragOverlayStore';
import type { ContentMinSize } from './useContentMinSize';
import { routeDesktopCommand } from './desktopCommandRouter';
import type { DesktopShellProps } from './desktopShellTypes';
import type {
  DesktopActionEntry,
  DesktopActionSection,
  DesktopCommandInvocation,
  DesktopContextMenuOpenRequest,
  DesktopContextTargetRef,
  DesktopActionVisibilityContext,
  DesktopVisibilityContextResolver,
  DesktopIconDef,
  DesktopIconKind,
  DesktopMenuSection,
  DesktopWindowDef,
} from './types';
import {
  renderWindowContentWithAdapters,
  type WindowContentAdapter,
} from './windowContentAdapter';

type DebugLogger = (formatter: string, ...args: unknown[]) => void;
type DebugFactory = (namespace: string) => DebugLogger;

const createDebug = ('default' in debugModule ? debugModule.default : debugModule) as unknown as DebugFactory;
import { useWindowInteractionController } from './useWindowInteractionController';

type ShellState = WindowingStateSlice & NotificationsStateSlice & Record<string, unknown>;
const contextActionResolveLog = createDebug('desktop:context-actions:resolve');
const contextActionOpenLog = createDebug('desktop:context-actions:open');

/** Convert windowing state WindowInstance to presentational DesktopWindowDef */
function toWindowDef(win: WindowInstance, focused: boolean): DesktopWindowDef {
  return {
    id: win.id,
    title: win.title,
    icon: win.icon,
    x: win.bounds.x,
    y: win.bounds.y,
    width: win.bounds.w,
    height: win.bounds.h,
    zIndex: win.z,
    focused,
    isDialog: win.isDialog,
    isResizable: win.isResizable,
  };
}

function getWindowBodySignature(win: WindowInstance, mode: 'interactive' | 'preview'): string {
  if (win.content.kind === 'card') {
    const card = win.content.card;
    return `card:${card?.stackId ?? ''}:${card?.cardId ?? ''}:${card?.cardSessionId ?? ''}:${card?.param ?? ''}:${mode}`;
  }

  if (win.content.kind === 'app') {
    return `app:${win.content.appKey ?? ''}:${win.id}:${mode}`;
  }

  return `dialog:${win.content.dialogKey ?? ''}:${win.title}:${win.id}:${mode}`;
}

let sessionCounter = 0;
function nextSessionId() {
  sessionCounter += 1;
  return `session-${sessionCounter}`;
}

function resolveWindowAppId(win: WindowInstance | undefined): string | undefined {
  if (!win || win.content.kind !== 'app') {
    return undefined;
  }
  const appKey = String(win.content.appKey ?? '').trim();
  if (!appKey) return undefined;
  const [appId] = appKey.split(':');
  return appId ? appId.trim() : undefined;
}

function resolveIconKind(icon: DesktopIconDef | undefined): DesktopIconKind {
  return icon?.kind === 'folder' ? 'folder' : 'app';
}

function resolveIconAppId(icon: DesktopIconDef | undefined): string | undefined {
  const explicitAppId = String(icon?.appId ?? '').trim();
  if (explicitAppId) return explicitAppId;
  const normalizedIconId = String(icon?.id ?? '').trim();
  if (!normalizedIconId || resolveIconKind(icon) === 'folder') return undefined;
  const [dotPrefix] = normalizedIconId.split('.');
  if (dotPrefix) return dotPrefix.trim();
  return normalizedIconId;
}

function getCommandSuffix(commandId: string, prefix: string): string | null {
  if (!commandId.startsWith(prefix)) return null;
  const suffix = commandId.slice(prefix.length).trim();
  return suffix.length > 0 ? suffix : null;
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

function compareIconsByLabel(a: DesktopIconDef, b: DesktopIconDef): number {
  const aKindRank = resolveIconKind(a) === 'folder' ? 1 : 0;
  const bKindRank = resolveIconKind(b) === 'folder' ? 1 : 0;
  if (aKindRank !== bKindRank) return aKindRank - bKindRank;
  const byLabel = a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
  if (byLabel !== 0) return byLabel;
  return a.id.localeCompare(b.id);
}

function resolveFolderMemberIconIds(
  folderIcon: DesktopIconDef,
  iconsById: Record<string, DesktopIconDef>,
  iconsInOrder: DesktopIconDef[],
): string[] {
  const members = folderIcon.folder?.memberIconIds;
  if (Array.isArray(members) && members.length > 0) {
    const seen = new Set<string>();
    const orderedMembers: string[] = [];
    for (const rawId of members) {
      const memberId = String(rawId ?? '').trim();
      if (!memberId || memberId === folderIcon.id || seen.has(memberId)) {
        continue;
      }
      const memberIcon = iconsById[memberId];
      if (!memberIcon || resolveIconKind(memberIcon) === 'folder') {
        continue;
      }
      seen.add(memberId);
      orderedMembers.push(memberId);
    }
    return orderedMembers;
  }

  return iconsInOrder
    .filter((icon) => icon.id !== folderIcon.id && resolveIconKind(icon) !== 'folder')
    .map((icon) => icon.id);
}

const resolveDefaultActionVisibilityContext: DesktopVisibilityContextResolver = ({ target }) => {
  return { target };
};

function buildRawContextMenuItemsForTarget(args: {
  target: DesktopContextTargetRef;
  contextActionsByTargetKey: ContextActionRegistryState;
  iconsById: Record<string, DesktopIconDef>;
  windowsById: Record<string, WindowInstance>;
}): DesktopActionEntry[] {
  const { target, contextActionsByTargetKey, iconsById, windowsById } = args;

  if (target.kind === 'icon') {
    const iconId = String(target.iconId ?? '').trim();
    if (!iconId) {
      return [];
    }
    const icon = iconsById[iconId];
    const iconKind = resolveIconKind(icon);
    const dynamicActions = resolveContextActions(contextActionsByTargetKey, target);
    const defaults: DesktopActionEntry[] =
      iconKind === 'folder'
        ? [
            { id: `folder-context.open.${iconId}`, label: 'Open', commandId: `folder.open.${iconId}` },
            {
              id: `folder-context.open-new.${iconId}`,
              label: 'Open in New Window',
              commandId: `folder.open-new.${iconId}`,
            },
            { separator: true },
            {
              id: `folder-context.launch-all.${iconId}`,
              label: 'Launch All',
              commandId: `folder.launch-all.${iconId}`,
            },
            {
              id: `folder-context.sort-icons.${iconId}`,
              label: 'Sort Icons',
              commandId: `folder.sort-icons.${iconId}`,
            },
          ]
        : [
            { id: `icon-context.open.${iconId}`, label: 'Open', commandId: `icon.open.${iconId}` },
            {
              id: `icon-context.open-new.${iconId}`,
              label: 'Open New',
              commandId: `icon.open-new.${iconId}`,
            },
            { separator: true },
            { id: `icon-context.pin.${iconId}`, label: 'Pin', commandId: `icon.pin.${iconId}` },
            { id: `icon-context.inspect.${iconId}`, label: 'Inspect', commandId: `icon.inspect.${iconId}` },
          ];

    return dynamicActions.length > 0 ? [...dynamicActions, { separator: true }, ...defaults] : defaults;
  }

  if (target.kind === 'window') {
    const windowId = target.windowId ?? '';
    const win = windowsById[windowId];
    if (!win) {
      return [];
    }
    const dynamicActions = resolveContextActions(contextActionsByTargetKey, target);
    const closeEntry: DesktopActionEntry = {
      id: `window-context.close.${windowId}`,
      label: 'Close Window',
      commandId: 'window.close-focused',
    };
    if (win.isDialog) {
      return dynamicActions.length > 0 ? [...dynamicActions, { separator: true }, closeEntry] : [closeEntry];
    }
    const defaults: DesktopActionEntry[] = [
      closeEntry,
      { separator: true },
      { id: `window-context.tile.${windowId}`, label: 'Tile Windows', commandId: 'window.tile' },
      { id: `window-context.cascade.${windowId}`, label: 'Cascade Windows', commandId: 'window.cascade' },
    ];
    return dynamicActions.length > 0 ? [...dynamicActions, { separator: true }, ...defaults] : defaults;
  }

  return resolveContextActions(contextActionsByTargetKey, target);
}

function isContextMenuSeparator(entry: DesktopActionEntry): entry is { separator: true } {
  return 'separator' in entry && entry.separator === true;
}

function sanitizeContextMenuItems(items: DesktopActionEntry[]): DesktopContextMenuItem[] {
  return items.map((entry) => {
    if (isContextMenuSeparator(entry)) {
      return { separator: true };
    }
    return {
      id: entry.id,
      label: entry.label,
      commandId: entry.commandId,
      shortcut: entry.shortcut,
      disabled: entry.disabled,
      checked: entry.checked,
      payload: entry.payload,
    };
  });
}

export interface DesktopShellControllerResult {
  themeClass?: string;
  menus: DesktopMenuSection[];
  icons: DesktopIconDef[];
  activeMenuId: string | null;
  selectedIconId: string | null;
  windows: DesktopWindowDef[];
  toast: string | null;
  onDesktopBackgroundClick: (event: MouseEvent<HTMLDivElement>) => void;
  onActiveMenuChange: (id: string | null) => void;
  onCommand: (commandId: string, invocation?: DesktopCommandInvocation) => void;
  onSelectIcon: (id: string) => void;
  onOpenIcon: (id: string) => void;
  onIconContextMenu: (iconId: string, event: MouseEvent<HTMLButtonElement>) => void;
  onFocusWindow: (id: string) => void;
  onCloseWindow: (id: string) => void;
  onWindowDragStart: (windowId: string, event: PointerEvent<HTMLDivElement>) => void;
  onWindowResizeStart: (windowId: string, event: PointerEvent<HTMLButtonElement>) => void;
  onWindowContextMenu: (windowId: string, event: MouseEvent<HTMLElement>, source: 'surface' | 'title-bar') => void;
  renderWindowBody: (window: DesktopWindowDef) => ReactNode;
  contextMenu: DesktopContextMenuState | null;
  onContextMenuClose: () => void;
  onContextMenuSelect: (item: string) => void;
  onContextMenuAction: (entry: { commandId?: string; payload?: Record<string, unknown>; id?: string }) => void;
  openContextMenu: (request: DesktopContextMenuOpenRequest) => void;
  registerWindowMenuSections: (windowId: string, sections: DesktopActionSection[]) => void;
  unregisterWindowMenuSections: (windowId: string) => void;
  registerContextActions: (target: DesktopContextTargetRef, actions: DesktopActionEntry[]) => void;
  unregisterContextActions: (target: DesktopContextTargetRef) => void;
  registerWindowContextActions: (windowId: string, actions: DesktopActionEntry[]) => void;
  unregisterWindowContextActions: (windowId: string) => void;
  onContentMinSize: (windowId: string, size: ContentMinSize) => void;
  onToastDone: () => void;
}

export function useDesktopShellController({
  stack,
  mode = 'interactive',
  themeClass,
  homeParam,
  menus: menusProp,
  icons: iconsProp,
  renderAppWindow,
  onCommand: onCommandProp,
  visibilityContextResolver,
  contributions,
}: DesktopShellProps): DesktopShellControllerResult {
  const dispatch = useDispatch();
  const store = useStore();
  const lastOpenedHomeKeyRef = useRef<string | null>(null);
  const windowBodyCacheRef = useRef<Map<string, { signature: string; body: ReactNode }>>(new Map());
  const windows = useSelector((s: ShellState) => selectWindowsByZ(s));
  const focusedWin = useSelector((s: ShellState) => selectFocusedWindow(s));
  const activeMenuId = useSelector((s: ShellState) => selectActiveMenuId(s));
  const selectedIconId = useSelector((s: ShellState) => selectSelectedIconId(s));
  const contextMenu = useSelector((s: ShellState) => selectDesktopContextMenu(s));
  const toast = useSelector((s: ShellState) => selectToast(s));
  const dragOverlay = useDragOverlaySnapshot();
  const focusedWindowId = focusedWin?.id ?? null;
  const [windowMenuSectionsById, setWindowMenuSectionsById] = useState<Record<string, DesktopActionSection[]>>({});
  const [contextActionsByTargetKey, setContextActionsByTargetKey] = useState<ContextActionRegistryState>({});
  const [iconSortMode, setIconSortMode] = useState<'default' | 'label-asc'>('default');
  const composedContributions = useMemo(() => composeDesktopContributions(contributions), [contributions]);

  const defaultIcons = useMemo(() => {
    const cardIds = Object.keys(stack.cards);
    return cardIds.map((cardId) => ({
      id: cardId,
      label: stack.cards[cardId].title ?? cardId,
      icon: stack.cards[cardId].icon ?? '📄',
    }));
  }, [stack.cards]);

  const defaultMenus = useMemo((): DesktopMenuSection[] => {
    return [
      {
        id: 'file',
        label: 'File',
        items: [
          {
            id: 'new-home',
            label: `New ${stack.cards[stack.homeCard]?.title ?? 'Home'} Window`,
            commandId: 'window.open.home',
            shortcut: 'Ctrl+N',
          },
          { id: 'close-focused', label: 'Close Window', commandId: 'window.close-focused', shortcut: 'Ctrl+W' },
        ],
      },
      {
        id: 'cards',
        label: 'Cards',
        items: Object.keys(stack.cards).map((cardId) => ({
          id: `open-${cardId}`,
          label: `${stack.cards[cardId].icon ?? ''} ${stack.cards[cardId].title ?? cardId}`.trim(),
          commandId: `window.open.card.${cardId}`,
        })),
      },
      {
        id: 'window',
        label: 'Window',
        items: [
          { id: 'tile', label: 'Tile Windows', commandId: 'window.tile' },
          { id: 'cascade', label: 'Cascade Windows', commandId: 'window.cascade' },
        ],
      },
    ];
  }, [stack.cards, stack.homeCard]);

  const baseIcons = useMemo(() => {
    if (iconsProp) return iconsProp;
    return composedContributions.icons.length > 0 ? composedContributions.icons : defaultIcons;
  }, [composedContributions.icons, defaultIcons, iconsProp]);

  const icons = useMemo(() => {
    if (iconSortMode === 'default') {
      return baseIcons;
    }
    return [...baseIcons].sort(compareIconsByLabel);
  }, [baseIcons, iconSortMode]);

  const iconsById = useMemo(() => {
    const byId: Record<string, DesktopIconDef> = {};
    for (const icon of icons) {
      byId[icon.id] = icon;
    }
    return byId;
  }, [icons]);

  const baseMenus = useMemo((): DesktopMenuSection[] => {
    if (menusProp) return menusProp;
    return composedContributions.menus.length > 0 ? composedContributions.menus : defaultMenus;
  }, [composedContributions.menus, defaultMenus, menusProp]);

  const focusedWindowRuntimeMenus = useMemo(
    () => (focusedWindowId ? windowMenuSectionsById[focusedWindowId] ?? [] : []),
    [focusedWindowId, windowMenuSectionsById],
  );

  const menus = useMemo(
    () => mergeActionSections([...baseMenus, ...focusedWindowRuntimeMenus]),
    [baseMenus, focusedWindowRuntimeMenus],
  );

  useEffect(() => {
    const homeCard = stack.cards[stack.homeCard];
    if (!homeCard) return;
    const homeKey = `${stack.id}:${stack.homeCard}:${homeParam ?? ''}`;
    if (lastOpenedHomeKeyRef.current === homeKey) return;
    lastOpenedHomeKeyRef.current = homeKey;

    const sid = nextSessionId();
    dispatch(
      openWindow({
        id: `window:${stack.homeCard}:${sid}`,
        title: homeCard.title ?? stack.homeCard,
        icon: homeCard.icon,
        bounds: { x: 140, y: 20, w: 420, h: 340 },
        content: {
          kind: 'card',
          card: { stackId: stack.id, cardId: stack.homeCard, cardSessionId: sid, param: homeParam },
        },
        dedupeKey: stack.homeCard,
      }),
    );
  }, [dispatch, homeParam, stack.id, stack.homeCard, stack.cards]);

  const lastOpenedStartupKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (composedContributions.startupWindows.length === 0) return;
    const startupKey = `${stack.id}:${homeParam ?? ''}:${composedContributions.startupWindows.map((w) => w.id).join('|')}`;
    if (lastOpenedStartupKeyRef.current === startupKey) return;
    lastOpenedStartupKeyRef.current = startupKey;

    for (const startup of composedContributions.startupWindows) {
      const payload = startup.create({ stack, homeParam });
      if (payload) dispatch(openWindow(payload));
    }
  }, [composedContributions.startupWindows, dispatch, homeParam, stack]);

  const windowDefs = useMemo(() => {
    return windows.map((w) => {
      const overlayDraft = dragOverlay.draftsById[w.id];
      if (overlayDraft) {
        return {
          ...toWindowDef(w, w.id === focusedWin?.id),
          x: overlayDraft.x,
          y: overlayDraft.y,
          width: overlayDraft.width,
          height: overlayDraft.height,
        };
      }
      return toWindowDef(w, w.id === focusedWin?.id);
    });
  }, [dragOverlay.draftsById, focusedWin?.id, windows]);

  const windowDefsById = useMemo(() => {
    const byId: Record<string, DesktopWindowDef> = {};
    for (const win of windowDefs) byId[win.id] = win;
    return byId;
  }, [windowDefs]);
  const windowDefsByIdRef = useRef(windowDefsById);
  useEffect(() => {
    windowDefsByIdRef.current = windowDefsById;
  }, [windowDefsById]);

  const windowsById = useMemo(() => {
    const byId: Record<string, WindowInstance> = {};
    for (const win of windows) byId[win.id] = win;
    return byId;
  }, [windows]);

  useEffect(() => {
    const openWindowIds = new Set(windows.map((w) => w.id));
    setWindowMenuSectionsById((prev) => {
      let changed = false;
      const next: Record<string, DesktopActionSection[]> = {};
      for (const [windowId, sections] of Object.entries(prev)) {
        if (!openWindowIds.has(windowId)) {
          changed = true;
          continue;
        }
        next[windowId] = sections;
      }
      return changed ? next : prev;
    });
    setContextActionsByTargetKey((prev) => {
      let changed = false;
      const next: ContextActionRegistryState = {};
      for (const [targetKey, entry] of Object.entries(prev)) {
        const targetWindowId = entry.target.windowId;
        if (targetWindowId && !openWindowIds.has(targetWindowId)) {
          changed = true;
          continue;
        }
        next[targetKey] = entry;
      }
      return changed ? next : prev;
    });
  }, [windows]);

  const registerWindowMenuSections = useCallback((windowId: string, sections: DesktopActionSection[]) => {
    setWindowMenuSectionsById((prev) => {
      const current = prev[windowId];
      if (current === sections) {
        return prev;
      }
      return { ...prev, [windowId]: sections };
    });
  }, []);

  const unregisterWindowMenuSections = useCallback((windowId: string) => {
    setWindowMenuSectionsById((prev) => {
      if (!(windowId in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[windowId];
      return next;
    });
  }, []);

  const registerContextActions = useCallback((target: DesktopContextTargetRef, actions: DesktopActionEntry[]) => {
    const normalizedTarget = normalizeContextTargetRef(target);
    const targetKey = buildContextTargetKey(normalizedTarget);
    setContextActionsByTargetKey((prev) => {
      const current = prev[targetKey];
      if (current?.actions === actions) {
        return prev;
      }
      return {
        ...prev,
        [targetKey]: {
          target: normalizedTarget,
          actions,
        },
      };
    });
  }, []);

  const unregisterContextActions = useCallback((target: DesktopContextTargetRef) => {
    const normalizedTarget = normalizeContextTargetRef(target);
    const targetKey = buildContextTargetKey(normalizedTarget);
    setContextActionsByTargetKey((prev) => {
      if (!(targetKey in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[targetKey];
      return next;
    });
  }, []);

  const registerWindowContextActions = useCallback(
    (windowId: string, actions: DesktopActionEntry[]) => {
      registerContextActions({ kind: 'window', windowId }, actions);
    },
    [registerContextActions]
  );

  const unregisterWindowContextActions = useCallback(
    (windowId: string) => {
      unregisterContextActions({ kind: 'window', windowId });
    },
    [unregisterContextActions]
  );

  const handleFocus = useCallback(
    (id: string) => {
      if (id === focusedWindowId) return;
      dispatch(focusWindow(id));
    },
    [dispatch, focusedWindowId],
  );
  const handleClose = useCallback(
    (id: string) => {
      dragOverlayStore.clear(id);
      dispatch(closeWindow(id));
    },
    [dispatch],
  );
  const handlePreviewMove = useCallback((id: string, next: { x: number; y: number }) => {
    const win = windowDefsByIdRef.current[id];
    if (!win) return;
    dragOverlayStore.update(id, { x: next.x, y: next.y, width: win.width, height: win.height });
  }, []);
  const handlePreviewResize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      const win = windowDefsByIdRef.current[id];
      if (!win) return;
      dragOverlayStore.update(id, {
        x: win.x,
        y: win.y,
        width: next.width,
        height: next.height,
      });
    },
    [],
  );
  const handleCommitMove = useCallback(
    (id: string, next: { x: number; y: number }) => {
      dispatch(moveWindow({ id, x: next.x, y: next.y }));
      dragOverlayStore.clear(id);
    },
    [dispatch],
  );
  const handleCommitResize = useCallback(
    (id: string, next: { width: number; height: number }) => {
      dispatch(resizeWindow({ id, w: next.width, h: next.height }));
      dragOverlayStore.clear(id);
    },
    [dispatch],
  );
  const handleCancelInteraction = useCallback((id: string) => {
    dragOverlayStore.clear(id);
  }, []);
  const handleBeginInteraction = useCallback(
    (id: string, interactionMode: 'move' | 'resize', initial: { x: number; y: number; width: number; height: number }) =>
      dragOverlayStore.begin(id, interactionMode, initial),
    [],
  );
  const getWindowDefById = useCallback((id: string) => windowDefsByIdRef.current[id], []);

  const getMinSizeForWindow = useCallback(
    (windowId: string) => {
      const state = store.getState() as ShellState;
      const win = state.windowing.windows[windowId];
      if (!win) return undefined;
      return { minWidth: win.minW, minHeight: win.minH };
    },
    [store],
  );

  const handleContentMinSize = useCallback(
    (windowId: string, size: ContentMinSize) => {
      dispatch(updateWindowMinSize({ id: windowId, minW: size.minW, minH: size.minH }));
    },
    [dispatch],
  );

  const { beginMove, beginResize } = useWindowInteractionController({
    getWindowById: getWindowDefById,
    onBeginWindowInteraction: handleBeginInteraction,
    onMoveWindow: handlePreviewMove,
    onResizeWindow: handlePreviewResize,
    onCommitMoveWindow: handleCommitMove,
    onCommitResizeWindow: handleCommitResize,
    onCancelWindowInteraction: handleCancelInteraction,
    onFocusWindow: handleFocus,
    constraints: { minX: 0, minY: 0, minWidth: 220, minHeight: 140 },
    getMinSizeForWindow,
  });

  useEffect(() => {
    return () => dragOverlayStore.clearAll();
  }, []);

  useEffect(() => {
    dragOverlayStore.pruneMissing(windows.map((w) => w.id));
  }, [windows]);

  const openCardWindow = useCallback(
    (cardId: string, options?: { dedupe?: boolean }) => {
      const cardDef = stack.cards[cardId];
      if (!cardDef) return;
      const sid = nextSessionId();
      dispatch(
        openWindow({
          id: `window:${cardId}:${sid}`,
          title: cardDef.title ?? cardId,
          icon: cardDef.icon,
          bounds: { x: 160 + (sessionCounter % 5) * 32, y: 30 + (sessionCounter % 4) * 24, w: 420, h: 340 },
          content: {
            kind: 'card',
            card: { stackId: stack.id, cardId, cardSessionId: sid },
          },
          dedupeKey: options?.dedupe ? cardId : undefined,
        }),
      );
    },
    [dispatch, stack.id, stack.cards],
  );

  const createContributionCommandContext = useCallback(
    (): DesktopCommandContext => ({
      dispatch,
      getState: () => store.getState(),
      focusedWindowId: focusedWin?.id ?? null,
      openCardWindow,
      closeWindow: handleClose,
    }),
    [dispatch, focusedWin?.id, handleClose, openCardWindow, store],
  );

  const routeIconOpenCommand = useCallback(
    (iconId: string, options: { newWindow: boolean; invocation: DesktopCommandInvocation }): boolean => {
      const normalizedIconId = String(iconId ?? '').trim();
      if (!normalizedIconId) {
        return false;
      }

      if (stack.cards[normalizedIconId]) {
        openCardWindow(normalizedIconId, { dedupe: false });
        return true;
      }

      const commandContext = createContributionCommandContext();
      if (options.newWindow) {
        const explicitOpenNewHandled = routeContributionCommand(
          `icon.open-new.${normalizedIconId}`,
          composedContributions.commandHandlers,
          commandContext,
          options.invocation,
        );
        if (explicitOpenNewHandled) {
          return true;
        }
      }

      return routeContributionCommand(
        `icon.open.${normalizedIconId}`,
        composedContributions.commandHandlers,
        commandContext,
        options.invocation,
      );
    },
    [composedContributions.commandHandlers, createContributionCommandContext, openCardWindow, stack.cards],
  );

  const resolveFolderMembers = useCallback(
    (folderIconId: string): string[] => {
      const folderIcon = iconsById[folderIconId];
      if (!folderIcon || resolveIconKind(folderIcon) !== 'folder') {
        return [];
      }
      return resolveFolderMemberIconIds(folderIcon, iconsById, icons);
    },
    [icons, iconsById],
  );

  const routeFolderCommand = useCallback(
    (commandId: string, invocation: DesktopCommandInvocation): boolean => {
      const folderOpenId = getCommandSuffix(commandId, 'folder.open.');
      if (folderOpenId) {
        const members = resolveFolderMembers(folderOpenId);
        return members.length > 0
          ? routeIconOpenCommand(members[0], { newWindow: false, invocation })
          : false;
      }

      const folderOpenNewId = getCommandSuffix(commandId, 'folder.open-new.');
      if (folderOpenNewId) {
        const members = resolveFolderMembers(folderOpenNewId);
        return members.length > 0
          ? routeIconOpenCommand(members[0], { newWindow: true, invocation })
          : false;
      }

      const folderLaunchAllId = getCommandSuffix(commandId, 'folder.launch-all.');
      if (folderLaunchAllId) {
        const members = resolveFolderMembers(folderLaunchAllId);
        let launchedCount = 0;
        for (const memberIconId of members) {
          if (routeIconOpenCommand(memberIconId, { newWindow: true, invocation })) {
            launchedCount += 1;
          }
        }
        return launchedCount > 0;
      }

      const folderSortIconsId = getCommandSuffix(commandId, 'folder.sort-icons.');
      if (folderSortIconsId) {
        const folderIcon = iconsById[folderSortIconsId];
        if (!folderIcon || resolveIconKind(folderIcon) !== 'folder') {
          return false;
        }
        setIconSortMode('label-asc');
        return true;
      }

      return false;
    },
    [iconsById, resolveFolderMembers, routeIconOpenCommand],
  );

  const resolveContextMenuItemsForTarget = useCallback(
    (target: DesktopContextTargetRef, invocation?: DesktopCommandInvocation): DesktopActionEntry[] => {
      const precedenceKeys = resolveContextActionPrecedenceKeys(target);
      const matchedPrecedence = precedenceKeys
        .map((key) => ({ key, count: contextActionsByTargetKey[key]?.actions.length ?? 0 }))
        .filter((entry) => entry.count > 0);
      const rawItems = buildRawContextMenuItemsForTarget({
        target,
        contextActionsByTargetKey,
        iconsById,
        windowsById,
      });
      contextActionResolveLog(
        'target=%o precedenceKeys=%o matched=%o rawItems=%d',
        target,
        precedenceKeys,
        matchedPrecedence,
        rawItems.length,
      );
      if (rawItems.length === 0) {
        return rawItems;
      }
      const visibilityContext: DesktopActionVisibilityContext = (
        visibilityContextResolver ?? resolveDefaultActionVisibilityContext
      )({
        state: store.getState(),
        target,
        invocation,
      });
      const visibleItems = applyActionVisibility(rawItems, visibilityContext);
      contextActionResolveLog(
        'target=%o visibleItems=%d roles=%o profile=%s registry=%s',
        target,
        visibleItems.length,
        visibilityContext.roles ?? [],
        visibilityContext.profile ?? '',
        visibilityContext.registry ?? '',
      );
      return visibleItems;
    },
    [contextActionsByTargetKey, iconsById, store, visibilityContextResolver, windowsById],
  );

  const routeCommand = useCallback(
    (commandId: string, invocation: DesktopCommandInvocation = { source: 'programmatic' }) => {
      if (invocation.source === 'context-menu' && invocation.contextTarget) {
        const target = normalizeContextTargetRef(invocation.contextTarget);
        const targetItems = resolveContextMenuItemsForTarget(target, invocation);
        if (!isContextCommandAllowed(targetItems, commandId)) {
          return;
        }
      }

      const contributionHandled = routeContributionCommand(
        commandId,
        composedContributions.commandHandlers,
        createContributionCommandContext(),
        invocation,
      );
      if (contributionHandled) return;

      if (routeFolderCommand(commandId, invocation)) {
        return;
      }

      const iconOpenNewId = getCommandSuffix(commandId, 'icon.open-new.');
      if (iconOpenNewId && routeIconOpenCommand(iconOpenNewId, { newWindow: true, invocation })) {
        return;
      }

      const iconOpenId = getCommandSuffix(commandId, 'icon.open.');
      if (iconOpenId && routeIconOpenCommand(iconOpenId, { newWindow: false, invocation })) {
        return;
      }

      if (commandId === 'clipboard.copy-text') {
        const text = String(invocation.payload?.text ?? invocation.payload?.content ?? '').trim();
        if (!text) {
          return;
        }
        void copyTextToClipboard(text)
          .then((copied) => {
            dispatch(showToast(copied ? 'Copied text' : 'Clipboard unavailable'));
          })
          .catch(() => {
            dispatch(showToast('Copy failed'));
          });
        return;
      }

      const handled = routeDesktopCommand(commandId, {
        homeCardId: stack.homeCard,
        focusedWindowId: focusedWin?.id ?? null,
        openCardWindow,
        closeWindow: handleClose,
        tileWindows: () => {
          dragOverlayStore.clearAll();
          windows.forEach((w, i) => {
            dispatch(moveWindow({ id: w.id, x: 140 + (i % 3) * 300, y: 10 + Math.floor(i / 3) * 260 }));
            dispatch(resizeWindow({ id: w.id, w: 280, h: 240 }));
          });
        },
        cascadeWindows: () => {
          dragOverlayStore.clearAll();
          windows.forEach((w, i) => {
            dispatch(moveWindow({ id: w.id, x: 140 + i * 36, y: 20 + i * 28 }));
            dispatch(resizeWindow({ id: w.id, w: 420, h: 340 }));
          });
        },
      });
      if (handled) return;
      onCommandProp?.(commandId, invocation);
    },
    [
      composedContributions.commandHandlers,
      createContributionCommandContext,
      dispatch,
      focusedWin?.id,
      handleClose,
      onCommandProp,
      openCardWindow,
      stack.homeCard,
      resolveContextMenuItemsForTarget,
      routeFolderCommand,
      routeIconOpenCommand,
      windows,
    ],
  );

  const handleOpenIcon = useCallback(
    (iconId: string) => {
      dispatch(setSelectedIcon(iconId));
      const icon = iconsById[iconId];
      if (resolveIconKind(icon) === 'folder') {
        routeCommand(`folder.open.${iconId}`, { source: 'icon' });
      } else {
        routeCommand(`icon.open.${iconId}`, { source: 'icon' });
      }
    },
    [dispatch, iconsById, routeCommand],
  );

  const openContextMenu = useCallback(
    (request: DesktopContextMenuOpenRequest) => {
      const normalizedTarget = normalizeContextTargetRef(request.target);
      const items = resolveContextMenuItemsForTarget(normalizedTarget);
      const resolvedMenuId = request.menuId ?? `${normalizedTarget.kind}-context`;
      contextActionOpenLog(
        'menuId=%s target=%o windowId=%s widgetId=%s items=%d',
        resolvedMenuId,
        normalizedTarget,
        request.windowId ?? normalizedTarget.windowId ?? '',
        request.widgetId ?? normalizedTarget.widgetId ?? '',
        items.length,
      );

      if (items.length === 0) {
        contextActionOpenLog('menuId=%s target=%o empty; closing context menu', resolvedMenuId, normalizedTarget);
        dispatch(closeDesktopContextMenu());
        return;
      }

      if (normalizedTarget.kind === 'window' && normalizedTarget.windowId) {
        dispatch(focusWindow(normalizedTarget.windowId));
      }
      if (normalizedTarget.kind === 'icon' && normalizedTarget.iconId) {
        dispatch(setSelectedIcon(normalizedTarget.iconId));
      }

      dispatch(setActiveMenu(null));
      dispatch(
        setDesktopContextMenu({
          x: request.x,
          y: request.y,
          menuId: resolvedMenuId,
          windowId: request.windowId ?? normalizedTarget.windowId ?? null,
          widgetId: request.widgetId ?? normalizedTarget.widgetId,
          target: normalizedTarget,
          items: sanitizeContextMenuItems(items),
        }),
      );
    },
    [dispatch, resolveContextMenuItemsForTarget],
  );

  const handleContextMenuClose = useCallback(() => {
    dispatch(closeDesktopContextMenu());
  }, [dispatch]);

  const handleWindowContextMenu = useCallback(
    (windowId: string, event: MouseEvent<HTMLElement>, source: 'surface' | 'title-bar') => {
      openContextMenu({
        x: event.clientX,
        y: event.clientY,
        menuId: 'window-context',
        windowId,
        widgetId: source === 'title-bar' ? 'title-bar' : undefined,
        target: {
          kind: 'window',
          windowId,
          widgetId: source === 'title-bar' ? 'title-bar' : undefined,
          appId: resolveWindowAppId(windowsById[windowId]),
        },
      });
    },
    [openContextMenu, windowsById],
  );

  const handleIconContextMenu = useCallback(
    (iconId: string, event: MouseEvent<HTMLButtonElement>) => {
      const icon = iconsById[iconId];
      openContextMenu({
        x: event.clientX,
        y: event.clientY,
        menuId: 'icon-context',
        target: {
          kind: 'icon',
          iconId,
          iconKind: resolveIconKind(icon),
          appId: resolveIconAppId(icon),
        },
      });
    },
    [iconsById, openContextMenu],
  );

  const handleContextMenuSelect = useCallback(
    (item: string) => {
      if (!contextMenu) {
        return;
      }
      routeCommand(item, {
        source: 'context-menu',
        menuId: contextMenu.menuId,
        windowId: contextMenu.windowId,
        widgetId: contextMenu.widgetId,
        contextTarget: contextMenu.target,
      });
      dispatch(closeDesktopContextMenu());
    },
    [contextMenu, dispatch, routeCommand],
  );

  const handleContextMenuAction = useCallback(
    (entry: { commandId?: string; payload?: Record<string, unknown> }) => {
      if (!contextMenu || !entry.commandId) {
        dispatch(closeDesktopContextMenu());
        return;
      }
      routeCommand(entry.commandId, {
        source: 'context-menu',
        menuId: contextMenu.menuId,
        windowId: contextMenu.windowId,
        widgetId: contextMenu.widgetId,
        contextTarget: contextMenu.target,
        payload: entry.payload,
      });
      dispatch(closeDesktopContextMenu());
    },
    [contextMenu, dispatch, routeCommand],
  );

  const defaultAdapters = useMemo<WindowContentAdapter[]>(
    () => [createAppWindowContentAdapter(), createFallbackWindowContentAdapter()],
    [],
  );

  const allAdapters = useMemo<WindowContentAdapter[]>(
    () => [...composedContributions.windowContentAdapters, ...defaultAdapters],
    [composedContributions.windowContentAdapters, defaultAdapters],
  );

  const buildWindowBody = useCallback(
    (winInstance: WindowInstance) => {
      if (!winInstance) return null;
      return renderWindowContentWithAdapters(
        winInstance,
        {
          stack,
          mode,
          renderAppWindow,
        },
        allAdapters,
      );
    },
    [allAdapters, mode, renderAppWindow, stack],
  );

  useEffect(() => {
    windowBodyCacheRef.current.clear();
  }, [buildWindowBody]);

  const windowBodyById = useMemo(() => {
    const nextCache = new Map<string, { signature: string; body: ReactNode }>();
    const nextBodies: Record<string, ReactNode> = {};

    for (const win of windows) {
      const signature = getWindowBodySignature(win, mode);
      const cached = windowBodyCacheRef.current.get(win.id);
      if (cached && cached.signature === signature) {
        nextBodies[win.id] = cached.body;
        nextCache.set(win.id, cached);
        continue;
      }

      const body = buildWindowBody(win);
      nextBodies[win.id] = body;
      nextCache.set(win.id, { signature, body });
    }

    windowBodyCacheRef.current = nextCache;
    return nextBodies;
  }, [buildWindowBody, mode, windows]);

  const renderWindowBody = useCallback(
    (winDef: DesktopWindowDef) => {
      if (!windowsById[winDef.id]) return null;
      return windowBodyById[winDef.id] ?? null;
    },
    [windowBodyById, windowsById],
  );

  const handleDesktopBackgroundClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        dispatch(clearDesktopTransient());
      }
    },
    [dispatch],
  );

  const handleActiveMenuChange = useCallback(
    (id: string | null) => {
      dispatch(closeDesktopContextMenu());
      dispatch(setActiveMenu(id));
    },
    [dispatch],
  );
  const handleSelectIcon = useCallback((id: string) => dispatch(setSelectedIcon(id)), [dispatch]);
  const handleToastDone = useCallback(() => dispatch(clearToast()), [dispatch]);

  return {
    themeClass,
    menus,
    icons,
    activeMenuId,
    selectedIconId,
    windows: windowDefs,
    toast,
    onDesktopBackgroundClick: handleDesktopBackgroundClick,
    onActiveMenuChange: handleActiveMenuChange,
    onCommand: routeCommand,
    onSelectIcon: handleSelectIcon,
    onOpenIcon: handleOpenIcon,
    onIconContextMenu: handleIconContextMenu,
    onFocusWindow: handleFocus,
    onCloseWindow: handleClose,
    onWindowDragStart: beginMove,
    onWindowResizeStart: beginResize,
    onWindowContextMenu: handleWindowContextMenu,
    renderWindowBody,
    contextMenu,
    onContextMenuClose: handleContextMenuClose,
    onContextMenuSelect: handleContextMenuSelect,
    onContextMenuAction: handleContextMenuAction,
    openContextMenu,
    registerWindowMenuSections,
    unregisterWindowMenuSections,
    registerContextActions,
    unregisterContextActions,
    registerWindowContextActions,
    unregisterWindowContextActions,
    onContentMinSize: handleContentMinSize,
    onToastDone: handleToastDone,
  };
}
