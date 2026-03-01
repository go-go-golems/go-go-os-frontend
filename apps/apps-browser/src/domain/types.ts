// --- API response types (match live /api/os/apps payloads) ---

export interface AppsManifestResponse {
  apps: AppManifestDocument[];
}

export interface AppManifestDocument {
  app_id: string;
  name: string;
  description?: string;
  required: boolean;
  capabilities?: string[];
  reflection?: {
    available: boolean;
    url?: string;
    version?: string;
  };
  docs?: AppManifestDocsHint;
  healthy: boolean;
  health_error?: string;
}

export interface AppManifestDocsHint {
  available: boolean;
  url?: string;
  count?: number;
  version?: string;
}

// --- Reflection response (GET /api/os/apps/{id}/reflection) ---

export interface ModuleReflectionDocument {
  app_id: string;
  name: string;
  version?: string;
  summary?: string;
  capabilities?: ReflectionCapability[];
  docs?: ReflectionDocLink[];
  apis?: ReflectionAPI[];
  schemas?: ReflectionSchemaRef[];
}

export interface ReflectionCapability {
  id: string;
  stability?: string;
  description?: string;
}

export interface ReflectionDocLink {
  id: string;
  title: string;
  url?: string;
  path?: string;
  description?: string;
}

export interface ReflectionAPI {
  id: string;
  method: string;
  path: string;
  summary?: string;
  request_schema?: string;
  response_schema?: string;
  error_schema?: string;
  tags?: string[];
}

export interface ReflectionSchemaRef {
  id: string;
  format: string;
  uri?: string;
  embedded?: unknown;
}

// --- Reflection response with unsupported sentinel ---

export type ReflectionResult =
  | (ModuleReflectionDocument & { _unsupported?: false })
  | { _unsupported: true; app_id: string };

// --- Module docs response (GET /api/apps/{id}/docs and /docs/{slug}) ---

export interface ModuleDocsTOCResponse {
  module_id: string;
  docs: ModuleDocDocument[];
}

export interface ModuleDocDocument {
  module_id: string;
  slug: string;
  title: string;
  doc_type: string;
  topics?: string[];
  summary?: string;
  see_also?: string[];
  order?: number;
  content?: string;
}

// --- Aggregated docs response (GET /api/os/docs) ---

export interface OSDocsResponse {
  total: number;
  results: OSDocResult[];
  facets: {
    topics: OSDocFacet[];
    doc_types: OSDocFacet[];
    modules: OSDocModuleFacet[];
  };
}

export interface OSDocResult {
  module_id: string;
  slug: string;
  title: string;
  doc_type: string;
  topics?: string[];
  summary?: string;
  url: string;
}

export interface OSDocFacet {
  slug: string;
  count: number;
}

export interface OSDocModuleFacet {
  id: string;
  count: number;
}

export interface OSDocsQuery {
  query?: string;
  topics?: string[];
  doc_type?: string[];
  module?: string[];
}
