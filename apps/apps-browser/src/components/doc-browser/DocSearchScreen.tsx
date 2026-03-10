import { useCallback, useMemo, useState } from 'react';
import { useDocsIndex, useDocsSearch } from '../../domain/docsHooks';
import { type DocsSearchQuery } from '../../domain/docsObjects';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface DocSearchScreenProps {
  initialQuery?: string;
}

interface FilterState {
  query: string;
  kinds: Set<string>;
  owners: Set<string>;
  docTypes: Set<string>;
  topics: Set<string>;
}

function toggleSet(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

function FilterSection({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: Array<{ slug: string; count: number }>;
  selected: Set<string>;
  onToggle: (slug: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div data-part="doc-filter-section">
      <div data-part="doc-filter-section-title">{title}</div>
      {items.map((item) => {
        const checked = selected.size === 0 || selected.has(item.slug);
        return (
          <label key={item.slug} data-part="doc-filter-item">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(item.slug)}
            />
            <span data-part="doc-filter-item-label">{item.slug}</span>
            <span data-part="doc-filter-item-count">{item.count}</span>
          </label>
        );
      })}
    </div>
  );
}

function ResultCard({
  result,
}: {
  result: ReturnType<typeof useDocsSearch>['results'][number];
}) {
  const { openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();
  const handlers = createDocLinkHandlers(
    { path: result.path },
    openDoc,
    openDocNewWindow,
    showDocLinkMenu,
  );

  return (
    <button
      type="button"
      data-part="doc-result-card"
      onClick={handlers.onClick}
      onAuxClick={handlers.onAuxClick}
      onContextMenu={handlers.onContextMenu}
    >
      <div data-part="doc-result-card-badges">
        <span data-part="doc-badge" data-variant="doc-type">{result.docType ?? 'reference'}</span>
        <span data-part="doc-badge" data-variant="module">{result.kind}:{result.owner}</span>
      </div>
      <div data-part="doc-result-card-title">{result.title}</div>
      {result.summary && (
        <div data-part="doc-result-card-summary">{result.summary}</div>
      )}
    </button>
  );
}

export function DocSearchScreen({ initialQuery = '' }: DocSearchScreenProps) {
  const { summaries } = useDocsIndex();
  const [filter, setFilter] = useState<FilterState>({
    query: initialQuery,
    kinds: new Set<string>(),
    owners: new Set<string>(),
    docTypes: new Set<string>(),
    topics: new Set<string>(),
  });

  const kindFacets = useMemo(() => facetCounts(summaries, (summary) => summary.kind), [summaries]);
  const ownerFacets = useMemo(() => facetCounts(summaries, (summary) => summary.owner), [summaries]);
  const docTypeFacets = useMemo(
    () => facetCounts(summaries, (summary) => summary.docType ?? 'reference'),
    [summaries],
  );
  const topicFacets = useMemo(
    () => facetCountsMany(summaries, (summary) => summary.topics ?? []),
    [summaries],
  );

  const query = useMemo<DocsSearchQuery>(() => ({
    query: filter.query.trim() || undefined,
    kinds: filter.kinds.size > 0 ? [...filter.kinds] : undefined,
    owners: filter.owners.size > 0 ? [...filter.owners] : undefined,
    docTypes: filter.docTypes.size > 0 ? [...filter.docTypes] : undefined,
    topics: filter.topics.size > 0 ? [...filter.topics] : undefined,
  }), [filter]);

  const { results, status } = useDocsSearch(query);

  const toggleKind = useCallback((slug: string) => {
    setFilter((prev) => ({ ...prev, kinds: toggleSet(prev.kinds.size === 0 ? new Set(kindFacets.map((item) => item.slug)) : prev.kinds, slug) }));
  }, [kindFacets]);
  const toggleOwner = useCallback((slug: string) => {
    setFilter((prev) => ({ ...prev, owners: toggleSet(prev.owners.size === 0 ? new Set(ownerFacets.map((item) => item.slug)) : prev.owners, slug) }));
  }, [ownerFacets]);
  const toggleDocType = useCallback((slug: string) => {
    setFilter((prev) => ({ ...prev, docTypes: toggleSet(prev.docTypes.size === 0 ? new Set(docTypeFacets.map((item) => item.slug)) : prev.docTypes, slug) }));
  }, [docTypeFacets]);
  const toggleTopic = useCallback((slug: string) => {
    setFilter((prev) => ({ ...prev, topics: toggleSet(prev.topics.size === 0 ? new Set(topicFacets.map((item) => item.slug)) : prev.topics, slug) }));
  }, [topicFacets]);

  const clearAll = useCallback(() => {
    setFilter({
      query: '',
      kinds: new Set<string>(),
      owners: new Set<string>(),
      docTypes: new Set<string>(),
      topics: new Set<string>(),
    });
  }, []);

  return (
    <div data-part="doc-search-screen">
      <div data-part="doc-search-screen-header">
        <form
          data-part="doc-search-bar"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem('query') as HTMLInputElement;
            setFilter((prev) => ({ ...prev, query: input.value }));
          }}
        >
          <input
            data-part="doc-search-input"
            name="query"
            type="text"
            placeholder="Search mounted documentation..."
            autoComplete="off"
            value={filter.query}
            onChange={(e) => setFilter((prev) => ({ ...prev, query: e.target.value }))}
          />
          <button type="submit" data-part="doc-browser-nav-btn">
            Search
          </button>
        </form>
      </div>

      <div data-part="doc-search-layout">
        <div data-part="doc-filter-sidebar">
          <FilterSection title="Kinds" items={kindFacets} selected={filter.kinds} onToggle={toggleKind} />
          <FilterSection title="Owners" items={ownerFacets} selected={filter.owners} onToggle={toggleOwner} />
          <FilterSection title="Doc Types" items={docTypeFacets} selected={filter.docTypes} onToggle={toggleDocType} />
          <FilterSection title="Topics" items={topicFacets} selected={filter.topics} onToggle={toggleTopic} />
          <div data-part="doc-filter-section">
            <button type="button" data-part="doc-filter-clear" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>

        <div data-part="doc-results">
          <div data-part="doc-results-header">
            <span data-part="doc-results-count">
              {status === 'loading' ? 'Searching…' : `${results.length} results`}
            </span>
          </div>

          {status !== 'loading' && results.length === 0 && (
            <div data-part="doc-center-message">
              No mounted docs match your search.
            </div>
          )}

          {results.map((result) => (
            <ResultCard key={result.path} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}

function facetCounts<T>(items: T[], toKey: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = toKey(item);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}

function facetCountsMany<T>(items: T[], toKeys: (item: T) => string[]) {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const key of toKeys(item)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count || a.slug.localeCompare(b.slug));
}
