import { useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGetAppsQuery, useGetModuleDocQuery, useGetModuleDocsQuery } from '../../api/appsApi';
import type { ModuleDocDocument } from '../../domain/types';
import { useDocBrowser } from './DocBrowserContext';

interface DocReaderScreenProps {
  moduleId: string;
  slug: string;
}

function parseSeeAlso(ref: string): { moduleId: string; slug: string } {
  const parts = ref.split('/');
  if (parts.length >= 2) {
    return { moduleId: parts[0], slug: parts.slice(1).join('/') };
  }
  return { moduleId: '', slug: ref };
}

function Breadcrumb({ moduleId, moduleName, doc }: { moduleId: string; moduleName: string; doc: ModuleDocDocument }) {
  const { openModuleDocs, openSearch } = useDocBrowser();

  return (
    <div data-part="doc-breadcrumb">
      <button type="button" data-part="doc-breadcrumb-link" onClick={() => openModuleDocs(moduleId)}>
        {moduleName}
      </button>
      <span data-part="doc-breadcrumb-sep">{'\u203A'}</span>
      <button type="button" data-part="doc-breadcrumb-link" onClick={() => openSearch()}>
        {doc.doc_type}
      </button>
      <span data-part="doc-breadcrumb-sep">{'\u203A'}</span>
      <span data-part="doc-breadcrumb-current">{doc.title}</span>
    </div>
  );
}

function MetadataBar({ moduleId, doc }: { moduleId: string; doc: ModuleDocDocument }) {
  const { openModuleDocs, openSearch } = useDocBrowser();

  return (
    <div data-part="doc-meta-bar">
      <button
        type="button"
        data-part="doc-badge"
        data-variant="doc-type"
        onClick={() => openSearch()}
      >
        {doc.doc_type}
      </button>
      <button
        type="button"
        data-part="doc-badge"
        data-variant="module"
        onClick={() => openModuleDocs(moduleId)}
      >
        {moduleId}
      </button>
      {doc.topics?.map((topic) => (
        <button
          key={topic}
          type="button"
          data-part="doc-badge"
          onClick={() => openSearch()}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

function SeeAlsoSection({ seeAlso }: { seeAlso: string[] }) {
  const { openDoc } = useDocBrowser();

  return (
    <div data-part="doc-see-also">
      <div data-part="doc-see-also-title">See Also</div>
      <ul data-part="doc-see-also-list">
        {seeAlso.map((ref) => {
          const parsed = parseSeeAlso(ref);
          return (
            <li key={ref}>
              <button
                type="button"
                data-part="doc-see-also-link"
                onClick={() => {
                  if (parsed.moduleId) {
                    openDoc(parsed.moduleId, parsed.slug);
                  }
                }}
              >
                {parsed.moduleId && (
                  <span data-part="doc-see-also-link-module">{parsed.moduleId}</span>
                )}
                <span data-part="doc-see-also-link-slug">{parsed.slug}</span>
                <span data-part="doc-see-also-link-arrow">{'\u203A'}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PrevNextNav({
  moduleId,
  currentSlug,
  toc,
}: {
  moduleId: string;
  currentSlug: string;
  toc: ModuleDocDocument[];
}) {
  const { openDoc } = useDocBrowser();

  const currentIndex = toc.findIndex((d) => d.slug === currentSlug);
  const prevDoc = currentIndex > 0 ? toc[currentIndex - 1] : undefined;
  const nextDoc = currentIndex >= 0 && currentIndex < toc.length - 1 ? toc[currentIndex + 1] : undefined;

  if (!prevDoc && !nextDoc) return null;

  return (
    <div data-part="doc-prev-next">
      <button
        type="button"
        data-part="doc-prev-next-btn"
        disabled={!prevDoc}
        onClick={() => prevDoc && openDoc(moduleId, prevDoc.slug)}
      >
        {prevDoc ? `\u25C0 ${prevDoc.title}` : ''}
      </button>
      <div data-part="doc-prev-next-spacer" />
      <button
        type="button"
        data-part="doc-prev-next-btn"
        disabled={!nextDoc}
        onClick={() => nextDoc && openDoc(moduleId, nextDoc.slug)}
      >
        {nextDoc ? `${nextDoc.title} \u25B6` : ''}
      </button>
    </div>
  );
}

export function DocReaderScreen({ moduleId, slug }: DocReaderScreenProps) {
  const { data: apps } = useGetAppsQuery();
  const { data: tocResponse, isLoading: tocLoading } = useGetModuleDocsQuery(moduleId);
  const { data: fullDoc, isLoading: docLoading } = useGetModuleDocQuery({ appId: moduleId, slug });

  const app = apps?.find((a) => a.app_id === moduleId);
  const moduleName = app?.name ?? moduleId;

  const tocDoc = useMemo(() => {
    return tocResponse?.docs?.find((d) => d.slug === slug);
  }, [tocResponse, slug]);

  const toc = tocResponse?.docs ?? [];

  if (tocLoading || docLoading) {
    return (
      <div data-part="doc-reader">
        <div data-part="doc-center-message">Loading document&hellip;</div>
      </div>
    );
  }

  const displayDoc = fullDoc ?? tocDoc;

  if (!displayDoc) {
    return (
      <div data-part="doc-reader">
        <div data-part="doc-center-message">
          Document not found: {moduleId}/{slug}
        </div>
      </div>
    );
  }

  return (
    <div data-part="doc-reader">
      <Breadcrumb moduleId={moduleId} moduleName={moduleName} doc={displayDoc} />
      <MetadataBar moduleId={moduleId} doc={displayDoc} />

      <div data-part="doc-content">
        <Markdown remarkPlugins={[remarkGfm]}>{displayDoc.content ?? ''}</Markdown>
      </div>

      {displayDoc.see_also && displayDoc.see_also.length > 0 && (
        <SeeAlsoSection seeAlso={displayDoc.see_also} />
      )}

      <PrevNextNav moduleId={moduleId} currentSlug={slug} toc={toc} />
    </div>
  );
}
