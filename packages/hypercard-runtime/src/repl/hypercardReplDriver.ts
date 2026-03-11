import type {
  ReplCompletionItem,
  ReplDriver,
  ReplDriverContext,
  ReplExecutionResult,
  ReplHelpEntry,
  TerminalLine,
} from '@hypercard/repl';
import { getRuntimePackageOrThrow, listRuntimePackages } from '../runtime-packages/runtimePackageRegistry';
import { listRuntimeSurfaceTypes } from '../runtime-packs/runtimeSurfaceTypeRegistry';
import { createRuntimeBroker, type RuntimeBroker, type SpawnRuntimeSessionRequest } from './runtimeBroker';

export interface ReplBundleLibraryEntry {
  key: string;
  title?: string;
  stackId: string;
  packageIds: string[];
  bundleCode: string;
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
  sessions: {
    title: 'sessions',
    detail: 'List broker-owned runtime sessions.',
    usage: 'sessions',
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

function helpForTopic(topic: string | null): ReplHelpEntry[] | null {
  if (!topic) {
    return [
      ...Object.values(COMMAND_HELP),
      ...listDocEntries(),
    ];
  }

  const command = COMMAND_HELP[topic];
  if (command) {
    return [command];
  }

  return listDocEntries().filter((entry) => entry.title === topic);
}

function linesForSessions(broker: RuntimeBroker, activeSessionId: string | null): TerminalLine[] {
  const sessions = broker.listSessions();
  if (sessions.length === 0) {
    return [{ type: 'system', text: 'No runtime sessions.' }];
  }

  return sessions.flatMap((session) => [
    {
      type: 'output' as const,
      text: `${session.sessionId}${session.sessionId === activeSessionId ? ' *' : ''} — ${session.stackId} (${session.packageIds.join(', ')})`,
    },
    {
      type: 'system' as const,
      text: `  surfaces: ${session.surfaces.join(', ') || 'none'}`,
    },
  ]);
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

  function getActiveSession(sessionIdArg?: string) {
    const sessionId = sessionIdArg ?? activeSessionId;
    if (!sessionId) {
      throw new Error('No active runtime session. Use spawn or use <session-id> first.');
    }
    const handle = broker.getSession(sessionId);
    if (!handle) {
      throw new Error(`Unknown runtime session: ${sessionId}`);
    }
    return { sessionId, handle };
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
    };
  }

  return {
    async execute(raw, _context: ReplDriverContext): Promise<ReplExecutionResult> {
      const trimmed = raw.trim();
      if (!trimmed) {
        return { lines: [] };
      }

      const [command, ...rest] = trimmed.split(/\s+/);

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
        case 'use': {
          const sessionId = rest[0];
          if (!sessionId) {
            throw new Error('Usage: use <session-id>');
          }
          const handle = broker.getSession(sessionId);
          if (!handle) {
            throw new Error(`Unknown runtime session: ${sessionId}`);
          }
          activeSessionId = sessionId;
          return {
            lines: [{ type: 'system', text: `Active runtime session: ${sessionId}` }],
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
                text: `${surfaceId} — ${meta.surfaceTypes?.[surfaceId] ?? 'ui.card.v1'}`,
              })),
            ],
          };
        }
        case 'render': {
          const surfaceId = rest[0];
          if (!surfaceId) {
            throw new Error('Usage: render <surface-id> [state-json]');
          }
          const { handle } = getActiveSession();
          const tree = handle.renderSurface(surfaceId, parseJsonArg(rest[1], {}));
          return { lines: formatJsonLines(tree) };
        }
        case 'event': {
          const surfaceId = rest[0];
          const handler = rest[1];
          if (!surfaceId || !handler) {
            throw new Error('Usage: event <surface-id> <handler> [args-json] [state-json]');
          }
          const { handle } = getActiveSession();
          const actions = handle.eventSurface(
            surfaceId,
            handler,
            parseJsonArg(rest[2], {}),
            parseJsonArg(rest[3], {}),
          );
          return { lines: formatJsonLines(actions) };
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
          return broker
            .listSessions()
            .filter((session) => session.sessionId.startsWith(tokens[1] ?? ''))
            .map((session) => ({
              value: session.sessionId,
              detail: session.stackId,
            }));
        case 'render':
        case 'event': {
          const session = activeSessionId ? broker.getSession(activeSessionId) : null;
          const partial = tokens[1] ?? '';
          return session
            ? session
                .getBundleMeta()
                .surfaces.filter((surfaceId) => surfaceId.startsWith(partial))
                .map((surfaceId) => ({
                  value: surfaceId,
                  detail: session.getBundleMeta().surfaceTypes?.[surfaceId] ?? 'ui.card.v1',
                }))
            : [];
        }
        case 'help':
          return helpForTopic(null)?.map((entry) => ({
            value: entry.title,
            detail: entry.detail,
          })) ?? [];
        default:
          return [
            ...listPackageCompletionItems(),
            ...listDocEntries().map((entry) => ({
              value: entry.title,
              detail: entry.detail,
            })),
          ].filter((entry) => entry.value.startsWith(tokens.at(-1) ?? ''));
      }
    },
    getHelp(topic) {
      return helpForTopic(topic);
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
