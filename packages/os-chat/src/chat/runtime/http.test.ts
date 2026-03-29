import { describe, expect, it, vi } from 'vitest';
import { submitPrompt } from './http';

describe('chat runtime http', () => {
  it('submits prompt body with optional profile selection', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    } as Response));

    await submitPrompt('hello', 'conv-1', '', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      profileSelection: {
        profile: 'agent',
        registry: 'default',
      },
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [_url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: 'hello',
      conv_id: 'conv-1',
      profile: 'agent',
      registry: 'default',
    });
  });

  it('keeps legacy fetch function argument contract', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    } as Response));

    await submitPrompt('hello', 'conv-legacy', '', fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [_url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      prompt: 'hello',
      conv_id: 'conv-legacy',
    });
  });
});
