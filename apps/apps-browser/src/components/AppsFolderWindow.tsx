import { type DesktopActionEntry, useDesktopWindowId, useOpenDesktopContextMenu, useRegisterContextActions } from '@go-go-golems/os-core/desktop-react';
import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { useGetAppsQuery } from '../api/appsApi';
import { computeSummaryStats, sortApps } from '../domain/sorting';
import type { AppManifestDocument } from '../domain/types';
import { AppIcon } from './AppIcon';
import './AppsFolderWindow.css';

export interface AppsFolderWindowProps {
  onSelectApp?: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
  onOpenDocsCenter?: () => void;
}

interface AppsFolderIconEntryProps {
  app: AppManifestDocument;
  selected: boolean;
  onSelectApp?: (appId: string) => void;
  onOpenApp?: (appId: string) => void;
}

function buildAppContextActions(app: AppManifestDocument): DesktopActionEntry[] {
  return [
    {
      id: `apps-browser.context.open-browser.${app.app_id}`,
      label: 'Open in Browser',
      commandId: 'apps-browser.open-browser',
      payload: { appId: app.app_id, appName: app.name },
    },
    {
      id: `apps-browser.context.get-info.${app.app_id}`,
      label: 'Get Info',
      commandId: 'apps-browser.get-info',
      payload: { appId: app.app_id, appName: app.name },
    },
    {
      id: `apps-browser.context.open-docs.${app.app_id}`,
      label: 'View Documentation',
      commandId: 'apps-browser.open-docs',
      payload: { appId: app.app_id, appName: app.name },
    },
    { separator: true },
    {
      id: `apps-browser.context.open-health.${app.app_id}`,
      label: 'Open Health Dashboard',
      commandId: 'apps-browser.open-health',
      payload: { appId: app.app_id, appName: app.name },
    },
    { separator: true },
    {
      id: `apps-browser.context.launch-app.${app.app_id}`,
      label: 'Launch App',
      commandId: `app.launch.${app.app_id}`,
      payload: { appId: app.app_id, appName: app.name },
    },
  ];
}

function AppsFolderIconEntry({ app, selected, onSelectApp, onOpenApp }: AppsFolderIconEntryProps) {
  const openContextMenu = useOpenDesktopContextMenu();
  const windowId = useDesktopWindowId();
  const target = useMemo(
    () => ({
      kind: 'widget' as const,
      windowId: windowId ?? undefined,
      widgetId: `apps-browser-folder-icon.${app.app_id}`,
      appId: app.app_id,
    }),
    [app.app_id, windowId],
  );
  const contextActions = useMemo(() => buildAppContextActions(app), [app.app_id, app.name]);

  useRegisterContextActions(target, contextActions);

  function handleContextMenu(event: MouseEvent<HTMLButtonElement>) {
    if (!openContextMenu) {
      return;
    }
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      target,
      menuId: 'apps-browser-folder-icon-context',
      windowId,
      widgetId: target.widgetId,
    });
  }

  return (
    <AppIcon
      app={app}
      selected={selected}
      onClick={() => onSelectApp?.(app.app_id)}
      onDoubleClick={() => onOpenApp?.(app.app_id)}
      onContextMenu={handleContextMenu}
    />
  );
}

function StatusSummary({ stats }: { stats: ReturnType<typeof computeSummaryStats> }) {
  const hasUnhealthy = stats.unhealthy > 0;
  return (
    <span data-part="apps-folder-status" data-variant={hasUnhealthy ? 'warning' : undefined}>
      {stats.mounted} apps &middot; {hasUnhealthy ? `\u26A0 ${stats.unhealthy} unhealthy` : `${stats.healthy} healthy`}{' '}
      &middot; {stats.required} required
    </span>
  );
}

export function AppsFolderWindow({ onSelectApp, onOpenApp, onOpenDocsCenter }: AppsFolderWindowProps) {
  const { data: apps, isLoading, isError, refetch } = useGetAppsQuery();
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>();

  if (isLoading) {
    return (
      <div data-part="apps-folder">
        <div data-part="apps-folder-message">Loading apps&hellip;</div>
      </div>
    );
  }

  if (isError || !apps) {
    return (
      <div data-part="apps-folder">
        <div data-part="apps-folder-message" data-variant="error">
          Failed to load apps.
        </div>
      </div>
    );
  }

  const sorted = sortApps(apps);
  const stats = computeSummaryStats(apps);

  function handleSelectApp(appId: string) {
    setSelectedAppId(appId);
    onSelectApp?.(appId);
  }

  function handleOpenApp(appId: string) {
    setSelectedAppId(appId);
    onOpenApp?.(appId);
  }

  return (
    <div data-part="apps-folder">
      <div data-part="apps-folder-toolbar">
        <StatusSummary stats={stats} />
        <div data-part="apps-folder-toolbar-actions">
          {onOpenDocsCenter && (
            <button
              type="button"
              data-part="apps-folder-docs-center"
              onClick={onOpenDocsCenter}
              aria-label="Open Documentation Center"
            >
              Documentation
            </button>
          )}
          <button type="button" data-part="apps-folder-refresh" onClick={() => refetch()} aria-label="Refresh">
            &#x27F3;
          </button>
        </div>
      </div>
      <div data-part="apps-folder-grid">
        {sorted.map((app) => (
          <AppsFolderIconEntry
            key={app.app_id}
            app={app}
            selected={selectedAppId === app.app_id}
            onSelectApp={handleSelectApp}
            onOpenApp={handleOpenApp}
          />
        ))}
      </div>
    </div>
  );
}
