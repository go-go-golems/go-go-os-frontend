import type { LogEntry, LogLevel } from './types';

const SERVICES = [
  'api-gateway',
  'auth-service',
  'db-primary',
  'db-replica',
  'cache-redis',
  'worker-queue',
  'scheduler',
  'web-frontend',
  'notification-svc',
  'billing-engine',
];

const MESSAGES: Record<LogLevel, string[]> = {
  TRACE: [
    'Entering function processRequest()',
    'Variable state: {connected: true, retries: 0}',
    'Socket keepalive ping sent',
    'GC pause: 2.3ms',
    'Thread pool utilization: 34%',
    'DNS lookup cached for api.internal',
  ],
  DEBUG: [
    'Request payload size: 2.4KB',
    'Cache lookup key: usr_8f3a2b',
    'Connection pool stats: active=12, idle=38, max=50',
    'Middleware chain: [cors, auth, rateLimit, handler]',
    'Query plan: sequential scan on idx_users_email',
    'JWT token decoded, sub: usr_8f3a2b, exp: 1709251200',
  ],
  INFO: [
    'Server started on port 8080',
    'Request completed: GET /api/v2/users 200 OK (43ms)',
    'Database migration applied: v42_add_indexes',
    'New WebSocket connection established from 10.0.3.47',
    'Background job scheduled: report_generation #4482',
    'TLS certificate renewed, expires 2026-06-15',
    'Health check passed: all dependencies healthy',
    'Batch processed: 1,247 records in 3.2s',
    'User login successful: admin@acme.corp',
    'Deployment v2.14.3 rolling out to cluster-east',
  ],
  WARN: [
    'Response time exceeded threshold: 2,340ms > 2,000ms',
    'Memory usage at 78% of allocated limit',
    'Rate limit approaching: 890/1000 requests for client_x9f2',
    'Deprecated API endpoint called: /api/v1/legacy/users',
    'Connection pool nearing capacity: 47/50 active',
    'Disk usage on /var/log at 85%',
    'Certificate expiring in 14 days',
    'Retry attempt 2/3 for upstream service call',
  ],
  ERROR: [
    'Failed to connect to database: ETIMEDOUT after 30000ms',
    'Unhandled rejection in request handler: TypeError',
    'Authentication failed: invalid signature on JWT token',
    'S3 upload failed: AccessDenied for bucket prod-assets',
    'Request failed: POST /api/v2/payments 500 Internal Server Error',
    'Circuit breaker OPEN for billing-engine (5 failures in 60s)',
    'Out of memory: heap allocation failed (requested 64MB)',
  ],
  FATAL: [
    'PANIC: unrecoverable state in transaction manager',
    'Kernel OOM killer invoked, process terminated',
    'Data corruption detected in WAL segment 000000010000000A',
    'Split-brain detected in cluster consensus',
  ],
};

const STACK_TRACE = `  at processRequest (src/handlers/api.ts:142:15)
  at Router.handle (node_modules/express/lib/router/index.js:275:10)
  at Layer.handle (node_modules/express/lib/router/layer.js:95:5)
  at middleware (src/middleware/auth.ts:28:9)
  at Object.dispatch (src/core/dispatcher.ts:67:22)
  at Server.handleConnection (src/server.ts:201:36)`;

const LEVEL_WEIGHTS: Array<{ level: LogLevel; w: number }> = [
  { level: 'TRACE', w: 8 },
  { level: 'DEBUG', w: 15 },
  { level: 'INFO', w: 45 },
  { level: 'WARN', w: 18 },
  { level: 'ERROR', w: 12 },
  { level: 'FATAL', w: 2 },
];

const TOTAL_WEIGHT = LEVEL_WEIGHTS.reduce((s, l) => s + l.w, 0);

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const REGIONS = ['us-east-1', 'us-west-2', 'eu-west-1'] as const;

export function generateLogEntry(id: number, timestamp: Date): LogEntry {
  let r = Math.random() * TOTAL_WEIGHT;
  let level: LogLevel = 'INFO';
  for (const lw of LEVEL_WEIGHTS) {
    r -= lw.w;
    if (r <= 0) {
      level = lw.level;
      break;
    }
  }

  const service = pickRandom(SERVICES);
  const message = pickRandom(MESSAGES[level]);
  const hasStack = (level === 'ERROR' || level === 'FATAL') && Math.random() > 0.4;

  return {
    id,
    timestamp,
    level,
    service,
    message,
    requestId: `req_${Math.random().toString(36).slice(2, 10)}`,
    pid: 1000 + Math.floor(Math.random() * 9000),
    stackTrace: hasStack ? STACK_TRACE : null,
    metadata: {
      host: `prod-${service.split('-')[0]}-${Math.floor(Math.random() * 4) + 1}.internal`,
      region: pickRandom(REGIONS),
      version: `v2.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`,
    },
  };
}

export function generateSampleLogs(count: number): LogEntry[] {
  const baseTime = Date.now() - count * 800;
  return Array.from({ length: count }, (_, i) => {
    const ts = new Date(baseTime + i * (400 + Math.random() * 1200));
    return generateLogEntry(i, ts);
  });
}
