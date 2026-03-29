import { initialConfirmRuntimeState, type ConfirmRuntimeState } from './confirmRuntimeSlice';

export interface ConfirmRuntimeRootLike {
  confirmRuntime?: ConfirmRuntimeState;
  [key: string]: unknown;
}

export function selectConfirmRuntime(state: ConfirmRuntimeRootLike): ConfirmRuntimeState {
  return state.confirmRuntime ?? initialConfirmRuntimeState;
}

export function selectConfirmConnected(state: ConfirmRuntimeRootLike): boolean {
  return selectConfirmRuntime(state).connected;
}

export function selectConfirmLastError(state: ConfirmRuntimeRootLike): string | undefined {
  return selectConfirmRuntime(state).lastError;
}

export function selectActiveConfirmRequests(state: ConfirmRuntimeRootLike) {
  const runtime = selectConfirmRuntime(state);
  return runtime.activeOrder.map((id) => runtime.activeById[id]).filter((value) => value !== undefined);
}

export function selectActiveConfirmRequestById(state: ConfirmRuntimeRootLike, requestId: string) {
  return selectConfirmRuntime(state).activeById[requestId];
}
