import { useLazyGetSchemaDocumentQuery } from '../api/appsApi';
import { useEffect, useRef } from 'react';
import { isReflectionUnsupported } from '../domain/selectors';
import type { AppManifestDocument, ReflectionAPI, ReflectionResult, ReflectionSchemaRef } from '../domain/types';

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
          <dt>id:</dt>
          <dd>{app.app_id}</dd>
          <dt>description:</dt>
          <dd>{app.description ?? '\u2014'}</dd>
          <dt>required:</dt>
          <dd>{app.required ? 'yes' : 'no'}</dd>
          <dt>base:</dt>
          <dd data-part="browser-detail-mono">/api/apps/{app.app_id}/</dd>
          <dt>reflection:</dt>
          <dd>{reflectionLabel}</dd>
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
        <span data-part="browser-detail-title">
          {api.method} /api/apps/{appId}
          {api.path}
        </span>
      </div>
      <div data-part="browser-detail-body">
        <dl data-part="browser-detail-fields">
          <dt>summary:</dt>
          <dd>{api.summary ?? '\u2014'}</dd>
          <dt>tags:</dt>
          <dd>{api.tags?.join(', ') ?? '\u2014'}</dd>
          <dt>request_schema:</dt>
          <dd>{api.request_schema ?? '\u2014'}</dd>
          <dt>response_schema:</dt>
          <dd>{api.response_schema ?? '\u2014'}</dd>
          <dt>error_schema:</dt>
          <dd>{api.error_schema ?? '\u2014'}</dd>
        </dl>
      </div>
    </div>
  );
}

interface SchemaDetailProps {
  schema: ReflectionSchemaRef;
  appId: string;
}

function formatSchemaPayload(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatSchemaFetchError(error: unknown): string {
  if (!error) {
    return 'Unknown error';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    const withStatus = error as { status?: unknown; data?: unknown; message?: unknown };
    if (withStatus.status !== undefined) {
      return `Request failed (${String(withStatus.status)})`;
    }
    if (typeof withStatus.message === 'string' && withStatus.message.trim().length > 0) {
      return withStatus.message;
    }
    if (typeof withStatus.data === 'string' && withStatus.data.trim().length > 0) {
      return withStatus.data;
    }
  }
  return 'Failed to fetch schema';
}

function SchemaDetail({ schema, appId }: SchemaDetailProps) {
  const schemaUrl = schema.uri ?? `/api/apps/${appId}/schemas/${encodeURIComponent(schema.id)}`;
  const [fetchSchema, { data: fetchedSchema, isFetching, isError, error }] = useLazyGetSchemaDocumentQuery();
  const schemaPayload = schema.embedded ?? fetchedSchema;
  const autoFetchUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (schemaPayload != null || isFetching || autoFetchUrlRef.current === schemaUrl) {
      return;
    }
    autoFetchUrlRef.current = schemaUrl;
    void fetchSchema(schemaUrl);
  }, [fetchSchema, isFetching, schemaPayload, schemaUrl]);

  return (
    <div data-part="browser-detail">
      <div data-part="browser-detail-header">
        <span data-part="browser-detail-title">Schema: {schema.id}</span>
        <span data-part="browser-detail-badges">format: {schema.format}</span>
      </div>
      <div data-part="browser-detail-body">
        <dl data-part="browser-detail-fields">
          <dt>uri:</dt>
          <dd data-part="browser-detail-mono">{schemaUrl}</dd>
        </dl>
        {schemaPayload != null ? (
          <pre data-part="browser-detail-code">{formatSchemaPayload(schemaPayload)}</pre>
        ) : (
          <div data-part="browser-detail-placeholder">
            <button
              type="button"
              data-part="apps-folder-refresh"
              onClick={() => void fetchSchema(schemaUrl)}
              disabled={isFetching}
              aria-label={`Fetch schema ${schema.id}`}
            >
              {isFetching ? 'Fetching schema...' : 'Fetch schema again'}
            </button>{' '}
            from {schemaUrl} to view the full schema as well.
            {isError && (
              <div style={{ marginTop: 8, color: '#a00' }}>Schema fetch failed: {formatSchemaFetchError(error)}</div>
            )}
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

export function BrowserDetailPanel({
  selectedApp,
  selectedApi,
  selectedSchema,
  reflection,
  reflectionLoading,
}: BrowserDetailPanelProps) {
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
    return <SchemaDetail schema={selectedSchema} appId={selectedApp.app_id} />;
  }

  if (selectedApi && selectedApp) {
    return <APIDetail api={selectedApi} appId={selectedApp.app_id} />;
  }

  return <ModuleDetail app={selectedApp} reflection={reflection} />;
}
