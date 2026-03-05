import SINGLEFILE_RELEASE_SYNC from '@jitl/quickjs-singlefile-mjs-release-sync';
import { newQuickJSWASMModule } from 'quickjs-emscripten';
import type { QuickJSContext, QuickJSRuntime, QuickJSWASMModule } from 'quickjs-emscripten-core';
import { validateRuntimeIntents } from './intentSchema';
import type {
  CardId,
  LoadedStackBundle,
  RuntimeErrorPayload,
  RuntimeIntent,
  SessionId,
  StackId,
} from './contracts';
import stackBootstrapSource from './stack-bootstrap.vm.js?raw';
import { validateUINode } from './uiSchema';

interface SessionVm {
  stackId: StackId;
  sessionId: SessionId;
  runtime: QuickJSRuntime;
  context: QuickJSContext;
  deadlineMs: number;
}

export interface QuickJSCardRuntimeServiceOptions {
  memoryLimitBytes?: number;
  stackLimitBytes?: number;
  loadTimeoutMs?: number;
  renderTimeoutMs?: number;
  eventTimeoutMs?: number;
}

const DEFAULT_OPTIONS: Required<QuickJSCardRuntimeServiceOptions> = {
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

function validateLoadedStackBundleMeta(stackId: StackId, sessionId: SessionId, value: unknown): LoadedStackBundle {
  if (!isRecord(value)) {
    throw new Error('Stack bundle metadata must be an object');
  }

  const cards = value.cards;
  if (!Array.isArray(cards) || cards.some((cardId) => typeof cardId !== 'string')) {
    throw new Error('Stack bundle metadata cards must be string[]');
  }

  const initialCardState = value.initialCardState;
  if (initialCardState !== undefined && !isRecord(initialCardState)) {
    throw new Error('Stack bundle metadata initialCardState must be an object when provided');
  }

  return {
    stackId,
    sessionId,
    declaredId: typeof value.declaredId === 'string' ? value.declaredId : undefined,
    title: typeof value.title === 'string' ? value.title : 'Untitled Stack',
    description: typeof value.description === 'string' ? value.description : undefined,
    initialSessionState: value.initialSessionState,
    initialCardState,
    cards,
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

export class QuickJSCardRuntimeService {
  private readonly options: Required<QuickJSCardRuntimeServiceOptions>;

  private readonly vms = new Map<SessionId, SessionVm>();

  constructor(options: QuickJSCardRuntimeServiceOptions = {}) {
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

  private readBundleMeta(vm: SessionVm): LoadedStackBundle {
    const meta = evalToNative<unknown>(vm, 'globalThis.__stackHost.getMeta()', 'stack-meta.js', this.options.loadTimeoutMs);
    return validateLoadedStackBundleMeta(vm.stackId, vm.sessionId, meta);
  }

  async loadStackBundle(stackId: StackId, sessionId: SessionId, code: string): Promise<LoadedStackBundle> {
    if (this.vms.has(sessionId)) {
      throw new Error(`Runtime session already exists: ${sessionId}`);
    }

    const vm = await this.createSessionVm(stackId, sessionId);

    try {
      evalCodeOrThrow(vm, code, `${sessionId}.stack.js`, this.options.loadTimeoutMs);
      const bundle = this.readBundleMeta(vm);
      this.vms.set(sessionId, vm);
      return bundle;
    } catch (error) {
      vm.context.dispose();
      vm.runtime.dispose();
      throw error;
    }
  }

  defineCard(sessionId: SessionId, cardId: CardId, code: string): LoadedStackBundle {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__stackHost.defineCard(${toJsLiteral(cardId)}, (${code}))`,
      `${sessionId}.define-card.js`,
      this.options.loadTimeoutMs
    );
    return this.readBundleMeta(vm);
  }

  defineCardRender(sessionId: SessionId, cardId: CardId, code: string): LoadedStackBundle {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__stackHost.defineCardRender(${toJsLiteral(cardId)}, (${code}))`,
      `${sessionId}.define-card-render.js`,
      this.options.loadTimeoutMs
    );
    return this.readBundleMeta(vm);
  }

  defineCardHandler(sessionId: SessionId, cardId: CardId, handler: string, code: string): LoadedStackBundle {
    const vm = this.getVmOrThrow(sessionId);
    evalCodeOrThrow(
      vm,
      `globalThis.__stackHost.defineCardHandler(${toJsLiteral(cardId)}, ${toJsLiteral(handler)}, (${code}))`,
      `${sessionId}.define-card-handler.js`,
      this.options.loadTimeoutMs
    );
    return this.readBundleMeta(vm);
  }

  renderCard(
    sessionId: SessionId,
    cardId: CardId,
    cardState: unknown,
    sessionState: unknown,
    globalState: unknown
  ) {
    const vm = this.getVmOrThrow(sessionId);
    const tree = evalToNative<unknown>(
      vm,
      `globalThis.__stackHost.render(${toJsLiteral(cardId)}, ${toJsLiteral(cardState)}, ${toJsLiteral(
        sessionState
      )}, ${toJsLiteral(globalState)})`,
      `${sessionId}.render.js`,
      this.options.renderTimeoutMs
    );

    return validateUINode(tree);
  }

  eventCard(
    sessionId: SessionId,
    cardId: CardId,
    handler: string,
    args: unknown,
    cardState: unknown,
    sessionState: unknown,
    globalState: unknown
  ): RuntimeIntent[] {
    const vm = this.getVmOrThrow(sessionId);
    const intents = evalToNative<unknown>(
      vm,
      `globalThis.__stackHost.event(${toJsLiteral(cardId)}, ${toJsLiteral(handler)}, ${toJsLiteral(
        args
      )}, ${toJsLiteral(cardState)}, ${toJsLiteral(sessionState)}, ${toJsLiteral(globalState)})`,
      `${sessionId}.event.js`,
      this.options.eventTimeoutMs
    );

    return validateRuntimeIntents(intents);
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
