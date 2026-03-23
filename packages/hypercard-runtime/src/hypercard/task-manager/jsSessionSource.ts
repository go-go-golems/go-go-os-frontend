import type { JsSessionBroker } from '../../repl/jsSessionBroker';
import type { TaskManagerRow, TaskManagerSource } from './types';

interface JsSessionTaskManagerSourceOptions {
  sourceId: string;
  sourceTitle: string;
  broker: JsSessionBroker;
  focusSession?: (sessionId: string) => void;
}

export function createJsSessionTaskManagerSource(
  options: JsSessionTaskManagerSourceOptions,
): TaskManagerSource {
  return {
    sourceId() {
      return options.sourceId;
    },
    title() {
      return options.sourceTitle;
    },
    listRows() {
      return options.broker.listSessions().map((session) => ({
        id: session.sessionId,
        kind: 'js-session',
        sourceId: options.sourceId,
        sourceTitle: options.sourceTitle,
        title: session.title,
        status: 'ready',
        startedAt: session.createdAt,
        details: {
          ownership: 'broker-owned',
          globals: String(session.globalNames.length),
          globalsPreview: session.globalNames.slice(0, 6).join(', ') || '—',
        },
        actions: [
          { id: 'focus', label: 'Focus', intent: 'focus' },
          { id: 'reset', label: 'Reset', intent: 'reset' },
          { id: 'dispose', label: 'Dispose', intent: 'dispose' },
        ],
      }) satisfies TaskManagerRow);
    },
    async invoke(actionId, rowId) {
      if (actionId === 'focus') {
        options.focusSession?.(rowId);
        return;
      }
      if (actionId === 'reset') {
        await options.broker.resetSession(rowId);
        return;
      }
      if (actionId === 'dispose') {
        options.broker.disposeSession(rowId);
        return;
      }
      throw new Error(`Unsupported JS session action: ${actionId}`);
    },
    subscribe(listener) {
      return options.broker.subscribe(listener);
    },
  };
}
