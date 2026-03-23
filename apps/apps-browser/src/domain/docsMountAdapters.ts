import type {
  AppManifestDocument,
  ModuleDocDocument,
  ModuleDocsTOCResponse,
} from './types';
import {
  buildDocObjectPath,
  buildDocsMountPath,
  type DocObject,
  type DocObjectSummary,
  type DocsMount,
  type DocsMountPath,
  type DocsSearchQuery,
  matchesDocsSearchQuery,
} from './docsObjects';

interface FetchLikeResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

export type FetchLike = (input: string, init?: RequestInit) => Promise<FetchLikeResponse>;

export interface VmmetaSymbolDoc {
  name: string;
  summary?: string;
  prose?: string;
  tags?: readonly string[];
  related?: readonly string[];
  source_file?: string;
  line?: number;
}

export interface VmmetaPackageDoc {
  name: string;
  title?: string;
  category?: string;
  version?: string;
  description?: string;
  prose?: string;
  source_file?: string;
}

export interface VmmetaDocFile {
  package?: VmmetaPackageDoc;
  symbols?: readonly VmmetaSymbolDoc[];
  file_path?: string;
}

export interface VmmetaCardMeta {
  id: string;
  packId: string;
  title?: string;
  icon?: string;
  source?: string;
  sourceFile?: string;
}

export interface VmmetaMetadata {
  packId: string;
  cards?: readonly VmmetaCardMeta[];
  docs?: {
    files?: readonly VmmetaDocFile[];
  };
}

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1';
}

export function defaultFetchLike(input: string, init?: RequestInit) {
  return fetch(new URL(input, resolveApiBaseUrl()).toString(), init);
}

async function fetchJson<T>(fetcher: FetchLike, path: string): Promise<T> {
  const response = await fetcher(path);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Docs fetch failed for ${path}: ${response.status} ${message}`.trim());
  }
  return response.json() as Promise<T>;
}

function moduleDocToSummary(moduleId: string, doc: ModuleDocDocument): DocObjectSummary {
  return {
    path: buildDocObjectPath('module', moduleId, doc.slug),
    mountPath: buildDocsMountPath('module', moduleId),
    kind: 'module',
    owner: moduleId,
    slug: doc.slug,
    title: doc.title,
    summary: doc.summary,
    docType: doc.doc_type,
    order: doc.order,
    topics: doc.topics ?? [],
  };
}

export function createModuleDocsMount(moduleId: string, fetcher: FetchLike = defaultFetchLike): DocsMount {
  const mountPath = buildDocsMountPath('module', moduleId);
  return {
    mountPath: () => mountPath,
    async list() {
      const response = await fetchJson<ModuleDocsTOCResponse>(fetcher, `/api/apps/${moduleId}/docs`);
      return (response.docs ?? []).map((doc) => moduleDocToSummary(moduleId, doc));
    },
    async read(subpath) {
      const slug = subpath[0];
      if (!slug) {
        return null;
      }
      const doc = await fetchJson<ModuleDocDocument>(fetcher, `/api/apps/${moduleId}/docs/${encodeURIComponent(slug)}`);
      return {
        ...moduleDocToSummary(moduleId, doc),
        content: doc.content,
        seeAlso: doc.see_also ?? [],
      };
    },
  };
}

export function createHelpDocsMount(owner = 'wesen-os', fetcher: FetchLike = defaultFetchLike): DocsMount {
  const mountPath = buildDocsMountPath('help', owner);
  return {
    mountPath: () => mountPath,
    async list() {
      const response = await fetchJson<ModuleDocsTOCResponse>(fetcher, '/api/os/help');
      return (response.docs ?? []).map((doc) => ({
        path: buildDocObjectPath('help', owner, doc.slug),
        mountPath,
        kind: 'help',
        owner,
        slug: doc.slug,
        title: doc.title,
        summary: doc.summary,
        docType: doc.doc_type,
        order: doc.order,
        topics: doc.topics ?? [],
      }));
    },
    async read(subpath) {
      const slug = subpath[0];
      if (!slug) {
        return null;
      }
      const doc = await fetchJson<ModuleDocDocument>(fetcher, `/api/os/help/${encodeURIComponent(slug)}`);
      return {
        path: buildDocObjectPath('help', owner, doc.slug),
        mountPath,
        kind: 'help',
        owner,
        slug: doc.slug,
        title: doc.title,
        summary: doc.summary,
        docType: doc.doc_type,
        order: doc.order,
        topics: doc.topics ?? [],
        content: doc.content,
        seeAlso: doc.see_also ?? [],
      };
    },
  };
}

function normalizeVmmetaSurfaceTypeSlug(pack: VmmetaPackageDoc): string {
  return 'overview';
}

function surfaceTypeDocToObject(surfaceTypeId: string, pack: VmmetaPackageDoc, mountPath: DocsMountPath): DocObject {
  return {
    path: buildDocObjectPath('surface-type', surfaceTypeId, normalizeVmmetaSurfaceTypeSlug(pack)),
    mountPath,
    kind: 'surface-type',
    owner: surfaceTypeId,
    slug: normalizeVmmetaSurfaceTypeSlug(pack),
    title: pack.title ?? pack.name,
    summary: pack.description,
    docType: pack.category ?? 'reference',
    tags: pack.version ? [pack.version] : [],
    content: pack.prose,
  };
}

function symbolDocToObject(kind: 'surface-type' | 'surface', owner: string, symbol: VmmetaSymbolDoc, mountPath: DocsMountPath): DocObject {
  return {
    path: buildDocObjectPath(kind, owner, symbol.name),
    mountPath,
    kind,
    owner,
    slug: symbol.name,
    title: symbol.name,
    summary: symbol.summary,
    docType: kind === 'surface-type' ? 'reference' : 'example',
    tags: symbol.tags ? [...symbol.tags] : [],
    content: symbol.prose,
    seeAlso: symbol.related ? [...symbol.related] : [],
  };
}

export function createVmmetaSurfaceTypeDocsMount(metadata: VmmetaMetadata): DocsMount {
  const mountPath = buildDocsMountPath('surface-type', metadata.packId);

  function collectSurfaceTypeDocs(): DocObject[] {
    const docs: DocObject[] = [];
    for (const file of metadata.docs?.files ?? []) {
      if (file.package?.name === metadata.packId) {
        docs.push(surfaceTypeDocToObject(metadata.packId, file.package, mountPath));
      }
      for (const symbol of file.symbols ?? []) {
        if (symbol.name.startsWith('widgets.')) {
          docs.push(symbolDocToObject('surface-type', metadata.packId, symbol, mountPath));
        }
      }
    }
    return docs;
  }

  return {
    mountPath: () => mountPath,
    async list() {
      return collectSurfaceTypeDocs();
    },
    async read(subpath) {
      const slug = subpath[0];
      if (!slug) {
        return null;
      }
      return collectSurfaceTypeDocs().find((doc) => doc.slug === slug) ?? null;
    },
    async search(query: DocsSearchQuery) {
      return collectSurfaceTypeDocs().filter((doc) => matchesDocsSearchQuery(doc, query));
    },
  };
}

export function createVmmetaSurfaceDocsMount(owner: string, metadata: VmmetaMetadata): DocsMount {
  const mountPath = buildDocsMountPath('surface', owner);
  const surfacesById = new Map((metadata.cards ?? []).map((surface) => [surface.id, surface]));

  function collectSurfaceDocs(): DocObject[] {
    const docs: DocObject[] = [];
    for (const file of metadata.docs?.files ?? []) {
      for (const symbol of file.symbols ?? []) {
        const surface = surfacesById.get(symbol.name);
        if (!surface) {
          continue;
        }
        docs.push({
          ...symbolDocToObject('surface', owner, symbol, mountPath),
          title: surface.title ?? symbol.name,
          summary: symbol.summary,
          tags: [...(symbol.tags ?? []), surface.packId],
        });
      }
    }
    return docs;
  }

  return {
    mountPath: () => mountPath,
    async list() {
      return collectSurfaceDocs();
    },
    async read(subpath) {
      const slug = subpath[0];
      if (!slug) {
        return null;
      }
      const surfaceDoc = collectSurfaceDocs().find((doc) => doc.slug === slug);
      if (!surfaceDoc) {
        return null;
      }
      const surfaceMeta = surfacesById.get(slug);
      return {
        ...surfaceDoc,
        content: [surfaceDoc.content, surfaceMeta?.source ? `\n\n## Source\n\n\`\`\`js\n${surfaceMeta.source}\n\`\`\`\n` : '']
          .filter(Boolean)
          .join(''),
      };
    },
    async search(query: DocsSearchQuery) {
      return collectSurfaceDocs().filter((doc) => matchesDocsSearchQuery(doc, query));
    },
  };
}

export async function registerDefaultDocsMounts(
  register: (mount: DocsMount) => void,
  fetcher: FetchLike = defaultFetchLike,
): Promise<void> {
  const response = await fetchJson<{ apps?: AppManifestDocument[] }>(fetcher, '/api/os/apps');
  for (const app of response.apps ?? []) {
    if (app.docs?.available) {
      register(createModuleDocsMount(app.app_id, fetcher));
    }
  }
  register(createHelpDocsMount('wesen-os', fetcher));
}
