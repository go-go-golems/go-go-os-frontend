import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { docsCatalogStore } from '../domain/docsCatalogStore';
import { docsRegistry } from '../domain/docsRegistry';
import { buildDocObjectPath, buildDocsMountPath, type DocObject, type DocsMount } from '../domain/docsObjects';
import { BrowserDetailPanel } from './BrowserDetailPanel';

describe('BrowserDetailPanel mounted docs', () => {
  it('renders mounted docs for the selected owner from the external catalog store', async () => {
    const owner = 'runtime-owner';
    const mountPath = buildDocsMountPath('card', owner);
    const docs: DocObject[] = [
      {
        path: buildDocObjectPath('card', owner, 'incident-command'),
        mountPath,
        kind: 'card',
        owner,
        slug: 'incident-command',
        title: 'Incident Command',
        summary: 'Mounted runtime card docs.',
        docType: 'example',
        content: '# Incident Command',
      },
    ];

    const mount: DocsMount = {
      mountPath: () => mountPath,
      async list() {
        return docs;
      },
      async read(subpath) {
        const slug = subpath[0];
        if (!slug) {
          return null;
        }
        return docs.find((doc) => doc.slug === slug) ?? null;
      },
    };

    const unregister = docsRegistry.register(mount);
    await docsCatalogStore.ensureMountLoaded(mountPath);

    const html = renderToStaticMarkup(
      <BrowserDetailPanel
        selectedApp={{
          app_id: owner,
          name: 'Runtime Owner',
          description: 'Synthetic owner app for mounted docs coverage.',
          required: false,
          healthy: true,
        }}
      />,
    );

    unregister();

    expect(html).toContain('Mounted Docs');
    expect(html).toContain('Incident Command');
    expect(html).toContain('runtime-owner');
  });
});
