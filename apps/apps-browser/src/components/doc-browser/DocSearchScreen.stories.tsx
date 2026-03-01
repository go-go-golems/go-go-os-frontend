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
  title: 'Apps/AppsBrowser/DocBrowser/Search',
  component: DocBrowserWindow,
  decorators: [StoreDecorator],
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: createDefaultAppsHandlers() },
  },
} satisfies Meta<typeof DocBrowserWindow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptySearch: Story = {
  args: { initialScreen: 'search' },
};

export const PreFilledQuery: Story = {
  args: { initialScreen: 'search', initialQuery: 'api' },
};

export const NoResults: Story = {
  args: { initialScreen: 'search', initialQuery: 'xyznonexistent' },
};
