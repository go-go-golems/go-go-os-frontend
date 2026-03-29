import { fromJson } from '@bufbuild/protobuf';
import { type TimelineSnapshotV2, TimelineSnapshotV2Schema } from '../sem/pb/proto/sem/timeline/transport_pb';
import {
  handleSem,
  type SemContext,
  type SemEnvelope,
} from '../sem/semRegistry';
import { timelineEntityFromProto } from '../sem/timelineMapper';
import { chatSessionSlice, createChatError, type ChatConnectionStatus } from '../state/chatSessionSlice';
import type { TimelineEntity } from '../state/timelineSlice';
import { timelineSlice } from '../state/timelineSlice';
import { isRecord } from '../utils/guards';
import type { ChatProfileSelection } from '../runtime/profileTypes';

export interface ConnectArgs {
  convId: string;
  dispatch: SemContext['dispatch'];
  profileSelection?: ChatProfileSelection;
  basePrefix?: string;
  onStatus?: (status: ChatConnectionStatus) => void;
  onLifecycle?: (event: WsLifecycleEvent) => void;
  hydrate?: boolean;
  wsFactory?: (url: string) => WebSocket;
  fetchImpl?: typeof fetch;
  location?: { protocol: string; host: string };
  onEnvelope?: (envelope: SemEnvelope) => void;
}

export type WsLifecyclePhase =
  | 'connect.begin'
  | 'connect.reuse'
  | 'disconnect'
  | 'ws.open'
  | 'ws.close'
  | 'ws.error'
  | 'hydrate.start'
  | 'hydrate.snapshot.applied'
  | 'hydrate.fetch.failed'
  | 'hydrate.fetch.error'
  | 'frame.buffered'
  | 'replay.begin'
  | 'replay.complete'
  | 'hydrate.complete';

export interface WsLifecycleEvent {
  phase: WsLifecyclePhase;
  convId: string;
  nonce: number;
  details?: Record<string, unknown>;
}

type RawSemEnvelope = unknown;

function seqFromEnvelope(envelope: RawSemEnvelope): number | null {
  if (!isRecord(envelope) || !isRecord(envelope.event)) return null;
  const seq = envelope.event.seq;
  if (typeof seq === 'number' && Number.isFinite(seq)) return seq;
  return null;
}

function resolveBasePrefix(basePrefix?: string): string {
  return typeof basePrefix === 'string' ? basePrefix.replace(/\/$/, '') : '';
}

function profileSelectionKey(selection?: ChatProfileSelection): string {
  const profile = String(selection?.profile ?? '').trim();
  const registry = String(selection?.registry ?? '').trim();
  return `${profile}::${registry}`;
}

function resolveWsUrl(
  convId: string,
  profileSelection?: ChatProfileSelection,
  basePrefix?: string,
  location?: { protocol: string; host: string }
) {
  const fallbackLocation =
    typeof window !== 'undefined' && window.location
      ? { protocol: window.location.protocol, host: window.location.host }
      : { protocol: 'http:', host: 'localhost' };
  const source = location ?? fallbackLocation;
  const protocol = source.protocol === 'https:' ? 'wss' : 'ws';
  let url = `${protocol}://${source.host}${resolveBasePrefix(basePrefix)}/ws?conv_id=${encodeURIComponent(convId)}`;
  const profile = String(profileSelection?.profile ?? '').trim();
  if (profile.length > 0) {
    url += `&profile=${encodeURIComponent(profile)}`;
  }
  const registry = String(profileSelection?.registry ?? '').trim();
  if (registry.length > 0) {
    url += `&registry=${encodeURIComponent(registry)}`;
  }
  return url;
}

function timelineApiUrl(convId: string, basePrefix?: string) {
  return `${resolveBasePrefix(basePrefix)}/api/timeline?conv_id=${encodeURIComponent(convId)}`;
}

function applyTimelineSnapshot(
  convId: string,
  snapshot: TimelineSnapshotV2,
  dispatch: SemContext['dispatch']
) {
  const entities = snapshot.entities
    .map((entity) => timelineEntityFromProto(entity, snapshot.version))
    .filter((entity): entity is TimelineEntity => entity !== null);
  dispatch(timelineSlice.actions.mergeSnapshot({ convId, entities }));
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function toBodyMessage(body: string, fallback: string): string {
  const normalized = String(body ?? '').trim();
  return normalized.length > 0 ? normalized : fallback;
}

function toSemEnvelope(payload: unknown): SemEnvelope | null {
  if (!isRecord(payload) || payload.sem !== true || !isRecord(payload.event)) {
    return null;
  }
  if (typeof payload.event.type !== 'string' || typeof payload.event.id !== 'string') {
    return null;
  }
  return payload as SemEnvelope;
}

class WsManager {
  private ws: WebSocket | null = null;
  private convId = '';
  private profileSelection = '';
  private connectNonce = 0;
  private hydrated = false;
  private buffered: RawSemEnvelope[] = [];
  private lastOnStatus: ((status: ChatConnectionStatus) => void) | null = null;
  private lastOnLifecycle: ((event: WsLifecycleEvent) => void) | null = null;
  private lastDispatch: SemContext['dispatch'] | null = null;

  private emitLifecycle(phase: WsLifecyclePhase, nonce: number, details?: Record<string, unknown>) {
    if (!this.convId || !this.lastOnLifecycle) return;
    this.lastOnLifecycle({ phase, convId: this.convId, nonce, details });
  }

  async connect(args: ConnectArgs) {
    const currentSelection = profileSelectionKey(args.profileSelection);
    if (this.ws && this.convId === args.convId && this.profileSelection === currentSelection) {
      this.lastOnLifecycle = args.onLifecycle ?? this.lastOnLifecycle;
      this.emitLifecycle('connect.reuse', this.connectNonce, {
        hydrated: this.hydrated,
        hydrateRequested: args.hydrate !== false,
        profileSelection: currentSelection,
      });
      if (args.hydrate !== false) {
        await this.ensureHydrated(args);
      }
      return;
    }

    this.disconnect();
    this.connectNonce += 1;
    const nonce = this.connectNonce;

    this.convId = args.convId;
    this.profileSelection = currentSelection;
    this.hydrated = false;
    this.buffered = [];
    this.lastOnStatus = args.onStatus ?? null;
    this.lastOnLifecycle = args.onLifecycle ?? null;
    this.lastDispatch = args.dispatch;
    this.emitLifecycle('connect.begin', nonce, {
      hydrateRequested: args.hydrate !== false,
      profileSelection: currentSelection,
    });

    args.dispatch(
      chatSessionSlice.actions.setConnectionStatus({
        convId: args.convId,
        status: 'connecting',
      })
    );
    args.onStatus?.('connecting');

    const wsFactory = args.wsFactory ?? ((url: string) => new WebSocket(url));
    const ws = wsFactory(resolveWsUrl(args.convId, args.profileSelection, args.basePrefix, args.location));
    this.ws = ws;

    let settleOpen: (() => void) | null = null;
    const openPromise = new Promise<void>((resolve) => {
      let settled = false;
      settleOpen = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      setTimeout(() => settleOpen?.(), 1500);
    });

    ws.onopen = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      this.emitLifecycle('ws.open', nonce);
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'connected',
        })
      );
      args.onStatus?.('connected');
    };

    ws.onclose = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      this.emitLifecycle('ws.close', nonce);
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'closed',
        })
      );
      args.dispatch(
        chatSessionSlice.actions.setIsStreaming({
          convId: args.convId,
          isStreaming: false,
        })
      );
      args.onStatus?.('closed');
    };

    ws.onerror = () => {
      settleOpen?.();
      if (nonce !== this.connectNonce) return;
      this.emitLifecycle('ws.error', nonce);
      args.dispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: args.convId,
          status: 'error',
        })
      );
      args.dispatch(
        chatSessionSlice.actions.setIsStreaming({
          convId: args.convId,
          isStreaming: false,
        })
      );
      args.dispatch(
        chatSessionSlice.actions.pushError({
          convId: args.convId,
          error: createChatError({
            kind: 'ws_error',
            stage: 'stream',
            source: 'wsManager.onerror',
            message: 'websocket error',
            recoverable: true,
          }),
        })
      );
      args.onStatus?.('error');
    };

    ws.onmessage = (message) => {
      if (nonce !== this.connectNonce) return;

      try {
        const payload = JSON.parse(String(message.data));
        const envelope = toSemEnvelope(payload);
        if (envelope) {
          args.onEnvelope?.(envelope);
        }
        if (!this.hydrated) {
          this.buffered.push(payload);
          this.emitLifecycle('frame.buffered', nonce, {
            bufferedCount: this.buffered.length,
            seq: seqFromEnvelope(payload),
          });
          return;
        }

        handleSem(payload, {
          dispatch: args.dispatch,
          convId: args.convId,
        });
      } catch (error) {
        args.dispatch(
          chatSessionSlice.actions.pushError({
            convId: args.convId,
            error: createChatError({
              kind: 'sem_decode_error',
              stage: 'stream',
              source: 'wsManager.onmessage',
              message: toErrorMessage(error, 'malformed websocket frame'),
              recoverable: true,
            }),
          })
        );
      }
    };

    await openPromise;
    if (nonce !== this.connectNonce) return;

    if (args.hydrate === false) {
      this.hydrated = true;
      return;
    }

    await this.hydrate(args, nonce);
  }

  disconnect() {
    const closingNonce = this.connectNonce;
    this.emitLifecycle('disconnect', closingNonce);
    this.connectNonce += 1;

    if (this.convId && this.lastDispatch) {
      this.lastDispatch(
        chatSessionSlice.actions.setConnectionStatus({
          convId: this.convId,
          status: 'closed',
        })
      );
      this.lastDispatch(
        chatSessionSlice.actions.setIsStreaming({
          convId: this.convId,
          isStreaming: false,
        })
      );
    }

    this.lastOnStatus?.('closed');

    try {
      this.ws?.close();
    } catch {
      // no-op
    }

    this.ws = null;
    this.convId = '';
    this.profileSelection = '';
    this.hydrated = false;
    this.buffered = [];
    this.lastOnStatus = null;
    this.lastOnLifecycle = null;
    this.lastDispatch = null;
  }

  async ensureHydrated(args: ConnectArgs) {
    if (!args.convId) return;
    if (!this.ws || this.convId !== args.convId) return;
    if (this.hydrated) return;

    await this.hydrate(args, this.connectNonce);
  }

  private async hydrate(args: ConnectArgs, nonce: number) {
    if (this.hydrated) return;
    if (nonce !== this.connectNonce) return;
    this.emitLifecycle('hydrate.start', nonce);

    const fetchImpl = args.fetchImpl ?? fetch;
    try {
      const response = await fetchImpl(timelineApiUrl(args.convId, args.basePrefix));
      if (response.ok) {
        const parsed = await response.json();
        if (nonce !== this.connectNonce) return;
        if (isRecord(parsed)) {
          const snapshot = fromJson(TimelineSnapshotV2Schema, parsed as any, {
            ignoreUnknownFields: true,
          });
          applyTimelineSnapshot(args.convId, snapshot, args.dispatch);
          this.emitLifecycle('hydrate.snapshot.applied', nonce, {
            entityCount: snapshot.entities.length,
            version: snapshot.version.toString(),
          });
        }
      } else {
        this.emitLifecycle('hydrate.fetch.failed', nonce, {
          status: response.status,
        });
        const body = await response.text();
        args.dispatch(
          chatSessionSlice.actions.pushError({
            convId: args.convId,
            error: createChatError({
              kind: 'http_error',
              stage: 'hydrate',
              source: 'wsManager.hydrate',
              status: response.status,
              message: toBodyMessage(body, `timeline request failed (${response.status})`),
              recoverable: response.status >= 500 || response.status === 429,
            }),
          })
        );
      }
    } catch (error) {
      this.emitLifecycle('hydrate.fetch.error', nonce, {
        message: toErrorMessage(error, 'timeline hydrate failed'),
      });
      args.dispatch(
        chatSessionSlice.actions.pushError({
          convId: args.convId,
          error: createChatError({
            kind: 'hydrate_error',
            stage: 'hydrate',
            source: 'wsManager.hydrate',
            message: toErrorMessage(error, 'timeline hydrate failed'),
            recoverable: true,
          }),
        })
      );
    }

    if (nonce !== this.connectNonce) return;

    this.hydrated = true;
    const buffered = this.buffered;
    this.buffered = [];
    this.emitLifecycle('replay.begin', nonce, {
      bufferedCount: buffered.length,
    });

    buffered.sort((a, b) => (seqFromEnvelope(a) ?? 0) - (seqFromEnvelope(b) ?? 0));
    let lastSeq = 0;
    let replayedCount = 0;
    for (const frame of buffered) {
      const seq = seqFromEnvelope(frame);
      if (seq && lastSeq && seq <= lastSeq) continue;
      if (seq) {
        lastSeq = seq;
      }
      handleSem(frame, {
        dispatch: args.dispatch,
        convId: args.convId,
      });
      replayedCount += 1;
    }
    this.emitLifecycle('replay.complete', nonce, {
      replayedCount,
    });
    this.emitLifecycle('hydrate.complete', nonce, {
      replayedCount,
    });
  }
}

export { WsManager };
