import type { LaunchableAppModule, LauncherHostContext, LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type {
  DesktopCommandHandler,
  DesktopCommandInvocation,
  DesktopContribution,
  DesktopMenuSection,
  WindowContentAdapter,
} from '@hypercard/engine/desktop-react';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { AppsFolderWindow } from '../components/AppsFolderWindow';
import { DocBrowserWindow } from '../components/doc-browser/DocBrowserWindow';
import type { DocBrowserMode } from '../components/doc-browser/DocBrowserContext';
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
const DOC_ROUTE_MODULE = 'module';
const DOC_ROUTE_DOC = 'doc';
const DOC_MODE_APPS = 'apps';
const DOC_MODE_HELP = 'help';

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
  mode?: DocBrowserMode;
  screen?: 'home' | 'search';
  moduleId?: string;
  slug?: string;
  query?: string;
  newWindow?: boolean;
}): OpenWindowPayload {
  const mode: DocBrowserMode = opts?.mode ?? DOC_MODE_APPS;
  const moduleId = asNonEmptyString(opts?.moduleId);
  const slug = asNonEmptyString(opts?.slug);
  const query = asNonEmptyString(opts?.query);

  // Build the route part (without mode prefix)
  let routePart: string;
  if (mode === DOC_MODE_HELP) {
    // Help mode: help:home, help:search:<query>, help:doc:<slug>
    if (slug) {
      routePart = `${DOC_ROUTE_DOC}:${encodeDocRoutePart(slug)}`;
    } else if (opts?.screen === 'search' || opts?.query !== undefined) {
      routePart = query ? `${DOC_ROUTE_SEARCH}:${encodeDocRoutePart(query)}` : DOC_ROUTE_SEARCH;
    } else {
      routePart = DOC_ROUTE_HOME;
    }
  } else {
    // Apps mode: apps:home, apps:search:<query>, apps:module:<id>, apps:doc:<id>:<slug>
    if (moduleId) {
      routePart = slug
        ? `${DOC_ROUTE_DOC}:${encodeDocRoutePart(moduleId)}:${encodeDocRoutePart(slug)}`
        : `${DOC_ROUTE_MODULE}:${encodeDocRoutePart(moduleId)}`;
    } else if (opts?.screen === 'search' || opts?.query !== undefined) {
      routePart = query ? `${DOC_ROUTE_SEARCH}:${encodeDocRoutePart(query)}` : DOC_ROUTE_SEARCH;
    } else {
      routePart = DOC_ROUTE_HOME;
    }
  }

  const suffix = `${mode}:${routePart}`;
  const title = mode === DOC_MODE_HELP ? 'Help' : 'Documentation';
  const dedupeBase = mode === DOC_MODE_HELP ? 'apps-browser:help' : 'apps-browser:docs';

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
              hostContext.openWindow(buildDocBrowserWindowPayload(moduleId ? { moduleId } : undefined))
            }
            onOpenDocsCenter={() => hostContext.openWindow(buildDocBrowserWindowPayload())}
            onOpenDoc={(moduleId, slug, newWindow) =>
              hostContext.openWindow(buildDocBrowserWindowPayload({ moduleId, slug, newWindow }))
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
            onOpenDocNewWindow={(moduleId, slug) =>
              hostContext.openWindow(buildDocBrowserWindowPayload({ mode: parsed.mode, moduleId, slug, newWindow: true }))
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
              onOpenDoc={(moduleId, slug) =>
                hostContext.openWindow(buildDocBrowserWindowPayload({ moduleId, slug }))
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
  mode?: DocBrowserMode;
  initialScreen?: 'home' | 'search' | 'module-docs' | 'reader' | 'topic-browser';
  initialModuleId?: string;
  initialSlug?: string;
  initialQuery?: string;
} {
  if (!suffix || suffix === DOC_ROUTE_HOME) {
    return {};
  }

  const parts = suffix.split(':');
  const firstToken = parts[0];

  // Check if first token is a mode prefix
  let mode: DocBrowserMode | undefined;
  let routeParts: string[];
  if (firstToken === DOC_MODE_APPS || firstToken === DOC_MODE_HELP) {
    mode = firstToken;
    routeParts = parts.slice(1);
  } else {
    // Backwards compatibility: no mode prefix defaults to apps
    mode = undefined;
    routeParts = parts;
  }

  const route = routeParts[0];
  if (!route || route === DOC_ROUTE_HOME) {
    return { mode };
  }

  if (route === DOC_ROUTE_SEARCH) {
    const query = decodeDocRoutePart(routeParts.slice(1).join(':'));
    return { mode, initialScreen: 'search', initialQuery: query };
  }

  if (mode === DOC_MODE_HELP) {
    // Help mode: help:doc:<slug> (no moduleId)
    if (route === DOC_ROUTE_DOC) {
      const slug = decodeDocRoutePart(routeParts.slice(1).join(':'));
      if (!slug) {
        return { mode };
      }
      return { mode, initialModuleId: 'wesen-os', initialSlug: slug };
    }
    return { mode };
  }

  // Apps mode routes
  if (route === DOC_ROUTE_MODULE) {
    const moduleId = decodeDocRoutePart(routeParts[1]);
    if (!moduleId) {
      return { mode };
    }
    return { mode, initialModuleId: moduleId };
  }
  if (route === DOC_ROUTE_DOC) {
    const moduleId = decodeDocRoutePart(routeParts[1]);
    const slug = decodeDocRoutePart(routeParts.slice(2).join(':'));
    if (!moduleId) {
      return { mode };
    }
    return slug
      ? { mode, initialModuleId: moduleId, initialSlug: slug }
      : { mode, initialModuleId: moduleId };
  }
  return { mode };
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
        hostContext.openWindow(buildDocBrowserWindowPayload({ mode: 'apps', ...(appId ? { moduleId: appId } : {}) }));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_DOC_PAGE) {
        const slug = asNonEmptyString(payload.slug);
        if (appId && slug) {
          hostContext.openWindow(buildDocBrowserWindowPayload({ mode: 'apps', moduleId: appId, slug }));
          return 'handled';
        }
        return 'pass';
      }
      if (commandId === COMMAND_SEARCH_DOCS) {
        const query = asNonEmptyString(payload.query);
        hostContext.openWindow(buildDocBrowserWindowPayload({ mode: 'apps', screen: 'search', query }));
        return 'handled';
      }
      if (commandId === COMMAND_OPEN_HELP) {
        hostContext.openWindow(buildDocBrowserWindowPayload({ mode: 'help' }));
        return 'handled';
      }
      return 'pass';
    },
  };
}

function AppsBrowserHost({ children }: { children: ReactNode }) {
  const storeRef = useRef<ReturnType<typeof createAppsBrowserStore> | null>(null);
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
