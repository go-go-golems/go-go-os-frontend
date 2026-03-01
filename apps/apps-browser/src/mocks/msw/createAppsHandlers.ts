import { HttpResponse, http } from 'msw';
import type { AppManifestDocument, ModuleDocDocument, ModuleReflectionDocument } from '../../domain/types';

export interface AppsHandlerData {
  apps: AppManifestDocument[];
  reflections: Record<string, ModuleReflectionDocument>;
  unsupportedReflection: string[];
  docsByApp: Record<string, ModuleDocDocument[]>;
  docsEndpointErrors: string[];
}

export interface CreateAppsHandlersOptions {
  data: AppsHandlerData;
  delayMs?: number;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tocFromDocs(moduleID: string, docs: ModuleDocDocument[]) {
  return {
    module_id: moduleID,
    docs: docs.map((entry) => ({
      ...entry,
      content: undefined,
    })),
  };
}

function csvToSet(raw: string | null): Set<string> | null {
  if (!raw) return null;
  const values = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

export function createAppsHandlers(options: CreateAppsHandlersOptions) {
  const { data, delayMs = 0 } = options;

  return [
    http.get('/api/os/apps', async () => {
      if (delayMs > 0) await wait(delayMs);
      return HttpResponse.json({ apps: data.apps });
    }),

    http.get('/api/os/apps/:appId/reflection', async ({ params }) => {
      if (delayMs > 0) await wait(delayMs);
      const appId = String(params.appId);

      if (!data.apps.some((a) => a.app_id === appId)) {
        return HttpResponse.text('app not found', { status: 404 });
      }

      if (data.unsupportedReflection.includes(appId)) {
        return HttpResponse.text('reflection not implemented', { status: 501 });
      }

      const doc = data.reflections[appId];
      if (!doc) {
        return HttpResponse.text('reflection not implemented', { status: 501 });
      }
      return HttpResponse.json(doc);
    }),

    http.get('/api/apps/:appId/docs', async ({ params }) => {
      if (delayMs > 0) await wait(delayMs);
      const appId = String(params.appId);

      if (!data.apps.some((a) => a.app_id === appId)) {
        return HttpResponse.text('app not found', { status: 404 });
      }

      if (data.docsEndpointErrors.includes(appId)) {
        return HttpResponse.text('docs endpoint failed', { status: 500 });
      }

      const docs = data.docsByApp[appId] ?? [];
      return HttpResponse.json(tocFromDocs(appId, docs));
    }),

    http.get('/api/apps/:appId/docs/:slug', async ({ params }) => {
      if (delayMs > 0) await wait(delayMs);
      const appId = String(params.appId);
      const slug = String(params.slug);

      if (!data.apps.some((a) => a.app_id === appId)) {
        return HttpResponse.text('app not found', { status: 404 });
      }

      if (data.docsEndpointErrors.includes(appId)) {
        return HttpResponse.text('docs endpoint failed', { status: 500 });
      }

      const docs = data.docsByApp[appId] ?? [];
      const match = docs.find((entry) => entry.slug === slug);
      if (!match) {
        return HttpResponse.text('doc not found', { status: 404 });
      }
      return HttpResponse.json(match);
    }),

    // Aggregate docs endpoint (mirrors wesen-os/cmd/wesen-os-launcher/docs_endpoint.go)
    http.get('/api/os/docs', async ({ request }) => {
      if (delayMs > 0) await wait(delayMs);

      const url = new URL(request.url);
      const query = (url.searchParams.get('query') ?? '').trim().toLowerCase();
      const moduleFilter = csvToSet(url.searchParams.get('module'));
      const docTypeFilter = csvToSet(url.searchParams.get('doc_type'));
      const topicFilter = csvToSet(url.searchParams.get('topics'));

      type DocResult = {
        module_id: string;
        slug: string;
        title: string;
        doc_type: string;
        topics?: string[];
        summary?: string;
        url: string;
      };

      const results: DocResult[] = [];

      for (const app of data.apps) {
        if (!app.docs?.available) continue;
        const moduleId = app.app_id;
        if (moduleFilter && !moduleFilter.has(moduleId.toLowerCase())) continue;

        const docs = data.docsByApp[moduleId] ?? [];
        for (const doc of docs) {
          if (docTypeFilter && !docTypeFilter.has(doc.doc_type.toLowerCase())) continue;
          if (topicFilter) {
            const docTopics = doc.topics ?? [];
            if (!docTopics.some((t) => topicFilter.has(t.toLowerCase()))) continue;
          }
          if (query) {
            const haystack = [doc.title, doc.summary ?? '', doc.slug, moduleId].join('\n').toLowerCase();
            if (!haystack.includes(query)) continue;
          }
          results.push({
            module_id: moduleId,
            slug: doc.slug,
            title: doc.title,
            doc_type: doc.doc_type,
            topics: doc.topics,
            summary: doc.summary,
            url: `/api/apps/${moduleId}/docs/${doc.slug}`,
          });
        }
      }

      results.sort((a, b) => {
        if (a.module_id !== b.module_id) return a.module_id.localeCompare(b.module_id);
        return a.slug.localeCompare(b.slug);
      });

      // Build facets
      const topicCounts: Record<string, number> = {};
      const docTypeCounts: Record<string, number> = {};
      const moduleCounts: Record<string, number> = {};

      for (const r of results) {
        for (const t of r.topics ?? []) {
          topicCounts[t.toLowerCase()] = (topicCounts[t.toLowerCase()] ?? 0) + 1;
        }
        docTypeCounts[r.doc_type.toLowerCase()] = (docTypeCounts[r.doc_type.toLowerCase()] ?? 0) + 1;
        moduleCounts[r.module_id.toLowerCase()] = (moduleCounts[r.module_id.toLowerCase()] ?? 0) + 1;
      }

      return HttpResponse.json({
        total: results.length,
        results,
        facets: {
          topics: Object.entries(topicCounts)
            .map(([slug, count]) => ({ slug, count }))
            .sort((a, b) => a.slug.localeCompare(b.slug)),
          doc_types: Object.entries(docTypeCounts)
            .map(([slug, count]) => ({ slug, count }))
            .sort((a, b) => a.slug.localeCompare(b.slug)),
          modules: Object.entries(moduleCounts)
            .map(([id, count]) => ({ id, count }))
            .sort((a, b) => a.id.localeCompare(b.id)),
        },
      });
    }),
  ];
}
