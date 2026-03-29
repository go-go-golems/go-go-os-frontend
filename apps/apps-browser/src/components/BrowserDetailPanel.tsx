import { SyntaxHighlight, toYaml } from '@go-go-golems/os-chat';
import { useLazyGetSchemaDocumentQuery } from '../api/appsApi';
import { useEffect, useMemo, useRef, useState } from 'react';
import { compareDocSummaries, groupDocsByMount, useDocsIndex } from '../domain/docsHooks';
import { type DocObjectPath } from '../domain/docsObjects';
import { isReflectionUnsupported } from '../domain/selectors';
import type { AppManifestDocument, ReflectionAPI, ReflectionResult, ReflectionSchemaRef } from '../domain/types';
import { isNewWindowClick, moduleDocUrlToObjectPath } from './doc-browser/docLinkInteraction';

interface ModuleDetailProps {
  app: AppManifestDocument;
  reflection?: ReflectionResult;
  onOpenDoc?: (path: DocObjectPath, newWindow?: boolean) => void;
}

function ModuleDetail({ app, reflection, onOpenDoc }: ModuleDetailProps) {
  const unsupported = isReflectionUnsupported(reflection);
  const doc = reflection && !reflection._unsupported ? reflection : undefined;
  const docsIndex = useDocsIndex();
  const mountedDocs = useMemo(
    () => groupDocsByMount(docsIndex.summaries.filter((entry) => entry.owner === app.app_id)),
    [app.app_id, docsIndex.summaries],
  );
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
        {doc?.docs && doc.docs.length > 0 && (
          <div data-part="browser-detail-api-schemas">
            <div data-part="browser-detail-section-title">Documentation</div>
            {doc.docs.map((entry) => {
              const parsed = entry.url ? moduleDocUrlToObjectPath(entry.url) : undefined;
              const canOpen = onOpenDoc && parsed;
              return (
                <div key={entry.id} data-part="browser-detail-api-schema">
                  <div data-part="browser-detail-api-schema-header">
                    {canOpen ? (
                      <button
                        type="button"
                        data-part="browser-detail-doc-link"
                        onClick={(e) => onOpenDoc(parsed, isNewWindowClick(e.nativeEvent))}
                        onAuxClick={(e) => {
                          if (e.button === 1) {
                            e.preventDefault();
                            onOpenDoc(parsed, true);
                          }
                        }}
                      >
                        {entry.title}
                      </button>
                    ) : (
                      <span data-part="browser-detail-api-schema-label">{entry.title}</span>
                    )}
                    <span data-part="browser-detail-api-schema-id">doc:{entry.id}</span>
                  </div>
                  {entry.url && !canOpen ? (
                    <div data-part="browser-detail-mono">
                      <a href={entry.url} target="_blank" rel="noreferrer">
                        {entry.url}
                      </a>
                    </div>
                  ) : entry.path && !canOpen ? (
                    <div data-part="browser-detail-mono">{entry.path}</div>
                  ) : null}
                  {entry.description && <div>{entry.description}</div>}
                </div>
              );
            })}
          </div>
        )}
        {mountedDocs.length > 0 && (
          <div data-part="browser-detail-api-schemas">
            <div data-part="browser-detail-section-title">Mounted Docs</div>
            {mountedDocs.map((group) => (
              <div key={group.mountPath} data-part="browser-detail-mounted-group">
                <div data-part="browser-detail-mounted-group-title">
                  {group.label} · {group.kind}
                </div>
                {group.summaries.slice().sort(compareDocSummaries).map((entry) => (
                  <div key={entry.path} data-part="browser-detail-api-schema">
                    <div data-part="browser-detail-api-schema-header">
                      {onOpenDoc ? (
                        <button
                          type="button"
                          data-part="browser-detail-doc-link"
                          onClick={(e) => onOpenDoc(entry.path, isNewWindowClick(e.nativeEvent))}
                          onAuxClick={(e) => {
                            if (e.button === 1) {
                              e.preventDefault();
                              onOpenDoc(entry.path, true);
                            }
                          }}
                        >
                          {entry.title}
                        </button>
                      ) : (
                        <span data-part="browser-detail-api-schema-label">{entry.title}</span>
                      )}
                      <span data-part="browser-detail-api-schema-id">{entry.docType ?? 'reference'}</span>
                    </div>
                    {entry.summary && <div>{entry.summary}</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface APIDetailProps {
  api: ReflectionAPI;
  appId: string;
  schemas: ReflectionSchemaRef[];
}

interface APISchemaPreviewProps {
  label: string;
  schemaId: string;
  appId: string;
  schema?: ReflectionSchemaRef;
}

function buildSchemaUrl(appId: string, schemaId: string, schema?: ReflectionSchemaRef): string {
  return schema?.uri ?? `/api/apps/${appId}/schemas/${encodeURIComponent(schemaId)}`;
}

function toReadableYaml(value: unknown): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return toYaml(JSON.parse(trimmed));
      } catch {
        return value;
      }
    }
    return value;
  }
  return toYaml(value);
}

function APISchemaPreview({ label, schemaId, appId, schema }: APISchemaPreviewProps) {
  const schemaUrl = buildSchemaUrl(appId, schemaId, schema);
  const [fetchSchema, { data: fetchedSchema, isFetching, isError, error }] = useLazyGetSchemaDocumentQuery();
  const schemaPayload = schema?.embedded ?? fetchedSchema;
  const [expanded, setExpanded] = useState(false);
  const autoFetchUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!expanded || schemaPayload != null || isFetching || autoFetchUrlRef.current === schemaUrl) {
      return;
    }
    autoFetchUrlRef.current = schemaUrl;
    void fetchSchema(schemaUrl);
  }, [expanded, fetchSchema, isFetching, schemaPayload, schemaUrl]);

  useEffect(() => {
    if (!expanded) {
      autoFetchUrlRef.current = null;
    }
  }, [expanded]);

  return (
    <details
      data-part="browser-detail-schema-fold"
      open={expanded}
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary data-part="browser-detail-schema-fold-summary">
        <span data-part="browser-detail-api-schema-label">{label}</span>
        <span data-part="browser-detail-api-schema-id">
          {schemaId}
          {schema?.format ? ` (${schema.format})` : ''}
        </span>
      </summary>
      <div data-part="browser-detail-api-schema">
        <div data-part="browser-detail-mono">{schemaUrl}</div>
        {schemaPayload != null ? (
          <SyntaxHighlight code={toReadableYaml(schemaPayload)} language="yaml" variant="light" maxLines={50} />
        ) : (
          <div data-part="browser-detail-placeholder">
            <button
              type="button"
              data-part="apps-folder-refresh"
              onClick={() => void fetchSchema(schemaUrl)}
              disabled={isFetching}
              aria-label={`Fetch schema ${schemaId}`}
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
    </details>
  );
}

function APIDetail({ api, appId, schemas }: APIDetailProps) {
  const schemaById = new Map(schemas.map((schema) => [schema.id, schema] as const));
  const schemaEntries = [
    { label: 'Request Schema', schemaId: api.request_schema },
    { label: 'Response Schema', schemaId: api.response_schema },
    { label: 'Error Schema', schemaId: api.error_schema },
  ].filter((entry): entry is { label: string; schemaId: string } => Boolean(entry.schemaId));

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
        {schemaEntries.length > 0 && (
          <div data-part="browser-detail-api-schemas">
            <div data-part="browser-detail-section-title">Schemas</div>
            {schemaEntries.map((entry) => (
              <APISchemaPreview
                key={entry.label}
                label={entry.label}
                schemaId={entry.schemaId}
                appId={appId}
                schema={schemaById.get(entry.schemaId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SchemaDetailProps {
  schema: ReflectionSchemaRef;
  appId: string;
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
  const schemaUrl = buildSchemaUrl(appId, schema.id, schema);
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
          <SyntaxHighlight code={toReadableYaml(schemaPayload)} language="yaml" variant="light" maxLines={80} />
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
  onOpenDoc?: (path: DocObjectPath, newWindow?: boolean) => void;
}

export function BrowserDetailPanel({
  selectedApp,
  selectedApi,
  selectedSchema,
  reflection,
  reflectionLoading,
  onOpenDoc,
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
    const schemas = reflection && !reflection._unsupported ? (reflection.schemas ?? []) : [];
    return <APIDetail api={selectedApi} appId={selectedApp.app_id} schemas={schemas} />;
  }

  return <ModuleDetail app={selectedApp} reflection={reflection} onOpenDoc={onOpenDoc} />;
}
