import { useGetReflectionQuery } from '../api/appsApi';
import type { AppManifestDocument, ReflectionResult } from '../domain/types';
import { isReflectionUnsupported } from '../domain/selectors';
import { AppIcon } from './AppIcon';
import './GetInfoWindow.css';

export interface GetInfoWindowProps {
  app: AppManifestDocument;
  onOpenInBrowser?: () => void;
}

function ReflectionSection({ appId, hasReflection }: { appId: string; hasReflection: boolean }) {
  if (!hasReflection) {
    return (
      <>
        <div data-part="get-info-section">Reflection</div>
        <dl data-part="get-info-fields">
          <dt>Available:</dt><dd>No</dd>
        </dl>
        <div data-part="get-info-note">
          This module does not publish reflective API metadata yet.
        </div>
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
          <dt>Available:</dt><dd>No</dd>
        </dl>
        <div data-part="get-info-note">
          This module does not publish reflective API metadata yet.
        </div>
      </>
    );
  }

  const doc = reflection as Exclude<ReflectionResult, { _unsupported: true }>;

  return (
    <>
      <div data-part="get-info-section">Reflection</div>
      <dl data-part="get-info-fields">
        <dt>Available:</dt><dd>{'\u2605'} Yes ({doc.version ?? '?'})</dd>
        {doc.app_id && <><dt>URL:</dt><dd style={{ fontFamily: 'monospace', fontSize: 10 }}>/api/os/apps/{doc.app_id}/reflection</dd></>}
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

      {doc.schemas && doc.schemas.length > 0 && (
        <>
          <div data-part="get-info-section">Schemas ({doc.schemas.length})</div>
          <div data-part="get-info-chips">
            {doc.schemas.map((s) => (
              <span key={s.id} data-part="get-info-chip">{s.id}</span>
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
        <dt>Description:</dt><dd>{app.description ?? '\u2014'}</dd>
        <dt>Required:</dt><dd>{app.required ? '\u25C8 Yes (required at startup)' : 'No'}</dd>
        <dt>Base URL:</dt><dd style={{ fontFamily: 'monospace', fontSize: 10 }}>/api/apps/{app.app_id}/</dd>
      </dl>

      <div data-part="get-info-section">Health</div>
      <dl data-part="get-info-fields">
        <dt>Status:</dt>
        <dd>
          {app.healthy
            ? <>{'\u25CF'} Healthy</>
            : <>{'\u25CB'} <span style={{ color: '#a00' }}>Unhealthy</span></>}
        </dd>
      </dl>
      {app.health_error && (
        <div data-part="get-info-health-error">
          {app.health_error}
          {app.required && (
            <div style={{ marginTop: 4, fontWeight: 'bold' }}>
              This is a required module. System may be degraded.
            </div>
          )}
        </div>
      )}

      <ReflectionSection appId={app.app_id} hasReflection={hasReflection} />

      {hasReflection && onOpenInBrowser && (
        <div data-part="get-info-footer">
          <button
            type="button"
            data-part="btn"
            onClick={onOpenInBrowser}
          >
            Open in Browser
          </button>
        </div>
      )}
    </div>
  );
}
