export type StackId = string;
export type SessionId = string;
export type RuntimeSurfaceId = string;

export interface RuntimeErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface RuntimeAction {
  type: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

export type RuntimeActionKind = 'draft' | 'filters' | 'domain' | 'system' | 'unknown';

const SYSTEM_ACTION_TYPES = new Set(['nav.go', 'nav.back', 'notify.show', 'window.close']);

export function getRuntimeActionKind(actionType: string): RuntimeActionKind {
  if (actionType.startsWith('draft.')) {
    return 'draft';
  }

  if (actionType.startsWith('filters.')) {
    return 'filters';
  }

  if (SYSTEM_ACTION_TYPES.has(actionType)) {
    return 'system';
  }

  const slashIndex = actionType.indexOf('/');
  if (slashIndex > 0) {
    return 'domain';
  }

  return 'unknown';
}

export function getRuntimeActionDomain(actionType: string): string | null {
  if (getRuntimeActionKind(actionType) !== 'domain') {
    return null;
  }

  return actionType.split('/', 1)[0] ?? null;
}

export function getRuntimeActionOperation(actionType: string): string {
  if (actionType.startsWith('draft.')) {
    return actionType.slice('draft.'.length);
  }

  if (actionType.startsWith('filters.')) {
    return actionType.slice('filters.'.length);
  }

  return actionType;
}

export interface RuntimeBundleMeta {
  stackId: StackId;
  sessionId: SessionId;
  declaredId?: string;
  title: string;
  description?: string;
  initialSessionState?: unknown;
  initialSurfaceState?: Record<string, unknown>;
  surfaces: string[];
  surfaceTypes?: Record<string, string>;
}

export interface LoadRuntimeBundleRequest {
  id: number;
  type: 'loadRuntimeBundle';
  stackId: StackId;
  sessionId: SessionId;
  code: string;
}

export interface RenderRuntimeSurfaceRequest {
  id: number;
  type: 'renderRuntimeSurface';
  sessionId: SessionId;
  surfaceId: RuntimeSurfaceId;
  state: unknown;
}

export interface EventRuntimeSurfaceRequest {
  id: number;
  type: 'eventRuntimeSurface';
  sessionId: SessionId;
  surfaceId: RuntimeSurfaceId;
  handler: string;
  args?: unknown;
  state: unknown;
}

export interface DefineRuntimeSurfaceRequest {
  id: number;
  type: 'defineRuntimeSurface';
  sessionId: SessionId;
  surfaceId: RuntimeSurfaceId;
  code: string;
}

export interface DefineRuntimeSurfaceRenderRequest {
  id: number;
  type: 'defineRuntimeSurfaceRender';
  sessionId: SessionId;
  surfaceId: RuntimeSurfaceId;
  code: string;
}

export interface DefineRuntimeSurfaceHandlerRequest {
  id: number;
  type: 'defineRuntimeSurfaceHandler';
  sessionId: SessionId;
  surfaceId: RuntimeSurfaceId;
  handler: string;
  code: string;
}

export interface DisposeSessionRequest {
  id: number;
  type: 'disposeSession';
  sessionId: SessionId;
}

export interface HealthRequest {
  id: number;
  type: 'health';
}

export type WorkerRequest =
  | LoadRuntimeBundleRequest
  | RenderRuntimeSurfaceRequest
  | EventRuntimeSurfaceRequest
  | DefineRuntimeSurfaceRequest
  | DefineRuntimeSurfaceRenderRequest
  | DefineRuntimeSurfaceHandlerRequest
  | DisposeSessionRequest
  | HealthRequest;

export interface LoadRuntimeBundleResult {
  bundle: RuntimeBundleMeta;
}

export interface RenderRuntimeSurfaceResult {
  tree: unknown;
}

export interface EventRuntimeSurfaceResult {
  actions: RuntimeAction[];
}

export interface DefineRuntimeSurfaceResult {
  bundle: RuntimeBundleMeta;
}

export interface DisposeSessionResult {
  disposed: boolean;
}

export interface HealthResult {
  ready: true;
  sessions: string[];
}

export type WorkerResult =
  | LoadRuntimeBundleResult
  | RenderRuntimeSurfaceResult
  | EventRuntimeSurfaceResult
  | DefineRuntimeSurfaceResult
  | DisposeSessionResult
  | HealthResult;

export interface WorkerSuccessResponse {
  id: number;
  ok: true;
  result: WorkerResult;
}

export interface WorkerErrorResponse {
  id: number;
  ok: false;
  error: RuntimeErrorPayload;
}

export type WorkerResponse = WorkerSuccessResponse | WorkerErrorResponse;
