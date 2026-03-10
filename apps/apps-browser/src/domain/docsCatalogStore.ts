import { useSyncExternalStore } from 'react';
import type { DocObject, DocObjectPath, DocObjectSummary, DocsMountPath, DocsSearchQuery } from './docsObjects';
import { type DocsRegistry, docsRegistry } from './docsRegistry';

type Listener = () => void;
type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface DocsMountRecord {
  status: LoadStatus;
  summaries: DocObjectSummary[];
  error?: string;
}

export interface DocsObjectRecord {
  status: LoadStatus;
  value?: DocObject | null;
  error?: string;
}

export interface DocsSearchRecord {
  status: LoadStatus;
  resultPaths: DocObjectPath[];
  error?: string;
}

export interface DocsCatalogSnapshot {
  mountPaths: DocsMountPath[];
  mounts: Record<string, DocsMountRecord>;
  objects: Record<string, DocsObjectRecord>;
  searches: Record<string, DocsSearchRecord>;
}

const EMPTY_SNAPSHOT: DocsCatalogSnapshot = {
  mountPaths: [],
  mounts: {},
  objects: {},
  searches: {},
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function serializeDocsSearchQuery(query: DocsSearchQuery): string {
  return JSON.stringify({
    query: query.query?.trim() ?? '',
    kinds: [...(query.kinds ?? [])].sort(),
    owners: [...(query.owners ?? [])].sort(),
    topics: [...(query.topics ?? [])].sort(),
    docTypes: [...(query.docTypes ?? [])].sort(),
  });
}

export interface DocsCatalogStore {
  getSnapshot(): DocsCatalogSnapshot;
  subscribe(listener: Listener): () => void;
  ensureAllMountsLoaded(): Promise<void>;
  ensureMountLoaded(mountPath: DocsMountPath): Promise<void>;
  ensureObjectLoaded(path: DocObjectPath): Promise<void>;
  runSearch(query: DocsSearchQuery): Promise<void>;
}

export function createDocsCatalogStore(registry: DocsRegistry): DocsCatalogStore {
  let snapshot: DocsCatalogSnapshot = {
    ...EMPTY_SNAPSHOT,
    mountPaths: registry.listMountPaths(),
  };
  const listeners = new Set<Listener>();
  const pendingMounts = new Map<DocsMountPath, Promise<void>>();
  const pendingObjects = new Map<DocObjectPath, Promise<void>>();
  const pendingSearches = new Map<string, Promise<void>>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setSnapshot = (updater: (current: DocsCatalogSnapshot) => DocsCatalogSnapshot) => {
    snapshot = updater(snapshot);
    notify();
  };

  const invalidateForRegistryUpdate = (nextMountPaths: DocsMountPath[]) => {
    const activeMounts = new Set(nextMountPaths);

    for (const mountPath of Array.from(pendingMounts.keys())) {
      if (!activeMounts.has(mountPath)) {
        pendingMounts.delete(mountPath);
      }
    }
    pendingObjects.clear();
    pendingSearches.clear();

    setSnapshot(() => ({
      mountPaths: nextMountPaths,
      mounts: {},
      objects: {},
      searches: {},
    }));

    nextMountPaths.forEach((mountPath) => {
      void ensureMountLoaded(mountPath);
    });
  };

  const refreshMountPaths = () => {
    const nextMountPaths = registry.listMountPaths();
    const same =
      nextMountPaths.length === snapshot.mountPaths.length &&
      nextMountPaths.every((path, index) => path === snapshot.mountPaths[index]);
    if (same) {
      return;
    }

    setSnapshot((current) => ({
      ...current,
      mountPaths: nextMountPaths,
    }));
  };

  registry.subscribe(() => invalidateForRegistryUpdate(registry.listMountPaths()));

  async function ensureMountLoaded(mountPath: DocsMountPath): Promise<void> {
    const current = snapshot.mounts[mountPath];
    if (current?.status === 'ready' || current?.status === 'loading') {
      return pendingMounts.get(mountPath) ?? Promise.resolve();
    }

    const resolved = registry.resolve(mountPath);
    if (!resolved || resolved.mountPath !== mountPath) {
      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        mounts: {
          ...currentSnapshot.mounts,
          [mountPath]: {
            status: 'error',
            summaries: [],
            error: `No docs mount registered for ${mountPath}`,
          },
        },
      }));
      return;
    }

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      mounts: {
        ...currentSnapshot.mounts,
        [mountPath]: {
          status: 'loading',
          summaries: currentSnapshot.mounts[mountPath]?.summaries ?? [],
        },
      },
    }));

    const job = resolved.mount
      .list(resolved.subpath)
      .then((summaries) => {
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          mounts: {
            ...currentSnapshot.mounts,
            [mountPath]: {
              status: 'ready',
              summaries,
            },
          },
        }));
      })
      .catch((error) => {
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          mounts: {
            ...currentSnapshot.mounts,
            [mountPath]: {
              status: 'error',
              summaries: [],
              error: toErrorMessage(error),
            },
          },
        }));
      })
      .finally(() => {
        pendingMounts.delete(mountPath);
      });

    pendingMounts.set(mountPath, job);
    return job;
  }

  async function ensureAllMountsLoaded() {
    refreshMountPaths();
    await Promise.all(snapshot.mountPaths.map((mountPath) => ensureMountLoaded(mountPath)));
  }

  async function ensureObjectLoaded(path: DocObjectPath): Promise<void> {
    const current = snapshot.objects[path];
    if (current?.status === 'ready' || current?.status === 'loading') {
      return pendingObjects.get(path) ?? Promise.resolve();
    }

    const resolved = registry.resolve(path);
    if (!resolved) {
      setSnapshot((currentSnapshot) => ({
        ...currentSnapshot,
        objects: {
          ...currentSnapshot.objects,
          [path]: {
            status: 'error',
            error: `No docs mount resolved for ${path}`,
          },
        },
      }));
      return;
    }

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      objects: {
        ...currentSnapshot.objects,
        [path]: {
          status: 'loading',
          value: currentSnapshot.objects[path]?.value,
        },
      },
    }));

    const job = resolved.mount
      .read(resolved.subpath)
      .then((value) => {
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          objects: {
            ...currentSnapshot.objects,
            [path]: {
              status: 'ready',
              value,
            },
          },
        }));
      })
      .catch((error) => {
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          objects: {
            ...currentSnapshot.objects,
            [path]: {
              status: 'error',
              error: toErrorMessage(error),
            },
          },
        }));
      })
      .finally(() => {
        pendingObjects.delete(path);
      });

    pendingObjects.set(path, job);
    return job;
  }

  async function runSearch(query: DocsSearchQuery): Promise<void> {
    const key = serializeDocsSearchQuery(query);
    const current = snapshot.searches[key];
    if (current?.status === 'loading') {
      return pendingSearches.get(key) ?? Promise.resolve();
    }

    setSnapshot((currentSnapshot) => ({
      ...currentSnapshot,
      searches: {
        ...currentSnapshot.searches,
        [key]: {
          status: 'loading',
          resultPaths: currentSnapshot.searches[key]?.resultPaths ?? [],
        },
      },
    }));

    const job = registry
      .search(query)
      .then((results) => {
        setSnapshot((currentSnapshot) => {
          const summariesByMount = new Map<DocsMountPath, DocObjectSummary[]>();
          for (const result of results) {
            const existing =
              summariesByMount.get(result.mountPath) ?? currentSnapshotMounts(currentSnapshot, result.mountPath);
            summariesByMount.set(result.mountPath, mergeSummaries(existing, [result]));
          }

          const nextMounts = { ...currentSnapshot.mounts };
          for (const [mountPath, summaries] of summariesByMount) {
            const previous = nextMounts[mountPath];
            nextMounts[mountPath] = {
              status: previous?.status ?? 'ready',
              summaries,
              error: previous?.error,
            };
          }

          return {
            ...currentSnapshot,
            searches: {
              ...currentSnapshot.searches,
              [key]: {
                status: 'ready',
                resultPaths: results.map((result) => result.path),
              },
            },
            mounts: nextMounts,
          };
        });
      })
      .catch((error) => {
        setSnapshot((currentSnapshot) => ({
          ...currentSnapshot,
          searches: {
            ...currentSnapshot.searches,
            [key]: {
              status: 'error',
              resultPaths: [],
              error: toErrorMessage(error),
            },
          },
        }));
      })
      .finally(() => {
        pendingSearches.delete(key);
      });

    pendingSearches.set(key, job);
    return job;
  }

  return {
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    ensureAllMountsLoaded,
    ensureMountLoaded,
    ensureObjectLoaded,
    runSearch,
  };
}

function currentSnapshotMounts(snapshot: DocsCatalogSnapshot, mountPath: DocsMountPath) {
  return snapshot.mounts[mountPath]?.summaries ?? [];
}

function mergeSummaries(existing: DocObjectSummary[], incoming: DocObjectSummary[]) {
  const map = new Map(existing.map((summary) => [summary.path, summary] as const));
  for (const summary of incoming) {
    map.set(summary.path, summary);
  }
  return Array.from(map.values()).sort((a, b) => a.path.localeCompare(b.path));
}

export const docsCatalogStore = createDocsCatalogStore(docsRegistry);

export function useDocsCatalogSnapshot() {
  return useSyncExternalStore(docsCatalogStore.subscribe, docsCatalogStore.getSnapshot, docsCatalogStore.getSnapshot);
}
