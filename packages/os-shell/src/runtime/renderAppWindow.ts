import type { ReactNode } from 'react';
import type { LauncherHostContext } from '../contracts/launcherHostContext';
import type { LauncherRenderContext } from '../contracts/launcherRenderContext';
import type { AppRegistry } from '../registry/createAppRegistry';
import type { ParsedAppKey } from './appKey';
import { parseAppKey } from './appKey';

export interface RenderAppWindowOptions {
  registry: AppRegistry;
  hostContext: Pick<LauncherHostContext, 'dispatch' | 'getState' | 'resolveApiBase' | 'resolveWsBase'>;
  onUnknownAppKey?: (appKey: string, windowId: string) => ReactNode | null;
}

export function renderAppWindow(options: RenderAppWindowOptions, appKey: string, windowId: string): ReactNode | null {
  let parsed: ParsedAppKey;
  try {
    parsed = parseAppKey(appKey);
  } catch {
    return options.onUnknownAppKey ? options.onUnknownAppKey(appKey, windowId) : null;
  }

  const module = options.registry.get(parsed.appId);
  if (!module) {
    return options.onUnknownAppKey ? options.onUnknownAppKey(appKey, windowId) : null;
  }

  const renderContext: LauncherRenderContext = {
    dispatch: options.hostContext.dispatch,
    getState: options.hostContext.getState,
    moduleId: module.manifest.id,
    stateKey: module.state?.stateKey,
    resolveApiBase: options.hostContext.resolveApiBase,
    resolveWsBase: options.hostContext.resolveWsBase,
  };

  return module.renderWindow({
    appId: parsed.appId,
    instanceId: parsed.instanceId,
    appKey,
    windowId,
    ctx: renderContext,
  });
}

export function createRenderAppWindow(options: RenderAppWindowOptions) {
  return (appKey: string, windowId: string) => renderAppWindow(options, appKey, windowId);
}
