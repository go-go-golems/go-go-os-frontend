import type {
  ReplCompletionItem,
  ReplDriver,
  ReplDriverContext,
  ReplExecutionResult,
  ReplHelpEntry,
  TerminalLine,
} from '@hypercard/repl';
import { getAttachedRuntimeSession, listAttachedRuntimeSessions } from './attachedRuntimeSessionRegistry';
import { getRuntimePackageOrThrow, listRuntimePackages } from '../runtime-packages/runtimePackageRegistry';
import { listRuntimeSurfaceTypes } from '../runtime-packs/runtimeSurfaceTypeRegistry';
import { createRuntimeBroker, type RuntimeBroker, type RuntimeSessionHandle, type RuntimeSessionSummary, type SpawnRuntimeSessionRequest } from './runtimeBroker';

export interface ReplBundleLibraryEntry {
  key: string;
  title?: string;
  stackId: string;
  packageIds: string[];
  bundleCode: string;
  docsMetadata?: RuntimeBundleDocsMetadata;
}

export interface HypercardReplDriverOptions {
  broker?: RuntimeBroker;
  bundleLibrary?: Record<string, ReplBundleLibraryEntry>;
}

interface RuntimePackageDocSymbol {
  name: string;
  summary?: string;
  prose?: string;
}

interface RuntimePackageDocFile {
  package?: {
    name?: string;
    title?: string;
    description?: string;
    prose?: string;
  };
  symbols?: RuntimePackageDocSymbol[];
}

interface RuntimePackageDocsMetadata {
  packId?: string;
  docs?: {
    files?: RuntimePackageDocFile[];
  };
}

interface RuntimeBundleDocSymbol {
  name: string;
  summary?: string;
  prose?: string;
}

interface RuntimeBundleDocFile {
  file_path?: string;
  symbols?: RuntimeBundleDocSymbol[];
}

interface RuntimeBundleDocsMetadata {
  packId?: string;
  docs?: {
    files?: RuntimeBundleDocFile[];
    by_symbol?: Record<string, RuntimeBundleDocSymbol>;
  };
}

const COMMAND_HELP: Record<string, ReplHelpEntry> = {
  packages: {
    title: 'packages',
    detail: 'List registered runtime packages and their summaries.',
    usage: 'packages',
  },
  'surface-types': {
    title: 'surface-types',
    detail: 'List registered runtime surface types.',
    usage: 'surface-types',
  },
  bundles: {
    title: 'bundles',
    detail: 'List the available bundle library entries that the REPL can spawn.',
    usage: 'bundles',
  },
  spawn: {
    title: 'spawn',
    detail: 'Spawn a runtime session from a named bundle library entry.',
    usage: 'spawn <bundle-key> [session-id]',
  },
  attach: {
    title: 'attach',
    detail: 'Attach the REPL to a live host-owned runtime session in read-only mode.',
    usage: 'attach <session-id>',
  },
  sessions: {
    title: 'sessions',
    detail: 'List spawned and attached runtime sessions visible to the REPL.',
    usage: 'sessions',
  },
  help: {
    title: 'help',
    detail: 'Show HyperCard REPL command help or docs for a command, package symbol, or runtime surface.',
    usage: 'help [topic]',
  },
  use: {
    title: 'use',
    detail: 'Select an active runtime session for later render/event commands.',
    usage: 'use <session-id>',
  },
  surfaces: {
    title: 'surfaces',
    detail: 'List runtime surfaces for the active or provided session.',
    usage: 'surfaces [session-id]',
  },
  render: {
    title: 'render',
    detail: 'Render a runtime surface and print the returned tree as JSON.',
    usage: 'render <surface-id> [state-json]',
  },
  event: {
    title: 'event',
    detail: 'Dispatch a handler on a runtime surface and print the resulting actions.',
    usage: 'event <surface-id> <handler> [args-json] [state-json]',
  },
  'define-surface': {
    title: 'define-surface',
    detail: 'Define a new runtime surface in the active session from inline factory code.',
    usage: 'define-surface <surface-id> <surface-type> <factory-code>',
  },
  'define-render': {
    title: 'define-render',
    detail: 'Replace the render() function for a runtime surface with inline code.',
    usage: 'define-render <surface-id> <render-code>',
  },
  'define-handler': {
    title: 'define-handler',
    detail: 'Replace or add a handler on a runtime surface with inline code.',
    usage: 'define-handler <surface-id> <handler-name> <handler-code>',
  },
  'open-surface': {
    title: 'open-surface',
    detail: 'Emit a host effect requesting a window for a runtime surface.',
    usage: 'open-surface <surface-id> [session-id]',
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function formatJsonLines(value: unknown): TerminalLine[] {
  return JSON.stringify(value, null, 2)
    .split('\n')
    .map((text) => ({ type: 'output' as const, text }));
}

function listDocEntries(): ReplHelpEntry[] {
  const entries: ReplHelpEntry[] = [];
  for (const packageId of listRuntimePackages()) {
    const runtimePackage = getRuntimePackageOrThrow(packageId);
    const metadata = runtimePackage.docsMetadata as RuntimePackageDocsMetadata | undefined;
    for (const file of metadata?.docs?.files ?? []) {
      if (file.package?.name) {
        entries.push({
          title: file.package.name,
          detail: file.package.description ?? file.package.title ?? runtimePackage.summary ?? packageId,
          usage: file.package.prose,
        });
      }
      for (const symbol of file.symbols ?? []) {
        entries.push({
          title: symbol.name,
          detail: symbol.summary ?? `Documentation symbol from ${packageId}`,
          usage: symbol.prose,
        });
      }
    }
  }
  return entries;
}

function listBundleDocEntries(
  bundleLibrary: Map<string, ReplBundleLibraryEntry>,
): ReplHelpEntry[] {
  const entries: ReplHelpEntry[] = [];
  for (const bundle of bundleLibrary.values()) {
    const docs = bundle.docsMetadata?.docs;
    for (const [symbolName, symbol] of Object.entries(docs?.by_symbol ?? {})) {
      entries.push({
        title: symbolName,
        detail: symbol.summary ?? `Runtime surface doc from ${bundle.key}`,
        usage: symbol.prose,
      });
    }
    for (const file of docs?.files ?? []) {
      for (const symbol of file.symbols ?? []) {
        if (docs?.by_symbol?.[symbol.name]) {
          continue;
        }
        entries.push({
          title: symbol.name,
          detail: symbol.summary ?? `Runtime surface doc from ${bundle.key}`,
          usage: symbol.prose,
        });
      }
    }
  }
  return entries;
}

function listPackageCompletionItems(): ReplCompletionItem[] {
  return listRuntimePackages().map((packageId) => {
    const runtimePackage = getRuntimePackageOrThrow(packageId);
    return {
      value: packageId,
      detail: runtimePackage.summary ?? runtimePackage.version,
    };
  });
}

function parseJsonArg(raw: string | undefined, fallback: unknown = {}): unknown {
  if (!raw) {
    return fallback;
  }
  return JSON.parse(raw);
}

function parseInlineAuthoringArgs(raw: string, count: number): string[] {
  const trimmed = raw.trim();
  if (!trimmed) {
    return [];
  }

  const tokens: string[] = [];
  let cursor = trimmed;
  for (let index = 0; index < count; index += 1) {
    const match = cursor.match(/^(\S+)(?:\s+|$)/);
    if (!match) {
      return tokens;
    }
    tokens.push(match[1]);
    cursor = cursor.slice(match[0].length);
  }

  if (cursor.trim().length > 0) {
    tokens.push(cursor.trim());
  }

  return tokens;
}

function helpForTopic(
  topic: string | null,
  bundleLibrary: Map<string, ReplBundleLibraryEntry>,
): ReplHelpEntry[] | null {
  const docEntries = [
    ...listDocEntries(),
    ...listBundleDocEntries(bundleLibrary),
  ];
  if (!topic) {
    return [
      ...Object.values(COMMAND_HELP),
      ...docEntries,
    ];
  }

  const command = COMMAND_HELP[topic];
  if (command) {
    return [command];
  }

  return docEntries.filter((entry) => entry.title === topic);
}

function findBundleForStackId(
  bundleLibrary: Map<string, ReplBundleLibraryEntry>,
  stackId: string,
): ReplBundleLibraryEntry | null {
  for (const bundle of bundleLibrary.values()) {
    if (bundle.stackId === stackId) {
      return bundle;
    }
  }
  return null;
}

function describeSurface(
  bundleLibrary: Map<string, ReplBundleLibraryEntry>,
  stackId: string,
  surfaceId: string,
  fallbackSurfaceType: string,
): string {
  const bundle = findBundleForStackId(bundleLibrary, stackId);
  const symbol = bundle?.docsMetadata?.docs?.by_symbol?.[surfaceId];
  if (!symbol?.summary) {
    return fallbackSurfaceType;
  }
  return `${symbol.summary} [${fallbackSurfaceType}]`;
}

function collectSessions(broker: RuntimeBroker): RuntimeSessionSummary[] {
  const attached = listAttachedRuntimeSessions().map((entry) => entry.summary);
  const spawned = broker.listSessions();
  return [...spawned, ...attached].sort((left, right) => left.sessionId.localeCompare(right.sessionId));
}

function linesForSessions(broker: RuntimeBroker, activeSessionId: string | null): TerminalLine[] {
  const sessions = collectSessions(broker);
  if (sessions.length === 0) {
    return [{ type: 'system', text: 'No runtime sessions.' }];
  }

  return sessions.flatMap((session) => [
    {
      type: 'output' as const,
      text:
        `${session.sessionId}${session.sessionId === activeSessionId ? ' *' : ''} — ` +
        `${session.stackId} (${session.packageIds.join(', ')}) ` +
        `[${session.origin}${session.writable ? '' : ', read-only'}]`,
    },
    {
      type: 'system' as const,
      text: `  surfaces: ${session.surfaces.join(', ') || 'none'}`,
    },
  ]);
}

function promptForSession(sessionId: string | null): string {
  return sessionId ? `hc[${sessionId}]>` : 'hc>';
}

export function createHypercardReplDriver(
  options: HypercardReplDriverOptions = {},
): ReplDriver {
  const broker = options.broker ?? createRuntimeBroker();
  const bundleLibrary = new Map(
    Object.values(options.bundleLibrary ?? {}).map((entry) => [entry.key, entry] as const),
  );

  let activeSessionId: string | null = null;
  let sessionCounter = 1;

  function nextSessionId(bundleKey: string) {
    const candidate = `${bundleKey}@repl-${sessionCounter}`;
    sessionCounter += 1;
    return candidate;
  }

  function getSessionRecord(sessionId: string): { handle: RuntimeSessionHandle; summary: RuntimeSessionSummary } | null {
    const spawnedHandle = broker.getSession(sessionId);
    if (spawnedHandle) {
      const summary = broker.listSessions().find((entry) => entry.sessionId === sessionId);
      if (!summary) {
        throw new Error(`Missing runtime session summary for spawned session: ${sessionId}`);
      }
      return { handle: spawnedHandle, summary };
    }

    const attached = getAttachedRuntimeSession(sessionId);
    if (attached) {
      return { handle: attached.handle, summary: attached.summary };
    }

    return null;
  }

  function requireWritableSession(record: { handle: RuntimeSessionHandle; summary: RuntimeSessionSummary }, sessionId: string) {
    if (record.summary.writable) {
      return;
    }
    throw new Error(`Attached runtime session ${sessionId} is read-only`);
  }

  function getActiveSession(sessionIdArg?: string) {
    const sessionId = sessionIdArg ?? activeSessionId;
    if (!sessionId) {
      throw new Error('No active runtime session. Use spawn or use <session-id> first.');
    }
    const record = getSessionRecord(sessionId);
    if (!record) {
      throw new Error(`Unknown runtime session: ${sessionId}`);
    }
    return { sessionId, ...record };
  }

  async function spawnBundle(bundleKey: string, sessionIdArg?: string): Promise<ReplExecutionResult> {
    const bundle = bundleLibrary.get(bundleKey);
    if (!bundle) {
      throw new Error(`Unknown bundle: ${bundleKey}`);
    }

    const request: SpawnRuntimeSessionRequest = {
      stackId: bundle.stackId,
      sessionId: sessionIdArg ?? nextSessionId(bundleKey),
      packageIds: bundle.packageIds,
      bundleCode: bundle.bundleCode,
    };
    const handle = await broker.spawnSession(request);
    activeSessionId = handle.sessionId;
    return {
      lines: [
        {
          type: 'system',
          text: `Spawned runtime session ${handle.sessionId} from ${bundleKey}`,
        },
        {
          type: 'output',
          text: `surfaces: ${handle.getBundleMeta().surfaces.join(', ') || 'none'}`,
        },
      ],
      envVars: {
        REPL_PROMPT: promptForSession(handle.sessionId),
      },
    };
  }

  return {
    async execute(raw, _context: ReplDriverContext): Promise<ReplExecutionResult> {
      const trimmed = raw.trim();
      if (!trimmed) {
        return { lines: [] };
      }

      const [command, ...rest] = trimmed.split(/\s+/);
      const restRaw = trimmed.slice(command.length).trimStart();

      switch (command) {
        case 'packages':
          return {
            lines: listPackageCompletionItems().map((item) => ({
              type: 'output',
              text: `${item.value} — ${item.detail ?? ''}`.trim(),
            })),
          };
        case 'surface-types':
          return {
            lines: listRuntimeSurfaceTypes().map((surfaceType) => ({
              type: 'output',
              text: surfaceType,
            })),
          };
        case 'bundles':
          return {
            lines:
              bundleLibrary.size === 0
                ? [{ type: 'system', text: 'No bundle library entries configured.' }]
                : Array.from(bundleLibrary.values()).map((bundle) => ({
                    type: 'output',
                    text: `${bundle.key} — ${bundle.title ?? bundle.stackId} [${bundle.packageIds.join(', ')}]`,
                  })),
          };
        case 'spawn':
          if (rest.length === 0) {
            throw new Error('Usage: spawn <bundle-key> [session-id]');
          }
          return await spawnBundle(rest[0], rest[1]);
        case 'sessions':
          return {
            lines: linesForSessions(broker, activeSessionId),
          };
        case 'help': {
          const topic = rest[0] ?? null;
          const entries = helpForTopic(topic, bundleLibrary);
          if (!entries || entries.length === 0) {
            return {
              lines: [
                {
                  type: 'error',
                  text: topic ? `No help available for "${topic}"` : 'No help available.',
                },
              ],
            };
          }
          return {
            lines: entries.flatMap((entry) => [
              { type: 'output' as const, text: `${entry.title} — ${entry.detail}` },
              ...(entry.usage ? [{ type: 'system' as const, text: `  ${entry.usage}` }] : []),
            ]),
          };
        }
        case 'attach': {
          const sessionId = rest[0];
          if (!sessionId) {
            throw new Error('Usage: attach <session-id>');
          }
          const attached = getAttachedRuntimeSession(sessionId);
          if (!attached) {
            throw new Error(`Unknown attached runtime session: ${sessionId}`);
          }
          activeSessionId = sessionId;
          return {
            lines: [{ type: 'system', text: `Attached to runtime session: ${sessionId} (read-only)` }],
            envVars: {
              REPL_PROMPT: promptForSession(sessionId),
            },
          };
        }
        case 'use': {
          const sessionId = rest[0];
          if (!sessionId) {
            throw new Error('Usage: use <session-id>');
          }
          const record = getSessionRecord(sessionId);
          if (!record) {
            throw new Error(`Unknown runtime session: ${sessionId}`);
          }
          activeSessionId = sessionId;
          return {
            lines: [{ type: 'system', text: `Active runtime session: ${sessionId}${record.summary.writable ? '' : ' (read-only)'}` }],
            envVars: {
              REPL_PROMPT: promptForSession(sessionId),
            },
          };
        }
        case 'surfaces': {
          const { handle, sessionId } = getActiveSession(rest[0]);
          const meta = handle.getBundleMeta();
          return {
            lines: [
              { type: 'system', text: `Runtime surfaces for ${sessionId}` },
              ...meta.surfaces.map((surfaceId) => ({
                type: 'output' as const,
                text: `${surfaceId} — ${describeSurface(
                  bundleLibrary,
                  handle.stackId,
                  surfaceId,
                  meta.surfaceTypes?.[surfaceId] ?? 'ui.card.v1',
                )}`,
              })),
            ],
          };
        }
        case 'render': {
          const [surfaceId, stateJson] = parseInlineAuthoringArgs(restRaw, 1);
          if (!surfaceId) {
            throw new Error('Usage: render <surface-id> [state-json]');
          }
          const { handle } = getActiveSession();
          const tree = handle.renderSurface(surfaceId, parseJsonArg(stateJson, {}));
          return { lines: formatJsonLines(tree) };
        }
        case 'event': {
          const surfaceId = rest[0];
          const handler = rest[1];
          if (!surfaceId || !handler) {
            throw new Error('Usage: event <surface-id> <handler> [args-json] [state-json]');
          }
          const active = getActiveSession();
          requireWritableSession(active, active.sessionId);
          const { handle } = active;
          const actions = handle.eventSurface(
            surfaceId,
            handler,
            parseJsonArg(rest[2], {}),
            parseJsonArg(rest[3], {}),
          );
          return { lines: formatJsonLines(actions) };
        }
        case 'define-surface': {
          const [surfaceId, surfaceType, code] = parseInlineAuthoringArgs(restRaw, 2);
          if (!surfaceId || !surfaceType || !code) {
            throw new Error('Usage: define-surface <surface-id> <surface-type> <factory-code>');
          }
          const active = getActiveSession();
          requireWritableSession(active, active.sessionId);
          const { handle, sessionId } = active;
          const bundle = handle.defineSurface(surfaceId, code, surfaceType);
          return {
            lines: [
              { type: 'system', text: `Defined runtime surface ${surfaceId} in ${sessionId}` },
              { type: 'output', text: `surfaces: ${bundle.surfaces.join(', ') || 'none'}` },
            ],
          };
        }
        case 'define-render': {
          const [surfaceId, code] = parseInlineAuthoringArgs(restRaw, 1);
          if (!surfaceId || !code) {
            throw new Error('Usage: define-render <surface-id> <render-code>');
          }
          const active = getActiveSession();
          requireWritableSession(active, active.sessionId);
          const { handle, sessionId } = active;
          handle.defineSurfaceRender(surfaceId, code);
          return {
            lines: [
              { type: 'system', text: `Updated render() for ${surfaceId} in ${sessionId}` },
            ],
          };
        }
        case 'define-handler': {
          const [surfaceId, handlerName, code] = parseInlineAuthoringArgs(restRaw, 2);
          if (!surfaceId || !handlerName || !code) {
            throw new Error('Usage: define-handler <surface-id> <handler-name> <handler-code>');
          }
          const active = getActiveSession();
          requireWritableSession(active, active.sessionId);
          const { handle, sessionId } = active;
          handle.defineSurfaceHandler(surfaceId, handlerName, code);
          return {
            lines: [
              { type: 'system', text: `Updated handler ${surfaceId}.${handlerName} in ${sessionId}` },
            ],
          };
        }
        case 'open-surface': {
          const surfaceId = rest[0];
          if (!surfaceId) {
            throw new Error('Usage: open-surface <surface-id> [session-id]');
          }
          const active = getActiveSession(rest[1]);
          const { handle, sessionId } = active;
          return {
            lines: [
              {
                type: 'system',
                text: `Requested runtime surface window for ${sessionId}:${surfaceId}${active.summary.writable ? '' : ' (read-only attached view)'}`,
              },
            ],
            effects: [
              {
                type: 'open-window',
                payload: {
                  kind: 'runtime-surface',
                  sessionId,
                  stackId: handle.stackId,
                  surfaceId,
                  title: `${handle.stackId}:${surfaceId}`,
                },
              },
            ],
          };
        }
        default:
          throw new Error(`Unknown HyperCard REPL command: ${command}`);
      }
    },
    getCompletions(input) {
      const trimmed = input.trimStart();
      const tokens = trimmed.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) {
        return Object.values(COMMAND_HELP).map((entry) => ({
          value: entry.title,
          detail: entry.detail,
        }));
      }

      if (tokens.length === 1 && !trimmed.endsWith(' ')) {
        return Object.values(COMMAND_HELP)
          .filter((entry) => entry.title.startsWith(tokens[0]))
          .map((entry) => ({ value: entry.title, detail: entry.detail }));
      }

      switch (tokens[0]) {
        case 'spawn':
          return Array.from(bundleLibrary.values())
            .filter((bundle) => bundle.key.startsWith(tokens[1] ?? ''))
            .map((bundle) => ({
              value: bundle.key,
              detail: bundle.title ?? bundle.stackId,
            }));
        case 'use':
        case 'attach':
          return collectSessions(broker)
            .filter((session) => session.sessionId.startsWith(tokens[1] ?? ''))
            .map((session) => ({
              value: session.sessionId,
              detail: `${session.stackId}${session.writable ? '' : ' (read-only)'}`,
            }));
        case 'render':
        case 'event':
        case 'define-render':
        case 'define-handler':
        case 'open-surface': {
          const session = activeSessionId ? getSessionRecord(activeSessionId) : null;
          const partial = tokens[1] ?? '';
          return session
            ? session
                .handle
                .getBundleMeta()
                .surfaces.filter((surfaceId) => surfaceId.startsWith(partial))
                .map((surfaceId) => ({
                  value: surfaceId,
                  detail: session.handle.getBundleMeta().surfaceTypes?.[surfaceId] ?? 'ui.card.v1',
                }))
            : [];
        }
        case 'define-surface':
          return listRuntimeSurfaceTypes()
            .filter((surfaceType) => surfaceType.startsWith(tokens[2] ?? ''))
            .map((surfaceType) => ({
              value: surfaceType,
              detail: 'registered runtime surface type',
            }));
        case 'help':
          return helpForTopic(null, bundleLibrary)?.map((entry) => ({
            value: entry.title,
            detail: entry.detail,
          })) ?? [];
        default:
          const lastToken = tokens.length > 0 ? tokens[tokens.length - 1] ?? '' : '';
          return [
            ...listPackageCompletionItems(),
            ...listDocEntries().map((entry) => ({
              value: entry.title,
              detail: entry.detail,
            })),
            ...listBundleDocEntries(bundleLibrary).map((entry) => ({
              value: entry.title,
              detail: entry.detail,
            })),
          ].filter((entry) => entry.value.startsWith(lastToken));
      }
    },
    getHelp(topic) {
      return helpForTopic(topic, bundleLibrary);
    },
  };
}

export function getRuntimePackageDocsMetadata(
  packageId: string,
): RuntimePackageDocsMetadata | null {
  return (getRuntimePackageOrThrow(packageId).docsMetadata as RuntimePackageDocsMetadata | undefined) ?? null;
}

export function getHypercardReplDriverState(driver: ReplDriver): Record<string, unknown> {
  return asRecord(driver);
}
