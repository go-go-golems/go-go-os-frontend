import {
  type DesktopActionEntry,
  useDesktopWindowId,
  useOpenDesktopContextMenu,
  useRegisterContextActions,
} from '@hypercard/engine/desktop-react';
import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { useGetAppsQuery, useGetReflectionQuery } from '../api/appsApi';
import type { DocObjectPath } from '../domain/docsObjects';
import { findApi, findSchema, getCrossRefSchemaIds, isReflectionUnsupported } from '../domain/selectors';
import { sortApps } from '../domain/sorting';
import type { AppManifestDocument, ReflectionResult } from '../domain/types';
import { APIListPane, ModuleListPane, SchemaListPane } from './BrowserColumns';
import { BrowserDetailPanel } from './BrowserDetailPanel';
import './ModuleBrowserWindow.css';

export interface ModuleBrowserWindowProps {
  initialAppId?: string;
  onOpenDocs?: (moduleId?: string) => void;
  onOpenDocsCenter?: () => void;
  onOpenDoc?: (path: DocObjectPath, newWindow?: boolean) => void;
}

function ReflectionLoader({
  appId,
  children,
}: {
  appId: string;
  children: (result: ReflectionResult | undefined, isLoading: boolean) => React.ReactNode;
}) {
  const { data, isLoading } = useGetReflectionQuery(appId);
  return <>{children(data, isLoading)}</>;
}

function buildAppContextActions(app: AppManifestDocument): DesktopActionEntry[] {
  return [
    {
      id: `apps-browser.module-browser.open-browser.${app.app_id}`,
      label: 'Open in Browser',
      commandId: 'apps-browser.open-browser',
      payload: { appId: app.app_id, appName: app.name },
    },
    {
      id: `apps-browser.module-browser.get-info.${app.app_id}`,
      label: 'Get Info',
      commandId: 'apps-browser.get-info',
      payload: { appId: app.app_id, appName: app.name },
    },
    {
      id: `apps-browser.module-browser.open-docs.${app.app_id}`,
      label: 'View Documentation',
      commandId: 'apps-browser.open-docs',
      payload: { appId: app.app_id, appName: app.name },
    },
    {
      id: `apps-browser.module-browser.chat-with-app.${app.app_id}`,
      label: 'Chat With App',
      commandId: 'apps-browser.chat-with-app',
      payload: { appId: app.app_id, appName: app.name },
    },
    { separator: true },
    {
      id: `apps-browser.module-browser.open-health.${app.app_id}`,
      label: 'Open Health Dashboard',
      commandId: 'apps-browser.open-health',
      payload: { appId: app.app_id, appName: app.name },
    },
    { separator: true },
    {
      id: `apps-browser.module-browser.launch-app.${app.app_id}`,
      label: 'Launch App',
      commandId: `app.launch.${app.app_id}`,
      payload: { appId: app.app_id, appName: app.name },
    },
  ];
}

function ModuleContextRegistration({ app, windowId }: { app: AppManifestDocument; windowId?: string | null }) {
  const target = useMemo(
    () => ({
      kind: 'widget' as const,
      windowId: windowId ?? undefined,
      widgetId: `apps-browser-module-row.${app.app_id}`,
      appId: app.app_id,
    }),
    [app.app_id, windowId],
  );
  const actions = useMemo(() => buildAppContextActions(app), [app.app_id, app.name]);
  useRegisterContextActions(target, actions);
  return null;
}

export function ModuleBrowserWindow({ initialAppId, onOpenDocs, onOpenDocsCenter, onOpenDoc }: ModuleBrowserWindowProps) {
  const { data: apps, refetch } = useGetAppsQuery();
  const sorted = useMemo(() => sortApps(apps ?? []), [apps]);
  const openContextMenu = useOpenDesktopContextMenu();
  const windowId = useDesktopWindowId();

  const [selectedAppId, setSelectedAppId] = useState<string | undefined>(initialAppId);
  const [selectedApiId, setSelectedApiId] = useState<string | undefined>();
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | undefined>();

  const selectedApp = sorted.find((a) => a.app_id === selectedAppId);
  const hasReflection = selectedApp?.reflection?.available === true;

  function selectModule(appId: string) {
    setSelectedAppId(appId);
    setSelectedApiId(undefined);
    setSelectedSchemaId(undefined);
  }

  function selectApi(apiId: string) {
    setSelectedApiId(apiId);
    setSelectedSchemaId(undefined);
  }

  function selectSchema(schemaId: string) {
    setSelectedSchemaId(schemaId);
  }

  function openAppContextMenu(appId: string, event: MouseEvent<HTMLButtonElement>) {
    if (!openContextMenu) {
      return;
    }
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
      target: {
        kind: 'widget',
        windowId: windowId ?? undefined,
        widgetId: `apps-browser-module-row.${appId}`,
        appId,
      },
      menuId: 'apps-browser-module-browser-context',
      windowId,
      widgetId: `apps-browser-module-row.${appId}`,
    });
  }

  function renderWithReflection(reflection: ReflectionResult | undefined, reflectionLoading: boolean) {
    const unsupported = isReflectionUnsupported(reflection);
    const doc = reflection && !reflection._unsupported ? reflection : undefined;
    const selectedApi = findApi(reflection, selectedApiId);
    const selectedSchema = findSchema(reflection, selectedSchemaId);
    const crossRefIds = getCrossRefSchemaIds(selectedApi);

    return (
      <>
        <div data-part="browser-columns">
          <ModuleListPane
            apps={sorted}
            selectedAppId={selectedAppId}
            onSelect={selectModule}
            onContextMenuApp={openAppContextMenu}
          />
          <APIListPane
            apis={doc?.apis}
            selectedApiId={selectedApiId}
            onSelect={selectApi}
            reflectionUnavailable={unsupported || (!!selectedAppId && !hasReflection)}
            reflectionLoading={reflectionLoading}
          />
          <SchemaListPane
            schemas={doc?.schemas}
            selectedSchemaId={selectedSchemaId}
            crossRefIds={crossRefIds}
            onSelect={selectSchema}
            reflectionUnavailable={unsupported || (!!selectedAppId && !hasReflection)}
            reflectionLoading={reflectionLoading}
          />
        </div>
        <BrowserDetailPanel
          selectedApp={selectedApp}
          selectedApi={selectedApi}
          selectedSchema={selectedSchema}
          reflection={reflection}
          reflectionLoading={reflectionLoading}
          onOpenDoc={onOpenDoc}
        />
      </>
    );
  }

  return (
    <div data-part="module-browser">
      {sorted.map((app) => (
        <ModuleContextRegistration key={app.app_id} app={app} windowId={windowId} />
      ))}
      <div data-part="module-browser-toolbar">
        <div data-part="module-browser-toolbar-actions">
          {onOpenDocsCenter && (
            <button
              type="button"
              data-part="module-browser-docs-btn"
              onClick={onOpenDocsCenter}
              aria-label="Open Documentation Center"
            >
              Doc Center
            </button>
          )}
          {onOpenDocs && (
            <button
              type="button"
              data-part="module-browser-docs-btn"
              onClick={() => onOpenDocs(selectedAppId)}
              disabled={!selectedAppId}
              aria-label="Open selected module docs"
            >
              Module Docs
            </button>
          )}
        </div>
        <button type="button" data-part="apps-folder-refresh" onClick={() => refetch()} aria-label="Refresh">
          &#x27F3;
        </button>
      </div>
      {selectedAppId && hasReflection ? (
        <ReflectionLoader appId={selectedAppId}>
          {(reflection, isLoading) => renderWithReflection(reflection, isLoading)}
        </ReflectionLoader>
      ) : (
        renderWithReflection(undefined, false)
      )}
    </div>
  );
}
