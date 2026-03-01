import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'react-redux';
import { createAppsBrowserStore } from '../../app/store';
import { MOCK_APPS_MANY } from '../../mocks/fixtures/apps';
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
  title: 'Apps/AppsBrowser/DocBrowserWindow',
  component: DocBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DocBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: [], docsByApp: {} }),
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({}, { delayMs: 60000 }),
    },
  },
};

export const ManyModulesNoDocs: Story = {
  parameters: {
    msw: {
      handlers: createDefaultAppsHandlers({ apps: MOCK_APPS_MANY, docsByApp: {} }),
    },
  },
};

export const PreSelectedModule: Story = {
  args: { initialModuleId: 'inventory' },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};

export const PreSelectedDoc: Story = {
  args: { initialModuleId: 'inventory', initialSlug: 'overview' },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};
