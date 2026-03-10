import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import { DocsRegistry } from '../../domain/docsRegistry';
import { buildDocObjectPath, buildDocsMountPath, type DocsMount } from '../../domain/docsObjects';
import { appsBrowserReducer } from '../appsBrowser/appsBrowserSlice';
import { attachDocsRegistrySync, runDocsRegistrySearch } from './docsRegistrySync';
import { docsExplorerReducer } from './docsExplorerSlice';

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
        content: 'content',
      };
    },
  };
}

function createTestStore() {
  return configureStore({
    reducer: {
      appsBrowser: appsBrowserReducer,
      docsExplorer: docsExplorerReducer,
    },
  });
}

async function waitForMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('docsRegistrySync', () => {
  it('projects mounted summaries into Redux state', async () => {
    const registry = new DocsRegistry();
    const store = createTestStore();
    const detach = attachDocsRegistrySync(store as never, registry);

    registry.register(createMount('module', 'inventory'));
    await waitForMicrotasks();

    const state = store.getState().docsExplorer;
    expect(state.syncStatus).toBe('ready');
    expect(state.mountPaths).toEqual(['/docs/objects/module/inventory']);
    expect(Object.keys(state.summariesByPath)).toEqual(['/docs/objects/module/inventory/overview']);

    detach();
  });

  it('updates search results from registry fan-out', async () => {
    const registry = new DocsRegistry();
    const store = createTestStore();

    registry.register(createMount('module', 'inventory'));
    registry.register(createMount('card', 'os-launcher', 'kanbanIncidentCommand'));

    await runDocsRegistrySearch(store as never, registry, 'kanban');

    const state = store.getState().docsExplorer;
    expect(state.search.status).toBe('ready');
    expect(state.search.resultPaths).toEqual(['/docs/objects/card/os-launcher/kanbanIncidentCommand']);
  });
});
