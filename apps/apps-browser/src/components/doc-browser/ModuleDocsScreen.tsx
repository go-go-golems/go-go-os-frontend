import { useMemo } from 'react';
import { useGetAppsQuery, useGetModuleDocsQuery } from '../../api/appsApi';
import type { ModuleDocDocument } from '../../domain/types';
import { useDocBrowser } from './DocBrowserContext';

interface ModuleDocsScreenProps {
  moduleId: string;
}

const DOC_TYPE_ORDER = ['guide', 'tutorial', 'reference', 'troubleshooting'];

function docTypeLabel(docType: string): string {
  switch (docType) {
    case 'guide':
      return 'Guides';
    case 'tutorial':
      return 'Tutorials';
    case 'reference':
      return 'References';
    case 'troubleshooting':
      return 'Troubleshooting';
    default:
      return docType.charAt(0).toUpperCase() + docType.slice(1);
  }
}

function groupByDocType(docs: ModuleDocDocument[]): Array<{ docType: string; docs: ModuleDocDocument[] }> {
  const groups = new Map<string, ModuleDocDocument[]>();
  for (const doc of docs) {
    const key = doc.doc_type.toLowerCase();
    const existing = groups.get(key) ?? [];
    existing.push(doc);
    groups.set(key, existing);
  }

  // Sort groups by DOC_TYPE_ORDER, then alphabetically for unknown types
  const knownGroups: Array<{ docType: string; docs: ModuleDocDocument[] }> = [];
  const unknownGroups: Array<{ docType: string; docs: ModuleDocDocument[] }> = [];

  for (const [docType, groupDocs] of groups) {
    const target = DOC_TYPE_ORDER.includes(docType) ? knownGroups : unknownGroups;
    target.push({ docType, docs: groupDocs });
  }

  knownGroups.sort((a, b) => DOC_TYPE_ORDER.indexOf(a.docType) - DOC_TYPE_ORDER.indexOf(b.docType));
  unknownGroups.sort((a, b) => a.docType.localeCompare(b.docType));

  return [...knownGroups, ...unknownGroups];
}

function DocEntryCard({ doc, moduleId }: { doc: ModuleDocDocument; moduleId: string }) {
  const { openDoc, openSearch } = useDocBrowser();

  return (
    <button
      type="button"
      data-part="doc-entry-card"
      onClick={() => openDoc(moduleId, doc.slug)}
    >
      <div data-part="doc-entry-card-header">
        <span data-part="doc-entry-card-order">{doc.order ?? ''}</span>
        <span data-part="doc-entry-card-title">{doc.title}</span>
        <span data-part="doc-entry-card-arrow">{'\u203A'}</span>
      </div>
      {doc.summary && (
        <div data-part="doc-entry-card-summary">{doc.summary}</div>
      )}
      {doc.topics && doc.topics.length > 0 && (
        <div data-part="doc-entry-card-topics">
          {doc.topics.map((topic) => (
            <button
              key={topic}
              type="button"
              data-part="doc-badge"
              onClick={(e) => {
                e.stopPropagation();
                openSearch();
              }}
            >
              {topic}
            </button>
          ))}
        </div>
      )}
    </button>
  );
}

export function ModuleDocsScreen({ moduleId }: ModuleDocsScreenProps) {
  const { data: apps } = useGetAppsQuery();
  const { data: tocResponse, isLoading } = useGetModuleDocsQuery(moduleId);

  const app = apps?.find((a) => a.app_id === moduleId);
  const moduleName = app?.name ?? moduleId;
  const docs = tocResponse?.docs ?? [];

  const groups = useMemo(() => groupByDocType(docs), [docs]);

  if (isLoading) {
    return (
      <div data-part="doc-module-screen">
        <div data-part="doc-center-message">Loading module documentation&hellip;</div>
      </div>
    );
  }

  return (
    <div data-part="doc-module-screen">
      <div data-part="doc-module-screen-header">
        <div>
          <div data-part="doc-module-screen-name">{moduleName}</div>
          <div data-part="doc-module-screen-meta">
            {docs.length} documentation page{docs.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div data-part="doc-module-screen-status">
        {app?.healthy ? '\u25CF Healthy' : '\u25CB Unhealthy'}
        {app?.reflection?.available && ' \u00B7 Reflection available'}
        {app?.docs?.version && ` \u00B7 Docs ${app.docs.version}`}
      </div>

      {docs.length === 0 ? (
        <div data-part="doc-center-message">
          This module has no documentation pages yet.
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.docType} data-part="doc-type-group">
            <div data-part="doc-type-group-title">{docTypeLabel(group.docType)}</div>
            {group.docs.map((doc) => (
              <DocEntryCard key={doc.slug} doc={doc} moduleId={moduleId} />
            ))}
          </div>
        ))
      )}

      {app?.reflection?.available && (
        <div data-part="doc-module-reflection-link">
          Reflection available &mdash; use the Module Browser to inspect APIs and schemas.
        </div>
      )}
    </div>
  );
}
