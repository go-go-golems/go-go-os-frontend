import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../../app/store';
import { buildDocsMountPath } from '../../domain/docsObjects';
import { createDefaultAppsHandlers } from '../../mocks/msw/defaultHandlers';
import { DocBrowserWindow } from './DocBrowserWindow';

function StoreDecorator(Story: React.ComponentType) {
  const store = createAppsBrowserStore();
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  );
}

const meta = {
  title: 'Apps/AppsBrowser/DocBrowser/ModuleDocs',
  component: DocBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDefaultAppsHandlers() },
  },
} satisfies Meta<typeof DocBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inventory: Story = {
  args: { initialMountPath: buildDocsMountPath('module', 'inventory') },
};

export const ArcAgi: Story = {
  args: { initialMountPath: buildDocsMountPath('module', 'arc-agi') },
};

export const Gepa: Story = {
  args: { initialMountPath: buildDocsMountPath('module', 'gepa') },
};

/** Inventory module docs with new-window callback. Ctrl/Cmd-click or right-click doc entry cards. */
export const InventoryWithNewWindow: Story = {
  args: {
    initialMountPath: buildDocsMountPath('module', 'inventory'),
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};

/** ARC-AGI module docs with new-window callback. Right-click for context menu on doc entries. */
export const ArcAgiWithNewWindow: Story = {
  args: {
    initialMountPath: buildDocsMountPath('module', 'arc-agi'),
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};

/** GEPA module docs with new-window callback. */
export const GepaWithNewWindow: Story = {
  args: {
    initialMountPath: buildDocsMountPath('module', 'gepa'),
    onOpenDocNewWindow: (...args: unknown[]) => console.log("[story] onOpenDocNewWindow", ...args),
  },
};
