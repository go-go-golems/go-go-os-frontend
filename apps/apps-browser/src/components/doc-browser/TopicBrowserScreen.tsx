import { useMemo, useState } from 'react';
import { useGetOSDocsQuery } from '../../api/appsApi';
import type { OSDocResult } from '../../domain/types';
import { useDocBrowser } from './DocBrowserContext';

interface TopicBrowserScreenProps {
  initialTopic?: string;
}

function groupByModule(results: OSDocResult[]): Array<{ moduleId: string; docs: OSDocResult[] }> {
  const groups = new Map<string, OSDocResult[]>();
  for (const result of results) {
    const existing = groups.get(result.module_id) ?? [];
    existing.push(result);
    groups.set(result.module_id, existing);
  }
  return [...groups.entries()]
    .map(([moduleId, docs]) => ({ moduleId, docs }))
    .sort((a, b) => a.moduleId.localeCompare(b.moduleId));
}

export function TopicBrowserScreen({ initialTopic }: TopicBrowserScreenProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>(initialTopic);
  const { openDoc } = useDocBrowser();

  // Fetch unfiltered for topic list
  const { data: allDocs } = useGetOSDocsQuery({});

  // Fetch filtered by selected topic
  const topicQuery = useMemo(
    () => (selectedTopic ? { topics: [selectedTopic] } : {}),
    [selectedTopic],
  );
  const { data: topicDocs, isLoading: topicLoading } = useGetOSDocsQuery(topicQuery);

  const topics = useMemo(
    () =>
      [...(allDocs?.facets?.topics ?? [])].sort((a, b) => b.count - a.count),
    [allDocs],
  );

  const moduleGroups = useMemo(
    () => groupByModule(topicDocs?.results ?? []),
    [topicDocs],
  );

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
        ) : topicLoading ? (
          <div data-part="doc-topic-placeholder">Loading&hellip;</div>
        ) : (
          <>
            <div data-part="doc-topic-detail-header">
              {selectedTopic}
              <span data-part="doc-topic-detail-count">
                ({topicDocs?.total ?? 0} docs)
              </span>
            </div>

            {moduleGroups.length === 0 ? (
              <div data-part="doc-topic-placeholder">
                No documentation tagged with this topic.
              </div>
            ) : (
              moduleGroups.map((group) => (
                <div key={group.moduleId} data-part="doc-topic-module-group">
                  <div data-part="doc-topic-module-header">
                    {group.moduleId.toUpperCase()}
                    <span data-part="doc-topic-module-count"> ({group.docs.length})</span>
                  </div>
                  {group.docs.map((doc) => (
                    <button
                      key={doc.slug}
                      type="button"
                      data-part="doc-topic-doc-row"
                      onClick={() => openDoc(doc.module_id, doc.slug)}
                    >
                      <span data-part="doc-topic-doc-type">{doc.doc_type}</span>
                      <span data-part="doc-topic-doc-title">{doc.title}</span>
                      <span data-part="doc-topic-doc-arrow">{'\u203A'}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
