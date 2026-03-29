import { GenericRenderer } from './builtin/GenericRenderer';
import { LogRenderer } from './builtin/LogRenderer';
import { MessageRenderer } from './builtin/MessageRenderer';
import { StatusRenderer } from './builtin/StatusRenderer';
import { ToolCallRenderer } from './builtin/ToolCallRenderer';
import { ToolResultRenderer } from './builtin/ToolResultRenderer';
import type { ChatWidgetRenderers, TimelineRenderer } from './types';

const builtinRenderers: Record<string, TimelineRenderer> = {
  message: MessageRenderer,
  tool_call: ToolCallRenderer,
  tool_result: ToolResultRenderer,
  status: StatusRenderer,
  log: LogRenderer,
};

const extensionRenderers = new Map<string, TimelineRenderer>();
const registryListeners = new Set<() => void>();
let registryVersion = 0;

function notifyRegistryChanged() {
  registryVersion += 1;
  for (const listener of registryListeners) {
    listener();
  }
}

export function registerTimelineRenderer(kind: string, renderer: TimelineRenderer) {
  const key = String(kind || '').trim();
  if (!key) return;
  const existing = extensionRenderers.get(key);
  if (existing === renderer) {
    return;
  }
  extensionRenderers.set(key, renderer);
  notifyRegistryChanged();
}

export function unregisterTimelineRenderer(kind: string) {
  const key = String(kind || '').trim();
  if (!key) return;
  if (!extensionRenderers.delete(key)) {
    return;
  }
  notifyRegistryChanged();
}

export function clearRegisteredTimelineRenderers() {
  if (extensionRenderers.size === 0) {
    return;
  }
  extensionRenderers.clear();
  notifyRegistryChanged();
}

export function registerDefaultTimelineRenderers() {
  let changed = false;
  for (const [kind, renderer] of Object.entries(builtinRenderers)) {
    const existing = extensionRenderers.get(kind);
    if (existing === renderer) {
      continue;
    }
    extensionRenderers.set(kind, renderer);
    changed = true;
  }
  if (changed) {
    notifyRegistryChanged();
  }
}

export function subscribeTimelineRenderers(listener: () => void): () => void {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

export function getTimelineRendererRegistryVersion(): number {
  return registryVersion;
}

export function resolveTimelineRenderers(overrides?: Partial<ChatWidgetRenderers>): ChatWidgetRenderers {
  const resolved: ChatWidgetRenderers = {
    ...builtinRenderers,
    ...Object.fromEntries(extensionRenderers.entries()),
    ...(overrides ?? {}),
    default: GenericRenderer,
  };

  if (overrides?.default) {
    resolved.default = overrides.default;
  }

  return resolved;
}
