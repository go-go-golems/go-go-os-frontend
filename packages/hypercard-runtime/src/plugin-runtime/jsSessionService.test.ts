import { afterEach, describe, expect, it } from 'vitest';
import { JsSessionService } from './jsSessionService';

describe('JsSessionService', () => {
  const services: JsSessionService[] = [];

  afterEach(() => {
    for (const service of services) {
      service.clear();
    }
    services.length = 0;
  });

  it('creates sessions and evaluates simple expressions', async () => {
    const service = new JsSessionService();
    services.push(service);

    const summary = await service.createSession({ sessionId: 'js-1', title: 'JS One' });
    expect(summary.sessionId).toBe('js-1');
    expect(summary.title).toBe('JS One');
    expect(summary.globalNames).toContain('console');

    expect(service.evaluate('js-1', '1 + 2')).toEqual({
      value: 3,
      valueType: 'number',
      logs: [],
    });
  });

  it('preserves globals across evaluations', async () => {
    const service = new JsSessionService();
    services.push(service);

    await service.createSession({ sessionId: 'js-1' });

    expect(service.evaluate('js-1', 'globalThis.answer = 41')).toEqual({
      value: 41,
      valueType: 'number',
      logs: [],
    });
    expect(service.evaluate('js-1', 'answer + 1')).toEqual({
      value: 42,
      valueType: 'number',
      logs: [],
    });
  });

  it('captures console.log output', async () => {
    const service = new JsSessionService();
    services.push(service);

    await service.createSession({ sessionId: 'js-logs' });

    expect(service.evaluate('js-logs', 'console.log("hello", "world"); 7')).toEqual({
      value: 7,
      valueType: 'number',
      logs: ['hello world'],
    });
  });

  it('formats thrown errors and still drains logs', async () => {
    const service = new JsSessionService();
    services.push(service);

    await service.createSession({ sessionId: 'js-error' });

    expect(service.evaluate('js-error', 'console.log("before"); throw new Error("boom")')).toEqual({
      value: undefined,
      valueType: 'error',
      logs: ['before'],
      error: {
        name: 'Error',
        message: 'boom',
      },
    });
  });

  it('times out runaway evals', async () => {
    const service = new JsSessionService({ evalTimeoutMs: 10 });
    services.push(service);

    await service.createSession({ sessionId: 'js-loop' });

    const result = service.evaluate('js-loop', 'while (true) {}');
    expect(result.valueType).toBe('error');
    expect(result.error?.message.toLowerCase()).toContain('interrupted');
  });

  it('resets sessions back to a blank prelude', async () => {
    const service = new JsSessionService();
    services.push(service);

    await service.createSession({
      sessionId: 'js-reset',
      preludeCode: 'globalThis.seeded = 123',
    });

    expect(service.evaluate('js-reset', 'seeded')).toEqual({
      value: 123,
      valueType: 'number',
      logs: [],
    });
    expect(service.evaluate('js-reset', 'globalThis.answer = 41')).toEqual({
      value: 41,
      valueType: 'number',
      logs: [],
    });

    const summary = await service.resetSession('js-reset');
    expect(summary.globalNames).toContain('seeded');
    expect(service.evaluate('js-reset', 'typeof answer')).toEqual({
      value: 'undefined',
      valueType: 'string',
      logs: [],
    });
    expect(service.evaluate('js-reset', 'seeded')).toEqual({
      value: 123,
      valueType: 'number',
      logs: [],
    });
  });
});
