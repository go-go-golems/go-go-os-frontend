import type { AppManifestDocument, ReflectionAPI, ReflectionSchemaRef, ReflectionResult } from '../domain/types';
import { isReflectionUnsupported } from '../domain/selectors';

interface ModuleDetailProps {
  app: AppManifestDocument;
  reflection?: ReflectionResult;
}

function ModuleDetail({ app, reflection }: ModuleDetailProps) {
  const unsupported = isReflectionUnsupported(reflection);
  const reflectionLabel = unsupported
    ? 'not implemented (501)'
    : app.reflection?.available
      ? `available (${app.reflection.version ?? '?'})`
      : 'not available';

  return (
    <div data-part="browser-detail">
      <div data-part="browser-detail-header">
        <span data-part="browser-detail-title">{app.name}</span>
        <span data-part="browser-detail-badges">
          {app.healthy ? '\u25CF healthy' : '\u25CB unhealthy'}
          {app.required && ' \u25C8'}
          {app.reflection?.available && ' \u2605'}
        </span>
      </div>
      <div data-part="browser-detail-body">
        <dl data-part="browser-detail-fields">
          <dt>id:</dt><dd>{app.app_id}</dd>
          <dt>description:</dt><dd>{app.description ?? '\u2014'}</dd>
          <dt>required:</dt><dd>{app.required ? 'yes' : 'no'}</dd>
          <dt>base:</dt><dd data-part="browser-detail-mono">/api/apps/{app.app_id}/</dd>
          <dt>reflection:</dt><dd>{reflectionLabel}</dd>
        </dl>
      </div>
    </div>
  );
}

interface APIDetailProps {
  api: ReflectionAPI;
  appId: string;
}

function APIDetail({ api, appId }: APIDetailProps) {
  return (
    <div data-part="browser-detail">
      <div data-part="browser-detail-header">
        <span data-part="browser-detail-title">{api.method} /api/apps/{appId}{api.path}</span>
      </div>
      <div data-part="browser-detail-body">
        <dl data-part="browser-detail-fields">
          <dt>summary:</dt><dd>{api.summary ?? '\u2014'}</dd>
          <dt>tags:</dt><dd>{api.tags?.join(', ') ?? '\u2014'}</dd>
          <dt>request_schema:</dt><dd>{api.request_schema ?? '\u2014'}</dd>
          <dt>response_schema:</dt><dd>{api.response_schema ?? '\u2014'}</dd>
          <dt>error_schema:</dt><dd>{api.error_schema ?? '\u2014'}</dd>
        </dl>
      </div>
    </div>
  );
}

interface SchemaDetailProps {
  schema: ReflectionSchemaRef;
}

function SchemaDetail({ schema }: SchemaDetailProps) {
  return (
    <div data-part="browser-detail">
      <div data-part="browser-detail-header">
        <span data-part="browser-detail-title">Schema: {schema.id}</span>
        <span data-part="browser-detail-badges">format: {schema.format}</span>
      </div>
      <div data-part="browser-detail-body">
        <dl data-part="browser-detail-fields">
          <dt>uri:</dt><dd data-part="browser-detail-mono">{schema.uri ?? '\u2014'}</dd>
        </dl>
        {schema.embedded ? (
          <pre data-part="browser-detail-code">
            {typeof schema.embedded === 'string'
              ? schema.embedded
              : JSON.stringify(schema.embedded, null, 2)}
          </pre>
        ) : (
          <div data-part="browser-detail-placeholder">
            Fetch from {schema.uri} to view full schema.
          </div>
        )}
      </div>
    </div>
  );
}

export interface BrowserDetailPanelProps {
  selectedApp?: AppManifestDocument;
  selectedApi?: ReflectionAPI;
  selectedSchema?: ReflectionSchemaRef;
  reflection?: ReflectionResult;
  reflectionLoading?: boolean;
}

export function BrowserDetailPanel({ selectedApp, selectedApi, selectedSchema, reflection, reflectionLoading }: BrowserDetailPanelProps) {
  if (!selectedApp) {
    return (
      <div data-part="browser-detail">
        <div data-part="browser-detail-placeholder">Select a module to inspect.</div>
      </div>
    );
  }

  if (reflectionLoading) {
    return (
      <div data-part="browser-detail">
        <div data-part="browser-detail-header">
          <span data-part="browser-detail-title">{selectedApp.name}</span>
        </div>
        <div data-part="browser-detail-placeholder">Loading reflection metadata&hellip;</div>
      </div>
    );
  }

  if (selectedSchema) {
    return <SchemaDetail schema={selectedSchema} />;
  }

  if (selectedApi && selectedApp) {
    return <APIDetail api={selectedApi} appId={selectedApp.app_id} />;
  }

  return <ModuleDetail app={selectedApp} reflection={reflection} />;
}
