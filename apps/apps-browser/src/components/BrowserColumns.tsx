import type { AppManifestDocument, ReflectionAPI, ReflectionSchemaRef } from '../domain/types';

export interface ModuleListPaneProps {
  apps: AppManifestDocument[];
  selectedAppId?: string;
  onSelect: (appId: string) => void;
}

export function ModuleListPane({ apps, selectedAppId, onSelect }: ModuleListPaneProps) {
  return (
    <div data-part="browser-pane">
      <div data-part="browser-pane-header">Modules</div>
      <ul data-part="browser-pane-list">
        {apps.map((app) => (
          <li key={app.app_id}>
            <button
              type="button"
              data-part="browser-pane-item"
              data-state={app.app_id === selectedAppId ? 'selected' : undefined}
              onClick={() => onSelect(app.app_id)}
            >
              <span data-part="browser-item-health" data-variant={app.healthy ? 'healthy' : 'unhealthy'}>
                {app.healthy ? '\u25CF' : '\u25CB'}
              </span>
              <span data-part="browser-item-label">{app.name}</span>
              <span data-part="browser-item-badges">
                {app.required && <span title="Required">{'\u25C8'}</span>}
                {app.reflection?.available && <span title="Reflective">{'\u2605'}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface APIListPaneProps {
  apis?: ReflectionAPI[];
  selectedApiId?: string;
  onSelect: (apiId: string) => void;
  reflectionUnavailable?: boolean;
  reflectionLoading?: boolean;
}

export function APIListPane({ apis, selectedApiId, onSelect, reflectionUnavailable, reflectionLoading }: APIListPaneProps) {
  return (
    <div data-part="browser-pane">
      <div data-part="browser-pane-header">APIs</div>
      {reflectionLoading ? (
        <div data-part="browser-pane-placeholder">Loading&hellip;</div>
      ) : reflectionUnavailable ? (
        <div data-part="browser-pane-placeholder">
          Reflection is not available for this module yet.
        </div>
      ) : !apis || apis.length === 0 ? (
        <div data-part="browser-pane-placeholder" />
      ) : (
        <ul data-part="browser-pane-list">
          {apis.map((api) => (
            <li key={api.id}>
              <button
                type="button"
                data-part="browser-pane-item"
                data-state={api.id === selectedApiId ? 'selected' : undefined}
                onClick={() => onSelect(api.id)}
              >
                <span data-part="browser-item-method">{api.method}</span>
                <span data-part="browser-item-label">{api.path}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export interface SchemaListPaneProps {
  schemas?: ReflectionSchemaRef[];
  selectedSchemaId?: string;
  crossRefIds?: Set<string>;
  onSelect: (schemaId: string) => void;
  reflectionUnavailable?: boolean;
  reflectionLoading?: boolean;
}

export function SchemaListPane({ schemas, selectedSchemaId, crossRefIds, onSelect, reflectionUnavailable, reflectionLoading }: SchemaListPaneProps) {
  return (
    <div data-part="browser-pane">
      <div data-part="browser-pane-header">Schemas</div>
      {reflectionLoading ? (
        <div data-part="browser-pane-placeholder">Loading&hellip;</div>
      ) : reflectionUnavailable ? (
        <div data-part="browser-pane-placeholder">
          Reflection is not available for this module yet.
        </div>
      ) : !schemas || schemas.length === 0 ? (
        <div data-part="browser-pane-placeholder" />
      ) : (
        <ul data-part="browser-pane-list">
          {schemas.map((s) => {
            const isCrossRef = crossRefIds?.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  data-part="browser-pane-item"
                  data-state={s.id === selectedSchemaId ? 'selected' : undefined}
                  onClick={() => onSelect(s.id)}
                >
                  {isCrossRef && <span data-part="browser-item-crossref" title="Referenced by selected API">{'\u25B8'}</span>}
                  <span data-part="browser-item-label">{s.id}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
