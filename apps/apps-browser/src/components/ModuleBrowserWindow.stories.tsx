import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../app/store';
import { createDefaultAppsHandlers } from '../mocks/msw/defaultHandlers';
import { MOCK_APPS_MANY } from '../mocks/fixtures/apps';
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
