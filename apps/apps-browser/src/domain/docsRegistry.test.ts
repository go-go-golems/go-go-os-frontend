import { describe, expect, it } from 'vitest';
import { buildDocObjectPath, buildDocsMountPath, type DocsMount } from './docsObjects';
import { DocsRegistry } from './docsRegistry';

function createMount(kind: string, owner: string, slug = 'overview'): DocsMount {
  const mountPath = buildDocsMountPath(kind, owner);
  return {
    mountPath: () => mountPath,
    async list() {
      return [
        {
          path: buildDocObjectPath(kind, owner, slug),
          mountPath,
          kind,
          owner,
          slug,
          title: `${owner}:${slug}`,
          summary: `summary ${owner}`,
          docType: 'reference',
          topics: ['docs'],
        },
      ];
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

describe('DocsRegistry', () => {
  it('returns a stable mounts snapshot until registry changes', () => {
    const registry = new DocsRegistry();
    const first = registry.getMounts();
    const second = registry.getMounts();

    expect(first).toBe(second);

    registry.register(createMount('module', 'inventory'));
    const third = registry.getMounts();
    const fourth = registry.getMounts();

    expect(third).not.toBe(first);
    expect(third).toBe(fourth);
    expect(third).toHaveLength(1);
  });

  it('resolves the longest matching mount path', () => {
    const registry = new DocsRegistry();
    registry.register(createMount('module', 'inventory'));
    registry.register(createMount('module', 'inventory.deeper'));

    const resolved = registry.resolve('/docs/objects/module/inventory.deeper/guide/intro');

    expect(resolved?.mountPath).toBe('/docs/objects/module/inventory.deeper');
    expect(resolved?.subpath).toEqual(['guide', 'intro']);
  });

  it('fans out search to mounts without duplicating by path', async () => {
    const registry = new DocsRegistry();
    const unregisterA = registry.register(createMount('module', 'inventory'));
    registry.register(createMount('module', 'arc-agi'));

    const firstResults = await registry.search({ query: 'summary' });
    expect(firstResults.map((entry) => entry.owner)).toEqual(['arc-agi', 'inventory']);

    unregisterA();
    const secondResults = await registry.search({ query: 'summary' });
    expect(secondResults.map((entry) => entry.owner)).toEqual(['arc-agi']);
  });
});
