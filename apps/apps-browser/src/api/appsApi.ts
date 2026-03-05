import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  AppsManifestResponse,
  ModuleDocDocument,
  ModuleDocsTOCResponse,
  ModuleReflectionDocument,
  OSDocsQuery,
  OSDocsResponse,
  ReflectionResult,
} from '../domain/types';

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1';
}

function toCSV(values?: string[]): string | undefined {
  if (!values || values.length === 0) {
    return undefined;
  }
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .join(',');
}

function buildOSDocsPath(query?: OSDocsQuery): string {
  if (!query) {
    return '/api/os/docs';
  }
  const params = new URLSearchParams();
  if (query.query?.trim()) {
    params.set('query', query.query.trim());
  }
  const topics = toCSV(query.topics);
  if (topics) {
    params.set('topics', topics);
  }
  const docTypes = toCSV(query.doc_type);
  if (docTypes) {
    params.set('doc_type', docTypes);
  }
  const modules = toCSV(query.module);
  if (modules) {
    params.set('module', modules);
  }
  const raw = params.toString();
  return raw ? `/api/os/docs?${raw}` : '/api/os/docs';
}

export const appsApi = createApi({
  reducerPath: 'appsApi',
  baseQuery: fetchBaseQuery({ baseUrl: resolveApiBaseUrl() }),
  tagTypes: ['AppsList', 'Reflection', 'DocsTOC', 'DocsPage', 'OSDocs', 'HelpDocs', 'HelpPage'],
  endpoints: (builder) => ({
    getApps: builder.query<import('../domain/types').AppManifestDocument[], void>({
      query: () => '/api/os/apps',
      providesTags: ['AppsList'],
      transformResponse: (response: AppsManifestResponse) => response.apps ?? [],
    }),

    getReflection: builder.query<ReflectionResult, string>({
      query: (appId) => ({
        url: `/api/os/apps/${appId}/reflection`,
        validateStatus: (response) => response.status === 200 || response.status === 501,
      }),
      providesTags: (_result, _error, appId) => [{ type: 'Reflection', id: appId }],
      transformResponse: (response: ModuleReflectionDocument | string, meta, appId): ReflectionResult => {
        const status = (meta as { response?: { status: number } })?.response?.status;
        if (status === 501) {
          return { _unsupported: true, app_id: appId };
        }
        return response as ModuleReflectionDocument;
      },
    }),

    getModuleDocs: builder.query<ModuleDocsTOCResponse, string>({
      query: (appId) => `/api/apps/${appId}/docs`,
      providesTags: (_result, _error, appId) => [{ type: 'DocsTOC', id: appId }],
      transformResponse: (response: ModuleDocsTOCResponse): ModuleDocsTOCResponse => ({
        module_id: response.module_id,
        docs: response.docs ?? [],
      }),
    }),

    getModuleDoc: builder.query<ModuleDocDocument, { appId: string; slug: string }>({
      query: ({ appId, slug }) => `/api/apps/${appId}/docs/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, arg) => [{ type: 'DocsPage', id: `${arg.appId}:${arg.slug}` }],
    }),

    getOSDocs: builder.query<OSDocsResponse, OSDocsQuery | undefined>({
      query: (query) => buildOSDocsPath(query),
      providesTags: ['OSDocs'],
      transformResponse: (response: OSDocsResponse): OSDocsResponse => ({
        total: response.total ?? 0,
        results: response.results ?? [],
        facets: {
          topics: response.facets?.topics ?? [],
          doc_types: response.facets?.doc_types ?? [],
          modules: response.facets?.modules ?? [],
        },
      }),
    }),

    getHelpDocs: builder.query<ModuleDocsTOCResponse, void>({
      query: () => '/api/os/help',
      providesTags: ['HelpDocs'],
      transformResponse: (response: ModuleDocsTOCResponse): ModuleDocsTOCResponse => ({
        module_id: response.module_id,
        docs: response.docs ?? [],
      }),
    }),

    getHelpDoc: builder.query<ModuleDocDocument, string>({
      query: (slug) => `/api/os/help/${encodeURIComponent(slug)}`,
      providesTags: (_result, _error, slug) => [{ type: 'HelpPage', id: slug }],
    }),

    getSchemaDocument: builder.query<unknown, string>({
      query: (schemaUrl) => ({
        url: schemaUrl,
        responseHandler: async (response) => {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            return response.json();
          }
          return response.text();
        },
      }),
    }),
  }),
});

export const {
  useGetAppsQuery,
  useGetReflectionQuery,
  useGetModuleDocsQuery,
  useGetModuleDocQuery,
  useLazyGetModuleDocQuery,
  useGetOSDocsQuery,
  useGetHelpDocsQuery,
  useGetHelpDocQuery,
  useLazyGetSchemaDocumentQuery,
} = appsApi;
