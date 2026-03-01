import { useCallback, useMemo, useState } from 'react';
import { useGetOSDocsQuery } from '../../api/appsApi';
import type { OSDocResult, OSDocsQuery } from '../../domain/types';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface DocSearchScreenProps {
  initialQuery?: string;
}

const HELP_MODULE_ID = 'wesen-os';

interface FilterState {
  query: string;
  modules: Set<string>;
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

function buildQuery(filter: FilterState, allModules: string[], allDocTypes: string[], allTopics: string[]): OSDocsQuery {
  const query: OSDocsQuery = {};
  if (filter.query.trim()) {
    query.query = filter.query.trim();
  }
  // Only add filter if not all are selected (i.e., user has unchecked some)
  if (filter.modules.size > 0 && filter.modules.size < allModules.length) {
    query.module = [...filter.modules];
  }
  if (filter.docTypes.size > 0 && filter.docTypes.size < allDocTypes.length) {
    query.doc_type = [...filter.docTypes];
  }
  if (filter.topics.size > 0 && filter.topics.size < allTopics.length) {
    query.topics = [...filter.topics];
  }
  return query;
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

function ResultCard({ result }: { result: OSDocResult }) {
  const { openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();
  const handlers = createDocLinkHandlers(
    { moduleId: result.module_id, slug: result.slug },
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
        <span data-part="doc-badge" data-variant="doc-type">{result.doc_type}</span>
        <span data-part="doc-badge" data-variant="module">{result.module_id}</span>
      </div>
      <div data-part="doc-result-card-title">{result.title}</div>
      {result.summary && (
        <div data-part="doc-result-card-summary">{result.summary}</div>
      )}
    </button>
  );
}

export function DocSearchScreen({ initialQuery = '' }: DocSearchScreenProps) {
  const { mode } = useDocBrowser();
  const isHelpMode = mode === 'help';

  // First, fetch unfiltered to get the full facet lists
  const unfilteredQuery = useMemo<OSDocsQuery>(() => (
    isHelpMode ? { module: [HELP_MODULE_ID] } : {}
  ), [isHelpMode]);
  const { data: unfilteredDocs } = useGetOSDocsQuery(unfilteredQuery);

  const allModules = useMemo(
    () => (unfilteredDocs?.facets?.modules ?? []).map((m) => m.id),
    [unfilteredDocs],
  );
  const allDocTypes = useMemo(
    () => (unfilteredDocs?.facets?.doc_types ?? []).map((d) => d.slug),
    [unfilteredDocs],
  );
  const allTopics = useMemo(
    () => (unfilteredDocs?.facets?.topics ?? []).map((t) => t.slug),
    [unfilteredDocs],
  );

  const [filter, setFilter] = useState<FilterState>({
    query: initialQuery,
    modules: new Set<string>(),
    docTypes: new Set<string>(),
    topics: new Set<string>(),
  });

  const apiQuery = useMemo(
    () => {
      const query = buildQuery(filter, allModules, allDocTypes, allTopics);
      if (isHelpMode) {
        query.module = [HELP_MODULE_ID];
      }
      return query;
    },
    [filter, allModules, allDocTypes, allTopics, isHelpMode],
  );

  const { data: filteredDocs, isLoading } = useGetOSDocsQuery(apiQuery);

  const toggleModule = useCallback((slug: string) => {
    setFilter((prev) => {
      const current = prev.modules.size === 0 ? new Set(allModules) : prev.modules;
      return { ...prev, modules: toggleSet(current, slug) };
    });
  }, [allModules]);

  const toggleDocType = useCallback((slug: string) => {
    setFilter((prev) => {
      const current = prev.docTypes.size === 0 ? new Set(allDocTypes) : prev.docTypes;
      return { ...prev, docTypes: toggleSet(current, slug) };
    });
  }, [allDocTypes]);

  const toggleTopic = useCallback((slug: string) => {
    setFilter((prev) => {
      const current = prev.topics.size === 0 ? new Set(allTopics) : prev.topics;
      return { ...prev, topics: toggleSet(current, slug) };
    });
  }, [allTopics]);

  const clearAll = useCallback(() => {
    setFilter({
      query: '',
      modules: new Set<string>(),
      docTypes: new Set<string>(),
      topics: new Set<string>(),
    });
  }, []);

  const results = filteredDocs?.results ?? [];
  const total = unfilteredDocs?.total ?? 0;

  // Use the unfiltered facets for the sidebar to show global counts
  const moduleFacets = useMemo(
    () =>
      (unfilteredDocs?.facets?.modules ?? []).map((m) => ({ slug: m.id, count: m.count })),
    [unfilteredDocs],
  );
  const docTypeFacets = unfilteredDocs?.facets?.doc_types ?? [];
  const topicFacets = unfilteredDocs?.facets?.topics ?? [];

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
            placeholder="Search documentation..."
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
          <FilterSection
            title="Modules"
            items={moduleFacets}
            selected={filter.modules}
            onToggle={toggleModule}
          />
          <FilterSection
            title="Doc Types"
            items={docTypeFacets}
            selected={filter.docTypes}
            onToggle={toggleDocType}
          />
          <FilterSection
            title="Topics"
            items={topicFacets}
            selected={filter.topics}
            onToggle={toggleTopic}
          />
          <div data-part="doc-filter-section">
            <button type="button" data-part="doc-filter-clear" onClick={clearAll}>
              Clear All
            </button>
          </div>
        </div>

        <div data-part="doc-results">
          <div data-part="doc-results-header">
            <span data-part="doc-results-count">
              {isLoading
                ? 'Searching\u2026'
                : results.length === total
                  ? `${results.length} results`
                  : `${results.length} of ${total} results`}
            </span>
          </div>

          {!isLoading && results.length === 0 && (
            <div data-part="doc-center-message">
              No docs match your search. Try different keywords or clear filters.
            </div>
          )}

          {results.map((result) => (
            <ResultCard key={`${result.module_id}:${result.slug}`} result={result} />
          ))}
        </div>
      </div>
    </div>
  );
}
