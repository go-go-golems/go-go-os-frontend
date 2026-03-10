import { describe, expect, it, vi } from 'vitest';
import {
  ChatProfileApiError,
  createProfile,
  listExtensionSchemas,
  listMiddlewareSchemas,
  listProfiles,
  setDefaultProfile,
  updateProfile,
} from './profileApi';

describe('profileApi', () => {
  it('lists profiles with optional registry query param', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [
        { slug: 'default', registry: 'default', is_default: false },
        { slug: 'inventory', registry: 'ops', is_default: true, extensions: { 'webchat.starter_suggestions@v1': { items: ['restock'] } } },
      ],
      text: async () => '',
    } as Response));

    const profiles = await listProfiles('default', {
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(profiles).toEqual([
      { slug: 'default', registry: 'default', is_default: false },
      {
        slug: 'inventory',
        registry: 'ops',
        is_default: true,
        extensions: { 'webchat.starter_suggestions@v1': { items: ['restock'] } },
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith('/chat/api/chat/profiles?registry=default');
  });

  it('parses indexed-object list payloads from legacy intermediaries', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        '1': { slug: 'inventory', registry: 'default', is_default: true },
        '0': { slug: 'default', registry: 'default', is_default: false },
      }),
      text: async () => '',
    } as Response));

    const profiles = await listProfiles('default', {
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(profiles.map((profile) => profile.slug)).toEqual(['default', 'inventory']);
    expect(profiles.map((profile) => profile.registry)).toEqual(['default', 'default']);
  });

  it('decodes extensions in create and update profile responses', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          registry: 'default',
          slug: 'analyst',
          is_default: true,
          extensions: {
            'webchat.starter_suggestions@v1': {
              items: ['Explain top movers'],
            },
          },
        }),
        text: async () => '',
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          registry: 'default',
          slug: 'analyst',
          is_default: false,
          extensions: {
            'webchat.starter_suggestions@v1': {
              items: ['Summarize low stock'],
            },
          },
        }),
        text: async () => '',
      } as Response);

    const created = await createProfile(
      {
        slug: 'analyst',
      },
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );
    const updated = await updateProfile(
      'analyst',
      {
        expected_version: 1,
      },
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(created.extensions).toEqual({
      'webchat.starter_suggestions@v1': {
        items: ['Explain top movers'],
      },
    });
    expect(updated.extensions).toEqual({
      'webchat.starter_suggestions@v1': {
        items: ['Summarize low stock'],
      },
    });
  });

  it('decodes set default response contract', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        registry: 'default',
        slug: 'inventory',
        is_default: true,
      }),
      text: async () => '',
    } as Response));

    const doc = await setDefaultProfile(
      'inventory',
      {},
      { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch }
    );

    expect(doc).toEqual({
      registry: 'default',
      slug: 'inventory',
      is_default: true,
    });
  });

  it('throws ChatProfileApiError on malformed 200 payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ nope: true }),
      text: async () => '',
    } as Response));

    await expect(
      listProfiles('default', { basePrefix: '/chat', fetchImpl: fetchImpl as unknown as typeof fetch })
    ).rejects.toBeInstanceOf(ChatProfileApiError);
  });

  it('decodes middleware schema catalog payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ([
        {
          name: 'agentmode',
          version: 1,
          display_name: 'Agent Mode',
          description: 'Parses mode switches',
          schema: { type: 'object' },
        },
      ]),
      text: async () => '',
    } as Response));

    const rows = await listMiddlewareSchemas({
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(rows).toEqual([
      {
        name: 'agentmode',
        version: 1,
        display_name: 'Agent Mode',
        description: 'Parses mode switches',
        schema: { type: 'object' },
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith('/chat/api/chat/schemas/middlewares');
  });

  it('decodes extension schema catalog payload', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ([
        {
          key: 'middleware.agentmode_config@v1',
          schema: { type: 'object', properties: { instances: { type: 'object' } } },
        },
      ]),
      text: async () => '',
    } as Response));

    const rows = await listExtensionSchemas({
      basePrefix: '/chat',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(rows).toEqual([
      {
        key: 'middleware.agentmode_config@v1',
        schema: { type: 'object', properties: { instances: { type: 'object' } } },
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledWith('/chat/api/chat/schemas/extensions');
  });
});
