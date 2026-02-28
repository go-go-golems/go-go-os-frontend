import { useState, useMemo } from 'react';
import { useGetAppsQuery, useGetReflectionQuery } from '../api/appsApi';
import { sortApps } from '../domain/sorting';
import { getCrossRefSchemaIds, findApi, findSchema, isReflectionUnsupported } from '../domain/selectors';
import type { ReflectionResult } from '../domain/types';
import { ModuleListPane, APIListPane, SchemaListPane } from './BrowserColumns';
import { BrowserDetailPanel } from './BrowserDetailPanel';
import './ModuleBrowserWindow.css';

export interface ModuleBrowserWindowProps {
  initialAppId?: string;
}

function ReflectionLoader({ appId, children }: { appId: string; children: (result: ReflectionResult | undefined, isLoading: boolean) => React.ReactNode }) {
  const { data, isLoading } = useGetReflectionQuery(appId);
  return <>{children(data, isLoading)}</>;
}

export function ModuleBrowserWindow({ initialAppId }: ModuleBrowserWindowProps) {
  const { data: apps, refetch } = useGetAppsQuery();
  const sorted = useMemo(() => sortApps(apps ?? []), [apps]);

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

  function renderWithReflection(reflection: ReflectionResult | undefined, reflectionLoading: boolean) {
    const unsupported = isReflectionUnsupported(reflection);
    const doc = reflection && !reflection._unsupported ? reflection : undefined;
    const selectedApi = findApi(reflection, selectedApiId);
    const selectedSchema = findSchema(reflection, selectedSchemaId);
    const crossRefIds = getCrossRefSchemaIds(selectedApi);

    return (
      <>
        <div data-part="browser-columns">
          <ModuleListPane apps={sorted} selectedAppId={selectedAppId} onSelect={selectModule} />
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
        />
      </>
    );
  }

  return (
    <div data-part="module-browser">
      <div data-part="module-browser-toolbar">
        <button
          type="button"
          data-part="apps-folder-refresh"
          onClick={() => refetch()}
          aria-label="Refresh"
        >
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
