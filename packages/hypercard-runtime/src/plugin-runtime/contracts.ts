export type StackId = string;
export type SessionId = string;
export type CardId = string;

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

export interface LoadedStackBundle {
  stackId: StackId;
  sessionId: SessionId;
  declaredId?: string;
  title: string;
  description?: string;
  initialSessionState?: unknown;
  initialCardState?: Record<string, unknown>;
  cards: string[];
  cardPacks?: Record<string, string>;
}

export interface LoadStackBundleRequest {
  id: number;
  type: 'loadStackBundle';
  stackId: StackId;
  sessionId: SessionId;
  code: string;
}

export interface RenderCardRequest {
  id: number;
  type: 'renderCard';
  sessionId: SessionId;
  cardId: CardId;
  state: unknown;
}

export interface EventCardRequest {
  id: number;
  type: 'eventCard';
  sessionId: SessionId;
  cardId: CardId;
  handler: string;
  args?: unknown;
  state: unknown;
}

export interface DefineCardRequest {
  id: number;
  type: 'defineCard';
  sessionId: SessionId;
  cardId: CardId;
  code: string;
}

export interface DefineCardRenderRequest {
  id: number;
  type: 'defineCardRender';
  sessionId: SessionId;
  cardId: CardId;
  code: string;
}

export interface DefineCardHandlerRequest {
  id: number;
  type: 'defineCardHandler';
  sessionId: SessionId;
  cardId: CardId;
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
  | LoadStackBundleRequest
  | RenderCardRequest
  | EventCardRequest
  | DefineCardRequest
  | DefineCardRenderRequest
  | DefineCardHandlerRequest
  | DisposeSessionRequest
  | HealthRequest;

export interface LoadStackBundleResult {
  bundle: LoadedStackBundle;
}

export interface RenderCardResult {
  tree: unknown;
}

export interface EventCardResult {
  actions: RuntimeAction[];
}

export interface DefineCardResult {
  bundle: LoadedStackBundle;
}

export interface DisposeSessionResult {
  disposed: boolean;
}

export interface HealthResult {
  ready: true;
  sessions: string[];
}

export type WorkerResult =
  | LoadStackBundleResult
  | RenderCardResult
  | EventCardResult
  | DefineCardResult
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
