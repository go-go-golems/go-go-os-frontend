import type { AppStateKey } from './appManifest';

export interface LauncherRenderContext {
  dispatch: (action: unknown) => unknown;
  getState: () => unknown;
  moduleId: string;
  stateKey?: AppStateKey;
  resolveApiBase?: (appId: string) => string;
  resolveWsBase?: (appId: string) => string;
}
