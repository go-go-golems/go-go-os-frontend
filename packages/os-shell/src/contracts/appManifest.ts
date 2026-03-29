export type AppStateKey = `app_${string}`;
export type LaunchReason = 'icon' | 'menu' | 'command' | 'startup';

export interface AppManifestLaunchConfig {
  mode: 'window' | 'workspace';
  singleton?: boolean;
  defaultWindow?: {
    width: number;
    height: number;
  };
}

export interface AppManifestBackendConfig {
  required: boolean;
  basePath: string;
  wsBasePath?: string;
}

export interface AppManifestDesktopIconConfig {
  id?: string;
  x?: number;
  y?: number;
  order?: number;
}

export interface AppManifest {
  id: string;
  name: string;
  icon: string;
  version?: string;
  launch: AppManifestLaunchConfig;
  backend?: AppManifestBackendConfig;
  desktop?: AppManifestDesktopIconConfig;
}

const APP_ID_RE = /^[a-z][a-z0-9-]*$/;
const APP_STATE_KEY_RE = /^app_[a-z0-9_]+$/;

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function assertValidAppId(appId: string): void {
  invariant(APP_ID_RE.test(appId), `Invalid app id "${appId}". Expected /^[a-z][a-z0-9-]*$/.`);
}

export function assertValidStateKey(stateKey: string): asserts stateKey is AppStateKey {
  invariant(APP_STATE_KEY_RE.test(stateKey), `Invalid app state key "${stateKey}". Expected /^app_[a-z0-9_]+$/.`);
}

export function assertValidManifest(manifest: AppManifest): void {
  assertValidAppId(manifest.id);
  invariant(manifest.name.trim().length > 0, `Invalid app manifest for "${manifest.id}": name is required.`);
  invariant(manifest.icon.trim().length > 0, `Invalid app manifest for "${manifest.id}": icon is required.`);
  if (manifest.desktop?.id) {
    invariant(
      manifest.desktop.id.trim().length > 0,
      `Invalid app manifest for "${manifest.id}": desktop.id cannot be blank.`,
    );
  }
}

export function assertUniqueManifestIds(manifests: readonly AppManifest[]): void {
  const seen = new Set<string>();
  for (const manifest of manifests) {
    assertValidManifest(manifest);
    if (seen.has(manifest.id)) {
      throw new Error(`Duplicate app manifest id "${manifest.id}".`);
    }
    seen.add(manifest.id);
  }
}

export function assertUniqueStateKeys(stateKeys: readonly string[]): void {
  const seen = new Set<string>();
  for (const stateKey of stateKeys) {
    assertValidStateKey(stateKey);
    if (seen.has(stateKey)) {
      throw new Error(`Duplicate app state key "${stateKey}".`);
    }
    seen.add(stateKey);
  }
}
