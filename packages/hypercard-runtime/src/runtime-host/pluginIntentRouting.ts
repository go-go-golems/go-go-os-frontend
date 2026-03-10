import { showToast } from '@hypercard/engine';
import { authorizeDomainIntent, authorizeSystemIntent } from '../features/pluginCardRuntime';
import { ingestRuntimeAction } from '../features/pluginCardRuntime';
import { closeWindow, sessionNavBack, sessionNavGo } from '@hypercard/engine/desktop-core';
import type { RuntimeAction } from '../plugin-runtime/contracts';
import type { CapabilityPolicy } from '../features/pluginCardRuntime';
import { getRuntimeActionDomain, getRuntimeActionKind } from '../plugin-runtime/contracts';

interface DispatchLike {
  (action: unknown): unknown;
}

interface ActionDispatchContext {
  dispatch: DispatchLike;
  getState?: () => unknown;
  sessionId: string;
  cardId: string;
  windowId: string;
}

interface RuntimeStateLike {
  pluginCardRuntime?: {
    sessions?: Record<string, { capabilities?: CapabilityPolicy }>;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toSystemAction(action: RuntimeAction, context: ActionDispatchContext): unknown | null {
  if (action.type === 'nav.back') {
    return sessionNavBack({ sessionId: context.sessionId });
  }

  if (action.type === 'nav.go') {
    if (!isRecord(action.payload)) {
      return null;
    }

    const card = action.payload.cardId;
    if (typeof card !== 'string' || card.length === 0) {
      return null;
    }

    const param = typeof action.payload.param === 'string' ? action.payload.param : undefined;
    return sessionNavGo({ sessionId: context.sessionId, card, param });
  }

  if (action.type === 'notify.show') {
    if (!isRecord(action.payload)) {
      return null;
    }

    const message = action.payload.message;
    if (typeof message !== 'string' || message.length === 0) {
      return null;
    }

    return showToast(message);
  }

  if (action.type === 'window.close') {
    return closeWindow(context.windowId);
  }

  return null;
}

function toDomainAction(action: RuntimeAction, context: ActionDispatchContext) {
  return {
    type: action.type,
    payload: action.payload,
    meta: {
      source: 'plugin-runtime',
      sessionId: context.sessionId,
      runtimeSessionId: context.sessionId,
      cardId: context.cardId,
      windowId: context.windowId,
    },
  };
}

export function dispatchRuntimeAction(action: RuntimeAction, context: ActionDispatchContext) {
  context.dispatch(
    ingestRuntimeAction({
      sessionId: context.sessionId,
      cardId: context.cardId,
      action,
    }),
  );

  const runtimeSession = (context.getState?.() as RuntimeStateLike | undefined)?.pluginCardRuntime?.sessions?.[
    context.sessionId
  ];
  const kind = getRuntimeActionKind(action.type);

  if (kind === 'domain' && runtimeSession?.capabilities) {
    const domain = getRuntimeActionDomain(action.type);
    const decision = authorizeDomainIntent(runtimeSession.capabilities, domain ?? '');
    if (!decision.allowed) {
      return;
    }
  }

  if (kind === 'system' && runtimeSession?.capabilities) {
    const decision = authorizeSystemIntent(runtimeSession.capabilities, action.type);
    if (!decision.allowed) {
      return;
    }
  }

  if (kind === 'domain') {
    context.dispatch(toDomainAction(action, context));
    return;
  }

  if (kind === 'system') {
    const routed = toSystemAction(action, context);
    if (routed) {
      context.dispatch(routed);
    }
  }
}
