import { useEffect, useMemo } from 'react';
import {
  docsCatalogStore,
  serializeDocsSearchQuery,
  useDocsCatalogSnapshot,
} from './docsCatalogStore';
import {
  matchesDocsSearchQuery,
  mountPathFromObjectPath,
  parseDocsObjectPath,
  type DocObjectPath,
  type DocObjectSummary,
  type DocsMountPath,
  type DocsSearchQuery,
} from './docsObjects';

export function useDocsIndex() {
  const snapshot = useDocsCatalogSnapshot();
  const mountKey = snapshot.mountPaths.join('|');

  useEffect(() => {
    void docsCatalogStore.ensureAllMountsLoaded();
  }, [mountKey]);

  return useMemo(() => {
    const mounts = snapshot.mountPaths.map((mountPath) => ({
      mountPath,
      record: snapshot.mounts[mountPath] ?? { status: 'idle' as const, summaries: [] },
    }));
    const summaries = mounts.flatMap((entry) => entry.record.summaries);
    const hasLoading = mounts.some((entry) => entry.record.status === 'loading' || entry.record.status === 'idle');
    const hasError = mounts.some((entry) => entry.record.status === 'error');
    const status = hasLoading ? 'loading' : hasError ? 'error' : 'ready';
    return {
      status,
      mountPaths: snapshot.mountPaths,
      mounts,
      summaries,
    };
  }, [snapshot, mountKey]);
}

export function useDocsMount(mountPath?: DocsMountPath) {
  const snapshot = useDocsCatalogSnapshot();

  useEffect(() => {
    if (!mountPath) {
      return;
    }
    void docsCatalogStore.ensureMountLoaded(mountPath);
  }, [mountPath]);

  const record = mountPath ? snapshot.mounts[mountPath] : undefined;
  return {
    status: record?.status ?? (mountPath ? 'idle' : 'error'),
    summaries: record?.summaries ?? [],
    error: record?.error,
  };
}

export function useDocObject(path?: DocObjectPath) {
  const snapshot = useDocsCatalogSnapshot();

  useEffect(() => {
    if (!path) {
      return;
    }
    void docsCatalogStore.ensureObjectLoaded(path);
  }, [path]);

  const record = path ? snapshot.objects[path] : undefined;
  return {
    status: record?.status ?? (path ? 'idle' : 'error'),
    value: record?.value,
    error: record?.error,
  };
}

export function useDocsSearch(query: DocsSearchQuery) {
  const snapshot = useDocsCatalogSnapshot();
  const searchKey = serializeDocsSearchQuery(query);

  useEffect(() => {
    void docsCatalogStore.runSearch(query);
  }, [searchKey]);

  return useMemo(() => {
    const record = snapshot.searches[searchKey];
    const indexedSummaries = new Map<string, DocObjectSummary>();
    for (const mountPath of snapshot.mountPaths) {
      for (const summary of snapshot.mounts[mountPath]?.summaries ?? []) {
        indexedSummaries.set(summary.path, summary);
      }
    }
    const results = (record?.resultPaths ?? [])
      .map((path) => indexedSummaries.get(path))
      .filter((summary): summary is DocObjectSummary => Boolean(summary));

    if (results.length === 0) {
      // Fallback while mounts are still loading or if a provider returned only cached paths.
      for (const mountPath of snapshot.mountPaths) {
        for (const summary of snapshot.mounts[mountPath]?.summaries ?? []) {
          if (matchesDocsSearchQuery(summary, query)) {
            results.push(summary);
          }
        }
      }
    }

    return {
      status: record?.status ?? 'idle',
      results,
      error: record?.error,
    };
  }, [query, searchKey, snapshot]);
}

export function summarizeMount(mountPath: DocsMountPath, summaries: DocObjectSummary[]) {
  const parsed = parseDocsObjectPath(mountPath);
  const kind = parsed?.kind ?? 'unknown';
  const owner = parsed?.owner ?? mountPath;

  return {
    kind,
    owner,
    mountPath,
    label: kind === 'module'
      ? owner
      : kind === 'help'
        ? 'Help'
        : owner,
    count: summaries.length,
    topics: Array.from(new Set(summaries.flatMap((summary) => summary.topics ?? []))).sort(),
    docTypes: Array.from(new Set(summaries.flatMap((summary) => (summary.docType ? [summary.docType] : [])))).sort(),
  };
}

export function groupDocsByMount(summaries: DocObjectSummary[]) {
  const grouped = new Map<DocsMountPath, DocObjectSummary[]>();
  for (const summary of summaries) {
    const existing = grouped.get(summary.mountPath) ?? [];
    existing.push(summary);
    grouped.set(summary.mountPath, existing);
  }
  return Array.from(grouped.entries())
    .map(([mountPath, entries]) => ({
      ...summarizeMount(mountPath, entries),
      summaries: entries.slice().sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => a.mountPath.localeCompare(b.mountPath));
}

export function compareDocSummaries(a: DocObjectSummary, b: DocObjectSummary) {
  const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return a.title.localeCompare(b.title);
}

export function objectPathToMountPath(path: DocObjectPath) {
  return mountPathFromObjectPath(path);
}
