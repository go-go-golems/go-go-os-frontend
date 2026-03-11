import {
  createQuickJsSessionVm,
  disposeQuickJsSessionVm,
  evalQuickJsCodeOrThrow,
  evalQuickJsToNative,
  type QuickJsSessionCoreOptions,
  type QuickJsSessionVm,
} from './quickJsSessionCore';

export interface JsSessionServiceOptions {
  memoryLimitBytes?: number;
  stackLimitBytes?: number;
  loadTimeoutMs?: number;
  evalTimeoutMs?: number;
  inspectTimeoutMs?: number;
}

export interface CreateJsSessionRequest {
  sessionId: string;
  title?: string;
  preludeCode?: string;
}

export interface JsSessionSummary {
  sessionId: string;
  title: string;
  createdAt: string;
  globalNames: string[];
}

export interface JsEvalError {
  name: string;
  message: string;
}

export interface JsEvalResult {
  value: unknown;
  valueType: string;
  logs: string[];
  error?: JsEvalError;
}

interface JsSessionRecord {
  vm: QuickJsSessionVm;
  title: string;
  createdAt: string;
  preludeCode?: string;
}

const DEFAULT_OPTIONS: Required<JsSessionServiceOptions> = {
  memoryLimitBytes: 32 * 1024 * 1024,
  stackLimitBytes: 1024 * 1024,
  loadTimeoutMs: 1000,
  evalTimeoutMs: 100,
  inspectTimeoutMs: 50,
};

const JS_REPL_BOOTSTRAP_SOURCE = `
  globalThis.__jsReplHost = {
    logs: [],
    pushLog(text) {
      this.logs.push(String(text));
    },
    consumeLogs() {
      const copy = this.logs.slice();
      this.logs.length = 0;
      return copy;
    }
  };

  globalThis.console = {
    log(...args) {
      globalThis.__jsReplHost.pushLog(args.map((arg) => String(arg)).join(' '));
    }
  };
`;

function normalizeOptions(options: JsSessionServiceOptions): Required<JsSessionServiceOptions> {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

function valueTypeOf(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

function asError(error: unknown): JsEvalError {
  if (error instanceof Error) {
    const [name, ...rest] = error.message.split(':');
    if (rest.length > 0 && name.trim().length > 0) {
      return {
        name: name.trim(),
        message: rest.join(':').trim(),
      };
    }
    return {
      name: 'Error',
      message: error.message,
    };
  }
  return {
    name: 'Error',
    message: String(error),
  };
}

function toCoreOptions(options: Required<JsSessionServiceOptions>): QuickJsSessionCoreOptions {
  return {
    memoryLimitBytes: options.memoryLimitBytes,
    stackLimitBytes: options.stackLimitBytes,
    loadTimeoutMs: options.loadTimeoutMs,
  };
}

export class JsSessionService {
  private readonly options: Required<JsSessionServiceOptions>;

  private readonly sessions = new Map<string, JsSessionRecord>();

  constructor(options: JsSessionServiceOptions = {}) {
    this.options = normalizeOptions(options);
  }

  private getRecordOrThrow(sessionId: string): JsSessionRecord {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw new Error(`JS session not found: ${sessionId}`);
    }
    return record;
  }

  private async createRecord(request: CreateJsSessionRequest): Promise<JsSessionRecord> {
    const bootstrapSources = [
      { code: JS_REPL_BOOTSTRAP_SOURCE, filename: 'js-repl-bootstrap.js' },
    ];
    if (request.preludeCode && request.preludeCode.trim().length > 0) {
      bootstrapSources.push({
        code: request.preludeCode,
        filename: `${request.sessionId}.prelude.js`,
      });
    }

    const vm = await createQuickJsSessionVm(
      'js-repl',
      request.sessionId,
      toCoreOptions(this.options),
      bootstrapSources,
    );

    return {
      vm,
      title: request.title?.trim() || request.sessionId,
      createdAt: new Date().toISOString(),
      preludeCode: request.preludeCode,
    };
  }

  async createSession(request: CreateJsSessionRequest): Promise<JsSessionSummary> {
    if (this.sessions.has(request.sessionId)) {
      throw new Error(`JS session already exists: ${request.sessionId}`);
    }

    const record = await this.createRecord(request);
    this.sessions.set(request.sessionId, record);
    return this.getSummary(request.sessionId);
  }

  getSummary(sessionId: string): JsSessionSummary {
    const record = this.getRecordOrThrow(sessionId);
    return {
      sessionId,
      title: record.title,
      createdAt: record.createdAt,
      globalNames: this.getGlobalNames(sessionId),
    };
  }

  listSessions(): JsSessionSummary[] {
    return Array.from(this.sessions.keys())
      .sort()
      .map((sessionId) => this.getSummary(sessionId));
  }

  evaluate(sessionId: string, code: string): JsEvalResult {
    const record = this.getRecordOrThrow(sessionId);
    try {
      const value = evalQuickJsToNative<unknown>(
        record.vm,
        code,
        `${sessionId}.eval.js`,
        this.options.evalTimeoutMs,
      );
      return {
        value,
        valueType: valueTypeOf(value),
        logs: this.consumeLogs(record.vm),
      };
    } catch (error) {
      return {
        value: undefined,
        valueType: 'error',
        logs: this.consumeLogs(record.vm),
        error: asError(error),
      };
    }
  }

  getGlobalNames(sessionId: string): string[] {
    const record = this.getRecordOrThrow(sessionId);
    return evalQuickJsToNative<string[]>(
      record.vm,
      'Object.getOwnPropertyNames(globalThis).sort()',
      `${sessionId}.globals.js`,
      this.options.inspectTimeoutMs,
    );
  }

  async resetSession(sessionId: string): Promise<JsSessionSummary> {
    const record = this.getRecordOrThrow(sessionId);
    disposeQuickJsSessionVm(record.vm);
    const nextRecord = await this.createRecord({
      sessionId,
      title: record.title,
      preludeCode: record.preludeCode,
    });
    this.sessions.set(sessionId, {
      ...nextRecord,
      createdAt: record.createdAt,
    });
    return this.getSummary(sessionId);
  }

  disposeSession(sessionId: string): boolean {
    const record = this.sessions.get(sessionId);
    if (!record) {
      return false;
    }
    this.sessions.delete(sessionId);
    disposeQuickJsSessionVm(record.vm);
    return true;
  }

  clear(): void {
    for (const record of this.sessions.values()) {
      disposeQuickJsSessionVm(record.vm);
    }
    this.sessions.clear();
  }

  health() {
    return {
      ready: true as const,
      sessions: Array.from(this.sessions.keys()).sort(),
    };
  }

  private consumeLogs(vm: QuickJsSessionVm): string[] {
    try {
      return evalQuickJsToNative<string[]>(
        vm,
        'globalThis.__jsReplHost.consumeLogs()',
        `${vm.sessionId}.consume-logs.js`,
        this.options.inspectTimeoutMs,
      );
    } catch {
      return [];
    }
  }

  installPrelude(sessionId: string, code: string): void {
    const record = this.getRecordOrThrow(sessionId);
    evalQuickJsCodeOrThrow(
      record.vm,
      code,
      `${sessionId}.install-prelude.js`,
      this.options.loadTimeoutMs,
    );
  }
}
