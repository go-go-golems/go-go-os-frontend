import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmWsManager } from './confirmWsManager';

class FakeWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  close() {
    this.emitClose({ code: 1000, reason: 'client_close', wasClean: true });
  }

  emitOpen() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.({} as Event);
  }

  emitClose(options?: { code?: number; reason?: string; wasClean?: boolean }) {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.({
      code: options?.code ?? 1006,
      reason: options?.reason ?? '',
      wasClean: options?.wasClean ?? false,
    } as CloseEvent);
  }
}

function createFactory(sockets: FakeWebSocket[]) {
  return (url: string) => {
    const socket = new FakeWebSocket(url);
    sockets.push(socket);
    return socket as unknown as WebSocket;
  };
}

describe('ConfirmWsManager reconnect policy', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reconnects using host-injected delay policy after unexpected close', () => {
    vi.useFakeTimers();
    const sockets: FakeWebSocket[] = [];
    const onClose = vi.fn();

    const manager = new ConfirmWsManager({
      wsUrl: 'ws://localhost:8091/confirm/ws?sessionId=global',
      websocketFactory: createFactory(sockets),
      onEvent: vi.fn(),
      onClose,
      reconnectPolicy: ({ attempt }) => ({ reconnect: true, delayMs: attempt * 10 }),
    });

    manager.connect();
    expect(sockets).toHaveLength(1);

    sockets[0].emitOpen();
    sockets[0].emitClose({ code: 1006, reason: 'network_lost', wasClean: false });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(9);
    expect(sockets).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);
  });

  it('does not reconnect when no policy is provided', () => {
    vi.useFakeTimers();
    const sockets: FakeWebSocket[] = [];
    const manager = new ConfirmWsManager({
      wsUrl: 'ws://localhost:8091/confirm/ws?sessionId=global',
      websocketFactory: createFactory(sockets),
      onEvent: vi.fn(),
    });

    manager.connect();
    expect(sockets).toHaveLength(1);
    sockets[0].emitClose({ code: 1006, reason: 'network_lost', wasClean: false });

    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(1);
  });

  it('cancels scheduled reconnect when disconnect is requested', () => {
    vi.useFakeTimers();
    const sockets: FakeWebSocket[] = [];
    const manager = new ConfirmWsManager({
      wsUrl: 'ws://localhost:8091/confirm/ws?sessionId=global',
      websocketFactory: createFactory(sockets),
      onEvent: vi.fn(),
      reconnectPolicy: () => ({ reconnect: true, delayMs: 100 }),
    });

    manager.connect();
    expect(sockets).toHaveLength(1);

    sockets[0].emitClose({ code: 1006, reason: 'network_lost', wasClean: false });
    manager.disconnect();

    vi.advanceTimersByTime(100);
    expect(sockets).toHaveLength(1);
  });
});
