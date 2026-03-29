import type { ConfirmRealtimeEvent } from '../types';

export interface ConfirmWindowRegistration {
  requestId: string;
  appKey: string;
  title: string;
  dedupeKey: string;
}

export interface ConfirmWsReconnectContext {
  attempt: number;
  closeCode?: number;
  closeReason?: string;
  wasClean?: boolean;
}

export interface ConfirmWsReconnectDecision {
  reconnect: boolean;
  delayMs?: number;
}

export type ConfirmWsReconnectPolicy = (
  context: ConfirmWsReconnectContext,
) => ConfirmWsReconnectDecision | null | undefined;

export interface ConfirmRuntimeHostAdapters {
  resolveBaseUrl: () => string;
  resolveSessionId: () => string;
  resolveWsReconnectPolicy?: () => ConfirmWsReconnectPolicy | undefined;
  openRequestWindow: (registration: ConfirmWindowRegistration) => void;
  closeRequestWindow?: (requestId: string) => void;
  onEventObserved?: (event: ConfirmRealtimeEvent) => void;
  onError?: (error: Error) => void;
}
