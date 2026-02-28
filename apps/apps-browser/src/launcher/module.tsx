import type { LaunchableAppModule, LaunchReason } from '@hypercard/desktop-os';
import type { OpenWindowPayload } from '@hypercard/engine/desktop-core';
import type { DesktopContribution, WindowContentAdapter } from '@hypercard/engine/desktop-react';
import { type ReactNode, useRef } from 'react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { AppsFolderWindow } from '../components/AppsFolderWindow';
import { GetInfoWindowByAppId } from '../components/GetInfoWindowByAppId';
import { HealthDashboardWindow } from '../components/HealthDashboardWindow';
import { ModuleBrowserWindow } from '../components/ModuleBrowserWindow';

const APP_CONTENT_KIND = 'app' as const;
const APP_KEY_FOLDER = 'apps-browser:folder';
const APP_KEY_BROWSER = 'apps-browser:browser';
const APP_KEY_HEALTH = 'apps-browser:health';
const APP_KEY_GET_INFO_PREFIX = 'apps-browser:get-info:';

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

function createAppsBrowserAdapter(): WindowContentAdapter {
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
        content = <AppsFolderWindow />;
      }

      if (content == null && appKey.startsWith(APP_KEY_BROWSER)) {
        const initialAppId = appKey.split(':').slice(2).join(':') || undefined;
        content = <ModuleBrowserWindow initialAppId={initialAppId} />;
      }

      if (content == null && appKey === APP_KEY_HEALTH) {
        content = <HealthDashboardWindow />;
      }

      if (content == null && appKey.startsWith(APP_KEY_GET_INFO_PREFIX)) {
        const appId = appKey.slice(APP_KEY_GET_INFO_PREFIX.length);
        if (appId) {
          content = <GetInfoWindowByAppId appId={appId} />;
        }
      }

      if (content == null) {
        return null;
      }
      return <AppsBrowserHost>{content}</AppsBrowserHost>;
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

  createContributions: (): DesktopContribution[] => [
    {
      id: 'apps-browser.window-adapters',
      windowContentAdapters: [createAppsBrowserAdapter()],
    },
  ],

  renderWindow: ({ windowId }): ReactNode => (
    <AppsBrowserHost key={windowId}>
      <AppsFolderWindow />
    </AppsBrowserHost>
  ),
};
