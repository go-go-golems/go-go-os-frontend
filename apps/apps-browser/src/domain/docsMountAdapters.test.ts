import { describe, expect, it } from 'vitest';
import type { FetchLike } from './docsMountAdapters';
import {
  createHelpDocsMount,
  createModuleDocsMount,
  createVmmetaCardDocsMount,
  createVmmetaPackDocsMount,
  registerDefaultDocsMounts,
} from './docsMountAdapters';

function createJsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    async text() {
      return JSON.stringify(body);
    },
    async json() {
      return body;
    },
  };
}

describe('docsMountAdapters', () => {
  it('maps backend module docs into DocObject paths', async () => {
    const fetcher: FetchLike = async (input) => {
      if (input === '/api/apps/inventory/docs') {
        return createJsonResponse({
          module_id: 'inventory',
          docs: [{ slug: 'overview', title: 'Overview', doc_type: 'guide', summary: 'Inventory docs' }],
        });
      }
      if (input === '/api/apps/inventory/docs/overview') {
        return createJsonResponse({
          module_id: 'inventory',
          slug: 'overview',
          title: 'Overview',
          doc_type: 'guide',
          summary: 'Inventory docs',
          content: '# Overview',
        });
      }
      throw new Error(`unexpected path ${input}`);
    };

    const mount = createModuleDocsMount('inventory', fetcher);
    const listed = await mount.list();
    const read = await mount.read(['overview']);

    expect(listed[0]?.path).toBe('/docs/objects/module/inventory/overview');
    expect(read?.content).toBe('# Overview');
  });

  it('registers module and help mounts from apps manifest', async () => {
    const fetcher: FetchLike = async (input) => {
      if (input === '/api/os/apps') {
        return createJsonResponse({
          apps: [
            { app_id: 'inventory', docs: { available: true } },
            { app_id: 'chat', docs: { available: false } },
          ],
        });
      }
      if (input === '/api/os/help') {
        return createJsonResponse({ module_id: 'wesen-os', docs: [] });
      }
      throw new Error(`unexpected path ${input}`);
    };

    const mountPaths: string[] = [];
    await registerDefaultDocsMounts((mount) => {
      mountPaths.push(mount.mountPath());
    }, fetcher);

    expect(mountPaths).toEqual([
      '/docs/objects/module/inventory',
      '/docs/objects/help/wesen-os',
    ]);
  });

  it('maps vmmeta package and card docs into mounts', async () => {
    const metadata = {
      packId: 'kanban.v1',
      cards: [
        { id: 'kanbanIncidentCommand', packId: 'kanban.v1', title: 'Incident Command', source: 'defineCard(...)' },
      ],
      docs: {
        files: [
          {
            package: {
              name: 'kanban.v1',
              title: 'Kanban Runtime Pack',
              category: 'runtime-pack',
              description: 'Pack docs',
              prose: 'Package prose',
            },
            symbols: [
              { name: 'widgets.kanban.page', summary: 'Page', prose: 'Pack symbol prose', tags: ['dsl'] },
            ],
          },
          {
            symbols: [
              { name: 'kanbanIncidentCommand', summary: 'Incident card', prose: 'Card prose', tags: ['demo'] },
            ],
          },
        ],
      },
    };

    const packMount = createVmmetaPackDocsMount(metadata);
    const cardMount = createVmmetaCardDocsMount('os-launcher', metadata);

    const packDocs = await packMount.list();
    const cardDoc = await cardMount.read(['kanbanIncidentCommand']);

    expect(packDocs.map((doc) => doc.path)).toEqual([
      '/docs/objects/pack/kanban.v1/overview',
      '/docs/objects/pack/kanban.v1/widgets.kanban.page',
    ]);
    expect(cardDoc?.path).toBe('/docs/objects/card/os-launcher/kanbanIncidentCommand');
    expect(cardDoc?.content).toContain('Card prose');
    expect(cardDoc?.content).toContain('defineCard(...)');
  });
});
