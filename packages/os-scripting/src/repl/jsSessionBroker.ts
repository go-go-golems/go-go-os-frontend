import {
  JsSessionService,
  type CreateJsSessionRequest,
  type JsEvalResult,
  type JsSessionServiceOptions,
  type JsSessionSummary,
} from '../plugin-runtime/jsSessionService';

export interface SpawnJsSessionRequest extends CreateJsSessionRequest {}

export interface JsSessionHandle {
  readonly sessionId: string;
  eval(code: string): JsEvalResult;
  inspectGlobals(): string[];
  installPrelude(code: string): void;
  reset(): Promise<JsSessionSummary>;
  dispose(): boolean;
}

export interface JsSessionBroker {
  spawnSession(request: SpawnJsSessionRequest): Promise<JsSessionHandle>;
  getSession(sessionId: string): JsSessionHandle | null;
  listSessions(): JsSessionSummary[];
  resetSession(sessionId: string): Promise<JsSessionSummary>;
  disposeSession(sessionId: string): boolean;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function createJsSessionBroker(
  options: JsSessionServiceOptions = {},
): JsSessionBroker {
  const sessionService = new JsSessionService(options);
  const handles = new Map<string, JsSessionHandle>();
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function createHandle(sessionId: string): JsSessionHandle {
    return {
      sessionId,
      eval(code) {
        return sessionService.evaluate(sessionId, code);
      },
      inspectGlobals() {
        return sessionService.getGlobalNames(sessionId);
      },
      installPrelude(code) {
        sessionService.installPrelude(sessionId, code);
      },
      async reset() {
        const summary = await sessionService.resetSession(sessionId);
        emit();
        return summary;
      },
      dispose() {
        return broker.disposeSession(sessionId);
      },
    };
  }

  const broker: JsSessionBroker = {
    async spawnSession(request) {
      if (handles.has(request.sessionId)) {
        throw new Error(`JS session already exists: ${request.sessionId}`);
      }
      await sessionService.createSession(request);
      const handle = createHandle(request.sessionId);
      handles.set(request.sessionId, handle);
      emit();
      return handle;
    },
    getSession(sessionId) {
      return handles.get(sessionId) ?? null;
    },
    listSessions() {
      return sessionService.listSessions();
    },
    async resetSession(sessionId) {
      const summary = await sessionService.resetSession(sessionId);
      emit();
      return summary;
    },
    disposeSession(sessionId) {
      const disposed = sessionService.disposeSession(sessionId);
      if (!disposed) {
        return false;
      }
      handles.delete(sessionId);
      emit();
      return true;
    },
    clear() {
      sessionService.clear();
      handles.clear();
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  return broker;
}
