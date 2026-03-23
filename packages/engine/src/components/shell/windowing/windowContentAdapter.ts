import type { ReactNode } from 'react';
import type { RuntimeBundleDefinition } from '../../../cards';
import type { WindowInstance } from '../../../desktop/core/state/types';

export interface WindowAdapterContext {
  bundle: RuntimeBundleDefinition;
  mode: 'interactive' | 'preview';
  renderAppWindow?: (appKey: string, windowId: string) => ReactNode;
}

export interface WindowContentAdapter {
  id: string;
  canRender: (window: WindowInstance, ctx: WindowAdapterContext) => boolean;
  render: (window: WindowInstance, ctx: WindowAdapterContext) => ReactNode | null;
}

/**
 * Selects the first adapter that can render the window and returns its output.
 * If an adapter returns null, routing continues to allow fallback adapters.
 */
export function renderWindowContentWithAdapters(
  window: WindowInstance,
  ctx: WindowAdapterContext,
  adapters: WindowContentAdapter[],
): ReactNode | null {
  for (const adapter of adapters) {
    if (!adapter.canRender(window, ctx)) continue;
    const rendered = adapter.render(window, ctx);
    if (rendered !== null) return rendered;
  }
  return null;
}
