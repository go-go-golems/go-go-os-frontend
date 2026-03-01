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
  ];
}
