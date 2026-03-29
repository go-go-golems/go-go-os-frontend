export interface RuntimeDebugEvent {
  id: number;
  ts: string;
  kind: string;
  stackId: string;
  cardId: string;
  cardType: string;
  nodeKey?: string;
  eventName?: string;
  actionType?: string;
  selectorName?: string;
  scope?: string;
  durationMs?: number;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

export interface RuntimeDebugHooks {
  onEvent?: (event: RuntimeDebugEvent) => void;
  shouldCapture?: (event: Omit<RuntimeDebugEvent, 'id' | 'ts'>) => boolean;
  sanitize?: (payload: unknown, context: { kind: string }) => unknown;
}

export interface RuntimeDebugContext {
  stackId: string;
  cardId: string;
  cardType: string;
}

export type RuntimeDebugEventInput = Omit<RuntimeDebugEvent, 'id' | 'ts' | 'stackId' | 'cardId' | 'cardType'> &
  Partial<Pick<RuntimeDebugEvent, 'stackId' | 'cardId' | 'cardType'>>;

let runtimeDebugEventId = 0;

function nextRuntimeDebugEventId(): number {
  runtimeDebugEventId += 1;
  return runtimeDebugEventId;
}

/**
 * Compatibility helper retained for plugin-runtime debug integrations.
 */
export function emitRuntimeDebugEvent(
  hooks: RuntimeDebugHooks | undefined,
  context: RuntimeDebugContext,
  event: RuntimeDebugEventInput
) {
  if (!hooks?.onEvent) return;

  const unstamped: Omit<RuntimeDebugEvent, 'id' | 'ts'> = {
    ...event,
    stackId: event.stackId ?? context.stackId,
    cardId: event.cardId ?? context.cardId,
    cardType: event.cardType ?? context.cardType,
  };

  if (hooks.shouldCapture && !hooks.shouldCapture(unstamped)) {
    return;
  }

  const payload = hooks.sanitize
    ? hooks.sanitize(unstamped.payload, { kind: unstamped.kind })
    : unstamped.payload;

  hooks.onEvent({
    ...unstamped,
    payload,
    id: nextRuntimeDebugEventId(),
    ts: new Date().toISOString(),
  });
}
