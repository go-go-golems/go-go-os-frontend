import { useMemo, useState } from 'react';
import { useDocsIndex, useDocsSearch } from '../../domain/docsHooks';
import { type DocObjectSummary } from '../../domain/docsObjects';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface TopicBrowserScreenProps {
  initialTopic?: string;
}

function groupByCollection(results: DocObjectSummary[]) {
  const groups = new Map<string, DocObjectSummary[]>();
  for (const result of results) {
    const key = `${result.kind}:${result.owner}`;
    const existing = groups.get(key) ?? [];
    existing.push(result);
    groups.set(key, existing);
  }
  return [...groups.entries()]
    .map(([key, docs]) => ({ key, docs }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

export function TopicBrowserScreen({ initialTopic }: TopicBrowserScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(initialTopic);
  const { summaries } = useDocsIndex();
  const { results, status } = useDocsSearch({ topics: selectedTopic ? [selectedTopic] : undefined });
  const { openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();

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

  const groups = useMemo(() => groupByCollection(results), [results]);

  return (
    <div data-part="doc-topic-browser">
      <div data-part="doc-topic-list">
        <div data-part="doc-topic-list-header">Topics</div>
        <ul data-part="doc-topic-list-items">
          {topics.map((topic) => (
            <li key={topic.slug}>
              <button
                type="button"
                data-part="doc-topic-item"
                data-state={topic.slug === selectedTopic ? 'selected' : undefined}
                onClick={() => setSelectedTopic(topic.slug)}
              >
                <span data-part="doc-topic-item-name">{topic.slug}</span>
                <span data-part="doc-topic-item-count">({topic.count})</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div data-part="doc-topic-detail">
        {!selectedTopic ? (
          <div data-part="doc-topic-placeholder">
            Select a topic to browse related documentation.
          </div>
        ) : status === 'loading' ? (
          <div data-part="doc-topic-placeholder">Loading&hellip;</div>
        ) : (
          <>
            <div data-part="doc-topic-detail-header">
              {selectedTopic}
              <span data-part="doc-topic-detail-count">
                ({results.length} docs)
              </span>
            </div>

            {groups.length === 0 ? (
              <div data-part="doc-topic-placeholder">
                No documentation tagged with this topic.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.key} data-part="doc-topic-module-group">
                  <div data-part="doc-topic-module-header">
                    {group.key.toUpperCase()}
                    <span data-part="doc-topic-module-count"> ({group.docs.length})</span>
                  </div>
                  {group.docs.map((doc) => {
                    const handlers = createDocLinkHandlers(
                      { path: doc.path },
                      openDoc,
                      openDocNewWindow,
                      showDocLinkMenu,
                    );
                    return (
                      <button
                        key={doc.path}
                        type="button"
                        data-part="doc-topic-doc-row"
                        onClick={handlers.onClick}
                        onAuxClick={handlers.onAuxClick}
                        onContextMenu={handlers.onContextMenu}
                      >
                        <span data-part="doc-topic-doc-type">{doc.docType ?? 'reference'}</span>
                        <span data-part="doc-topic-doc-title">{doc.title}</span>
                        <span data-part="doc-topic-doc-arrow">{'\u203A'}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
