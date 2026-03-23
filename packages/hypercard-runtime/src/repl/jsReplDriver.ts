import type {
  ReplCompletionItem,
  ReplDriver,
  ReplDriverContext,
  ReplExecutionResult,
  ReplHelpEntry,
  TerminalLine,
} from '@hypercard/repl';
import { getAttachedJsSession, listAttachedJsSessions } from './attachedJsSessionRegistry';
import { createJsSessionBroker, type JsSessionBroker } from './jsSessionBroker';

export interface JsReplDriverOptions {
  broker?: JsSessionBroker;
  initialSessionId?: string | null;
  initialOrigin?: 'spawned' | 'attached-runtime' | null;
}

const JS_KEYWORDS = [
  'await',
  'break',
  'const',
  'continue',
  'else',
  'false',
  'for',
  'function',
  'if',
  'let',
  'null',
  'return',
  'switch',
  'throw',
  'true',
  'typeof',
  'undefined',
  'var',
  'while',
] as const;

const COMMAND_HELP: Record<string, ReplHelpEntry> = {
  ':spawn': {
    title: ':spawn',
    detail: 'Spawn a blank JavaScript session.',
    usage: ':spawn [session-id]',
  },
  ':sessions': {
    title: ':sessions',
    detail: 'List live JavaScript sessions, including attached runtime-backed sessions.',
    usage: ':sessions',
  },
  ':attach': {
    title: ':attach',
    detail: 'Attach to a live runtime-backed JavaScript session.',
    usage: ':attach <session-id>',
  },
  ':use': {
    title: ':use',
    detail: 'Select the active JavaScript session for plain eval lines.',
    usage: ':use <session-id>',
  },
  ':globals': {
    title: ':globals',
    detail: 'List globals in the active or provided session.',
    usage: ':globals [session-id]',
  },
  ':reset': {
    title: ':reset',
    detail: 'Reset the active or provided session back to its initial prelude.',
    usage: ':reset [session-id]',
  },
  ':dispose': {
    title: ':dispose',
    detail: 'Dispose a JavaScript session.',
    usage: ':dispose [session-id]',
  },
  ':help': {
    title: ':help',
    detail: 'Show JS REPL command help.',
    usage: ':help [topic]',
  },
};

function splitCommand(raw: string): { command: string; rest: string } {
  const trimmed = raw.trim();
  const spaceIndex = trimmed.indexOf(' ');
  if (spaceIndex === -1) {
    return { command: trimmed, rest: '' };
  }
  return {
    command: trimmed.slice(0, spaceIndex),
    rest: trimmed.slice(spaceIndex + 1).trim(),
  };
}

function nextGeneratedSessionId(counter: number): string {
  return `js-${counter}`;
}

function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatEvalLines(result: { logs: string[]; value: unknown; error?: { name: string; message: string } }): TerminalLine[] {
  const lines: TerminalLine[] = result.logs.map((text) => ({ type: 'system', text }));
  if (result.error) {
    lines.push({
      type: 'error',
      text: `${result.error.name}: ${result.error.message}`,
    });
    return lines;
  }
  lines.push({
    type: 'output',
    text: formatValue(result.value),
  });
  return lines;
}

function currentToken(input: string): string {
  const match = input.match(/([A-Za-z_$:][\w$:]*)$/);
  return match?.[1] ?? '';
}

type ActiveJsSessionRecord =
  | {
      kind: 'spawned';
      sessionId: string;
      title: string;
      origin: 'spawned';
      session: ReturnType<JsSessionBroker['getSession']> extends infer T ? Exclude<T, null> : never;
    }
  | {
      kind: 'attached-runtime';
      sessionId: string;
      title: string;
      origin: 'attached-runtime';
      session: NonNullable<ReturnType<typeof getAttachedJsSession>>['handle'];
    };

function promptForSession(sessionId: string | null, origin: 'spawned' | 'attached-runtime' | null): string {
  if (!sessionId || !origin) {
    return 'js>';
  }
  return origin === 'attached-runtime' ? `js[runtime:${sessionId}]>` : `js[${sessionId}]>`;
}

export function createJsReplDriver(options: JsReplDriverOptions = {}): ReplDriver {
  const broker = options.broker ?? createJsSessionBroker();
  let activeSessionId: string | null = options.initialSessionId ?? null;
  let activeOrigin: 'spawned' | 'attached-runtime' | null = options.initialOrigin ?? null;
  let sessionCounter = 1;

  function requireSession(sessionIdArg?: string) {
    const sessionId = sessionIdArg ?? activeSessionId;
    if (!sessionId) {
      throw new Error('No active JS session. Use :spawn or :use <session-id> first.');
    }
    const spawned = broker.getSession(sessionId);
    if (spawned) {
      return {
        kind: 'spawned' as const,
        sessionId,
        title: broker.listSessions().find((summary) => summary.sessionId === sessionId)?.title ?? sessionId,
        origin: 'spawned' as const,
        session: spawned,
      };
    }
    const attached = getAttachedJsSession(sessionId);
    if (attached) {
      return {
        kind: 'attached-runtime' as const,
        sessionId,
        title: attached.summary.title,
        origin: 'attached-runtime' as const,
        session: attached.handle,
      };
    }
    throw new Error(`Unknown JS session: ${sessionId}`);
  }

  return {
    async execute(raw: string, _context: ReplDriverContext): Promise<ReplExecutionResult> {
      const trimmed = raw.trim();
      if (!trimmed) {
        return { lines: [] };
      }

      if (trimmed.startsWith(':')) {
        const { command, rest } = splitCommand(trimmed);
        switch (command) {
          case ':spawn': {
            const sessionId = rest || nextGeneratedSessionId(sessionCounter++);
            await broker.spawnSession({ sessionId, title: `JavaScript ${sessionId}` });
            activeSessionId = sessionId;
            activeOrigin = 'spawned';
            return {
              lines: [
                { type: 'system', text: `Spawned JS session ${sessionId}` },
              ],
              envVars: {
                REPL_PROMPT: promptForSession(sessionId, 'spawned'),
              },
            };
          }
          case ':sessions': {
            const sessions = [
              ...broker.listSessions().map((summary) => ({
                sessionId: summary.sessionId,
                title: summary.title,
                origin: 'spawned' as const,
              })),
              ...listAttachedJsSessions().map((entry) => ({
                sessionId: entry.summary.sessionId,
                title: entry.summary.title,
                origin: 'attached-runtime' as const,
              })),
            ].sort((left, right) => left.sessionId.localeCompare(right.sessionId));
            if (sessions.length === 0) {
              return { lines: [{ type: 'system', text: 'No JS sessions.' }] };
            }
            return {
              lines: sessions.map((summary) => ({
                type: 'output',
                text:
                  `${summary.sessionId}${summary.sessionId === activeSessionId ? ' *' : ''} — ` +
                  `${summary.title} [${summary.origin}]`,
              })),
            };
          }
          case ':attach': {
            if (!rest) {
              throw new Error('Usage: :attach <session-id>');
            }
            const attached = getAttachedJsSession(rest);
            if (!attached) {
              throw new Error(`Unknown attached JS session: ${rest}`);
            }
            activeSessionId = rest;
            activeOrigin = 'attached-runtime';
            return {
              lines: [{ type: 'system', text: `Attached JS console to runtime session ${rest}` }],
              envVars: {
                REPL_PROMPT: promptForSession(rest, 'attached-runtime'),
              },
            };
          }
          case ':use': {
            if (!rest) {
              throw new Error('Usage: :use <session-id>');
            }
            const active = requireSession(rest);
            activeSessionId = rest;
            activeOrigin = active.origin;
            return {
              lines: [{ type: 'system', text: `Active JS session: ${rest} [${active.origin}]` }],
              envVars: {
                REPL_PROMPT: promptForSession(rest, active.origin),
              },
            };
          }
          case ':globals': {
            const { sessionId, session } = requireSession(rest || undefined);
            return {
              lines: [
                { type: 'system', text: `Globals for ${sessionId}` },
                ...session.inspectGlobals().map((name) => ({ type: 'output' as const, text: name })),
              ],
            };
          }
          case ':reset': {
            const active = requireSession(rest || undefined);
            if (active.kind !== 'spawned') {
              throw new Error(`Attached JS session ${active.sessionId} cannot be reset`);
            }
            const { sessionId, session } = active;
            await session.reset();
            return {
              lines: [{ type: 'system', text: `Reset JS session ${sessionId}` }],
            };
          }
          case ':dispose': {
            const sessionId = rest || activeSessionId;
            if (!sessionId) {
              throw new Error('Usage: :dispose <session-id>');
            }
            if (getAttachedJsSession(sessionId)) {
              throw new Error(`Attached JS session ${sessionId} cannot be disposed from JavaScript REPL`);
            }
            const disposed = broker.disposeSession(sessionId);
            if (!disposed) {
              throw new Error(`Unknown JS session: ${sessionId}`);
            }
            if (activeSessionId === sessionId) {
              activeSessionId = null;
              activeOrigin = null;
            }
            return {
              lines: [{ type: 'system', text: `Disposed JS session ${sessionId}` }],
              envVars: {
                REPL_PROMPT: promptForSession(null, null),
              },
            };
          }
          case ':help': {
            const topic = rest || null;
            const entries = topic
              ? Object.values(COMMAND_HELP).filter((entry) => entry.title === topic)
              : Object.values(COMMAND_HELP);
            return {
              lines: entries.flatMap((entry) => [
                { type: 'output' as const, text: `${entry.title} — ${entry.detail}` },
                ...(entry.usage ? [{ type: 'system' as const, text: `  ${entry.usage}` }] : []),
              ]),
            };
          }
          default:
            throw new Error(`Unknown JS REPL command: ${command}`);
        }
      }

      const { session } = requireSession();
      return {
        lines: formatEvalLines(
          'eval' in session ? session.eval(trimmed) : session.evaluate(trimmed),
        ),
      };
    },
    getCompletions(input) {
      const trimmed = input.trimStart();
      if (trimmed.startsWith(':')) {
        const token = currentToken(trimmed);
        if (
          trimmed.startsWith(':use') ||
          trimmed.startsWith(':attach') ||
          trimmed.startsWith(':globals')
        ) {
          const partial = trimmed.split(/\s+/)[1] ?? '';
          return [
            ...broker.listSessions().map((summary) => ({ value: summary.sessionId, detail: `${summary.title} [spawned]` })),
            ...listAttachedJsSessions().map((entry) => ({
              value: entry.summary.sessionId,
              detail: `${entry.summary.title} [attached-runtime]`,
            })),
          ]
            .filter((entry) => entry.value.startsWith(partial));
        }
        if (trimmed.startsWith(':dispose') || trimmed.startsWith(':reset')) {
          const partial = trimmed.split(/\s+/)[1] ?? '';
          return broker.listSessions()
            .filter((summary) => summary.sessionId.startsWith(partial))
            .map((summary) => ({ value: summary.sessionId, detail: summary.title }));
        }
        return Object.values(COMMAND_HELP)
          .filter((entry) => entry.title.startsWith(token || ':'))
          .map((entry) => ({ value: entry.title, detail: entry.detail }));
      }

      const token = currentToken(input);
      let globals: string[] = [];
      if (activeSessionId) {
        try {
          globals = requireSession(activeSessionId).session.inspectGlobals();
        } catch {
          globals = [];
        }
      }
      return [
        ...JS_KEYWORDS.map((keyword) => ({ value: keyword, detail: 'js keyword' })),
        ...globals.map((name) => ({ value: name, detail: 'session global' })),
      ].filter((entry) => entry.value.startsWith(token));
    },
    getHelp(topic) {
      if (!topic) {
        return Object.values(COMMAND_HELP);
      }
      return Object.values(COMMAND_HELP).filter((entry) => entry.title === topic);
    },
  };
}
