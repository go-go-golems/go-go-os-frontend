import { describe, expect, it } from 'vitest';
import type { FetchLike } from './docsMountAdapters';
import {
  createHelpDocsMount,
  createModuleDocsMount,
  createVmmetaSurfaceDocsMount,
  createVmmetaSurfaceTypeDocsMount,
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

  it('maps vmmeta surface-type and surface docs into mounts', async () => {
    const metadata = {
      packId: 'kanban.v1',
      cards: [
        { id: 'kanbanIncidentCommand', packId: 'kanban.v1', title: 'Incident Command', source: 'defineRuntimeSurface(...)' },
      ],
      docs: {
        files: [
          {
            package: {
              name: 'kanban.v1',
              title: 'Kanban Runtime Surface Type',
              category: 'runtime-surface-type',
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

    const surfaceTypeMount = createVmmetaSurfaceTypeDocsMount(metadata);
    const surfaceMount = createVmmetaSurfaceDocsMount('os-launcher', metadata);

    const surfaceTypeDocs = await surfaceTypeMount.list();
    const surfaceDoc = await surfaceMount.read(['kanbanIncidentCommand']);

    expect(surfaceTypeDocs.map((doc) => doc.path)).toEqual([
      '/docs/objects/surface-type/kanban.v1/overview',
      '/docs/objects/surface-type/kanban.v1/widgets.kanban.page',
    ]);
    expect(surfaceDoc?.path).toBe('/docs/objects/surface/os-launcher/kanbanIncidentCommand');
    expect(surfaceDoc?.content).toContain('Card prose');
    expect(surfaceDoc?.content).toContain('defineRuntimeSurface(...)');
  });
});
