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
  title: 'Apps/AppsBrowser/DocBrowser/Home',
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

/** Home screen with new-window callback wired. Ctrl/Cmd-click or right-click a doc card link to trigger. */
export const WithNewWindowCallback: Story = {
  args: {
    onOpenDocNewWindow: (...args: unknown[]) => console.log('[story] onOpenDocNewWindow', ...args),
  },
  parameters: {
    msw: { handlers: createDefaultAppsHandlers() },
  },
};
