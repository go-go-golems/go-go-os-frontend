import { useMemo } from 'react';
import { useGetAppsQuery } from '../../api/appsApi';
import { groupDocsByMount, useDocsIndex } from '../../domain/docsHooks';
import type { DocObjectSummary, DocsMountPath } from '../../domain/docsObjects';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface CollectionCardData {
  mountPath: DocsMountPath;
  kind: string;
  owner: string;
  label: string;
  count: number;
  summaries: DocObjectSummary[];
}

function displayCollectionLabel(card: CollectionCardData, appNames: Map<string, string>) {
  if (card.kind === 'module') {
    return appNames.get(card.owner) ?? card.owner;
  }
  if (card.kind === 'help') {
    return 'Help';
  }
  return card.label;
}

function CollectionCard({ card, appNames }: { card: CollectionCardData; appNames: Map<string, string> }) {
  const { openCollection, openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();
  const displayLabel = displayCollectionLabel(card, appNames);

  return (
    <div data-part="doc-module-card">
      <div
        data-part="doc-module-card-header"
        onClick={() => openCollection(card.mountPath)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            openCollection(card.mountPath);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span data-part="doc-module-card-name">{displayLabel}</span>
      </div>
      <div data-part="doc-module-card-meta">
        {card.count} page{card.count !== 1 ? 's' : ''} · {card.kind}
      </div>
      <ul data-part="doc-module-card-list">
        {card.summaries.slice(0, 5).map((doc) => {
          const handlers = createDocLinkHandlers(
            { path: doc.path },
            openDoc,
            openDocNewWindow,
            showDocLinkMenu,
          );
          return (
            <li key={doc.path}>
              <button
                type="button"
                data-part="doc-module-card-link"
                onClick={handlers.onClick}
                onAuxClick={handlers.onAuxClick}
                onContextMenu={handlers.onContextMenu}
              >
                <span data-part="doc-module-card-link-type">{doc.docType ?? doc.kind}</span>
                <span data-part="doc-module-card-link-title">{doc.title}</span>
                <span data-part="doc-module-card-link-arrow">{'\u203A'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChipRow({
  title,
  items,
  onClick,
}: {
  title: string;
  items: Array<{ slug: string; count: number }>;
  onClick: (slug: string) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <div data-part="doc-center-section">{title}</div>
      <div data-part="doc-chip-row">
        {items.map((item) => (
          <button
            key={item.slug}
            type="button"
            data-part="doc-chip"
            onClick={() => onClick(item.slug)}
          >
            {item.slug}
            <span data-part="doc-chip-count">{item.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DocCenterHome() {
  const { data: apps } = useGetAppsQuery();
  const { status, summaries } = useDocsIndex();
  const { openSearch, openTopicBrowser } = useDocBrowser();

  const appNames = useMemo(
    () => new Map((apps ?? []).map((app) => [app.app_id, app.name])),
    [apps],
  );

  const collections = useMemo(
    () => groupDocsByMount(summaries).map((group) => ({
      mountPath: group.mountPath,
      kind: group.kind,
      owner: group.owner,
      label: group.label,
      count: group.count,
      summaries: group.summaries,
    })),
    [summaries],
  );

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const summary of summaries) {
      for (const topic of summary.topics ?? []) {
        counts.set(topic, (counts.get(topic) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  }, [summaries]);

  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    for (const summary of summaries) {
      counts.set(summary.kind, (counts.get(summary.kind) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
  }, [summaries]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div data-part="doc-center-home">
        <div data-part="doc-center-message">Loading documentation&hellip;</div>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div data-part="doc-center-home">
        <div data-part="doc-center-message">
          No documentation collections are mounted yet.
        </div>
      </div>
    );
  }

  return (
    <div data-part="doc-center-home">
      <div>
        <div data-part="doc-center-section">Mounted Documentation Collections</div>
        <div data-part="doc-module-grid">
          {collections.map((card) => (
            <CollectionCard key={card.mountPath} card={card} appNames={appNames} />
          ))}
        </div>
      </div>

      <ChipRow title="Browse by Topic" items={topics} onClick={openTopicBrowser} />
      <ChipRow title="Browse by Kind" items={kinds} onClick={(kind) => openSearch(kind)} />

      <div data-part="doc-center-footer">
        {summaries.length} docs across {collections.length} mounted collections
      </div>
    </div>
  );
}
