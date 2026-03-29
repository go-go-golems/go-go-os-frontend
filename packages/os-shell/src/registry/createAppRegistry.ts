import { type AppManifest, assertUniqueManifestIds, assertUniqueStateKeys } from '../contracts/appManifest';
import type { LaunchableAppModule } from '../contracts/launchableAppModule';

export interface AppRegistry {
  get: (appId: string) => LaunchableAppModule | undefined;
  has: (appId: string) => boolean;
  list: () => readonly LaunchableAppModule[];
  listManifests: () => readonly AppManifest[];
}

function sortModules(modules: readonly LaunchableAppModule[]): LaunchableAppModule[] {
  return [...modules].sort((a, b) => {
    const leftOrder = a.manifest.desktop?.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = b.manifest.desktop?.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }
    return a.manifest.id.localeCompare(b.manifest.id);
  });
}

export function createAppRegistry(modules: readonly LaunchableAppModule[]): AppRegistry {
  const orderedModules = sortModules(modules);
  const manifests = orderedModules.map((module) => module.manifest);
  assertUniqueManifestIds(manifests);
  const stateKeys = orderedModules.flatMap((module) => (module.state ? [module.state.stateKey] : []));
  assertUniqueStateKeys(stateKeys);

  const moduleMap = new Map<string, LaunchableAppModule>();
  for (const module of orderedModules) {
    if (moduleMap.has(module.manifest.id)) {
      throw new Error(`Duplicate app module id "${module.manifest.id}".`);
    }
    moduleMap.set(module.manifest.id, module);
  }

  return {
    get: (appId) => moduleMap.get(appId),
    has: (appId) => moduleMap.has(appId),
    list: () => orderedModules,
    listManifests: () => manifests,
  };
}
