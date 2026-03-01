import { useGetModuleDocsQuery, useGetReflectionQuery } from '../api/appsApi';
import { isReflectionUnsupported } from '../domain/selectors';
import type { AppManifestDocument, ReflectionResult } from '../domain/types';
import { AppIcon } from './AppIcon';
import './GetInfoWindow.css';

export interface GetInfoWindowProps {
  app: AppManifestDocument;
  onOpenInBrowser?: () => void;
}

function formatDocsFetchError(error: unknown): string {
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
  return 'Failed to load documentation';
}

function buildDocURL(appId: string, slug: string): string {
  return `/api/apps/${appId}/docs/${encodeURIComponent(slug)}`;
}

function DocumentationSection({ app }: { app: AppManifestDocument }) {
  if (app.docs?.available !== true) {
    return (
      <>
        <div data-part="get-info-section">Documentation</div>
        <dl data-part="get-info-fields">
          <dt>Available:</dt>
          <dd>No</dd>
        </dl>
        <div data-part="get-info-note">This module does not publish structured docs metadata yet.</div>
      </>
    );
  }
  return <DocumentationDataSection app={app} />;
}

function DocumentationDataSection({ app }: { app: AppManifestDocument }) {
  const { data: toc, isLoading, isError, error } = useGetModuleDocsQuery(app.app_id);

  if (isLoading) {
    return (
      <>
        <div data-part="get-info-section">Documentation</div>
        <div data-part="get-info-note">Loading module docs index&hellip;</div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div data-part="get-info-section">Documentation</div>
        <dl data-part="get-info-fields">
          <dt>Available:</dt>
          <dd>
            {'\u2605'} Yes ({app.docs?.version ?? '?'})
          </dd>
          {app.docs?.url && (
            <>
              <dt>Index URL:</dt>
              <dd style={{ fontFamily: 'monospace', fontSize: 10 }}>{app.docs.url}</dd>
            </>
          )}
        </dl>
        <div data-part="get-info-docs-error">Docs endpoint failed: {formatDocsFetchError(error)}</div>
      </>
    );
  }

  const docs = toc?.docs ?? [];
  const effectiveModuleID = toc?.module_id || app.app_id;

  return (
    <>
      <div data-part="get-info-section">Documentation</div>
      <dl data-part="get-info-fields">
        <dt>Available:</dt>
        <dd>
          {'\u2605'} Yes ({app.docs?.version ?? '?'})
        </dd>
        <dt>Pages:</dt>
        <dd>{docs.length}</dd>
        {app.docs?.url && (
          <>
            <dt>Index URL:</dt>
            <dd style={{ fontFamily: 'monospace', fontSize: 10 }}>
              <a href={app.docs.url} target="_blank" rel="noreferrer">
                {app.docs.url}
              </a>
            </dd>
          </>
        )}
      </dl>

      {docs.length > 0 ? (
        <ul data-part="get-info-api-list">
          {docs.map((entry) => (
            <li key={entry.slug} data-part="get-info-api-item">
              <span data-part="get-info-api-method">{entry.doc_type}</span>
              <span data-part="get-info-api-path">
                <a href={buildDocURL(effectiveModuleID, entry.slug)} target="_blank" rel="noreferrer">
                  {entry.title}
                </a>
              </span>
              <span data-part="get-info-api-summary">{entry.summary ?? '\u2014'}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div data-part="get-info-note">Docs index is available but currently empty.</div>
      )}
    </>
  );
}

function ReflectionSection({ appId, hasReflection }: { appId: string; hasReflection: boolean }) {
  if (!hasReflection) {
    return (
      <>
        <div data-part="get-info-section">Reflection</div>
        <dl data-part="get-info-fields">
          <dt>Available:</dt>
          <dd>No</dd>
        </dl>
        <div data-part="get-info-note">This module does not publish reflective API metadata yet.</div>
      </>
    );
  }

  return <ReflectionDataSection appId={appId} />;
}

function ReflectionDataSection({ appId }: { appId: string }) {
  const { data: reflection, isLoading } = useGetReflectionQuery(appId);

  if (isLoading) {
    return (
      <>
        <div data-part="get-info-section">Reflection</div>
        <div data-part="get-info-note">Loading reflection metadata&hellip;</div>
      </>
    );
  }

  if (!reflection || isReflectionUnsupported(reflection)) {
    return (
      <>
        <div data-part="get-info-section">Reflection</div>
        <dl data-part="get-info-fields">
          <dt>Available:</dt>
          <dd>No</dd>
        </dl>
        <div data-part="get-info-note">This module does not publish reflective API metadata yet.</div>
      </>
    );
  }

  const doc = reflection as Exclude<ReflectionResult, { _unsupported: true }>;

  return (
    <>
      <div data-part="get-info-section">Reflection</div>
      <dl data-part="get-info-fields">
        <dt>Available:</dt>
        <dd>
          {'\u2605'} Yes ({doc.version ?? '?'})
        </dd>
        {doc.app_id && (
          <>
            <dt>URL:</dt>
            <dd style={{ fontFamily: 'monospace', fontSize: 10 }}>/api/os/apps/{doc.app_id}/reflection</dd>
          </>
        )}
      </dl>

      {doc.apis && doc.apis.length > 0 && (
        <>
          <div data-part="get-info-section">APIs ({doc.apis.length})</div>
          <ul data-part="get-info-api-list">
            {doc.apis.map((api) => (
              <li key={api.id} data-part="get-info-api-item">
                <span data-part="get-info-api-method">{api.method}</span>
                <span data-part="get-info-api-path">{api.path}</span>
                <span data-part="get-info-api-summary">{api.summary}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {doc.docs && doc.docs.length > 0 && (
        <>
          <div data-part="get-info-section">Documentation ({doc.docs.length})</div>
          <ul data-part="get-info-api-list">
            {doc.docs.map((entry) => (
              <li key={entry.id} data-part="get-info-api-item">
                <span data-part="get-info-api-method">DOC</span>
                <span data-part="get-info-api-path">
                  {entry.url ? (
                    <a href={entry.url} target="_blank" rel="noreferrer">
                      {entry.title}
                    </a>
                  ) : (
                    entry.title
                  )}
                </span>
                <span data-part="get-info-api-summary">{entry.description ?? entry.path ?? '\u2014'}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {doc.schemas && doc.schemas.length > 0 && (
        <>
          <div data-part="get-info-section">Schemas ({doc.schemas.length})</div>
          <div data-part="get-info-chips">
            {doc.schemas.map((s) => (
              <span key={s.id} data-part="get-info-chip">
                {s.id}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export function GetInfoWindow({ app, onOpenInBrowser }: GetInfoWindowProps) {
  const hasReflection = app.reflection?.available === true;

  return (
    <div data-part="get-info">
      <div data-part="get-info-header">
        <AppIcon app={app} />
        <div data-part="get-info-header-text">
          <span data-part="get-info-name">{app.name}</span>
          <span data-part="get-info-id">{app.app_id}</span>
        </div>
      </div>

      <div data-part="get-info-section">General</div>
      <dl data-part="get-info-fields">
        <dt>Description:</dt>
        <dd>{app.description ?? '\u2014'}</dd>
        <dt>Required:</dt>
        <dd>{app.required ? '\u25C8 Yes (required at startup)' : 'No'}</dd>
        <dt>Base URL:</dt>
        <dd style={{ fontFamily: 'monospace', fontSize: 10 }}>/api/apps/{app.app_id}/</dd>
      </dl>

      <div data-part="get-info-section">Health</div>
      <dl data-part="get-info-fields">
        <dt>Status:</dt>
        <dd>
          {app.healthy ? (
            <>{'\u25CF'} Healthy</>
          ) : (
            <>
              {'\u25CB'} <span style={{ color: '#a00' }}>Unhealthy</span>
            </>
          )}
        </dd>
      </dl>
      {app.health_error && (
        <div data-part="get-info-health-error">
          {app.health_error}
          {app.required && (
            <div style={{ marginTop: 4, fontWeight: 'bold' }}>This is a required module. System may be degraded.</div>
          )}
        </div>
      )}

      <DocumentationSection app={app} />

      <ReflectionSection appId={app.app_id} hasReflection={hasReflection} />

      {hasReflection && onOpenInBrowser && (
        <div data-part="get-info-footer">
          <button type="button" data-part="btn" onClick={onOpenInBrowser}>
            Open in Browser
          </button>
        </div>
      )}
    </div>
  );
}
