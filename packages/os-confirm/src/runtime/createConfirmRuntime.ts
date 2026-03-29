import { createConfirmApiClient } from '../api/confirmApiClient';
import type { ConfirmRuntimeHostAdapters } from '../host/types';
import { applyRealtimeEvent, setConnectionState, setLastError, type ConfirmRuntimeAnyAction } from '../state/confirmRuntimeSlice';
import type { ConfirmRealtimeEvent } from '../types';
import { ConfirmWsManager } from '../ws/confirmWsManager';

function toWsUrl(baseUrl: string, sessionId: string): string {
  const prefixed = `${baseUrl.replace(/\/$/, '')}/ws?sessionId=${encodeURIComponent(sessionId)}`;
  if (prefixed.startsWith('https://')) {
    return `wss://${prefixed.slice('https://'.length)}`;
  }
  if (prefixed.startsWith('http://')) {
    return `ws://${prefixed.slice('http://'.length)}`;
  }
  return prefixed;
}

export interface CreateConfirmRuntimeOptions {
  host: ConfirmRuntimeHostAdapters;
  dispatch: (action: ConfirmRuntimeAnyAction) => void;
}

export function createConfirmRuntime(options: CreateConfirmRuntimeOptions) {
  const baseUrl = options.host.resolveBaseUrl().replace(/\/$/, '');
  const sessionId = options.host.resolveSessionId();
  const apiClient = createConfirmApiClient({ baseUrl });

  const wsManager = new ConfirmWsManager({
    wsUrl: toWsUrl(baseUrl, sessionId),
    reconnectPolicy: options.host.resolveWsReconnectPolicy?.(),
    onOpen: () => options.dispatch(setConnectionState(true)),
    onClose: () => options.dispatch(setConnectionState(false)),
    onError: (error) => {
      options.dispatch(setLastError(error.message));
      options.host.onError?.(error);
    },
    onEvent: (event: ConfirmRealtimeEvent) => {
      options.host.onEventObserved?.(event);
      options.dispatch(applyRealtimeEvent(event));

      const request = event.request;
      if (event.type === 'new_request' && request) {
        options.host.openRequestWindow({
          requestId: request.id,
          appKey: `confirm-request:${request.id}`,
          title: request.title ?? 'Confirmation',
          dedupeKey: `confirm-request:${request.id}`,
        });
      }
      if (event.type === 'request_completed') {
        const requestId = event.requestId ?? event.request?.id;
        if (requestId) {
          options.host.closeRequestWindow?.(requestId);
        }
      }
    },
  });

  return {
    apiClient,
    connect: () => wsManager.connect(),
    disconnect: () => wsManager.disconnect(),
  };
}
