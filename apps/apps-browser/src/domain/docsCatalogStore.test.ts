import { describe, expect, it } from 'vitest';
import { buildDocObjectPath, buildDocsMountPath, type DocsMount } from './docsObjects';
import { createDocsCatalogStore } from './docsCatalogStore';
import { DocsRegistry } from './docsRegistry';

function createMount(kind: string, owner: string, slug = 'overview'): DocsMount {
  const mountPath = buildDocsMountPath(kind, owner);
  return {
    mountPath: () => mountPath,
    async list() {
      return [{
        path: buildDocObjectPath(kind, owner, slug),
        mountPath,
        kind,
        owner,
        slug,
        title: `${owner}:${slug}`,
        summary: `summary ${owner}`,
        docType: 'reference',
        topics: ['docs'],
      }];
    },
    async read(subpath) {
      const finalSlug = subpath[0];
      if (!finalSlug) {
        return null;
      }
      return {
        path: buildDocObjectPath(kind, owner, finalSlug),
        mountPath,
        kind,
        owner,
        slug: finalSlug,
        title: `${owner}:${finalSlug}`,
        content: 'doc content',
      };
    },
  };
}

describe('docsCatalogStore', () => {
  it('tracks registry mount paths and loads mount summaries', async () => {
    const registry = new DocsRegistry();
    registry.register(createMount('module', 'inventory'));
    const store = createDocsCatalogStore(registry);

    await store.ensureAllMountsLoaded();
    const snapshot = store.getSnapshot();

    expect(snapshot.mountPaths).toEqual(['/docs/objects/module/inventory']);
    expect(snapshot.mounts['/docs/objects/module/inventory']?.status).toBe('ready');
    expect(snapshot.mounts['/docs/objects/module/inventory']?.summaries[0]?.path).toBe('/docs/objects/module/inventory/overview');
  });

  it('loads individual doc objects by canonical path', async () => {
    const registry = new DocsRegistry();
    registry.register(createMount('card', 'os-launcher', 'kanbanIncidentCommand'));
    const store = createDocsCatalogStore(registry);

    await store.ensureObjectLoaded('/docs/objects/card/os-launcher/kanbanIncidentCommand');
    const snapshot = store.getSnapshot();

    expect(snapshot.objects['/docs/objects/card/os-launcher/kanbanIncidentCommand']?.status).toBe('ready');
    expect(snapshot.objects['/docs/objects/card/os-launcher/kanbanIncidentCommand']?.value?.content).toBe('doc content');
  });

  it('stores search result paths without Redux', async () => {
    const registry = new DocsRegistry();
    registry.register(createMount('module', 'inventory'));
    registry.register(createMount('card', 'os-launcher', 'kanbanIncidentCommand'));
    const store = createDocsCatalogStore(registry);

    await store.runSearch({ query: 'kanban' });
    const snapshot = store.getSnapshot();
    const key = JSON.stringify({ query: 'kanban', kinds: [], owners: [], topics: [], docTypes: [] });

    expect(snapshot.searches[key]?.status).toBe('ready');
    expect(snapshot.searches[key]?.resultPaths).toEqual(['/docs/objects/card/os-launcher/kanbanIncidentCommand']);
  });
});
