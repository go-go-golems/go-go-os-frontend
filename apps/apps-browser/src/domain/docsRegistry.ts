import {
  type DocsMount,
  type DocsMountPath,
  type DocsResolveMatch,
  type DocsSearchQuery,
  type DocObjectSummary,
  matchesDocsSearchQuery,
} from './docsObjects';

type Listener = () => void;

function normalizePath(path: string): string {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }
  return path;
}

export class DocsRegistry {
  private mounts = new Map<DocsMountPath, DocsMount>();
  private listeners = new Set<Listener>();
  private mountSnapshotCache: DocsMount[] | null = null;

  register(mount: DocsMount): () => void {
    const mountPath = mount.mountPath();
    this.mounts.set(mountPath, mount);
    this.invalidate();

    return () => {
      const current = this.mounts.get(mountPath);
      if (current === mount) {
        this.mounts.delete(mountPath);
        this.invalidate();
      }
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getMounts(): DocsMount[] {
    if (!this.mountSnapshotCache) {
      this.mountSnapshotCache = Array.from(this.mounts.values()).sort((a, b) => a.mountPath().localeCompare(b.mountPath()));
    }
    return this.mountSnapshotCache;
  }

  listMountPaths(): DocsMountPath[] {
    return this.getMounts().map((mount) => mount.mountPath());
  }

  resolve(path: string): DocsResolveMatch | null {
    const normalizedPath = normalizePath(path);
    const mounts = this.getMounts().slice().sort((a, b) => b.mountPath().length - a.mountPath().length);
    for (const mount of mounts) {
      const mountPath = mount.mountPath();
      if (normalizedPath === mountPath || normalizedPath.startsWith(`${mountPath}/`)) {
        const suffix = normalizedPath.slice(mountPath.length).replace(/^\/+/, '');
        const subpath = suffix.length > 0 ? suffix.split('/').filter(Boolean) : [];
        return { mount, mountPath, subpath };
      }
    }
    return null;
  }

  async search(query: DocsSearchQuery): Promise<DocObjectSummary[]> {
    const mounts = this.getMounts();
    const results = await Promise.all(mounts.map(async (mount) => {
      if (mount.search) {
        return mount.search(query);
      }
      const listed = await mount.list();
      return listed.filter((entry) => matchesDocsSearchQuery(entry, query));
    }));

    const deduped = new Map<string, DocObjectSummary>();
    for (const group of results) {
      for (const entry of group) {
        deduped.set(entry.path, entry);
      }
    }

    return Array.from(deduped.values()).sort((a, b) => a.path.localeCompare(b.path));
  }

  private invalidate() {
    this.mountSnapshotCache = null;
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const docsRegistry = new DocsRegistry();
