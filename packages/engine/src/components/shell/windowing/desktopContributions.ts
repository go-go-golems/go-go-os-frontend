import type { RuntimeBundleDefinition } from '../../../cards';
import type { OpenWindowPayload } from '../../../desktop/core/state/types';
import type {
  DesktopActionSection,
  DesktopCommandInvocation,
  DesktopIconDef,
  DesktopMenuSection,
} from './types';
import type { WindowContentAdapter } from './windowContentAdapter';

export interface DesktopCommandContext {
  dispatch: (action: any) => unknown;
  getState?: () => unknown;
  focusedWindowId: string | null;
  openSurfaceWindow: (surfaceId: string, options?: { dedupe?: boolean }) => void;
  closeWindow: (windowId: string) => void;
}

export interface DesktopCommandHandler {
  id: string;
  priority?: number;
  matches: (commandId: string) => boolean;
  run: (commandId: string, ctx: DesktopCommandContext, invocation: DesktopCommandInvocation) => 'handled' | 'pass';
}

export interface StartupWindowContext {
  bundle: RuntimeBundleDefinition;
  homeParam?: string;
}

export interface StartupWindowFactory {
  id: string;
  create: (ctx: StartupWindowContext) => OpenWindowPayload | null;
}

export interface DesktopContribution {
  id: string;
  menus?: DesktopMenuSection[];
  icons?: DesktopIconDef[];
  commands?: DesktopCommandHandler[];
  windowContentAdapters?: WindowContentAdapter[];
  startupWindows?: StartupWindowFactory[];
}

export interface ComposedDesktopContributions {
  menus: DesktopMenuSection[];
  icons: DesktopIconDef[];
  commandHandlers: DesktopCommandHandler[];
  windowContentAdapters: WindowContentAdapter[];
  startupWindows: StartupWindowFactory[];
}

export interface ComposeDesktopContributionsOptions {
  onIconCollision?: 'throw' | 'warn';
}

function cloneActionSection(section: DesktopActionSection): DesktopActionSection {
  return { ...section, items: [...section.items] };
}

export function mergeActionSections<T extends DesktopActionSection>(sections: T[]): T[] {
  const byId = new Map<string, DesktopActionSection>();
  const order: string[] = [];

  for (const section of sections) {
    const existing = byId.get(section.id);
    if (!existing) {
      byId.set(section.id, cloneActionSection(section));
      order.push(section.id);
      continue;
    }

    existing.label = section.label;
    existing.merge = section.merge;
    if (section.merge === 'replace') {
      existing.items = [...section.items];
      continue;
    }
    existing.items = [...existing.items, ...section.items];
  }

  return order.map((id) => byId.get(id) as T);
}

function mergeMenus(menus: DesktopMenuSection[]): DesktopMenuSection[] {
  return mergeActionSections(menus);
}

function mergeIcons(icons: DesktopIconDef[], options: ComposeDesktopContributionsOptions): DesktopIconDef[] {
  const byId = new Map<string, DesktopIconDef>();
  const merged: DesktopIconDef[] = [];

  for (const icon of icons) {
    if (!byId.has(icon.id)) {
      byId.set(icon.id, icon);
      merged.push(icon);
      continue;
    }

    const msg = `Desktop contribution icon collision: ${icon.id}`;
    if (options.onIconCollision === 'warn') {
      console.warn(msg);
      continue;
    }
    throw new Error(msg);
  }

  return merged;
}

function sortCommandHandlers(handlers: DesktopCommandHandler[]): DesktopCommandHandler[] {
  return handlers
    .map((handler, idx) => ({ handler, idx }))
    .sort((a, b) => (b.handler.priority ?? 0) - (a.handler.priority ?? 0) || a.idx - b.idx)
    .map((entry) => entry.handler);
}

export function composeDesktopContributions(
  items: DesktopContribution[] | undefined,
  options: ComposeDesktopContributionsOptions = {},
): ComposedDesktopContributions {
  const list = items ?? [];
  return {
    menus: mergeMenus(list.flatMap((c) => c.menus ?? [])),
    icons: mergeIcons(list.flatMap((c) => c.icons ?? []), options),
    commandHandlers: sortCommandHandlers(list.flatMap((c) => c.commands ?? [])),
    windowContentAdapters: list.flatMap((c) => c.windowContentAdapters ?? []),
    startupWindows: list.flatMap((c) => c.startupWindows ?? []),
  };
}

export function routeContributionCommand(
  commandId: string,
  handlers: DesktopCommandHandler[],
  ctx: DesktopCommandContext,
  invocation: DesktopCommandInvocation = { source: 'programmatic' },
): boolean {
  for (const handler of handlers) {
    if (!handler.matches(commandId)) continue;
    if (handler.run(commandId, ctx, invocation) === 'handled') return true;
  }
  return false;
}
