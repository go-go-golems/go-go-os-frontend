import SINGLEFILE_RELEASE_SYNC from '@jitl/quickjs-singlefile-mjs-release-sync';
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import type { QuickJSContext, QuickJSRuntime, QuickJSWASMModule } from 'quickjs-emscripten-core';
import { validateRuntimeActions } from './intentSchema';
import type {
  RuntimeSurfaceId,
  RuntimeBundleMeta,
  RuntimeErrorPayload,
  RuntimeAction,
  SessionId,
  StackId,
} from './contracts';
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';

interface SessionVm {
  stackId: StackId;
  sessionId: SessionId;
  runtime: QuickJSRuntime;
  context: QuickJSContext;
  deadlineMs: number;
}

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

let quickJsModulePromise: Promise<QuickJSWASMModule> | null = null;

function getSharedQuickJsModule() {
  if (!quickJsModulePromise) {
    quickJsModulePromise = newQuickJSWASMModule(SINGLEFILE_RELEASE_SYNC);
  }
  return quickJsModulePromise;
}

function toJsLiteral(value: unknown): string {
  const encoded = JSON.stringify(value);
  return encoded === undefined ? 'undefined' : encoded;
}

function formatQuickJSError(errorDump: unknown): string {
  if (typeof errorDump === 'string') {
    return errorDump;
  }

  if (errorDump && typeof errorDump === 'object') {
    const details = errorDump as { name?: string; message?: string };
    if (details.name && details.message) {
      return `${details.name}: ${details.message}`;
    }
    if (details.message) {
      return details.message;
    }
  }

  return 'Unknown QuickJS runtime error';
}

function withDeadline<T>(vm: SessionVm, timeoutMs: number, fn: () => T): T {
  vm.deadlineMs = Date.now() + timeoutMs;
  try {
    return fn();
  } finally {
    vm.deadlineMs = Number.POSITIVE_INFINITY;
  }
}

function evalToNative<T>(vm: SessionVm, code: string, filename: string, timeoutMs: number): T {
  const context = vm.context;
  const result = withDeadline(vm, timeoutMs, () => context.evalCode(code, filename));
  if (result.error) {
    const dumped = context.dump(result.error);
    result.error.dispose();
    throw new Error(formatQuickJSError(dumped));
  }

  try {
    return context.dump(result.value) as T;
  } finally {
    result.value.dispose();
  }
}

function evalCodeOrThrow(vm: SessionVm, code: string, filename: string, timeoutMs: number): void {
  const context = vm.context;
  const result = withDeadline(vm, timeoutMs, () => context.evalCode(code, filename));
  if (result.error) {
    const dumped = context.dump(result.error);
    result.error.dispose();
    throw new Error(formatQuickJSError(dumped));
  }

  result.value.dispose();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateRuntimeBundleMeta(stackId: StackId, sessionId: SessionId, value: unknown): RuntimeBundleMeta {
  if (!isRecord(value)) {
    throw new Error('Runtime bundle metadata must be an object');
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

  constructor(options: QuickJSRuntimeServiceOptions = {}) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };
  }

  private async createSessionVm(stackId: StackId, sessionId: SessionId): Promise<SessionVm> {
    const QuickJS = await getSharedQuickJsModule();
    const runtime = QuickJS.newRuntime();
    const context = runtime.newContext();

    const vm: SessionVm = {
      stackId,
      sessionId,
      runtime,
      context,
      deadlineMs: Number.POSITIVE_INFINITY,
    };

    runtime.setMemoryLimit(this.options.memoryLimitBytes);
    runtime.setMaxStackSize(this.options.stackLimitBytes);
    runtime.setInterruptHandler(() => Date.now() > vm.deadlineMs);

    evalCodeOrThrow(vm, stackBootstrapSource, 'stack-bootstrap.js', this.options.loadTimeoutMs);
    return vm;
  }

  private getVmOrThrow(sessionId: SessionId): SessionVm {
    const vm = this.vms.get(sessionId);
    if (!vm) {
      throw new Error(`Runtime session not found: ${sessionId}`);
    }
    return vm;
  }

  private readRuntimeBundleMeta(vm: SessionVm): RuntimeBundleMeta {
    const meta = evalToNative<unknown>(vm, 'globalThis.__runtimeBundleHost.getMeta()', 'runtime-bundle-meta.js', this.options.loadTimeoutMs);
    return validateRuntimeBundleMeta(vm.stackId, vm.sessionId, meta);
  }

  async loadRuntimeBundle(stackId: StackId, sessionId: SessionId, code: string): Promise<RuntimeBundleMeta> {
    if (this.vms.has(sessionId)) {
      throw new Error(`Runtime session already exists: ${sessionId}`);
    }

    const vm = await this.createSessionVm(stackId, sessionId);

    try {
      evalCodeOrThrow(vm, code, `${sessionId}.runtime-bundle.js`, this.options.loadTimeoutMs);
      const bundle = this.readRuntimeBundleMeta(vm);
      this.vms.set(sessionId, vm);
      return bundle;
    } catch (error) {
      vm.context.dispose();
      vm.runtime.dispose();
      throw error;
    }
  }

  defineRuntimeSurface(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string, packId?: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurface(${toJsLiteral(surfaceId)}, (${code}), ${toJsLiteral(packId)})`,
      `${sessionId}.define-runtime-surface.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  defineRuntimeSurfaceRender(sessionId: SessionId, surfaceId: RuntimeSurfaceId, code: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceRender(${toJsLiteral(surfaceId)}, (${code}))`,
      `${sessionId}.define-runtime-surface-render.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  defineRuntimeSurfaceHandler(sessionId: SessionId, surfaceId: RuntimeSurfaceId, handler: string, code: string): RuntimeBundleMeta {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__runtimeBundleHost.defineRuntimeSurfaceHandler(${toJsLiteral(surfaceId)}, ${toJsLiteral(handler)}, (${code}))`,
      `${sessionId}.define-runtime-surface-handler.js`,
      this.options.loadTimeoutMs
    );
    return this.readRuntimeBundleMeta(vm);
  }

  renderRuntimeSurface(
    sessionId: SessionId,
    surfaceId: RuntimeSurfaceId,
    state: unknown
  ): unknown {
    const vm = this.getVmOrThrow(sessionId);
    return evalToNative<unknown>(
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
    const actions = evalToNative<unknown>(
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
      return false;
    }

    this.vms.delete(sessionId);
    vm.context.dispose();
    vm.runtime.dispose();
    return true;
  }

  health() {
    return {
      ready: true as const,
      sessions: Array.from(this.vms.keys()),
    };
  }
}
