import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../../app/store';
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
  args: { initialModuleId: 'inventory' },
};

export const ArcAgi: Story = {
  args: { initialModuleId: 'arc-agi' },
};

export const Gepa: Story = {
  args: { initialModuleId: 'gepa' },
};
