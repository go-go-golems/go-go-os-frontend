import { useMemo } from 'react';
import { useGetAppsQuery, useGetOSDocsQuery } from '../../api/appsApi';
import type { AppManifestDocument, OSDocResult, OSDocsResponse } from '../../domain/types';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface ModuleCardData {
  app: AppManifestDocument;
  docs: OSDocResult[];
}

function buildModuleCards(apps: AppManifestDocument[], docsResponse: OSDocsResponse | undefined): ModuleCardData[] {
  const resultsByModule = new Map<string, OSDocResult[]>();
  for (const result of docsResponse?.results ?? []) {
    const existing = resultsByModule.get(result.module_id) ?? [];
    existing.push(result);
    resultsByModule.set(result.module_id, existing);
  }

  return apps
    .filter((app) => app.docs?.available)
    .map((app) => ({
      app,
      docs: resultsByModule.get(app.app_id) ?? [],
    }))
    .filter((card) => card.docs.length > 0);
}

function ModuleCard({ card }: { card: ModuleCardData }) {
  const { openModuleDocs, openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();

  return (
    <div data-part="doc-module-card">
      <div
        data-part="doc-module-card-header"
        onClick={() => openModuleDocs(card.app.app_id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') openModuleDocs(card.app.app_id);
        }}
        role="button"
        tabIndex={0}
      >
        <span data-part="doc-module-card-name">{card.app.name}</span>
      </div>
      <div data-part="doc-module-card-meta">
        {card.docs.length} page{card.docs.length !== 1 ? 's' : ''}
      </div>
      <ul data-part="doc-module-card-list">
        {card.docs.map((doc) => {
          const handlers = createDocLinkHandlers(
            { moduleId: card.app.app_id, slug: doc.slug },
            openDoc,
            openDocNewWindow,
            showDocLinkMenu,
          );
          return (
            <li key={doc.slug}>
              <button
                type="button"
                data-part="doc-module-card-link"
                onClick={handlers.onClick}
                onAuxClick={handlers.onAuxClick}
                onContextMenu={handlers.onContextMenu}
              >
                <span data-part="doc-module-card-link-type">{doc.doc_type}</span>
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

function TopicChips({ topics }: { topics: Array<{ slug: string; count: number }> }) {
  const { openSearch } = useDocBrowser();

  if (topics.length === 0) return null;

  return (
    <div>
      <div data-part="doc-center-section">Browse by Topic</div>
      <div data-part="doc-chip-row">
        {topics.map((topic) => (
          <button
            key={topic.slug}
            type="button"
            data-part="doc-chip"
            onClick={() => openSearch()}
          >
            {topic.slug}
            <span data-part="doc-chip-count">{topic.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function DocTypeChips({ docTypes }: { docTypes: Array<{ slug: string; count: number }> }) {
  const { openSearch } = useDocBrowser();

  if (docTypes.length === 0) return null;

  return (
    <div>
      <div data-part="doc-center-section">Browse by Type</div>
      <div data-part="doc-chip-row">
        {docTypes.map((dt) => (
          <button
            key={dt.slug}
            type="button"
            data-part="doc-chip"
            onClick={() => openSearch()}
          >
            {dt.slug}
            <span data-part="doc-chip-count">{dt.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function DocCenterHome() {
  const { data: apps, isLoading: appsLoading } = useGetAppsQuery();
  const { data: docsResponse, isLoading: docsLoading } = useGetOSDocsQuery({});
  const { openSearch } = useDocBrowser();

  const moduleCards = useMemo(
    () => buildModuleCards(apps ?? [], docsResponse),
    [apps, docsResponse],
  );

  const topics = useMemo(
    () =>
      [...(docsResponse?.facets?.topics ?? [])].sort((a, b) => b.count - a.count),
    [docsResponse],
  );

  const docTypes = useMemo(
    () =>
      [...(docsResponse?.facets?.doc_types ?? [])].sort((a, b) => b.count - a.count),
    [docsResponse],
  );

  const isLoading = appsLoading || docsLoading;

  if (isLoading) {
    return (
      <div data-part="doc-center-home">
        <div data-part="doc-center-message">Loading documentation&hellip;</div>
      </div>
    );
  }

  if (moduleCards.length === 0) {
    return (
      <div data-part="doc-center-home">
        <DocSearchBar onSearch={openSearch} />
        <div data-part="doc-center-message">
          No documentation available yet. Modules can add docs by embedding markdown files with YAML frontmatter.
        </div>
      </div>
    );
  }

  return (
    <div data-part="doc-center-home">
      <DocSearchBar onSearch={openSearch} />

      <div>
        <div data-part="doc-center-section">Modules with Documentation</div>
        <div data-part="doc-module-grid">
          {moduleCards.map((card) => (
            <ModuleCard key={card.app.app_id} card={card} />
          ))}
        </div>
      </div>

      <TopicChips topics={topics} />
      <DocTypeChips docTypes={docTypes} />

      <div data-part="doc-center-footer">
        {docsResponse?.total ?? 0} docs across {docsResponse?.facets?.modules?.length ?? 0} modules
      </div>
    </div>
  );
}

function DocSearchBar({ onSearch }: { onSearch: (query?: string) => void }) {
  return (
    <form
      data-part="doc-search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const input = form.elements.namedItem('query') as HTMLInputElement;
        onSearch(input.value || undefined);
      }}
    >
      <input
        data-part="doc-search-input"
        name="query"
        type="text"
        placeholder="Search documentation..."
        autoComplete="off"
      />
      <button type="submit" data-part="doc-browser-nav-btn">
        Search
      </button>
    </form>
  );
}
