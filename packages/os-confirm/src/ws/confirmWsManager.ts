import type { ConfirmRealtimeEvent } from '../types';
import type { ConfirmWsReconnectPolicy } from '../host/types';
import { mapRealtimeEventFromProto } from '../proto/confirmProtoAdapter';

const OPEN_READY_STATE = 1;

export interface ConfirmWsManagerOptions {
  wsUrl: string;
  onEvent: (event: ConfirmRealtimeEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Error) => void;
  reconnectPolicy?: ConfirmWsReconnectPolicy;
  websocketFactory?: (url: string) => WebSocket;
}

export class ConfirmWsManager {
  private readonly options: ConfirmWsManagerOptions;
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private disconnectRequested = false;

  constructor(options: ConfirmWsManagerOptions) {
    this.options = options;
  }

  connect() {
    this.disconnectRequested = false;
    this.clearReconnectTimer();
    if (this.socket && this.socket.readyState <= OPEN_READY_STATE) {
      return;
    }
    if (this.socket && this.socket.readyState > OPEN_READY_STATE) {
      this.socket = null;
    }
    this.openSocket();
  }

  disconnect() {
    this.disconnectRequested = true;
    this.clearReconnectTimer();
    if (this.socket) {
      this.socket.close();
      return;
    }
    this.socket = null;
  }

  private openSocket() {
    const factory = this.options.websocketFactory ?? ((url) => new WebSocket(url));
    const socket = factory(this.options.wsUrl);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) {
        return;
      }
      this.reconnectAttempt = 0;
      this.options.onOpen?.();
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = null;
      this.options.onClose?.();
      if (this.disconnectRequested) {
        return;
      }

      const decision = this.options.reconnectPolicy?.({
        attempt: this.reconnectAttempt + 1,
        closeCode: typeof event.code === 'number' ? event.code : undefined,
        closeReason: typeof event.reason === 'string' ? event.reason : undefined,
        wasClean: typeof event.wasClean === 'boolean' ? event.wasClean : undefined,
      });
      if (!decision || !decision.reconnect) {
        return;
      }
      this.reconnectAttempt += 1;
      const rawDelay = typeof decision.delayMs === 'number' ? decision.delayMs : 0;
      const delayMs = Number.isFinite(rawDelay) ? Math.max(0, rawDelay) : 0;
      this.scheduleReconnect(delayMs);
    };
    socket.onerror = () => this.options.onError?.(new Error('confirm-ws: socket error'));
    socket.onmessage = (message) => {
      try {
        const parsed = mapRealtimeEventFromProto(JSON.parse(String(message.data)));
        if (!parsed) {
          this.options.onError?.(new Error('confirm-ws: invalid realtime event payload'));
          return;
        }
        this.options.onEvent(parsed);
      } catch (error) {
        this.options.onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };
  }

  private scheduleReconnect(delayMs: number) {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.disconnectRequested) {
        return;
      }
      this.openSocket();
    }, delayMs);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer === null) {
      return;
    }
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
