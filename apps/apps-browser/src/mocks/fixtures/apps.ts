import type { AppManifestDocument, ModuleDocDocument, ModuleReflectionDocument } from '../../domain/types';

export const MOCK_INVENTORY: AppManifestDocument = {
  app_id: 'inventory',
  name: 'Inventory',
  description: 'Inventory chat runtime, profiles, timeline, and confirm APIs',
  required: true,
  capabilities: ['chat', 'ws', 'timeline', 'profiles', 'confirm'],
  docs: { available: true, url: '/api/apps/inventory/docs', count: 4, version: 'v1' },
  healthy: true,
};

export const MOCK_GEPA: AppManifestDocument = {
  app_id: 'gepa',
  name: 'GEPA',
  description: 'GEPA script runner backend module',
  required: false,
  capabilities: ['script-runner', 'events', 'timeline', 'schemas', 'reflection'],
  reflection: { available: true, url: '/api/os/apps/gepa/reflection', version: 'v1' },
  docs: { available: true, url: '/api/apps/gepa/docs', count: 3, version: 'v1' },
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

export const MOCK_ARC_AGI: AppManifestDocument = {
  app_id: 'arc-agi',
  name: 'ARC-AGI',
  description: 'ARC-AGI puzzle runtime and session management',
  required: false,
  capabilities: ['runtime', 'sessions', 'timeline', 'reflection'],
  reflection: { available: true, url: '/api/os/apps/arc-agi/reflection', version: 'v1' },
  docs: { available: true, url: '/api/apps/arc-agi/docs', count: 4, version: 'v1' },
  healthy: true,
};

export const MOCK_APPS_DEFAULT: AppManifestDocument[] = [MOCK_INVENTORY, MOCK_GEPA, MOCK_ARC_AGI];

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
    title: 'Inventory Module Overview',
    doc_type: 'guide',
    topics: ['backend', 'inventory', 'onboarding'],
    summary: 'Architecture and ownership boundaries for the inventory backend module.',
    order: 1,
    content:
      '# Inventory Module Overview\n\nThe inventory backend module owns chat, websocket, timeline, profile, confirm, and documentation routes under:\n\n- `/api/apps/inventory/...`\n\nThe module delegates runtime behavior to `pkg/backendcomponent` and adds backend-host integration contracts:\n\n- `AppBackendModule`\n- `ReflectiveAppBackendModule`\n- `DocumentableAppBackendModule`\n\n## Responsibilities\n\n| Area | Description |\n|------|-------------|\n| Chat | Message handling, LLM routing |\n| Timeline | Event recording, playback |\n| Profiles | Profile CRUD, session binding |\n| Confirm | Human-in-the-loop confirmation |\n| Docs | Embedded module documentation |',
  },
  {
    module_id: 'inventory',
    slug: 'api-reference',
    title: 'Inventory API Reference',
    doc_type: 'reference',
    topics: ['backend', 'api', 'inventory'],
    summary: 'Route contracts, payloads, and error behavior for inventory.',
    see_also: ['inventory/overview', 'gepa/api-reference'],
    order: 2,
    content:
      '# Inventory API Reference\n\n## Endpoints\n\n### GET /api/apps/inventory/chat\n\nWebSocket endpoint for chat messages.\n\n### GET /api/apps/inventory/timeline\n\nReturns timeline entries for the current session.\n\n### GET /api/apps/inventory/profiles\n\nReturns all saved profiles.\n\n### POST /api/apps/inventory/profiles\n\nCreates a new profile.',
  },
  {
    module_id: 'inventory',
    slug: 'profiles-and-runtime',
    title: 'Profiles and Runtime',
    doc_type: 'guide',
    topics: ['backend', 'profiles'],
    summary: 'Profile loading, session binding, and runtime configuration.',
    see_also: ['inventory/overview'],
    order: 3,
    content:
      '# Profiles and Runtime\n\n## Profile Lifecycle\n\nProfiles are loaded at startup from the embedded store. Each profile contains:\n\n- Name and description\n- LLM configuration (model, temperature, system prompt)\n- Feature flags\n\n## Session Binding\n\nWhen a user starts a chat session, a profile is bound to it. The profile determines which LLM backend is used and what system prompts are injected.',
  },
  {
    module_id: 'inventory',
    slug: 'troubleshooting',
    title: 'Inventory Troubleshooting',
    doc_type: 'troubleshooting',
    topics: ['backend', 'troubleshooting'],
    summary: 'Common errors, debugging, and recovery procedures for inventory.',
    see_also: ['inventory/overview', 'inventory/api-reference'],
    order: 4,
    content:
      '# Inventory Troubleshooting\n\n## Common Issues\n\n### Chat endpoint returns 502\n\nThis usually means the LLM backend is unreachable. Check:\n\n1. Backend process is running\n2. Network connectivity to the LLM provider\n3. API key configuration\n\n### Profiles not loading\n\nEnsure the embedded profile store has valid YAML frontmatter.',
  },
];

export const MOCK_GEPA_DOCS: ModuleDocDocument[] = [
  {
    module_id: 'gepa',
    slug: 'overview',
    title: 'GEPA Module Overview',
    doc_type: 'guide',
    topics: ['backend', 'onboarding'],
    summary: 'High-level architecture and ownership boundaries for the GEPA module.',
    order: 1,
    content:
      '# GEPA Module Overview\n\nThe GEPA backend module manages script execution, event streaming, and timeline recording under:\n\n- `/api/apps/gepa/...`\n\n## Core Responsibilities\n\n- Script discovery and execution\n- Server-sent event streaming\n- Timeline entry management\n- Schema discovery and documentation',
  },
  {
    module_id: 'gepa',
    slug: 'api-reference',
    title: 'GEPA API Reference',
    doc_type: 'reference',
    topics: ['backend', 'api'],
    summary: 'Route contracts, payloads, and error behavior for the GEPA module.',
    see_also: ['gepa/overview', 'inventory/api-reference'],
    order: 2,
    content:
      '# GEPA API Reference\n\n## Endpoints\n\n### GET /api/apps/gepa/scripts\n\nList all available scripts.\n\n### POST /api/apps/gepa/run\n\nExecute a named script with arguments.\n\n### GET /api/apps/gepa/events\n\nServer-sent event stream for real-time updates.',
  },
  {
    module_id: 'gepa',
    slug: 'scripts-and-runs',
    title: 'Scripts and Runs',
    doc_type: 'guide',
    topics: ['backend', 'scripts'],
    summary: 'How scripts are discovered, validated, and executed in GEPA.',
    see_also: ['gepa/overview', 'gepa/api-reference'],
    order: 3,
    content:
      '# Scripts and Runs\n\n## Script Discovery\n\nScripts are loaded from the configured script directory at startup. Each script is a YAML file with metadata and a sequence of steps.\n\n## Execution Model\n\nWhen a script is run, GEPA creates a Run object that tracks:\n\n- Start time and duration\n- Step-by-step progress\n- Output and error streams\n- Final status (success, failure, cancelled)',
  },
];

export const MOCK_ARC_AGI_DOCS: ModuleDocDocument[] = [
  {
    module_id: 'arc-agi',
    slug: 'overview',
    title: 'ARC-AGI Module Overview',
    doc_type: 'guide',
    topics: ['backend', 'onboarding', 'runtime'],
    summary: 'High-level architecture and ownership boundaries for the ARC backend module.',
    order: 1,
    content:
      '# ARC-AGI Module Overview\n\nThe ARC backend module manages runtime lifecycle and proxies ARC gameplay APIs under:\n\n- `/api/apps/arc-agi/...`\n\n## Core Responsibilities\n\n- Runtime driver lifecycle (`Init`, `Start`, `Stop`, `Health`)\n- Session and event timeline management\n- Schema + reflection metadata exposure\n- Module docs endpoints',
  },
  {
    module_id: 'arc-agi',
    slug: 'api-reference',
    title: 'ARC-AGI API Reference',
    doc_type: 'reference',
    topics: ['backend', 'api'],
    summary: 'Route contracts, payloads, and error behavior for the ARC module.',
    see_also: ['arc-agi/overview', 'inventory/api-reference'],
    order: 2,
    content:
      '# ARC-AGI API Reference\n\n## Endpoints\n\n### GET /api/apps/arc-agi/puzzles\n\nList available ARC puzzles.\n\n### POST /api/apps/arc-agi/sessions\n\nCreate a new puzzle-solving session.\n\n### GET /api/apps/arc-agi/sessions/:id\n\nGet session state and progress.',
  },
  {
    module_id: 'arc-agi',
    slug: 'runtime-modes',
    title: 'Runtime Modes',
    doc_type: 'guide',
    topics: ['backend', 'runtime'],
    summary: 'Runtime driver modes, initialization sequence, and health checking.',
    see_also: ['arc-agi/overview', 'arc-agi/session-lifecycle'],
    order: 3,
    content:
      '# Runtime Modes\n\n## Driver Lifecycle\n\nThe ARC runtime driver supports three modes:\n\n1. **Standalone** — single process, embedded puzzle store\n2. **Proxied** — delegates to external ARC runtime via gRPC\n3. **Mock** — in-memory puzzle store for testing\n\n## Initialization Sequence\n\n1. Load configuration\n2. Initialize driver in selected mode\n3. Verify health\n4. Register with backend host',
  },
  {
    module_id: 'arc-agi',
    slug: 'session-lifecycle',
    title: 'Session Lifecycle',
    doc_type: 'guide',
    topics: ['backend', 'sessions'],
    summary: 'Session creation, state machine transitions, and cleanup behavior.',
    see_also: ['arc-agi/overview', 'arc-agi/runtime-modes'],
    order: 4,
    content:
      '# Session Lifecycle\n\n## State Machine\n\nEach ARC session progresses through these states:\n\n```\ncreated → active → (solving | paused) → completed | abandoned\n```\n\n## Cleanup\n\nSessions are cleaned up after a configurable idle timeout (default: 30 minutes). Abandoned sessions release all held resources.',
  },
];
