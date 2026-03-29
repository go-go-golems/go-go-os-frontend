import type { ChatProfileListItem } from '../runtime/profileTypes';

function normalize(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

function selectionValue(profile: string, registry?: string): string {
  return JSON.stringify({
    profile: normalize(profile),
    registry: normalize(registry) || undefined,
  });
}

function parseSelectionValue(raw: string): { profile: string; registry?: string } | null {
  const normalized = normalize(raw);
  if (!normalized) {
    return null;
  }
  try {
    const parsed = JSON.parse(normalized) as { profile?: unknown; registry?: unknown };
    const profile = typeof parsed.profile === 'string' ? normalize(parsed.profile) : '';
    if (!profile) {
      return null;
    }
    const registry = typeof parsed.registry === 'string' ? normalize(parsed.registry) : '';
    return {
      profile,
      registry: registry || undefined,
    };
  } catch {
    return {
      profile: normalized,
    };
  }
}

export function resolveProfileSelectorValue(
  profiles: ChatProfileListItem[],
  currentSelection: { profile?: string | null; registry?: string | null }
): string {
  const defaultProfile = profiles.find((profile) => profile.is_default) ?? profiles[0];
  const selectedProfile = normalize(currentSelection.profile);
  const selectedRegistry = normalize(currentSelection.registry);
  if (selectedProfile) {
    const match = profiles.find((profile) =>
      normalize(profile.slug) === selectedProfile &&
      (selectedRegistry === '' || normalize(profile.registry) === selectedRegistry)
    );
    if (match) {
      return selectionValue(match.slug, match.registry);
    }
  }
  if (!defaultProfile?.slug) {
    return '';
  }
  return selectionValue(defaultProfile.slug, defaultProfile.registry);
}

export function resolveProfileSelectionChange(
  nextSelectionRaw: string,
  profiles: ChatProfileListItem[]
): { profile: string; registry?: string } | null {
  const decoded = parseSelectionValue(nextSelectionRaw);
  if (!decoded) {
    const fallback = profiles.find((profile) => profile.is_default) ?? profiles[0];
    if (!fallback?.slug) {
      return null;
    }
    return {
      profile: normalize(fallback.slug),
      registry: normalize(fallback.registry) || undefined,
    };
  }
  const match = profiles.find((profile) =>
    normalize(profile.slug) === decoded.profile &&
    (decoded.registry === undefined || normalize(profile.registry) === decoded.registry)
  );
  if (!match?.slug) {
    return null;
  }
  return {
    profile: normalize(match.slug),
    registry: normalize(match.registry) || undefined,
  };
}
