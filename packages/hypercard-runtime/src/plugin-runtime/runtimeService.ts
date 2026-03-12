import { validateRuntimeActions } from './intentSchema';
import { getRuntimePackageOrThrow, resolveRuntimePackageInstallOrder } from '../runtime-packages';
import { getRuntimeSurfaceTypeOrThrow } from '../runtime-packs';
import type {
  RuntimeSurfaceId,
  RuntimeBundleMeta,
  RuntimeErrorPayload,
  RuntimeAction,
  SessionId,
  StackId,
} from './contracts';
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';
import { toJsLiteral } from './quickJsSessionCore';
import { JsSessionService, type JsEvalResult, type JsSessionServiceOptions } from './jsSessionService';

export interface QuickJSRuntimeServiceOptions {
  memoryLimitBytes?: number;
  stackLimitBytes?: number;
  loadTimeoutMs?: number;
  renderTimeoutMs?: number;
  eventTimeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<QuickJSRuntimeServiceOptions> = {
  memoryLimitBytes: 32 * 1024 * 1024,
  stackLimitBytes: 1024 * 1024,
  loadTimeoutMs: 1000,
  renderTimeoutMs: 100,
  eventTimeoutMs: 100,
};

let runtimeServiceInstanceCounter = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRuntimeBundleMeta(stackId: StackId, sessionId: SessionId, value: unknown): RuntimeBundleMeta {
  if (!isRecord(value)) {
    throw new Error('Runtime bundle metadata must be an object');
  }

  const packageIds = value.packageIds;
  if (!Array.isArray(packageIds) || packageIds.some((packageId) => typeof packageId !== 'string')) {
    throw new Error('Runtime bundle metadata packageIds must be string[]');
  }

  const surfaces = value.surfaces;
  if (!Array.isArray(surfaces) || surfaces.some((surfaceId) => typeof surfaceId !== 'string')) {
    throw new Error('Runtime bundle metadata surfaces must be string[]');
  }

  const initialSurfaceState = value.initialSurfaceState;
  if (initialSurfaceState !== undefined && !isRecord(initialSurfaceState)) {
    throw new Error('Runtime bundle metadata initialSurfaceState must be an object when provided');
  }

  const surfaceTypes = value.surfaceTypes;
  if (surfaceTypes !== undefined) {
    if (!isRecord(surfaceTypes)) {
      throw new Error('Runtime bundle metadata surfaceTypes must be an object when provided');
    }
    for (const [surfaceId, surfaceTypeId] of Object.entries(surfaceTypes)) {
      if (typeof surfaceId !== 'string' || typeof surfaceTypeId !== 'string') {
        throw new Error('Runtime bundle metadata surfaceTypes must be Record<string, string>');
      }
    }
  }

  return {
    stackId,
    sessionId,
    declaredId: typeof value.declaredId === 'string' ? value.declaredId : undefined,
    title: typeof value.title === 'string' ? value.title : 'Untitled Stack',
    description: typeof value.description === 'string' ? value.description : undefined,
    packageIds: packageIds.filter((packageId): packageId is string => typeof packageId === 'string'),
    initialSessionState: value.initialSessionState,
    initialSurfaceState,
    surfaces,
    surfaceTypes: isRecord(surfaceTypes) ? Object.fromEntries(
      Object.entries(surfaceTypes).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
    ) : undefined,
  };
}

export function toRuntimeError(error: unknown): RuntimeErrorPayload {
  if (error instanceof Error) {
    const interrupted = error.message.includes('interrupted');
    return {
      code: interrupted ? 'RUNTIME_TIMEOUT' : 'RUNTIME_ERROR',
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  };
}

export class QuickJSRuntimeService {
  private readonly options: Required<QuickJSRuntimeServiceOptions>;

  private readonly sessionService: JsSessionService;

  private readonly bundles = new Map<SessionId, RuntimeBundleMeta>();

  private readonly instanceId: string;

  constructor(options: QuickJSRuntimeServiceOptions = {}) {
    this.instanceId = `runtime-service-${runtimeServiceInstanceCounter++}`;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
    this.sessionService = new JsSessionService({
      memoryLimitBytes: this.options.memoryLimitBytes,
      stackLimitBytes: this.options.stackLimitBytes,
      loadTimeoutMs: this.options.loadTimeoutMs,
      evalTimeoutMs: this.options.eventTimeoutMs,
      inspectTimeoutMs: this.options.loadTimeoutMs,
    } satisfies JsSessionServiceOptions);

    console.log('[QuickJSRuntimeService] Created service instance', {
      instanceId: this.instanceId,
      options: this.options,
    });
  }

  private getBundleOrThrow(sessionId: SessionId): RuntimeBundleMeta {
    const bundle = this.bundles.get(sessionId);
    if (!bundle) {
      console.error('[QuickJSRuntimeService] Runtime session not found', {
        instanceId: this.instanceId,
        sessionId,
        availableSessions: Array.from(this.bundles.keys()),
      });
      throw new Error(`Runtime session not found: ${sessionId}`);
    }
    return bundle;
  }

  private readRuntimeBundleMeta(stackId: StackId, sessionId: SessionId): RuntimeBundleMeta {
    const meta = this.sessionService.evaluateToNative<unknown>(
      sessionId,
      'globalThis.__runtimeBundleHost.getMeta()',
      'runtime-bundle-meta.js',
      this.options.loadTimeoutMs,
    );
    return validateRuntimeBundleMeta(stackId, sessionId, meta);
  }

  private installRuntimePackages(sessionId: SessionId, packageIds: string[]): string[] {
    const orderedPackageIds = resolveRuntimePackageInstallOrder(packageIds);
    for (const packageId of orderedPackageIds) {
      const runtimePackage = getRuntimePackageOrThrow(packageId);
      this.sessionService.installPrelude(sessionId, runtimePackage.installPrelude);
    }
    return orderedPackageIds;
  }

  async loadRuntimeBundle(stackId: StackId, sessionId: SessionId, packageIds: string[], code: string): Promise<RuntimeBundleMeta> {
    if (this.bundles.has(sessionId)) {
      console.warn('[QuickJSRuntimeService] Refusing to load duplicate runtime session', {
        instanceId: this.instanceId,
        stackId,
        sessionId,
        availableSessions: Array.from(this.bundles.keys()),
      });
      throw new Error(`Runtime session already exists: ${sessionId}`);
    }

    console.log('[QuickJSRuntimeService] Loading runtime bundle', {
      instanceId: this.instanceId,
      stackId,
      sessionId,
      packageIds,
      codeLength: code.length,
      beforeSessions: Array.from(this.bundles.keys()),
    });

    try {
      await this.sessionService.createSession({
        sessionId,
        title: stackId,
        scopeId: stackId,
        bootstrapSources: [{ code: stackBootstrapSource, filename: 'stack-bootstrap.js' }],
      });
      const installedPackageIds = this.installRuntimePackages(sessionId, packageIds);
      this.sessionService.runCode(sessionId, code, `${sessionId}.runtime-bundle.js`, this.options.loadTimeoutMs);
      const bundle = this.readRuntimeBundleMeta(stackId, sessionId);
      const declared = Array.from(new Set(bundle.packageIds)).sort();
      const installed = Array.from(new Set(installedPackageIds)).sort();
      if (declared.length !== installed.length || declared.some((packageId, index) => packageId !== installed[index])) {
        throw new Error(
          `Runtime bundle packageIds mismatch. Declared: ${declared.join(', ') || '(none)'}; installed: ${installed.join(', ') || '(none)'}`
        );
      }
      this.bundles.set(sessionId, bundle);
      console.log('[QuickJSRuntimeService] Loaded runtime bundle', {
        instanceId: this.instanceId,
        stackId,
        sessionId,
        declaredPackageIds: bundle.packageIds,
        surfaces: bundle.surfaces,
        afterSessions: Array.from(this.bundles.keys()),
      });
      return bundle;
    } catch (error) {
      console.error('[QuickJSRuntimeService] Failed to load runtime bundle', {
        instanceId: this.instanceId,
        stackId,
        sessionId,
        packageIds,
        message: error instanceof Error ? error.message : String(error),
      });
      this.sessionService.disposeSession(sessionId);
      this.bundles.delete(sessionId);
      throw error;
    }
  }

  defineRuntimeSurface(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string, packId?: string): RuntimeBundleMeta {
    const bundle = this.getBundleOrThrow(sessionId);
    if (typeof packId === 'string' && packId.trim().length > 0) {
      getRuntimeSurfaceTypeOrThrow(packId);
    }
    this.sessionService.runCode(
      sessionId,
      `globalThis.__runtimeBundleHost.defineRuntimeSurface(${toJsLiteral(surfaceId)}, (${code}), ${toJsLiteral(packId)})`,
      `${sessionId}.define-runtime-surface.js`,
      this.options.loadTimeoutMs
    );
    const next = this.readRuntimeBundleMeta(bundle.stackId, sessionId);
    this.bundles.set(sessionId, next);
    return next;
  }

  defineRuntimeSurfaceRender(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string): RuntimeBundleMeta {
    const bundle = this.getBundleOrThrow(sessionId);
    this.sessionService.runCode(
      sessionId,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceRender(${toJsLiteral(surfaceId)}, (${code}))`,
      `${sessionId}.define-runtime-surface-render.js`,
      this.options.loadTimeoutMs
    );
    const next = this.readRuntimeBundleMeta(bundle.stackId, sessionId);
    this.bundles.set(sessionId, next);
    return next;
  }

  defineRuntimeSurfaceHandler(sessionId: SessionId, surfaceId: RuntimeSurfaceId, handler: string, code: string): RuntimeBundleMeta {
    const bundle = this.getBundleOrThrow(sessionId);
    this.sessionService.runCode(
      sessionId,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceHandler(${toJsLiteral(surfaceId)}, ${toJsLiteral(handler)}, (${code}))`,
      `${sessionId}.define-runtime-surface-handler.js`,
      this.options.loadTimeoutMs
    );
    const next = this.readRuntimeBundleMeta(bundle.stackId, sessionId);
    this.bundles.set(sessionId, next);
    return next;
  }

  getRuntimeBundleMeta(sessionId: SessionId): RuntimeBundleMeta {
    const bundle = this.getBundleOrThrow(sessionId);
    const next = this.readRuntimeBundleMeta(bundle.stackId, sessionId);
    this.bundles.set(sessionId, next);
    return next;
  }

  evaluateSessionJs(sessionId: SessionId, code: string): JsEvalResult {
    this.getBundleOrThrow(sessionId);
    return this.sessionService.evaluate(sessionId, code);
  }

  getSessionGlobalNames(sessionId: SessionId): string[] {
    this.getBundleOrThrow(sessionId);
    return this.sessionService.getGlobalNames(sessionId);
  }

  renderRuntimeSurface(
    sessionId: SessionId,
    surfaceId: RuntimeSurfaceId,
    state: unknown
  ): unknown {
    this.getBundleOrThrow(sessionId);
    return this.sessionService.evaluateToNative<unknown>(
      sessionId,
      `globalThis.__runtimeBundleHost.renderRuntimeSurface(${toJsLiteral(surfaceId)}, ${toJsLiteral(state)})`,
      `${sessionId}.render-runtime-surface.js`,
      this.options.renderTimeoutMs
    );
  }

  eventRuntimeSurface(
    sessionId: SessionId,
    surfaceId: RuntimeSurfaceId,
    handler: string,
    args: unknown,
    state: unknown
  ): RuntimeAction[] {
    this.getBundleOrThrow(sessionId);
    const actions = this.sessionService.evaluateToNative<unknown>(
      sessionId,
      `globalThis.__runtimeBundleHost.eventRuntimeSurface(${toJsLiteral(surfaceId)}, ${toJsLiteral(handler)}, ${toJsLiteral(
        args
      )}, ${toJsLiteral(state)})`,
      `${sessionId}.event-runtime-surface.js`,
      this.options.eventTimeoutMs
    );

    return validateRuntimeActions(actions);
  }

  disposeSession(sessionId: SessionId): boolean {
    if (!this.bundles.has(sessionId)) {
      console.warn('[QuickJSRuntimeService] disposeSession missed', {
        instanceId: this.instanceId,
        sessionId,
        availableSessions: Array.from(this.bundles.keys()),
      });
      return false;
    }

    this.bundles.delete(sessionId);
    this.sessionService.disposeSession(sessionId);
    console.log('[QuickJSRuntimeService] Disposed runtime session', {
      instanceId: this.instanceId,
      sessionId,
      remainingSessions: Array.from(this.bundles.keys()),
    });
    return true;
  }

  health() {
    return {
      ready: true as const,
      sessions: Array.from(this.bundles.keys()),
    };
  }
}
