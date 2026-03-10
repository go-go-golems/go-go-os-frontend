import { useMemo } from 'react';
import { useGetAppsQuery } from '../../api/appsApi';
import { compareDocSummaries, summarizeMount, useDocsMount } from '../../domain/docsHooks';
import { parseDocsObjectPath, type DocObjectSummary, type DocsMountPath } from '../../domain/docsObjects';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface ModuleDocsScreenProps {
  mountPath: DocsMountPath;
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

function groupByDocType(docs: DocObjectSummary[]): Array<{ docType: string; docs: DocObjectSummary[] }> {
  const groups = new Map<string, DocObjectSummary[]>();
  for (const doc of docs) {
    const key = (doc.docType ?? 'reference').toLowerCase();
    const existing = groups.get(key) ?? [];
    existing.push(doc);
    groups.set(key, existing);
  }

  // Sort groups by DOC_TYPE_ORDER, then alphabetically for unknown types
  const knownGroups: Array<{ docType: string; docs: DocObjectSummary[] }> = [];
  const unknownGroups: Array<{ docType: string; docs: DocObjectSummary[] }> = [];

  for (const [docType, groupDocs] of groups) {
    const target = DOC_TYPE_ORDER.includes(docType) ? knownGroups : unknownGroups;
    target.push({ docType, docs: groupDocs.slice().sort(compareDocSummaries) });
  }

  knownGroups.sort((a, b) => DOC_TYPE_ORDER.indexOf(a.docType) - DOC_TYPE_ORDER.indexOf(b.docType));
  unknownGroups.sort((a, b) => a.docType.localeCompare(b.docType));

  return [...knownGroups, ...unknownGroups];
}

function DocEntryCard({ doc }: { doc: DocObjectSummary }) {
  const { openDoc, openSearch, openDocNewWindow, showDocLinkMenu } = useDocBrowser();
  const handlers = createDocLinkHandlers(
    { path: doc.path },
    openDoc,
    openDocNewWindow,
    showDocLinkMenu,
  );

  return (
    <button
      type="button"
      data-part="doc-entry-card"
      onClick={handlers.onClick}
      onAuxClick={handlers.onAuxClick}
      onContextMenu={handlers.onContextMenu}
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
            <span
              key={topic}
              role="button"
              tabIndex={0}
              data-part="doc-badge"
              onClick={(e) => {
                e.stopPropagation();
                openSearch();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  openSearch();
                }
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

export function ModuleDocsScreen({ mountPath }: ModuleDocsScreenProps) {
  const { data: apps } = useGetAppsQuery();
  const { status, summaries, error } = useDocsMount(mountPath);
  const parsed = parseDocsObjectPath(mountPath);
  const mountInfo = summarizeMount(mountPath, summaries);
  const app = parsed?.kind === 'module' ? apps?.find((candidate) => candidate.app_id === parsed.owner) : undefined;
  const collectionName =
    parsed?.kind === 'module'
      ? (app?.name ?? parsed?.owner ?? mountPath)
      : parsed?.kind === 'help'
        ? 'Help'
        : parsed?.owner ?? mountPath;
  const docs = summaries;

  const groups = useMemo(() => groupByDocType(docs), [docs]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div data-part="doc-module-screen">
        <div data-part="doc-center-message">Loading documentation collection&hellip;</div>
      </div>
    );
  }

  return (
    <div data-part="doc-module-screen">
      <div data-part="doc-module-screen-header">
        <div>
          <div data-part="doc-module-screen-name">{collectionName}</div>
          <div data-part="doc-module-screen-meta">
            {docs.length} document{docs.length !== 1 ? 's' : ''} · {mountInfo.kind}
          </div>
        </div>
      </div>

      <div data-part="doc-module-screen-status">
        {parsed?.kind === 'module' ? (app?.healthy ? '\u25CF Healthy' : '\u25CB Unhealthy') : '\u25CF Mounted'}
        {parsed?.kind === 'module' && app?.reflection?.available && ' \u00B7 Reflection available'}
        {mountInfo.docTypes.length > 0 && ` \u00B7 ${mountInfo.docTypes.join(', ')}`}
        {mountInfo.topics.length > 0 && ` \u00B7 ${mountInfo.topics.length} topic${mountInfo.topics.length !== 1 ? 's' : ''}`}
      </div>

      {error && (
        <div data-part="doc-center-message">Collection failed to load: {error}</div>
      )}

      {docs.length === 0 ? (
        <div data-part="doc-center-message">
          This collection has no documents yet.
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.docType} data-part="doc-type-group">
            <div data-part="doc-type-group-title">{docTypeLabel(group.docType)}</div>
            {group.docs.map((doc) => (
              <DocEntryCard key={doc.path} doc={doc} />
            ))}
          </div>
        ))
      )}

      {parsed?.kind === 'module' && app?.reflection?.available && (
        <div data-part="doc-module-reflection-link">
          Reflection available &mdash; use the Module Browser to inspect APIs and schemas.
        </div>
      )}
    </div>
  );
}
