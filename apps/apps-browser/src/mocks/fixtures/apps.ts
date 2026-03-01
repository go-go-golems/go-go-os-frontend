import type { AppManifestDocument, ModuleDocDocument, ModuleReflectionDocument } from '../../domain/types';

export const MOCK_INVENTORY: AppManifestDocument = {
  app_id: 'inventory',
  name: 'Inventory',
  description: 'Inventory chat runtime, profiles, timeline, and confirm APIs',
  required: true,
  capabilities: ['chat', 'ws', 'timeline', 'profiles', 'confirm'],
  docs: { available: true, url: '/api/apps/inventory/docs', count: 2, version: 'v1' },
  healthy: true,
};

export const MOCK_GEPA: AppManifestDocument = {
  app_id: 'gepa',
  name: 'GEPA',
  description: 'GEPA script runner backend module',
  required: false,
  capabilities: ['script-runner', 'events', 'timeline', 'schemas', 'reflection'],
  reflection: { available: true, url: '/api/os/apps/gepa/reflection', version: 'v1' },
  docs: { available: true, url: '/api/apps/gepa/docs', count: 2, version: 'v1' },
  healthy: true,
};

export const MOCK_INVENTORY_UNHEALTHY: AppManifestDocument = {
  ...MOCK_INVENTORY,
  healthy: false,
  health_error: 'database connection pool exhausted: dial tcp 127.0.0.1:5432: connect: connection refused',
};

export const MOCK_AUTH: AppManifestDocument = {
  app_id: 'auth',
  name: 'Auth',
  description: 'Authentication and session management',
  required: true,
  capabilities: ['auth', 'sessions'],
  healthy: false,
  health_error: 'dial tcp 127.0.0.1:6379: connection refused',
};

export const MOCK_BILLING: AppManifestDocument = {
  app_id: 'billing',
  name: 'Billing',
  description: 'Billing and subscription management',
  required: true,
  capabilities: ['billing', 'subscriptions'],
  healthy: true,
};

export const MOCK_SCHEDULER: AppManifestDocument = {
  app_id: 'scheduler',
  name: 'Scheduler',
  description: 'Task scheduling and cron management',
  required: false,
  capabilities: ['scheduling', 'cron', 'reflection'],
  reflection: { available: true, url: '/api/os/apps/scheduler/reflection', version: 'v1' },
  healthy: true,
};

export const MOCK_TELEMETRY: AppManifestDocument = {
  app_id: 'telemetry',
  name: 'Telemetry',
  description: 'Metrics and observability',
  required: false,
  capabilities: ['metrics', 'traces'],
  healthy: true,
};

export const MOCK_APPS_DEFAULT: AppManifestDocument[] = [MOCK_INVENTORY, MOCK_GEPA];

export const MOCK_APPS_MANY: AppManifestDocument[] = [
  MOCK_AUTH,
  MOCK_INVENTORY,
  MOCK_BILLING,
  MOCK_GEPA,
  MOCK_SCHEDULER,
  MOCK_TELEMETRY,
];

export const MOCK_GEPA_REFLECTION: ModuleReflectionDocument = {
  app_id: 'gepa',
  name: 'GEPA',
  version: 'v1',
  summary: 'GEPA script runner backend module',
  capabilities: [
    { id: 'script-runner', stability: 'stable', description: 'Execute named scripts' },
    { id: 'events', stability: 'stable', description: 'Server-sent event stream' },
    { id: 'timeline', stability: 'stable', description: 'Timeline entry management' },
    { id: 'schemas', stability: 'beta', description: 'Schema discovery and documentation' },
  ],
  apis: [
    { id: 'list-scripts', method: 'GET', path: '/scripts', summary: 'List local scripts', tags: ['script-runner'] },
    {
      id: 'run-script',
      method: 'POST',
      path: '/run',
      summary: 'Execute a script',
      request_schema: 'run-request',
      response_schema: 'run-response',
      tags: ['script-runner'],
    },
    { id: 'events', method: 'GET', path: '/events', summary: 'Event stream', tags: ['events'] },
    { id: 'get-schema', method: 'GET', path: '/schemas/{id}', summary: 'Schema doc', tags: ['schemas'] },
    { id: 'timeline', method: 'GET', path: '/timeline', summary: 'Timeline entries', tags: ['timeline'] },
  ],
  schemas: [
    { id: 'run-request', format: 'json-schema', uri: '/api/apps/gepa/schemas/run-request' },
    { id: 'run-response', format: 'json-schema', uri: '/api/apps/gepa/schemas/run-response' },
    { id: 'script-def', format: 'json-schema', uri: '/api/apps/gepa/schemas/script-def' },
    { id: 'event-entry', format: 'json-schema', uri: '/api/apps/gepa/schemas/event-entry' },
  ],
};

export const MOCK_RUN_REQUEST_SCHEMA = {
  type: 'object',
  properties: {
    script_name: { type: 'string' },
    args: { type: 'object' },
    timeout_ms: { type: 'integer' },
  },
  required: ['script_name'],
};

export const MOCK_INVENTORY_DOCS: ModuleDocDocument[] = [
  {
    module_id: 'inventory',
    slug: 'overview',
    title: 'Inventory Overview',
    doc_type: 'overview',
    topics: ['inventory', 'chat'],
    summary: 'High-level component and route overview for inventory backend.',
    order: 10,
    content: '# Inventory Overview\n\nInventory module docs.',
  },
  {
    module_id: 'inventory',
    slug: 'api-reference',
    title: 'Inventory API Reference',
    doc_type: 'api-reference',
    topics: ['inventory', 'api'],
    summary: 'HTTP and websocket endpoint contract for inventory.',
    order: 20,
    content: '# Inventory API Reference\n\nList of endpoints.',
  },
];

export const MOCK_GEPA_DOCS: ModuleDocDocument[] = [
  {
    module_id: 'gepa',
    slug: 'overview',
    title: 'GEPA Overview',
    doc_type: 'overview',
    topics: ['gepa', 'scripts'],
    summary: 'Execution model, lifecycle, and script ownership.',
    order: 10,
    content: '# GEPA Overview\n\nGEPA module docs.',
  },
  {
    module_id: 'gepa',
    slug: 'scripts-and-runs',
    title: 'Scripts And Runs',
    doc_type: 'guide',
    topics: ['gepa', 'scripts'],
    summary: 'How scripts are discovered and executed.',
    order: 20,
    content: '# Scripts And Runs\n\nRun model and events.',
  },
];
