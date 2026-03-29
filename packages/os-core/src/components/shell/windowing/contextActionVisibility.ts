import type {
  DesktopActionEntry,
  DesktopActionItem,
  DesktopActionVisibilityContext,
} from './types';

function normalizeToken(value: unknown): string | undefined {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : undefined;
}

function normalizeTokenList(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const token = normalizeToken(value);
    if (!token || seen.has(token)) {
      continue;
    }
    seen.add(token);
    out.push(token);
  }
  return out;
}

function hasIntersection(listA: string[], listB: string[]): boolean {
  if (listA.length === 0 || listB.length === 0) {
    return false;
  }
  const set = new Set(listB);
  return listA.some((item) => set.has(item));
}

function isActionItem(entry: DesktopActionEntry): entry is DesktopActionItem {
  return !('separator' in entry);
}

export function isActionVisible(
  entry: DesktopActionEntry,
  context: DesktopActionVisibilityContext,
): boolean {
  if (!isActionItem(entry)) {
    return true;
  }

  const visibility = entry.visibility;
  if (!visibility) {
    return true;
  }

  const activeProfile = normalizeToken(context.profile);
  const activeRoles = normalizeTokenList(context.roles);
  const allowedProfiles = normalizeTokenList(visibility.allowedProfiles);
  const allowedRoles = normalizeTokenList(visibility.allowedRoles);

  if (allowedProfiles.length > 0) {
    if (!activeProfile || !allowedProfiles.includes(activeProfile)) {
      return false;
    }
  }

  if (allowedRoles.length > 0 && !hasIntersection(activeRoles, allowedRoles)) {
    return false;
  }

  if (visibility.when && visibility.when(context) !== true) {
    return false;
  }

  return true;
}

function normalizeSeparators(entries: DesktopActionEntry[]): DesktopActionEntry[] {
  const normalized: DesktopActionEntry[] = [];
  for (const entry of entries) {
    if ('separator' in entry) {
      if (normalized.length === 0) {
        continue;
      }
      const previous = normalized[normalized.length - 1];
      if ('separator' in previous) {
        continue;
      }
      normalized.push(entry);
      continue;
    }
    normalized.push(entry);
  }
  if (normalized.length > 0) {
    const last = normalized[normalized.length - 1];
    if ('separator' in last) {
      normalized.pop();
    }
  }
  return normalized;
}

export function applyActionVisibility(
  entries: DesktopActionEntry[],
  context: DesktopActionVisibilityContext,
): DesktopActionEntry[] {
  const filtered: DesktopActionEntry[] = [];
  for (const entry of entries) {
    if (!isActionItem(entry)) {
      filtered.push(entry);
      continue;
    }
    if (isActionVisible(entry, context)) {
      filtered.push(entry);
      continue;
    }

    const unauthorized = entry.visibility?.unauthorized ?? 'hide';
    if (unauthorized === 'disable') {
      filtered.push({ ...entry, disabled: true });
    }
  }

  return normalizeSeparators(filtered);
}

export function isContextCommandAllowed(
  entries: DesktopActionEntry[],
  commandId: string,
): boolean {
  const normalizedCommandId = normalizeToken(commandId);
  if (!normalizedCommandId) {
    return false;
  }

  for (const entry of entries) {
    if (!isActionItem(entry)) {
      continue;
    }
    if (entry.commandId !== normalizedCommandId) {
      continue;
    }
    if (entry.disabled) {
      continue;
    }
    return true;
  }

  return false;
}
