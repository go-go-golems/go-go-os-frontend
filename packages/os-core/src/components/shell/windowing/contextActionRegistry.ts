import type { DesktopActionEntry, DesktopActionItem, DesktopContextTargetRef } from './types';

export interface ContextActionRegistryEntry {
  target: DesktopContextTargetRef;
  actions: DesktopActionEntry[];
}

export type ContextActionRegistryState = Record<string, ContextActionRegistryEntry>;

function normalizeValue(value: string | undefined): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeContextTargetRef(target: DesktopContextTargetRef): DesktopContextTargetRef {
  const normalizedIconKind = target.iconKind === 'folder' ? 'folder' : target.iconKind === 'app' ? 'app' : undefined;
  return {
    kind: target.kind,
    windowId: normalizeValue(target.windowId),
    iconId: normalizeValue(target.iconId),
    iconKind: normalizedIconKind,
    widgetId: normalizeValue(target.widgetId),
    messageId: normalizeValue(target.messageId),
    conversationId: normalizeValue(target.conversationId),
    appId: normalizeValue(target.appId),
  };
}

export function buildContextTargetKey(target: DesktopContextTargetRef): string {
  const normalized = normalizeContextTargetRef(target);
  const parts = [`kind=${normalized.kind}`];
  if (normalized.appId) parts.push(`app=${normalized.appId}`);
  if (normalized.windowId) parts.push(`window=${normalized.windowId}`);
  if (normalized.conversationId) parts.push(`conversation=${normalized.conversationId}`);
  if (normalized.messageId) parts.push(`message=${normalized.messageId}`);
  if (normalized.iconId) parts.push(`icon=${normalized.iconId}`);
  if (normalized.iconKind) parts.push(`iconKind=${normalized.iconKind}`);
  if (normalized.widgetId) parts.push(`widget=${normalized.widgetId}`);
  return parts.join('|');
}

function pushUniqueKey(keys: string[], key: string, seen: Set<string>) {
  if (seen.has(key)) return;
  seen.add(key);
  keys.push(key);
}

function pushTargetKey(keys: string[], target: DesktopContextTargetRef, seen: Set<string>) {
  pushUniqueKey(keys, buildContextTargetKey(target), seen);
}

export function resolveContextActionPrecedenceKeys(target: DesktopContextTargetRef): string[] {
  const normalized = normalizeContextTargetRef(target);
  const keys: string[] = [];
  const seen = new Set<string>();

  pushTargetKey(keys, normalized, seen);
  if (normalized.widgetId) {
    pushTargetKey(
      keys,
      {
        ...normalized,
        widgetId: undefined,
      },
      seen,
    );
  }
  if (normalized.iconKind) {
    pushTargetKey(
      keys,
      {
        ...normalized,
        iconKind: undefined,
      },
      seen,
    );
    if (normalized.widgetId) {
      pushTargetKey(
        keys,
        {
          ...normalized,
          widgetId: undefined,
          iconKind: undefined,
        },
        seen,
      );
    }
  }

  if (normalized.appId) {
    pushTargetKey(
      keys,
      {
        ...normalized,
        appId: undefined,
      },
      seen,
    );
    if (normalized.widgetId) {
      pushTargetKey(
        keys,
        {
          ...normalized,
          appId: undefined,
          widgetId: undefined,
        },
        seen,
      );
    }
    if (normalized.iconKind) {
      pushTargetKey(
        keys,
        {
          ...normalized,
          appId: undefined,
          iconKind: undefined,
        },
        seen,
      );
      if (normalized.widgetId) {
        pushTargetKey(
          keys,
          {
            ...normalized,
            appId: undefined,
            widgetId: undefined,
            iconKind: undefined,
          },
          seen,
        );
      }
    }
    pushTargetKey(keys, { kind: normalized.kind, appId: normalized.appId }, seen);
  }

  pushTargetKey(keys, { kind: normalized.kind }, seen);

  if (normalized.windowId && normalized.kind !== 'window') {
    if (normalized.appId) {
      pushTargetKey(
        keys,
        { kind: 'window', windowId: normalized.windowId, appId: normalized.appId },
        seen
      );
    }
    pushTargetKey(keys, { kind: 'window', windowId: normalized.windowId }, seen);
  }

  return keys;
}

function isActionItem(entry: DesktopActionEntry): entry is DesktopActionItem {
  return !('separator' in entry);
}

export function mergeContextActions(entries: DesktopActionEntry[][]): DesktopActionEntry[] {
  const merged: DesktopActionEntry[] = [];
  const seenActionIds = new Set<string>();

  for (const list of entries) {
    for (const entry of list) {
      if (!isActionItem(entry)) {
        merged.push(entry);
        continue;
      }
      if (seenActionIds.has(entry.id)) {
        continue;
      }
      seenActionIds.add(entry.id);
      merged.push(entry);
    }
  }

  return merged;
}

export function resolveContextActions(
  registry: ContextActionRegistryState,
  target: DesktopContextTargetRef
): DesktopActionEntry[] {
  const keys = resolveContextActionPrecedenceKeys(target);
  const actionLists = keys
    .map((key) => registry[key]?.actions ?? [])
    .filter((actions) => actions.length > 0);
  return mergeContextActions(actionLists);
}
