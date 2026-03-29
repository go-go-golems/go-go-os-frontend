import type { LaunchableAppModule, LauncherHostContext, LaunchReason } from '@go-go-golems/os-shell';
import type { OpenWindowPayload } from '@go-go-golems/os-core/desktop-core';
import type {
  DesktopCommandHandler,
  DesktopCommandInvocation,
  DesktopContribution,
  DesktopMenuSection,
  WindowContentAdapter,
} from '@go-go-golems/os-core/desktop-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { buildDocObjectPath, buildDocsMountPath, type DocObjectPath, type DocsMountPath } from '../domain/docsObjects';
import { docsRegistry } from '../domain/docsRegistry';
import { registerDefaultDocsMounts } from '../domain/docsMountAdapters';
import { AppsFolderWindow } from '../components/AppsFolderWindow';
import { DocBrowserWindow } from '../components/doc-browser/DocBrowserWindow';
import { GetInfoWindowByAppId } from '../components/GetInfoWindowByAppId';
import { HealthDashboardWindow } from '../components/HealthDashboardWindow';
import { ModuleBrowserWindow } from '../components/ModuleBrowserWindow';

const APP_CONTENT_KIND = 'app' as const;
const APP_KEY_FOLDER = 'apps-browser:folder';
const APP_KEY_BROWSER = 'apps-browser:browser';
const APP_KEY_HEALTH = 'apps-browser:health';
const APP_KEY_GET_INFO_PREFIX = 'apps-browser:get-info:';
const APP_KEY_DOCS_PREFIX = 'apps-browser:docs:';
const COMMAND_OPEN_BROWSER = 'apps-browser.open-browser';
const COMMAND_GET_INFO = 'apps-browser.get-info';
const COMMAND_OPEN_HEALTH = 'apps-browser.open-health';
const COMMAND_OPEN_DOCS = 'apps-browser.open-docs';
const COMMAND_OPEN_DOC_PAGE = 'apps-browser.open-doc-page';
const COMMAND_SEARCH_DOCS = 'apps-browser.search-docs';
const COMMAND_OPEN_HELP = 'apps-browser.open-help';
const DOC_ROUTE_HOME = 'home';
const DOC_ROUTE_SEARCH = 'search';
const DOC_ROUTE_COLLECTION = 'collection';
const DOC_ROUTE_DOC = 'doc';
const DOC_ROUTE_TOPIC = 'topic';
const docsBootstrapByRegistry = new WeakSet<object>();
const docsBootstrapJobs = new WeakMap<object, Promise<void>>();

function ensureDefaultDocsBootstrapped() {
  if (docsBootstrapByRegistry.has(docsRegistry)) {
    return Promise.resolve();
  }

  const pending = docsBootstrapJobs.get(docsRegistry);
  if (pending) {
    return pending;
  }

  const job = registerDefaultDocsMounts((mount) => {
    docsRegistry.register(mount);
  })
    .then(() => {
      docsBootstrapByRegistry.add(docsRegistry);
      docsBootstrapJobs.delete(docsRegistry);
    })
    .catch((error) => {
      docsBootstrapJobs.delete(docsRegistry);
      console.error('[apps-browser] Failed to register default docs mounts', error);
    });

  docsBootstrapJobs.set(docsRegistry, job);
  return job;
}

function buildFolderWindowPayload(reason: LaunchReason): OpenWindowPayload {
  return {
    id: 'window:apps-browser:folder',
    title: 'Mounted Apps',
    icon: '\uD83D\uDCC2',
    bounds: { x: 100, y: 60, w: 520, h: 400 },
    content: { kind: APP_CONTENT_KIND, appKey: APP_KEY_FOLDER },
    dedupeKey: reason === 'startup' ? 'apps-browser:folder:startup' : 'apps-browser:folder',
  };
}

export function buildBrowserWindowPayload(initialAppId?: string): OpenWindowPayload {
  return {
    id: `window:apps-browser:browser:${initialAppId ?? 'default'}`,
    title: 'Module Browser',
    icon: '\uD83D\uDD0D',
    bounds: { x: 120, y: 40, w: 780, h: 560 },
    content: { kind: APP_CONTENT_KIND, appKey: `${APP_KEY_BROWSER}${initialAppId ? `:${initialAppId}` : ''}` },
    dedupeKey: 'apps-browser:browser',
  };
}

export function buildHealthWindowPayload(): OpenWindowPayload {
  return {
    id: 'window:apps-browser:health',
    title: 'Health Dashboard',
    icon: '\u2764',
    bounds: { x: 140, y: 80, w: 600, h: 480 },
    content: { kind: APP_CONTENT_KIND, appKey: APP_KEY_HEALTH },
    dedupeKey: 'apps-browser:health',
  };
}

let docWindowCounter = 0;

export function buildDocBrowserWindowPayload(opts?: {
  screen?: 'home' | 'search';
  mountPath?: DocsMountPath;
  path?: DocObjectPath;
  query?: string;
  newWindow?: boolean;
  topic?: string;
}): OpenWindowPayload {
  const mountPath = asNonEmptyString(opts?.mountPath);
  const path = asNonEmptyString(opts?.path);
  const query = asNonEmptyString(opts?.query);
  const topic = asNonEmptyString(opts?.topic);

  let routePart: string;
  if (path) {
    routePart = `${DOC_ROUTE_DOC}:${encodeDocRoutePart(path)}`;
  } else if (mountPath) {
    routePart = `${DOC_ROUTE_COLLECTION}:${encodeDocRoutePart(mountPath)}`;
  } else if (topic) {
    routePart = `${DOC_ROUTE_TOPIC}:${encodeDocRoutePart(topic)}`;
  } else if (opts?.screen === 'search' || opts?.query !== undefined) {
    routePart = query ? `${DOC_ROUTE_SEARCH}:${encodeDocRoutePart(query)}` : DOC_ROUTE_SEARCH;
  } else {
    routePart = DOC_ROUTE_HOME;
  }

  const suffix = routePart;
  const title = 'Documentation';
  const dedupeBase = 'apps-browser:docs';

  if (opts?.newWindow) {
    const counter = ++docWindowCounter;
    return {
      id: `window:${dedupeBase}:new-${counter}:${routePart}`,
      title,
      icon: '\uD83D\uDCD6',
      bounds: { x: 160 + (counter % 5) * 20, y: 60 + (counter % 5) * 20, w: 700, h: 520 },
      content: {
        kind: APP_CONTENT_KIND,
        appKey: `${APP_KEY_DOCS_PREFIX}${suffix}`,
      },
      dedupeKey: `${dedupeBase}:new-${counter}`,
    };
  }
  return {
    id: `window:${dedupeBase}:${routePart}`,
    title,
    icon: '\uD83D\uDCD6',
    bounds: { x: 160, y: 60, w: 700, h: 520 },
    content: {
      kind: APP_CONTENT_KIND,
      appKey: `${APP_KEY_DOCS_PREFIX}${suffix}`,
    },
    dedupeKey: `${dedupeBase}:${routePart}`,
  };
}

export function buildGetInfoWindowPayload(appId: string, appName?: string): OpenWindowPayload {
  return {
    id: `window:apps-browser:get-info:${appId}`,
    title: `${appName ?? appId} \u2014 Get Info`,
    icon: '\u2139\uFE0F',
    bounds: { x: 200, y: 100, w: 440, h: 520 },
    content: {
      kind: APP_CONTENT_KIND,
      appKey: `${APP_KEY_GET_INFO_PREFIX}${appId}`,
    },
    dedupeKey: `apps-browser:get-info:${appId}`,
  };
}

function createAppsBrowserAdapter(hostContext: LauncherHostContext): WindowContentAdapter {
  return {
    id: 'apps-browser.windows',
    canRender: (window) =>
      window.content.kind === APP_CONTENT_KIND &&
      typeof window.content.appKey === 'string' &&
      window.content.appKey.startsWith('apps-browser:'),
    render: (window) => {
      const appKey = window.content.appKey as string;
      let content: ReactNode = null;

      if (appKey === APP_KEY_FOLDER) {
        content = (
          <AppsFolderWindow
            onOpenApp={(appId) => hostContext.openWindow(buildBrowserWindowPayload(appId))}
            onOpenDocsCenter={() => hostContext.openWindow(buildDocBrowserWindowPayload())}
          />
        );
      }

      if (content == null && appKey.startsWith(APP_KEY_BROWSER)) {
        const initialAppId = appKey.split(':').slice(2).join(':') || undefined;
        content = (
          <ModuleBrowserWindow
            initialAppId={initialAppId}
            onOpenDocs={(moduleId) =>
              hostContext.openWindow(buildDocBrowserWindowPayload(moduleId ? { mountPath: buildDocsMountPath('module', moduleId) } : undefined))
            }
            onOpenDocsCenter={() => hostContext.openWindow(buildDocBrowserWindowPayload())}
            onOpenDoc={(path, newWindow) =>
              hostContext.openWindow(buildDocBrowserWindowPayload({ path, newWindow }))
            }
          />
        );
      }

      if (content == null && appKey === APP_KEY_HEALTH) {
        content = <HealthDashboardWindow onClickModule={(appId) => hostContext.openWindow(buildGetInfoWindowPayload(appId))} />;
      }

      if (content == null && appKey.startsWith(APP_KEY_DOCS_PREFIX)) {
        const suffix = appKey.slice(APP_KEY_DOCS_PREFIX.length);
        const parsed = parseDocBrowserSuffix(suffix);
        content = (
          <DocBrowserWindow
            {...parsed}
            onOpenDocNewWindow={(path) =>
              hostContext.openWindow(buildDocBrowserWindowPayload({ path, newWindow: true }))
            }
          />
        );
      }

      if (content == null && appKey.startsWith(APP_KEY_GET_INFO_PREFIX)) {
        const appId = appKey.slice(APP_KEY_GET_INFO_PREFIX.length);
        if (appId) {
          content = (
            <GetInfoWindowByAppId
              appId={appId}
              onOpenInBrowser={() => hostContext.openWindow(buildBrowserWindowPayload(appId))}
              onOpenDoc={(path) =>
                hostContext.openWindow(buildDocBrowserWindowPayload({ path }))
              }
            />
          );
        }
      }

      if (content == null) {
        return null;
      }
      return <AppsBrowserHost>{content}</AppsBrowserHost>;
    },
  };
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function encodeDocRoutePart(value: string): string {
  return encodeURIComponent(value);
}

function decodeDocRoutePart(value: string | undefined): string | undefined {
  const token = asNonEmptyString(value);
  if (!token) {
    return undefined;
  }
  try {
    const decoded = decodeURIComponent(token);
    return asNonEmptyString(decoded);
  } catch {
    return undefined;
  }
}

function parseDocBrowserSuffix(suffix: string): {
  initialScreen?: 'home' | 'search' | 'collection' | 'reader' | 'topic-browser';
  initialMountPath?: DocsMountPath;
  initialPath?: DocObjectPath;
  initialQuery?: string;
  initialTopic?: string;
} {
  if (!suffix || suffix === DOC_ROUTE_HOME) {
    return {};
  }

  const parts = suffix.split(':');
  const route = parts[0];
  if (!route || route === DOC_ROUTE_HOME) {
    return {};
  }

  if (route === DOC_ROUTE_SEARCH) {
    const query = decodeDocRoutePart(parts.slice(1).join(':'));
    return { initialScreen: 'search', initialQuery: query };
  }

  if (route === DOC_ROUTE_COLLECTION) {
    const mountPath = decodeDocRoutePart(parts.slice(1).join(':'));
    if (!mountPath) {
      return {};
    }
    return { initialScreen: 'collection', initialMountPath: mountPath as DocsMountPath };
  }
  if (route === DOC_ROUTE_DOC) {
    const path = decodeDocRoutePart(parts.slice(1).join(':'));
    if (!path) {
      return {};
    }
    return { initialScreen: 'reader', initialPath: path as DocObjectPath };
  }
  if (route === DOC_ROUTE_TOPIC) {
    const initialTopic = decodeDocRoutePart(parts.slice(1).join(':'));
    return { initialScreen: 'topic-browser', initialTopic };
  }
  return {};
}

function resolveAppFromInvocation(invocation: DesktopCommandInvocation): { appId?: string; appName?: string } {
  const payload = invocation.payload ?? {};
  return {
    appId:
      asNonEmptyString(payload.appId) ??
      asNonEmptyString(payload.moduleId) ??
      asNonEmptyString(invocation.contextTarget?.appId),
    appName: asNonEmptyString(payload.appName),
  };
}

function createAppsBrowserCommandHandler(hostContext: LauncherHostContext): DesktopCommandHandler {
  return {
    id: 'apps-browser.commands',
    priority: 220,
    matches: (commandId) =>
      commandId === COMMAND_OPEN_BROWSER ||
      commandId === COMMAND_GET_INFO ||
      commandId === COMMAND_OPEN_HEALTH ||
      commandId === COMMAND_OPEN_DOCS ||
      commandId === COMMAND_OPEN_DOC_PAGE ||
      commandId === COMMAND_SEARCH_DOCS ||
      commandId === COMMAND_OPEN_HELP,
    run: (commandId, _ctx, invocation) => {
      const { appId, appName } = resolveAppFromInvocation(invocation);
      const payload = invocation.payload ?? {};
      if (commandId === COMMAND_OPEN_HEALTH) {
        hostContext.openWindow(buildHealthWindowPayload());
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_BROWSER) {
        hostContext.openWindow(buildBrowserWindowPayload(appId));
        return 'handled';
      }
      if (commandId === COMMAND_GET_INFO && appId) {
        hostContext.openWindow(buildGetInfoWindowPayload(appId, appName));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_DOCS) {
        hostContext.openWindow(buildDocBrowserWindowPayload(appId ? { mountPath: buildDocsMountPath('module', appId) } : undefined));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_DOC_PAGE) {
        const slug = asNonEmptyString(payload.slug);
        if (appId && slug) {
          hostContext.openWindow(buildDocBrowserWindowPayload({ path: buildDocObjectPath('module', appId, slug) }));
          return 'handled';
        }
        return 'pass';
      }
      if (commandId === COMMAND_SEARCH_DOCS) {
        const query = asNonEmptyString(payload.query);
        hostContext.openWindow(buildDocBrowserWindowPayload({ screen: 'search', query }));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_HELP) {
        hostContext.openWindow(buildDocBrowserWindowPayload({ mountPath: buildDocsMountPath('help', 'wesen-os') }));
        return 'handled';
      }
      return 'pass';
    },
  };
}

function AppsBrowserHost({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createAppsBrowserStore> | null>(null);
  useEffect(() => {
    void ensureDefaultDocsBootstrapped();
  }, []);
  if (!storeRef.current) {
    storeRef.current = createAppsBrowserStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}

export const appsBrowserLauncherModule: LaunchableAppModule = {
  manifest: {
    id: 'apps-browser',
    name: 'Apps Browser',
    icon: '\uD83D\uDCC2',
    launch: { mode: 'window' },
    desktop: { order: 90 },
  },

  buildLaunchWindow: (_ctx, reason) => {
    return buildFolderWindowPayload(reason);
  },

  createContributions: (hostContext): DesktopContribution[] => [
    {
      id: 'apps-browser.desktop-contributions',
      menus: [
        {
          id: 'help',
          label: 'Help',
          items: [
            { id: 'general-help', label: 'General Help', commandId: COMMAND_OPEN_HELP },
            { separator: true },
            { id: 'apps-docs', label: 'Apps Documentation Browser', commandId: COMMAND_OPEN_DOCS },
          ],
        } satisfies DesktopMenuSection,
      ],
      windowContentAdapters: [createAppsBrowserAdapter(hostContext)],
      commands: [createAppsBrowserCommandHandler(hostContext)],
    },
  ],

  renderWindow: ({ windowId }): ReactNode => (
    <AppsBrowserHost key={windowId}>
      <AppsFolderWindow />
    </AppsBrowserHost>
  ),
};
