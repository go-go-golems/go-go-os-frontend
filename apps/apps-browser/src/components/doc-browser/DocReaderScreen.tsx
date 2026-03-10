import { useCallback, useMemo, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import { useGetAppsQuery } from '../../api/appsApi';
import { compareDocSummaries, objectPathToMountPath, useDocObject, useDocsMount } from '../../domain/docsHooks';
import {
  buildDocObjectPath,
  parseDocsObjectPath,
  type DocObject,
  type DocObjectPath,
  type DocObjectSummary,
} from '../../domain/docsObjects';
import { useDocBrowser } from './DocBrowserContext';
import { createDocLinkHandlers } from './docLinkInteraction';

interface DocReaderScreenProps {
  path: DocObjectPath;
}

function CodeBlock({ children, ...props }: ComponentPropsWithoutRef<'pre'>) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = extractText(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div data-part="doc-code-block">
      <pre {...props}>{children}</pre>
      <button
        type="button"
        data-part="doc-code-copy"
        onClick={handleCopy}
        aria-label="Copy code"
        title="Copy to clipboard"
      >
        {copied ? '\u2713' : '\u2398'}
      </button>
    </div>
  );
}

function extractText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props?: { children?: unknown } };
    return extractText(element.props?.children);
  }
  return '';
}

const markdownComponents = {
  pre: CodeBlock,
};

function parseSeeAlso(ref: string, currentKind?: string, currentOwner?: string): DocObjectPath | null {
  if (ref.startsWith('/docs/objects/')) {
    return ref as DocObjectPath;
  }
  if (ref.includes('/')) {
    const [owner, ...rest] = ref.split('/');
    return buildDocObjectPath('module', owner, rest.join('/'));
  }
  if (currentKind && currentOwner) {
    return buildDocObjectPath(currentKind, currentOwner, ref);
  }
  return null;
}

function Breadcrumb({
  doc,
  collectionLabel,
  onOpenCollection,
}: {
  doc: DocObject;
  collectionLabel: string;
  onOpenCollection: () => void;
}) {
  const { openSearch } = useDocBrowser();

  return (
    <div data-part="doc-breadcrumb">
      <button type="button" data-part="doc-breadcrumb-link" onClick={onOpenCollection}>
        {collectionLabel}
      </button>
      <span data-part="doc-breadcrumb-sep">{'\u203A'}</span>
      <button type="button" data-part="doc-breadcrumb-link" onClick={() => openSearch(doc.docType)}>
        {doc.docType ?? 'reference'}
      </button>
      <span data-part="doc-breadcrumb-sep">{'\u203A'}</span>
      <span data-part="doc-breadcrumb-current">{doc.title}</span>
    </div>
  );
}

function MetadataBar({ doc, onOpenCollection }: { doc: DocObject; onOpenCollection: () => void }) {
  const { openSearch } = useDocBrowser();

  return (
    <div data-part="doc-meta-bar">
      <button
        type="button"
        data-part="doc-badge"
        data-variant="doc-type"
        onClick={() => openSearch(doc.docType)}
      >
        {doc.docType ?? 'reference'}
      </button>
      <button
        type="button"
        data-part="doc-badge"
        data-variant="module"
        onClick={onOpenCollection}
      >
        {doc.kind}:{doc.owner}
      </button>
      {doc.topics?.map((topic) => (
        <button
          key={topic}
          type="button"
          data-part="doc-badge"
          onClick={() => openSearch(topic)}
        >
          {topic}
        </button>
      ))}
    </div>
  );
}

function SeeAlsoSection({
  seeAlso,
  currentKind,
  currentOwner,
}: {
  seeAlso: string[];
  currentKind?: string;
  currentOwner?: string;
}) {
  const { openDoc, openDocNewWindow, showDocLinkMenu } = useDocBrowser();

  return (
    <div data-part="doc-see-also">
      <div data-part="doc-see-also-title">See Also</div>
      <ul data-part="doc-see-also-list">
        {seeAlso.map((ref) => {
          const path = parseSeeAlso(ref, currentKind, currentOwner);
          if (!path) {
            return (
              <li key={ref}>
                <span data-part="doc-see-also-link-slug">{ref}</span>
              </li>
            );
          }
          const parsed = parseDocsObjectPath(path);
          const handlers = createDocLinkHandlers(
            { path },
            openDoc,
            openDocNewWindow,
            showDocLinkMenu,
          );
          return (
            <li key={ref}>
              <button
                type="button"
                data-part="doc-see-also-link"
                onClick={handlers.onClick}
                onAuxClick={handlers.onAuxClick}
                onContextMenu={handlers.onContextMenu}
              >
                <span data-part="doc-see-also-link-module">{parsed?.owner ?? 'docs'}</span>
                <span data-part="doc-see-also-link-slug">{parsed?.slug ?? ref}</span>
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
  currentPath,
  docs,
}: {
  currentPath: DocObjectPath;
  docs: DocObjectSummary[];
}) {
  const { openDoc } = useDocBrowser();
  const ordered = docs.slice().sort(compareDocSummaries);
  const currentIndex = ordered.findIndex((entry) => entry.path === currentPath);
  const prevDoc = currentIndex > 0 ? ordered[currentIndex - 1] : undefined;
  const nextDoc = currentIndex >= 0 && currentIndex < ordered.length - 1 ? ordered[currentIndex + 1] : undefined;

  if (!prevDoc && !nextDoc) return null;

  return (
    <div data-part="doc-prev-next">
      <button
        type="button"
        data-part="doc-prev-next-btn"
        disabled={!prevDoc}
        onClick={() => prevDoc && openDoc(prevDoc.path)}
      >
        {prevDoc ? `\u25C0 ${prevDoc.title}` : ''}
      </button>
      <div data-part="doc-prev-next-spacer" />
      <button
        type="button"
        data-part="doc-prev-next-btn"
        disabled={!nextDoc}
        onClick={() => nextDoc && openDoc(nextDoc.path)}
      >
        {nextDoc ? `${nextDoc.title} \u25B6` : ''}
      </button>
    </div>
  );
}

export function DocReaderScreen({ path }: DocReaderScreenProps) {
  const { data: apps } = useGetAppsQuery();
  const { openCollection } = useDocBrowser();
  const { status, value } = useDocObject(path);
  const mountPath = objectPathToMountPath(path) ?? undefined;
  const mount = useDocsMount(mountPath);
  const parsed = parseDocsObjectPath(path);
  const app = parsed?.kind === 'module' ? apps?.find((candidate) => candidate.app_id === parsed.owner) : undefined;
  const collectionLabel =
    parsed?.kind === 'module'
      ? (app?.name ?? parsed.owner)
      : parsed?.kind === 'help'
        ? 'Help'
        : parsed?.owner ?? path;

  if (status === 'loading' || status === 'idle') {
    return (
      <div data-part="doc-reader">
        <div data-part="doc-center-message">Loading document&hellip;</div>
      </div>
    );
  }

  if (!value) {
    return (
      <div data-part="doc-reader">
        <div data-part="doc-center-message">
          Document not found: {path}
        </div>
      </div>
    );
  }

  return (
    <div data-part="doc-reader">
      <Breadcrumb doc={value} collectionLabel={collectionLabel} onOpenCollection={() => mountPath && openCollection(mountPath)} />
      <MetadataBar doc={value} onOpenCollection={() => mountPath && openCollection(mountPath)} />

      <div data-part="doc-content">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {value.content ?? ''}
        </Markdown>
      </div>

      {value.seeAlso && value.seeAlso.length > 0 && (
        <SeeAlsoSection seeAlso={value.seeAlso} currentKind={value.kind} currentOwner={value.owner} />
      )}

      {mountPath && <PrevNextNav currentPath={path} docs={mount.summaries} />}
    </div>
  );
}
