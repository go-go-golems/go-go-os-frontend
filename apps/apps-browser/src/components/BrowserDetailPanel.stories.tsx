import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { BrowserDetailPanel } from './BrowserDetailPanel';
import { docsCatalogStore, docsRegistry } from '../index';
import { buildDocObjectPath, buildDocsMountPath, type DocObject, type DocsMount } from '../domain/docsObjects';
import { MOCK_ARC_AGI, MOCK_INVENTORY } from '../mocks/fixtures/apps';

const inventoryMountPath = buildDocsMountPath('module', 'inventory');
const inventoryDocs: DocObject[] = [
  {
    path: buildDocObjectPath('module', 'inventory', 'overview'),
    mountPath: inventoryMountPath,
    kind: 'module',
    owner: 'inventory',
    slug: 'overview',
    title: 'Inventory Overview',
    summary: 'Overview mounted through the docs registry.',
    docType: 'guide',
    content: '# Inventory Overview',
    order: 1,
  },
];

const arcModuleMountPath = buildDocsMountPath('module', 'arc-agi');
const arcSurfaceMountPath = buildDocsMountPath('surface', 'arc-agi');
const arcDocs: DocObject[] = [
  {
    path: buildDocObjectPath('module', 'arc-agi', 'runtime-modes'),
    mountPath: arcModuleMountPath,
    kind: 'module',
    owner: 'arc-agi',
    slug: 'runtime-modes',
    title: 'Runtime Modes',
    summary: 'Backend/runtime guide for ARC-AGI.',
    docType: 'guide',
    content: '# Runtime Modes',
    order: 1,
  },
  {
    path: buildDocObjectPath('surface', 'arc-agi', 'incident-command'),
    mountPath: arcSurfaceMountPath,
    kind: 'surface',
    owner: 'arc-agi',
    slug: 'incident-command',
    title: 'Incident Command',
    summary: 'Mounted runtime-surface example for the selected owner.',
    docType: 'example',
    content: '# Incident Command',
    order: 2,
  },
];

function createStaticMount(mountPath: string, docs: DocObject[]): DocsMount {
  return {
    mountPath: () => mountPath as ReturnType<typeof buildDocsMountPath>,
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
}

function DocsDecorator(Story: React.ComponentType) {
  useEffect(() => {
    const unregisterInventory = docsRegistry.register(createStaticMount(inventoryMountPath, inventoryDocs));
    const unregisterArcModule = docsRegistry.register(createStaticMount(arcModuleMountPath, arcDocs.filter((doc) => doc.kind === 'module')));
    const unregisterArcSurface = docsRegistry.register(createStaticMount(arcSurfaceMountPath, arcDocs.filter((doc) => doc.kind === 'surface')));
    void docsCatalogStore.ensureAllMountsLoaded();
    return () => {
      unregisterArcSurface();
      unregisterArcModule();
      unregisterInventory();
    };
  }, []);

  return <Story />;
}

const meta = {
  title: 'Apps/AppsBrowser/BrowserDetailPanel',
  component: BrowserDetailPanel,
  decorators: [DocsDecorator],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof BrowserDetailPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InventoryMountedDocs: Story = {
  args: {
    selectedApp: MOCK_INVENTORY,
    onOpenDoc: (...args: unknown[]) => console.log('[story] onOpenDoc', ...args),
  },
};

export const ArcAgiMountedDocs: Story = {
  args: {
    selectedApp: MOCK_ARC_AGI,
    onOpenDoc: (...args: unknown[]) => console.log('[story] onOpenDoc', ...args),
  },
};
