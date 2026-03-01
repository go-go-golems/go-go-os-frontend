import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { MOCK_APPS_MANY } from '../mocks/fixtures/apps';
import { createDefaultAppsHandlers } from '../mocks/msw/defaultHandlers';
import { ModuleBrowserWindow } from './ModuleBrowserWindow';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/ModuleBrowserWindow',
  component: ModuleBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ModuleBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const PreSelectedGepa: Story = {
  args: { initialAppId: 'gepa' },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const PreSelectedInventory: Story = {
  args: { initialAppId: 'inventory' },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const ManyModules: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: MOCK_APPS_MANY }),
    },
  },
};

export const ReflectionLoading: Story = {
  args: { initialAppId: 'gepa' },
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({}, { delayMs: 60000 }),
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: [] }),
    },
  },
};

/** GEPA with doc link callback. Click documentation links in the bottom detail section. Check Actions panel. */
export const GepaWithDocLinks: Story = {
  args: {
    initialAppId: 'gepa',
    onOpenDoc: (...args: unknown[]) => console.log("[story] onOpenDoc", ...args),
  },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

/** Inventory with doc link callback. Documentation section shows clickable doc links instead of raw URLs. */
export const InventoryWithDocLinks: Story = {
  args: {
    initialAppId: 'inventory',
    onOpenDoc: (...args: unknown[]) => console.log("[story] onOpenDoc", ...args),
  },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

/** ARC-AGI with doc link callback. Ctrl/Cmd-click doc links to trigger new-window open via third arg=true. */
export const ArcAgiWithDocLinks: Story = {
  args: {
    initialAppId: 'arc-agi',
    onOpenDoc: (...args: unknown[]) => console.log("[story] onOpenDoc", ...args),
  },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

/** All callbacks wired: doc center, module docs, and doc links. Shows full toolbar + detail integration. */
export const FullyWiredGepa: Story = {
  args: {
    initialAppId: 'gepa',
    onOpenDocsCenter: (...args: unknown[]) => console.log("[story] onOpenDocsCenter", ...args),
    onOpenDocs: (...args: unknown[]) => console.log("[story] onOpenDocs", ...args),
    onOpenDoc: (...args: unknown[]) => console.log("[story] onOpenDoc", ...args),
  },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};
