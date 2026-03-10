export type DocObjectKind = string;

export type DocsRootPath = `/docs/objects/${string}`;
export type DocsMountPath = `/docs/objects/${string}/${string}`;
export type DocObjectPath = `/docs/objects/${string}/${string}/${string}`;

export interface DocObjectSummary {
  path: DocObjectPath;
  mountPath: DocsMountPath;
  kind: DocObjectKind;
  owner: string;
  slug: string;
  title: string;
  summary?: string;
  docType?: string;
  topics?: string[];
  tags?: string[];
}

export interface DocObject extends DocObjectSummary {
  content?: string;
  seeAlso?: string[];
}

export interface DocsSearchQuery {
  query?: string;
  kinds?: string[];
  owners?: string[];
  topics?: string[];
  docTypes?: string[];
}

export interface DocsResolveMatch {
  mount: DocsMount;
  mountPath: DocsMountPath;
  subpath: string[];
}

export interface DocsMount {
  mountPath(): DocsMountPath;
  list(subpath?: string[]): Promise<DocObjectSummary[]>;
  read(subpath: string[]): Promise<DocObject | null>;
  search?(query: DocsSearchQuery): Promise<DocObjectSummary[]>;
}

export function buildDocsMountPath(kind: string, owner: string): DocsMountPath {
  return `/docs/objects/${kind}/${owner}`;
}

export function buildDocObjectPath(kind: string, owner: string, slug: string): DocObjectPath {
  return `/docs/objects/${kind}/${owner}/${slug}`;
}

export function parseDocsObjectPath(path: string): { kind: string; owner: string; slug?: string } | null {
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 4) {
    return null;
  }
  if (parts[0] !== 'docs' || parts[1] !== 'objects') {
    return null;
  }
  const [_, __, kind, owner, slug] = parts;
  if (!kind || !owner) {
    return null;
  }
  return { kind, owner, slug };
}

export function mountPathFromObjectPath(path: string): DocsMountPath | null {
  const parsed = parseDocsObjectPath(path);
  if (!parsed) {
    return null;
  }
  return buildDocsMountPath(parsed.kind, parsed.owner);
}

export function isDocObjectPath(path: string): path is DocObjectPath {
  const parsed = parseDocsObjectPath(path);
  return parsed !== null && typeof parsed.slug === 'string' && parsed.slug.length > 0;
}

function includesAny(values: string[] | undefined, filters: string[] | undefined): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  if (!values || values.length === 0) {
    return false;
  }
  return filters.some((entry) => values.includes(entry));
}

export function matchesDocsSearchQuery(doc: DocObjectSummary, query: DocsSearchQuery): boolean {
  if (query.kinds && query.kinds.length > 0 && !query.kinds.includes(doc.kind)) {
    return false;
  }
  if (query.owners && query.owners.length > 0 && !query.owners.includes(doc.owner)) {
    return false;
  }
  if (query.docTypes && query.docTypes.length > 0) {
    if (!doc.docType || !query.docTypes.includes(doc.docType)) {
      return false;
    }
  }
  if (!includesAny(doc.topics, query.topics)) {
    return false;
  }
  if (query.query && query.query.trim().length > 0) {
    const haystack = [
      doc.title,
      doc.summary ?? '',
      doc.slug,
      ...(doc.topics ?? []),
      ...(doc.tags ?? []),
      doc.docType ?? '',
    ].join(' ').toLowerCase();
    const needles = query.query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!needles.every((needle) => haystack.includes(needle))) {
      return false;
    }
  }
  return true;
}
