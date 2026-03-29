import type { ConfirmRealtimeEvent, ConfirmRequest, ConfirmRequestCompletion } from '../types';

export interface ConfirmRuntimeState {
  connected: boolean;
  activeById: Record<string, ConfirmRequest>;
  activeOrder: string[];
  completionsById: Record<string, ConfirmRequestCompletion>;
  lastError?: string;
}

export const initialConfirmRuntimeState: ConfirmRuntimeState = {
  connected: false,
  activeById: {},
  activeOrder: [],
  completionsById: {},
};

export type ConfirmRuntimeAction =
  | { type: 'confirmRuntime/setConnectionState'; payload: boolean }
  | { type: 'confirmRuntime/setLastError'; payload: string | undefined }
  | { type: 'confirmRuntime/upsertRequest'; payload: ConfirmRequest }
  | {
      type: 'confirmRuntime/completeRequestById';
      payload: { requestId: string; completedAt: string; output?: Record<string, unknown> };
    }
  | { type: 'confirmRuntime/removeRequest'; payload: string }
  | { type: 'confirmRuntime/clearCompletions' }
  | { type: 'confirmRuntime/applyRealtimeEvent'; payload: ConfirmRealtimeEvent };

export type ConfirmRuntimeAnyAction =
  | ConfirmRuntimeAction
  | {
      type: string;
      payload?: unknown;
      [key: string]: unknown;
    };

function upsertActiveRequest(state: ConfirmRuntimeState, request: ConfirmRequest) {
  if (request.status && request.status !== 'pending') {
    completeRequest(state, request.id, request.completedAt ?? new Date().toISOString());
    return;
  }
  state.activeById[request.id] = request;
  if (!state.activeOrder.includes(request.id)) {
    state.activeOrder.push(request.id);
  }
}

function completeRequest(state: ConfirmRuntimeState, requestId: string, completedAt: string, output?: Record<string, unknown>) {
  delete state.activeById[requestId];
  state.activeOrder = state.activeOrder.filter((id) => id !== requestId);
  state.completionsById[requestId] = { requestId, completedAt, output };
}

export function setConnectionState(payload: boolean): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/setConnectionState', payload };
}

export function setLastError(payload: string | undefined): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/setLastError', payload };
}

export function upsertRequest(payload: ConfirmRequest): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/upsertRequest', payload };
}

export function completeRequestById(payload: {
  requestId: string;
  completedAt: string;
  output?: Record<string, unknown>;
}): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/completeRequestById', payload };
}

export function removeRequest(payload: string): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/removeRequest', payload };
}

export function clearCompletions(): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/clearCompletions' };
}

export function applyRealtimeEvent(payload: ConfirmRealtimeEvent): ConfirmRuntimeAction {
  return { type: 'confirmRuntime/applyRealtimeEvent', payload };
}

export function confirmRuntimeReducer(
  state: ConfirmRuntimeState = initialConfirmRuntimeState,
  action: ConfirmRuntimeAnyAction,
): ConfirmRuntimeState {
  const nextState: ConfirmRuntimeState = {
    ...state,
    activeById: { ...state.activeById },
    activeOrder: [...state.activeOrder],
    completionsById: { ...state.completionsById },
  };

  switch (action.type) {
    case 'confirmRuntime/setConnectionState': {
      nextState.connected = Boolean(action.payload);
      if (Boolean(action.payload)) {
        nextState.lastError = undefined;
      }
      return nextState;
    }
    case 'confirmRuntime/setLastError': {
      nextState.lastError = typeof action.payload === 'string' ? action.payload : undefined;
      return nextState;
    }
    case 'confirmRuntime/upsertRequest': {
      if (action.payload && typeof action.payload === 'object') {
        upsertActiveRequest(nextState, action.payload as ConfirmRequest);
      }
      return nextState;
    }
    case 'confirmRuntime/completeRequestById': {
      const payload = action.payload as { requestId?: string; completedAt?: string; output?: Record<string, unknown> };
      if (typeof payload?.requestId === 'string') {
        completeRequest(
          nextState,
          payload.requestId,
          typeof payload.completedAt === 'string' ? payload.completedAt : new Date().toISOString(),
          payload.output,
        );
      }
      return nextState;
    }
    case 'confirmRuntime/removeRequest': {
      if (typeof action.payload === 'string') {
        delete nextState.activeById[action.payload];
        nextState.activeOrder = nextState.activeOrder.filter((id) => id !== action.payload);
      }
      return nextState;
    }
    case 'confirmRuntime/clearCompletions': {
      nextState.completionsById = {};
      return nextState;
    }
    case 'confirmRuntime/applyRealtimeEvent': {
      const event = action.payload as ConfirmRealtimeEvent;
      if (event.type === 'new_request' || event.type === 'request_updated') {
        if (event.request) {
          upsertActiveRequest(nextState, event.request);
        }
        return nextState;
      }

      const completedAt = event.completedAt ?? new Date().toISOString();
      if (event.requestId) {
        completeRequest(nextState, event.requestId, completedAt, event.output);
        return nextState;
      }
      if (event.request?.id) {
        completeRequest(nextState, event.request.id, completedAt, event.output);
      }
      return nextState;
    }
    default:
      return state;
  }
}
