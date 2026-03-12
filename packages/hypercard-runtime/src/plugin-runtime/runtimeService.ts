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
import {
  createQuickJsSessionVm,
  disposeQuickJsSessionVm,
  evalQuickJsCodeOrThrow,
  evalQuickJsToNative,
  toJsLiteral,
  type QuickJsSessionVm,
} from './quickJsSessionCore';
import {
  evaluateQuickJsSessionJs,
  getQuickJsSessionGlobalNames,
  installJsEvalBridge,
} from './jsEvalSupport';
import type { JsEvalResult } from './jsSessionService';

type SessionVm = QuickJsSessionVm;

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

  private readonly vms = new Map<SessionId, SessionVm>();

  private readonly instanceId: string;

  constructor(options: QuickJSRuntimeServiceOptions = {}) {
    this.instanceId = `runtime-service-${runtimeServiceInstanceCounter++}`;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    console.log('[QuickJSRuntimeService] Created service instance', {
      instanceId: this.instanceId,
      options: this.options,
    });
  }

  private async createSessionVm(stackId: StackId, sessionId: SessionId): Promise<SessionVm> {
    return await createQuickJsSessionVm(
      stackId,
      sessionId,
      {
        memoryLimitBytes: this.options.memoryLimitBytes,
        stackLimitBytes: this.options.stackLimitBytes,
        loadTimeoutMs: this.options.loadTimeoutMs,
      },
      [{ code: stackBootstrapSource, filename: 'stack-bootstrap.js' }],
    );
  }

  private getVmOrThrow(sessionId: SessionId): SessionVm {
    const vm = this.vms.get(sessionId);
    if (!vm) {
      console.error('[QuickJSRuntimeService] Runtime session not found', {
        instanceId: this.instanceId,
        sessionId,
        availableSessions: Array.from(this.vms.keys()),
      });
      throw new Error(`Runtime session not found: ${sessionId}`);
    }
    return vm;
  }

  private readRuntimeBundleMeta(vm: SessionVm): RuntimeBundleMeta {
    const meta = evalQuickJsToNative<unknown>(vm, 'globalThis.__runtimeBundleHost.getMeta()', 'runtime-bundle-meta.js', this.options.loadTimeoutMs);
    return validateRuntimeBundleMeta(vm.scopeId, vm.sessionId, meta);
  }

  private installRuntimePackages(vm: SessionVm, packageIds: string[]): string[] {
    const orderedPackageIds = resolveRuntimePackageInstallOrder(packageIds);
    for (const packageId of orderedPackageIds) {
      const runtimePackage = getRuntimePackageOrThrow(packageId);
      evalQuickJsCodeOrThrow(vm, runtimePackage.installPrelude, `${packageId}.runtime-package.js`, this.options.loadTimeoutMs);
    }
    return orderedPackageIds;
  }

  async loadRuntimeBundle(stackId: StackId, sessionId: SessionId, packageIds: string[], code: string): Promise<RuntimeBundleMeta> {
    if (this.vms.has(sessionId)) {
      console.warn('[QuickJSRuntimeService] Refusing to load duplicate runtime session', {
        instanceId: this.instanceId,
        stackId,
        sessionId,
        availableSessions: Array.from(this.vms.keys()),
      });
      throw new Error(`Runtime session already exists: ${sessionId}`);
    }

    console.log('[QuickJSRuntimeService] Loading runtime bundle', {
      instanceId: this.instanceId,
      stackId,
      sessionId,
      packageIds,
      codeLength: code.length,
      beforeSessions: Array.from(this.vms.keys()),
    });

    const vm = await this.createSessionVm(stackId, sessionId);

    try {
      const installedPackageIds = this.installRuntimePackages(vm, packageIds);
      evalQuickJsCodeOrThrow(vm, code, `${sessionId}.runtime-bundle.js`, this.options.loadTimeoutMs);
      const bundle = this.readRuntimeBundleMeta(vm);
      const declared = Array.from(new Set(bundle.packageIds)).sort();
      const installed = Array.from(new Set(installedPackageIds)).sort();
      if (declared.length !== installed.length || declared.some((packageId, index) => packageId !== installed[index])) {
        throw new Error(
          `Runtime bundle packageIds mismatch. Declared: ${declared.join(', ') || '(none)'}; installed: ${installed.join(', ') || '(none)'}`
        );
      }
      this.vms.set(sessionId, vm);
      console.log('[QuickJSRuntimeService] Loaded runtime bundle', {
        instanceId: this.instanceId,
        stackId,
        sessionId,
        declaredPackageIds: bundle.packageIds,
        surfaces: bundle.surfaces,
        afterSessions: Array.from(this.vms.keys()),
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
      disposeQuickJsSessionVm(vm);
      throw error;
    }
  }

  defineRuntimeSurface(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string, packId?: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    if (typeof packId === 'string' && packId.trim().length > 0) {
      getRuntimeSurfaceTypeOrThrow(packId);
    }
    evalQuickJsCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurface(${toJsLiteral(surfaceId)}, (${code}), ${toJsLiteral(packId)})`,
      `${sessionId}.define-runtime-surface.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  defineRuntimeSurfaceRender(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    evalQuickJsCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceRender(${toJsLiteral(surfaceId)}, (${code}))`,
      `${sessionId}.define-runtime-surface-render.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  defineRuntimeSurfaceHandler(sessionId: SessionId, surfaceId: RuntimeSurfaceId, handler: string, code: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    evalQuickJsCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceHandler(${toJsLiteral(surfaceId)}, ${toJsLiteral(handler)}, (${code}))`,
      `${sessionId}.define-runtime-surface-handler.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  getRuntimeBundleMeta(sessionId: SessionId): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    return this.readRuntimeBundleMeta(vm);
  }

  evaluateSessionJs(sessionId: SessionId, code: string): JsEvalResult {
    const vm = this.getVmOrThrow(sessionId);
    installJsEvalBridge(vm, `${sessionId}.js-eval-bridge.js`, this.options.loadTimeoutMs);
    return evaluateQuickJsSessionJs(
      vm,
      code,
      `${sessionId}.session-eval.js`,
      this.options.eventTimeoutMs,
      this.options.loadTimeoutMs,
    );
  }

  getSessionGlobalNames(sessionId: SessionId): string[] {
    const vm = this.getVmOrThrow(sessionId);
    installJsEvalBridge(vm, `${sessionId}.js-eval-bridge.js`, this.options.loadTimeoutMs);
    return getQuickJsSessionGlobalNames(
      vm,
      `${sessionId}.session-globals.js`,
      this.options.loadTimeoutMs,
    );
  }

  renderRuntimeSurface(
    sessionId: SessionId,
    surfaceId: RuntimeSurfaceId,
    state: unknown
  ): unknown {
    const vm = this.getVmOrThrow(sessionId);
    return evalQuickJsToNative<unknown>(
      vm,
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
    const vm = this.getVmOrThrow(sessionId);
    const actions = evalQuickJsToNative<unknown>(
      vm,
      `globalThis.__runtimeBundleHost.eventRuntimeSurface(${toJsLiteral(surfaceId)}, ${toJsLiteral(handler)}, ${toJsLiteral(
        args
      )}, ${toJsLiteral(state)})`,
      `${sessionId}.event-runtime-surface.js`,
      this.options.eventTimeoutMs
    );

    return validateRuntimeActions(actions);
  }

  disposeSession(sessionId: SessionId): boolean {
    const vm = this.vms.get(sessionId);
    if (!vm) {
      console.warn('[QuickJSRuntimeService] disposeSession missed', {
        instanceId: this.instanceId,
        sessionId,
        availableSessions: Array.from(this.vms.keys()),
      });
      return false;
    }

    this.vms.delete(sessionId);
    disposeQuickJsSessionVm(vm);
    console.log('[QuickJSRuntimeService] Disposed runtime session', {
      instanceId: this.instanceId,
      sessionId,
      remainingSessions: Array.from(this.vms.keys()),
    });
    return true;
  }

  health() {
    return {
      ready: true as const,
      sessions: Array.from(this.vms.keys()),
    };
  }
}
