import type { RuntimeBundleDefinition } from '@go-go-golems/os-core';
import type { OpenWindowPayload } from '@go-go-golems/os-core/desktop-core';
import { RuntimeSurfaceDebugWindow } from './RuntimeSurfaceDebugWindow';

export const HYPERCARD_RUNTIME_DEBUG_APP_ID = 'hypercard-runtime-debug';
export const HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID = 'stacks';

export interface BuildRuntimeDebugWindowPayloadOptions {
  appId?: string;
  instanceId?: string;
  title?: string;
  icon?: string;
  bounds?: OpenWindowPayload['bounds'];
  dedupeKey?: string;
}

export interface RuntimeDebugAppWindowProps {
  ownerAppId: string;
  instanceId: string;
  bundles?: RuntimeBundleDefinition[];
}

export function buildRuntimeDebugWindowPayload(options: BuildRuntimeDebugWindowPayloadOptions = {}): OpenWindowPayload {
  const appId = options.appId ?? HYPERCARD_RUNTIME_DEBUG_APP_ID;
  const instanceId = options.instanceId ?? HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID;
  return {
    id: `window:${appId}:${instanceId}`,
    title: options.title ?? 'Stacks & Cards',
    icon: options.icon ?? '🔧',
    bounds: options.bounds ?? { x: 80, y: 30, w: 560, h: 480 },
    content: {
      kind: 'app',
      appKey: `${appId}:${instanceId}`,
    },
    dedupeKey: options.dedupeKey ?? `${appId}:${instanceId}`,
  };
}

export function RuntimeDebugAppWindow({ ownerAppId, instanceId, bundles }: RuntimeDebugAppWindowProps) {
  if (instanceId !== HYPERCARD_RUNTIME_DEBUG_INSTANCE_ID) {
    return (
      <section style={{ padding: 12, display: 'grid', gap: 8 }}>
        <strong>Stacks & Cards</strong>
        <span>Unknown runtime debug window instance: {instanceId}</span>
      </section>
    );
  }

  return <RuntimeSurfaceDebugWindow ownerAppId={ownerAppId} bundles={bundles} />;
}
