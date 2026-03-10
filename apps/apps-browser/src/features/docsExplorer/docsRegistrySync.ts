import type { Store } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { DocObjectSummary } from '../../domain/docsObjects';
import type { DocsRegistry } from '../../domain/docsRegistry';
import {
  docsSearchFailed,
  docsSearchStarted,
  docsSearchSucceeded,
  docsSyncFailed,
  docsSyncStarted,
  docsSyncSucceeded,
} from './docsExplorerSlice';

async function buildRegistrySnapshot(registry: DocsRegistry): Promise<{
  mountPaths: ReturnType<DocsRegistry['listMountPaths']>;
  summaries: DocObjectSummary[];
}> {
  const mounts = registry.getMounts();
  const mountPaths = registry.listMountPaths();
  const groups = await Promise.all(mounts.map((mount) => mount.list()));
  const summaries = groups.flat().sort((a, b) => a.path.localeCompare(b.path));
  return { mountPaths, summaries };
}

export function attachDocsRegistrySync(store: Store<RootState>, registry: DocsRegistry): () => void {
  let refreshGeneration = 0;

  async function refresh() {
    const generation = ++refreshGeneration;
    store.dispatch(docsSyncStarted());
    try {
      const snapshot = await buildRegistrySnapshot(registry);
      if (generation !== refreshGeneration) {
        return;
      }
      store.dispatch(docsSyncSucceeded(snapshot));
    } catch (error) {
      if (generation !== refreshGeneration) {
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      store.dispatch(docsSyncFailed(message));
    }
  }

  const unsubscribe = registry.subscribe(() => {
    void refresh();
  });

  void refresh();

  return () => {
    unsubscribe();
  };
}

export async function runDocsRegistrySearch(
  store: Store<RootState>,
  registry: DocsRegistry,
  query: string,
): Promise<void> {
  store.dispatch(docsSearchStarted(query));
  try {
    const results = await registry.search({ query });
    store.dispatch(docsSearchSucceeded({ query, results }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.dispatch(docsSearchFailed(message));
  }
}
